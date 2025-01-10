use crate::parser::ast_parser::{parse_file, get_parent_content};
use serde::Serialize;
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use crate::utils::ast_collection::compute_ast_fingerprint;
use crate::utils::filters::filter_files;
use crate::utils::language_mapping::get_language_from_extension;
use indicatif::ProgressBar;
use indicatif::ProgressStyle;
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;

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

#[derive(Serialize, Clone, Debug)]
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
    // Configure Rayon to use 10 threads
    let pool = ThreadPoolBuilder::new()
        .num_threads(10)
        .build()
        .unwrap();

    pool.install(|| {
        // Collect files to be processed
        let files = filter_files(&args.source_path, &args.languages, &args.excludes);

        // Configure progress bar
        let pb = ProgressBar::new(files.len() as u64);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta})\nProcessing file: {msg}")
                .unwrap()
                .progress_chars("#>-"),
        );

        // Use thread-local storage for intermediate data to reduce lock contention
        let results: Vec<_> = files
            .par_iter()
            .map(|file| {
                // Update progress bar (only message is updated inside the parallel block)
                pb.set_message(file.to_string_lossy().to_string());

                // Process the file and gather duplicate data
                if let Ok((blocks, tree, source_code)) = parse_file(file) {
                    let mut local_fingerprints = HashMap::<String, Vec<DuplicateBlock>>::new();
                    let mut local_content_mappings = Vec::<(String, usize, usize, String, String, String)>::new();
                    let mut local_parent_fingerprints = HashMap::<String, ParentFingerprint>::new();

                    for block in blocks {
                        let block_length = block.end_line - block.start_line + 1;
                        if block_length >= args.threshold {
                            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
                            let language = get_language_from_extension(extension)
                                .unwrap_or_else(|| panic!("Unsupported file extension"));

                            let (fingerprint, ast_representation) = compute_ast_fingerprint(&block.content, language);

                            // Check for existing block duplicates
                            if local_fingerprints
                                .get(&fingerprint)
                                .map_or(false, |existing_blocks| {
                                    existing_blocks.iter().any(|b| {
                                        b.start_line_number == block.start_line
                                            && b.end_line_number == block.end_line
                                            && b.source_file == file.to_string_lossy().to_string()
                                    })
                                })
                            {
                                continue;
                            }

                            // Add block to local fingerprints
                            local_fingerprints
                                .entry(fingerprint.clone())
                                .or_default()
                                .push(DuplicateBlock {
                                    start_line_number: block.start_line,
                                    end_line_number: block.end_line,
                                    source_file: file.to_string_lossy().to_string(),
                                });

                            // Add content mapping
                            local_content_mappings.push((
                                block.content.clone(),
                                block.start_line,
                                block.end_line,
                                fingerprint.clone(),
                                file.to_string_lossy().to_string(),
                                ast_representation.clone(),
                            ));

                            // Process parent content
                            if let Some(parent_content) =
                                get_parent_content(&tree, &source_code, block.start_byte, block.end_byte)
                            {
                                let (parent_fingerprint, parent_ast) =
                                    compute_ast_fingerprint(&parent_content, language);
                                local_parent_fingerprints.insert(
                                    fingerprint.clone(),
                                    ParentFingerprint {
                                        fingerprint: parent_fingerprint,
                                        content: parent_content,
                                        ast_content: parent_ast,
                                    },
                                );
                            }
                        }
                    }

                    Some((local_fingerprints, local_content_mappings, local_parent_fingerprints))
                } else {
                    None
                }
            })
            .filter_map(|x| x)
            .collect();

        pb.finish_with_message("Processing complete");

        // Aggregate results from all threads
        let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
        let mut content_mappings = Vec::new();
        let mut parent_fingerprints = HashMap::new();

        for (local_fingerprints, local_content_mappings, local_parent_fingerprints) in results {
            for (key, blocks) in local_fingerprints {
                fingerprints.entry(key).or_default().extend(blocks);
            }
            content_mappings.extend(local_content_mappings);
            parent_fingerprints.extend(local_parent_fingerprints);
        }

        if args.debug {
            let debug_data = DebugData {
                parent_fingerprints: parent_fingerprints.clone(),
                exceeding_threshold_fingerprints: BTreeSet::new(),
                content_fingerprint_mappings: content_mappings.clone(),
            };
            if let Ok(json) = serde_json::to_string_pretty(&debug_data) {
                let mut file = File::create("debug_data.json").expect("Failed to create file");
                file.write_all(json.as_bytes()).expect("Failed to write to file");
            }
        }

        // Filter fingerprints and create reports
        fingerprints
            .into_iter()
            .filter(|(_, blocks)| blocks.len() > 1)
            .map(|(fingerprint, blocks)| DuplicateReport {
                fingerprint,
                line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
                blocks,
            })
            .collect()
    })
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