use crate::parser::ast_parser::{parse_file, get_parent_content};
use serde::Serialize;
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use crate::utils::ast_collection::compute_ast_fingerprint;
use crate::utils::filters::filter_files;
use crate::utils::language_mapping::get_language_from_extension;
use indicatif::{MultiProgress, ProgressBar};
use indicatif::ProgressStyle;
use rayon::prelude::*;

#[derive(Serialize, Debug)]
pub struct DuplicateBlock {
    pub start_line_number: usize,
    pub end_line_number: usize,
    pub source_file: String,
}

#[derive(Serialize)]
pub struct DuplicateReport {
    pub fingerprint: String,
    pub line_count: usize,
    pub blocks: Vec<DuplicateBlock>,
}

#[derive(Serialize, Clone)]
struct ParentFingerprint {
    fingerprint: String,
    content: String,
    ast_content: String,
}

#[derive(Serialize)]
struct DebugData {
    parent_fingerprints: HashMap<String, ParentFingerprint>,
    exceeding_threshold_fingerprints: BTreeSet<String>,
    content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)>, // (content, start_line, end_line, fingerprint, file_name, ast_content)
}

pub fn detect_duplicates(args: &crate::cli::CliArgs) -> Vec<DuplicateReport> {
    let files = filter_files(&args.source_path, &args.languages, &args.excludes);
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints: HashMap<String, ParentFingerprint> = HashMap::new();
    let mut exceeding_threshold_fingerprints: BTreeSet<String> = BTreeSet::new();
    let mut content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)> = Vec::new();

    // MultiProgress for managing multiple progress bars
    let multi_progress = MultiProgress::new();

    // Main file-level progress bar
    let pb = multi_progress.add(ProgressBar::new(files.len() as u64));
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta})\nProcessing file: {msg}")
            .unwrap()
            .progress_chars("#>-"),
    );

    for file in files {
        pb.set_message(file.to_string_lossy().to_string());

        if let Ok((blocks, tree, source_code)) = parse_file(&file) {
            let file_path = file.to_string_lossy().to_string();
            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            let language = get_language_from_extension(extension).unwrap_or_else(|| panic!("Unsupported file extension"));

            // Block-level progress bar for each file
            // let block_pb = multi_progress.add(ProgressBar::new(blocks.len() as u64));
            // block_pb.set_style(
            //     ProgressStyle::default_bar()
            //         .template("{spinner:.yellow} [Block {pos}/{len}] {msg}")
            //         .unwrap()
            //         .progress_chars("#>-"),
            // );

            // Parallel processing of blocks
            let processed_blocks: Vec<(String, Option<ParentFingerprint>, DuplicateBlock)> = blocks
                .par_iter()
                .enumerate()
                .filter_map(|(i, block)| {
                    // block_pb.set_message(format!("Processing block {}/{}", i + 1, blocks.len()));
                    let block_length = block.end_line - block.start_line + 1;
                    if block_length < args.threshold {
                        // block_pb.inc(1);
                        return None;
                    }

                    let (fingerprint, _ast_representation) = compute_ast_fingerprint(&block.content, language);

                    // Check if the block already exists
                    if let Some(existing_blocks) = fingerprints.get(&fingerprint) {
                        if existing_blocks.iter().any(|b| b.start_line_number == block.start_line
                            && b.end_line_number == block.end_line
                            && b.source_file == file_path)
                        {
                            // block_pb.inc(1);
                            return None; // Skip insertion if the block already exists
                        }
                    }

                    let duplicate_block = DuplicateBlock {
                        start_line_number: block.start_line,
                        end_line_number: block.end_line,
                        source_file: file_path.clone(),
                    };

                    let parent_fingerprint = if let Some(parent_content) =
                        get_parent_content(&tree, &source_code, block.start_byte, block.end_byte)
                    {
                        let (parent_fingerprint, ast_representation) =
                            compute_ast_fingerprint(&parent_content, language);
                        Some(ParentFingerprint {
                            fingerprint: parent_fingerprint,
                            content: parent_content,
                            ast_content: ast_representation,
                        })
                    } else {
                        None
                    };

                    // block_pb.inc(1);
                    Some((fingerprint, parent_fingerprint, duplicate_block))
                })
                .collect();

            // block_pb.finish_with_message("Block processing complete");

            // Add results to global maps
            for (fingerprint, parent_fingerprint, duplicate_block) in processed_blocks {
                fingerprints.entry(fingerprint.clone()).or_default().push(duplicate_block);

                if let Some(parent) = parent_fingerprint {
                    parent_fingerprints.insert(fingerprint.clone(), parent);
                }
            }
        }
        pb.inc(1);
    }

    pb.finish_with_message("Processing complete");
    
    for (fingerprint, blocks) in &fingerprints {
        if blocks.len() > 1 && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold {
            exceeding_threshold_fingerprints.insert(fingerprint.clone());
        }
    }

    let debug_data = DebugData {
        parent_fingerprints: parent_fingerprints.clone(),
        exceeding_threshold_fingerprints: exceeding_threshold_fingerprints.clone(),
        content_fingerprint_mappings: content_fingerprint_mappings.clone(),
    };

    if args.debug {
        if let Ok(json) = serde_json::to_string_pretty(&debug_data) {
            let mut file = File::create("debug_data.json").expect("Failed to create file");
            file.write_all(json.as_bytes()).expect("Failed to write to file");
        }
    }

    fingerprints
        .into_iter()
        .filter(|(fingerprint, blocks)| {
            let retain = blocks.len() > 1
                && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold
                && parent_fingerprints.get(fingerprint)
                .map_or(true, |pf| !exceeding_threshold_fingerprints.contains(&pf.fingerprint));
            log::debug!(
                "Filtering fingerprint: {}, retain: {}, blocks: {:?}",
                fingerprint,
                retain,
                blocks
            );
            retain
        })
        .map(|(fingerprint, blocks)| {
            log::debug!("Creating DuplicateReport for fingerprint: {}", fingerprint);
            DuplicateReport {
                fingerprint,
                line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
                blocks,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};
    use crate::cli::CliArgs;

    fn setup_test_environment() -> PathBuf {
        let test_dir = Path::new("./tests/rust");
        test_dir.to_path_buf()
    }

    #[test]
    fn test_detect_duplicates_no_duplicates() {
        let test_dir = setup_test_environment();
        let args = CliArgs {
            source_path: test_dir.clone(),
            languages: vec!["rust".to_string()],
            excludes: vec![],
            output_format: "json".to_string(),
            output_file: None,
            threshold: 100,
            debug: false,
        };

        let result = detect_duplicates(&args);
        assert!(result.is_empty());
    }

    #[test]
    fn test_detect_duplicates_with_duplicates() {
        let test_dir = setup_test_environment();
        let args = CliArgs {
            source_path: test_dir.clone(),
            languages: vec!["rust".to_string()],
            excludes: vec![],
            output_format: "json".to_string(),
            output_file: None,
            threshold: 5,
            debug: false,
        };

        let result = detect_duplicates(&args);
        assert!(!result.is_empty());
    }

    #[test]
    fn test_detect_duplicates_with_excludes() {
        let test_dir = setup_test_environment();
        let args = CliArgs {
            source_path: test_dir.clone(),
            languages: vec!["rust".to_string()],
            excludes: vec!["./tests/rust/testA.rs".to_string(), "./tests/rust/testB.rs".to_string(), "./tests/rust/testC.rs".to_string()],
            output_format: "json".to_string(),
            output_file: None,
            threshold: 5,
            debug: false,
        };

        let result = detect_duplicates(&args);
        assert!(result.is_empty());
    }

    #[test]
    fn test_detect_duplicates_debug_mode() {
        let test_dir = setup_test_environment();
        let args = CliArgs {
            source_path: test_dir.clone(),
            languages: vec!["rust".to_string()],
            excludes: vec![],
            output_format: "json".to_string(),
            output_file: None,
            threshold: 1,
            debug: true,
        };

        let result = detect_duplicates(&args);
        assert!(!result.is_empty());
        assert!(Path::new("debug_data.json").exists());
        fs::remove_file("debug_data.json").unwrap();
    }
}