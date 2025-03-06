use crate::models::detection_types::{DuplicateBlock, DuplicateReport, ParentFingerprint};
use crate::parser::ast_parser::parse_file;
use crate::utils::filters::filter_files;
use dashmap::DashMap;
use indicatif::ProgressBar;
use indicatif::ProgressStyle;
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;
use serde_json::Value;
use std::collections::BTreeSet;
use reson::POOL_STACK_SIZE;

pub fn detect_duplicates(args: &crate::cli::CliArgs, num_threads: usize) -> Value {
    let files = filter_files(&args.source_path, &args.languages, &args.excludes, args.max_file_size);
    let fingerprints: DashMap<String, Vec<DuplicateBlock>> = DashMap::new();
    let parent_fingerprints: DashMap<String, ParentFingerprint> = DashMap::new();

    let pb = ProgressBar::new(files.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} \nProcessing file: {msg}")
            .unwrap()
            .progress_chars("#>-")
    );

    let pool = ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .stack_size(POOL_STACK_SIZE)
        .build()
        .unwrap();

    pool.install(|| {
        let processed_blocks: Vec<(String, Option<ParentFingerprint>, DuplicateBlock)> = files.par_iter()
                .filter_map(|file| {
                    pb.set_message(file.to_string_lossy().to_string());
                    if let Ok((blocks, _tree, _source_code)) = parse_file(file, args.threshold) {
                        let file_path = file.to_string_lossy().to_string();
                        let result = Some(blocks.iter().filter_map(|block_rc| {
                            let block = block_rc.borrow();
                            let fingerprint = block.code_block.fingerprint.clone();
                            // Skip blank ASTs and small blocks
                            if fingerprint == "blank_ast" || block.code_block.ast_lines < 10 {
                                return None;
                            }
                            let duplicate_block = DuplicateBlock {
                                start_line_number: block.code_block.start_line,
                                end_line_number: block.code_block.end_line,
                                source_file: file_path.clone(),
                            };
                            let parent_fingerprint = block.parent.as_ref().and_then(|parent_weak| {
                                parent_weak.upgrade().map(|parent_ref| {
                                    let parent = parent_ref.borrow();
                                    let parent_fingerprint = parent.code_block.fingerprint.clone();
                                    ParentFingerprint {
                                        fingerprint: parent_fingerprint,
                                    }
                                })
                            });
                            Some((fingerprint, parent_fingerprint, duplicate_block))
                        }).collect::<Vec<_>>());
                        pb.inc(1);
                        result
                    } else {
                        pb.inc(1);
                        None
                    }
                })
                .flatten()
                .collect();

        // Ensure that writing to fingerprints and parent_fingerprints is synchronized
        for (fingerprint, parent_fingerprint, duplicate_block) in processed_blocks {
            fingerprints.entry(fingerprint.clone()).and_modify(|existing_blocks| {
                existing_blocks.push(duplicate_block.clone());
            }).or_insert_with(|| vec![duplicate_block.clone()]);

            if let Some(parent) = parent_fingerprint {
                parent_fingerprints.entry(fingerprint.clone()).or_insert(parent);
            }
        }
    });

    pb.finish_with_message(format!("Processing complete in {:.2} seconds", pb.elapsed().as_secs_f64()));

    let exceeding_threshold_fingerprints: BTreeSet<String> = fingerprints.iter()
        .filter(|entry| entry.value().len() > 1 && (entry.value()[0].end_line_number - entry.value()[0].start_line_number + 1) >= args.threshold)
        .map(|entry| entry.key().clone())
        .collect();

    fn filter_and_collect_fingerprints(
        fingerprints: &DashMap<String, Vec<DuplicateBlock>>,
        parent_fingerprints: &DashMap<String, ParentFingerprint>,
        exceeding_threshold_fingerprints: &BTreeSet<String>,
        threshold: usize,
    ) -> (usize, usize, BTreeSet<String>, Vec<DuplicateReport>) {
        let (duplicate_blocks, duplicate_lines, duplicate_file_set, details): (usize, usize, BTreeSet<String>, Vec<DuplicateReport>) = fingerprints
            .iter()
            .filter(|entry| {
                let blocks = entry.value();
                blocks.len() > 1
                    && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= threshold
                    && parent_fingerprints.get(entry.key())
                    .map_or(true, |pf| !exceeding_threshold_fingerprints.contains(&pf.fingerprint))
            })
            .map(|entry| {
                let blocks = entry.value();
                let line_count: usize = blocks.iter().map(|b| b.end_line_number - b.start_line_number + 1).sum();
                let files: BTreeSet<String> = blocks.iter().map(|b| b.source_file.clone()).collect();
                let report = DuplicateReport {
                    fingerprint: entry.key().clone(),
                    line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
                    blocks: blocks.clone(),
                };
                (blocks.len(), line_count, files, report)
            })
            .fold((0, 0, BTreeSet::new(), Vec::new()), |(acc_blocks, acc_lines, mut acc_files, mut acc_details), (b, l, f, r)| {
                acc_files.extend(f);
                acc_details.push(r);
                (acc_blocks + b, acc_lines + l, acc_files, acc_details)
            });

        (duplicate_blocks, duplicate_lines, duplicate_file_set, details)
    }

    let (duplicate_blocks, duplicate_lines, duplicate_file_set, details) = filter_and_collect_fingerprints(
        &fingerprints,
        &parent_fingerprints,
        &exceeding_threshold_fingerprints,
        args.threshold,
    );

    let summary = serde_json::json!({
        "duplicateBlocks": duplicate_blocks,
        "duplicateLines": duplicate_lines,
        "duplicateFiles": duplicate_file_set.len(),
    });

    let result = serde_json::json!({
        "summary": summary,
        "records": serde_json::to_value(details).unwrap()
    });

    Value::Object(result.as_object().unwrap().clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cli::CliArgs;
    use std::path::{Path, PathBuf};

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
    }
}