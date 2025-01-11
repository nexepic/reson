use crate::parser::ast_parser::{parse_file, get_parent_content, CodeBlock};
use serde::Serialize;
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use crate::utils::ast_collection::compute_ast_fingerprint;
use crate::utils::filters::filter_files;
use crate::utils::language_mapping::get_language_from_extension;
use indicatif::ProgressBar;
use indicatif::ProgressStyle;
use tree_sitter::Tree;
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
    let pb = ProgressBar::new(files.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta})\nProcessing file: {msg}")
            .unwrap()
            .progress_chars("#>-"),
    );

    // 并行处理每个文件
    let results: Vec<FileProcessingResult> = files
        .par_iter()
        .map(|file| {
            pb.set_message(file.to_string_lossy().to_string());
            let result = if let Ok((blocks, tree, source_code)) = parse_file(file) {
                process_file(file, blocks, tree, source_code, args)
            } else {
                None
            };
            pb.inc(1);
            result
        })
        .filter_map(|res| res)
        .collect();

    pb.finish_with_message("Processing complete");

    // 合并结果
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints: HashMap<String, ParentFingerprint> = HashMap::new();
    let mut content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)> =
        Vec::new();

    for result in results {
        fingerprints.extend(result.fingerprints);
        parent_fingerprints.extend(result.parent_fingerprints);
        content_fingerprint_mappings.extend(result.content_fingerprint_mappings);
    }

    // 计算超出阈值的指纹
    let exceeding_threshold_fingerprints = calculate_exceeding_threshold_fingerprints(
        &fingerprints,
        args.threshold,
    );

    // 调试数据输出（可选）
    if args.debug {
        let debug_data = DebugData {
            parent_fingerprints: parent_fingerprints.clone(),
            exceeding_threshold_fingerprints: exceeding_threshold_fingerprints.clone(),
            content_fingerprint_mappings: content_fingerprint_mappings.clone(),
        };
        if let Ok(json) = serde_json::to_string_pretty(&debug_data) {
            let mut file = File::create("debug_data.json").expect("Failed to create file");
            file.write_all(json.as_bytes()).expect("Failed to write to file");
        }
    }

    // 生成重复报告
    create_duplicate_reports(
        fingerprints,
        parent_fingerprints,
        exceeding_threshold_fingerprints,
        args,
    )
}

struct FileProcessingResult {
    fingerprints: HashMap<String, Vec<DuplicateBlock>>,
    parent_fingerprints: HashMap<String, ParentFingerprint>,
    content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)>,
}

// 单个文件的处理逻辑
fn process_file(
    file: &std::path::Path,
    blocks: Vec<CodeBlock>,
    tree: Tree,
    source_code: String,
    args: &crate::cli::CliArgs,
) -> Option<FileProcessingResult> {
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints = HashMap::new();
    let mut content_fingerprint_mappings = Vec::new();

    for block in blocks {
        let block_length = block.end_line - block.start_line + 1;
        if block_length >= args.threshold {
            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            let language = get_language_from_extension(extension).unwrap_or_else(|| panic!("Unsupported file extension"));

            let (fingerprint, ast_representation) = compute_ast_fingerprint(&block.content, language);

            fingerprints.entry(fingerprint.clone()).or_default().push(DuplicateBlock {
                start_line_number: block.start_line,
                end_line_number: block.end_line,
                source_file: file.to_string_lossy().to_string(),
            });

            content_fingerprint_mappings.push((
                block.content.clone(),
                block.start_line,
                block.end_line,
                fingerprint.clone(),
                file.to_string_lossy().to_string(),
                ast_representation.clone(),
            ));

            if let Some(parent_content) = get_parent_content(&tree, &source_code, block.start_byte, block.end_byte) {
                let (parent_fingerprint, ast_representation) = compute_ast_fingerprint(&parent_content, language);
                parent_fingerprints.insert(
                    fingerprint.clone(),
                    ParentFingerprint {
                        fingerprint: parent_fingerprint.clone(),
                        content: parent_content.clone(),
                        ast_content: ast_representation.clone(),
                    },
                );
            }
        }
    }

    Some(FileProcessingResult {
        fingerprints,
        parent_fingerprints,
        content_fingerprint_mappings,
    })
}

// 超出阈值的指纹计算
fn calculate_exceeding_threshold_fingerprints(
    fingerprints: &HashMap<String, Vec<DuplicateBlock>>,
    threshold: usize,
) -> BTreeSet<String> {
    fingerprints
        .iter()
        .filter_map(|(fingerprint, blocks)| {
            if blocks.len() > 1 && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= threshold {
                Some(fingerprint.clone())
            } else {
                None
            }
        })
        .collect()
}

// 创建重复报告
fn create_duplicate_reports(
    fingerprints: HashMap<String, Vec<DuplicateBlock>>,
    parent_fingerprints: HashMap<String, ParentFingerprint>,
    exceeding_threshold_fingerprints: BTreeSet<String>,
    args: &crate::cli::CliArgs,
) -> Vec<DuplicateReport> {
    fingerprints
        .into_iter()
        .filter(|(fingerprint, blocks)| {
            blocks.len() > 1
                && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold
                && parent_fingerprints.get(fingerprint)
                .map_or(true, |pf| !exceeding_threshold_fingerprints.contains(&pf.fingerprint))
        })
        .map(|(fingerprint, blocks)| DuplicateReport {
            fingerprint,
            line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
            blocks,
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