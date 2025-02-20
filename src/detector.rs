use crate::parser::ast_parser::{parse_file};
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use std::sync::{Arc, Mutex};
use crate::parser::ast_collection::compute_ast_fingerprint;
use crate::utils::filters::filter_files;
use indicatif::ProgressBar;
use indicatif::ProgressStyle;
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;
use crate::models::detection_types::{DebugData, DuplicateBlock, DuplicateReport, ParentFingerprint};

pub fn detect_duplicates(args: &crate::cli::CliArgs, num_threads: usize) -> HashMap<String, serde_json::Value> {
    let files = filter_files(&args.source_path, &args.languages, &args.excludes, args.max_file_size);
    let fingerprints: Arc<Mutex<HashMap<String, Vec<DuplicateBlock>>>> = Arc::new(Mutex::new(HashMap::new()));
    let parent_fingerprints: Arc<Mutex<HashMap<String, ParentFingerprint>>> = Arc::new(Mutex::new(HashMap::new()));

    let pb = ProgressBar::new(files.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} \nProcessing file: {msg}")
            .unwrap()
            .progress_chars("#>-")
    );

    let pool = ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .stack_size(100 * 1024 * 1024)
        .build()
        .unwrap();

    pool.install(|| {
        files.par_iter().for_each(|file| {
            pb.set_message(file.to_string_lossy().to_string());

            if let Ok((blocks, _tree, _source_code)) = parse_file(file, args.threshold) {
                let file_path = file.to_string_lossy().to_string();

                let processed_blocks: Vec<(String, Option<ParentFingerprint>, DuplicateBlock)> = blocks.iter()
                    .filter_map(|block_rc| {
                        let block = block_rc.borrow();
                        let fingerprint = compute_ast_fingerprint(&block.code_block.ast_representation);

                        let fingerprints_lock = fingerprints.lock().unwrap();
                        if let Some(existing_blocks) = fingerprints_lock.get(&fingerprint) {
                            if existing_blocks.iter().any(|b|
                                b.start_line_number == block.code_block.start_line &&
                                    b.end_line_number == block.code_block.end_line &&
                                    b.source_file == file_path
                            ) {
                                return None;
                            }
                        }

                        let duplicate_block = DuplicateBlock {
                            start_line_number: block.code_block.start_line,
                            end_line_number: block.code_block.end_line,
                            source_file: file_path.clone(),
                        };

                        let parent_fingerprint = block.parent.as_ref().and_then(|parent_weak| {
                            parent_weak.upgrade().map(|parent_ref| {
                                let parent = parent_ref.borrow();
                                let parent_fingerprint = compute_ast_fingerprint(&parent.code_block.ast_representation);
                                ParentFingerprint {
                                    fingerprint: parent_fingerprint,
                                    content: parent.code_block.content.clone(),
                                }
                            })
                        });

                        Some((fingerprint, parent_fingerprint, duplicate_block))
                    })
                    .collect();

                {
                    let mut fingerprints_lock = fingerprints.lock().unwrap();
                    let mut parent_fingerprints_lock = parent_fingerprints.lock().unwrap();
                    for (fingerprint, parent_fingerprint, duplicate_block) in processed_blocks {
                        fingerprints_lock.entry(fingerprint.clone()).or_default().push(duplicate_block);
                        if let Some(parent) = parent_fingerprint {
                            parent_fingerprints_lock.insert(fingerprint, parent);
                        }
                    }
                }
            }
            pb.inc(1);
        });
    });

    pb.finish_with_message(format!("Processing complete in {:.2} seconds", pb.elapsed().as_secs_f64()));

    // 计算超过阈值的 fingerprints，确保此处计算是单线程操作
    let exceeding_threshold_fingerprints: BTreeSet<String> = {
        let fingerprints_lock = fingerprints.lock().unwrap();
        fingerprints_lock.iter()
            .filter(|(_, blocks)| blocks.len() > 1 && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold)
            .map(|(fingerprint, _)| fingerprint.clone())
            .collect()
    };

    let debug_data = DebugData {
        parent_fingerprints: parent_fingerprints.lock().unwrap().clone(),
        exceeding_threshold_fingerprints: exceeding_threshold_fingerprints.clone(),
    };

    if args.debug {
        if let Ok(json) = serde_json::to_string_pretty(&debug_data) {
            let mut file = File::create("debug_data.json").expect("Failed to create file");
            file.write_all(json.as_bytes()).expect("Failed to write to file");
        }
    }

    let (duplicate_blocks, duplicate_lines, duplicate_file_set): (usize, usize, BTreeSet<String>) = fingerprints
        .lock().unwrap()
        .par_iter()
        .filter(|(fingerprint, blocks)| {
            blocks.len() > 1
                && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold
                && parent_fingerprints.lock().unwrap().get(&**fingerprint)
                .map_or(true, |pf| !exceeding_threshold_fingerprints.contains(&pf.fingerprint))
        })
        .map(|(_, blocks)| {
            let line_count: usize = blocks.iter().map(|b| b.end_line_number - b.start_line_number + 1).sum();
            let files: BTreeSet<String> = blocks.iter().map(|b| b.source_file.clone()).collect();
            (blocks.len(), line_count, files)
        })
        .reduce(|| (0, 0, BTreeSet::new()), |(acc_blocks, acc_lines, mut acc_files), (b, l, f)| {
            acc_files.extend(f);
            (acc_blocks + b, acc_lines + l, acc_files)
        });

    let summary = serde_json::json!({
        "duplicateBlocks": duplicate_blocks,
        "duplicateLines": duplicate_lines,
        "duplicateFiles": duplicate_file_set.len(),
    });

    let details: Vec<DuplicateReport> = fingerprints
        .lock().unwrap()
        .iter()
        .filter(|(fingerprint, blocks)| {
            blocks.len() > 1
                && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold
                && parent_fingerprints.lock().unwrap().get(&**fingerprint)
                .map_or(true, |pf| !exceeding_threshold_fingerprints.contains(&pf.fingerprint))
        })
        .map(|(fingerprint, blocks)| DuplicateReport {
            fingerprint: fingerprint.clone(),
            line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
            blocks: blocks.clone(),
        })
        .collect();

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