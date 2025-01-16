use crate::parser::ast_parser::{parse_file, get_parent_content};
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
use crate::models::detection_types::{DebugData, DuplicateBlock, DuplicateReport, ParentFingerprint};

pub fn detect_duplicates(args: &crate::cli::CliArgs, num_threads: usize) -> HashMap<String, serde_json::Value> {
    let files = filter_files(&args.source_path, &args.languages, &args.excludes, args.max_file_size);
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints: HashMap<String, ParentFingerprint> = HashMap::new();
    let mut exceeding_threshold_fingerprints: BTreeSet<String> = BTreeSet::new();
    let content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)> = Vec::new();

    let pb = ProgressBar::new(files.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} \nProcessing file: {msg}")
            .unwrap()
            .progress_chars("#>-")
    );

    // Create a custom thread pool with the specified number of threads
    let pool = ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .stack_size(100 * 1024 * 1024)
        .build()
        .unwrap();

    for file in files {
        pb.set_message(file.to_string_lossy().to_string());

        // Parse file and store blocks on the heap using Box
        if let Ok((blocks, tree, source_code)) = parse_file(&file) {
            let file_path = file.to_string_lossy().to_string();
            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            let language = get_language_from_extension(extension).unwrap_or_else(|| panic!("Unsupported file extension"));

            // Move blocks to heap to avoid stack overflow
            let blocks = Box::new(blocks);
            let processed_blocks: Vec<(String, Option<ParentFingerprint>, DuplicateBlock)> = pool.install(|| {
                blocks.par_iter()
                    .filter_map(|block| {
                        let block_length = block.end_line - block.start_line + 1;
                        if block_length < args.threshold {
                            return None;
                        }

                        let (fingerprint, _ast_representation) = compute_ast_fingerprint(&block.content, language);

                        // Check if the block already exists
                        if let Some(existing_blocks) = fingerprints.get(&fingerprint) {
                            if existing_blocks.iter().any(|b| b.start_line_number == block.start_line && b.end_line_number == block.end_line && b.source_file == file_path) {
                                return None; // Skip insertion if the block already exists
                            }
                        }

                        let duplicate_block = DuplicateBlock {
                            start_line_number: block.start_line,
                            end_line_number: block.end_line,
                            source_file: file_path.clone(),
                        };

                        let parent_fingerprint = if let Some(parent_content) = get_parent_content(&tree, &source_code, block.start_byte, block.end_byte) {
                            let (parent_fingerprint, ast_representation) = compute_ast_fingerprint(&parent_content, language);
                            Some(ParentFingerprint {
                                fingerprint: parent_fingerprint,
                                content: parent_content,
                                ast_content: ast_representation,
                            })
                        } else {
                            None
                        };

                        Some((fingerprint, parent_fingerprint, duplicate_block))
                    })
                    .collect()
            });

            for (fingerprint, parent_fingerprint, duplicate_block) in processed_blocks {
                fingerprints.entry(fingerprint.clone()).or_default().push(duplicate_block);

                if let Some(parent) = parent_fingerprint {
                    parent_fingerprints.insert(fingerprint.clone(), parent);
                }
            }
        }
        pb.inc(1);
    }

    pb.finish_with_message(format!("Processing complete in {:.2} seconds", pb.elapsed().as_secs_f64()));

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

    let mut duplicate_blocks = 0;
    let mut duplicate_lines = 0;
    let mut duplicate_file_set = BTreeSet::new();

    let details: Vec<DuplicateReport> = fingerprints
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
            duplicate_blocks += blocks.len();
            duplicate_lines += blocks.iter().map(|b| b.end_line_number - b.start_line_number + 1).sum::<usize>();
            blocks.iter().for_each(|b| { duplicate_file_set.insert(b.source_file.clone()); });
            DuplicateReport {
                fingerprint,
                line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
                blocks,
            }
        })
        .collect();

    let summary = serde_json::json!({
        "duplicateBlocks": duplicate_blocks,
        "duplicateLines": duplicate_lines,
        "duplicateFiles": duplicate_file_set.len(),
    });

    let mut result = HashMap::new();
    result.insert("summary".to_string(), summary);
    result.insert("records".to_string(), serde_json::to_value(details).unwrap());

    result
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
            threads: 1,
            max_file_size: 1048576,
            debug: false,
        };

        let result = detect_duplicates(&args, 1);
        assert!(result.get("records").unwrap().as_array().unwrap().is_empty());
        let summary = result.get("summary").unwrap();
        assert_eq!(summary["duplicateBlocks"], 0);
        assert_eq!(summary["duplicateLines"], 0);
        assert_eq!(summary["duplicateFiles"], 0);
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
            threads: 1,
            max_file_size: 1048576,
            debug: false,
        };

        let result = detect_duplicates(&args, 1);
        assert!(!result.get("records").unwrap().as_array().unwrap().is_empty());
        let summary = result.get("summary").unwrap();
        assert!(summary["duplicateBlocks"].as_u64().unwrap() > 0);
        assert!(summary["duplicateLines"].as_u64().unwrap() > 0);
        assert!(summary["duplicateFiles"].as_u64().unwrap() > 0);
    }

    // #[test]
    // fn test_remove_duplicate_blocks() {
    //     let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    // 
    //     fingerprints.insert(
    //         "fingerprint1".to_string(),
    //         vec![
    //             DuplicateBlock {
    //                 start_line_number: 1,
    //                 end_line_number: 5,
    //                 source_file: "file1.rs".to_string(),
    //             },
    //             DuplicateBlock {
    //                 start_line_number: 1,
    //                 end_line_number: 5,
    //                 source_file: "file1.rs".to_string(),
    //             },
    //         ],
    //     );
    // 
    //     fingerprints.insert(
    //         "fingerprint2".to_string(),
    //         vec![
    //             DuplicateBlock {
    //                 start_line_number: 10,
    //                 end_line_number: 15,
    //                 source_file: "file2.rs".to_string(),
    //             },
    //             DuplicateBlock {
    //                 start_line_number: 20,
    //                 end_line_number: 25,
    //                 source_file: "file2.rs".to_string(),
    //             },
    //         ],
    //     );
    // 
    //     remove_duplicate_blocks(&mut fingerprints);
    // 
    //     assert_eq!(fingerprints["fingerprint1"].len(), 1);
    //     assert_eq!(fingerprints["fingerprint2"].len(), 2);
    // }

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
            threads: 1,
            max_file_size: 1048576,
            debug: false,
        };

        let result = detect_duplicates(&args, 1);
        assert!(result.get("records").unwrap().as_array().unwrap().is_empty());
        let summary = result.get("summary").unwrap();
        assert_eq!(summary["duplicateBlocks"], 0);
        assert_eq!(summary["duplicateLines"], 0);
        assert_eq!(summary["duplicateFiles"], 0);
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
            threads: 1,
            max_file_size: 1048576,
            debug: true,
        };

        let result = detect_duplicates(&args, 1);
        assert!(!result.get("records").unwrap().as_array().unwrap().is_empty());
        assert!(Path::new("debug_data.json").exists());
        fs::remove_file("debug_data.json").unwrap();
    }
}