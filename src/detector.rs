use crate::parser::ast_parser::{parse_file, get_parent_content};
use crate::utils::{filter_files, compute_ast_fingerprint};
use serde::Serialize;
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;
use tree_sitter::Parser;
use tree_sitter_c::language as c_language;
use tree_sitter_java::language as java_language;
use tree_sitter_python::language as python_language;

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
}

#[derive(Serialize)]
struct DebugData {
    parent_fingerprints: HashMap<String, ParentFingerprint>,
    exceeding_threshold_fingerprints: BTreeSet<String>,
    content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)>, // (content, start_line, end_line, fingerprint, file_name, ast_content)
}

pub fn detect_duplicates(args: &crate::cli::CliArgs) -> Vec<DuplicateReport> {
    let files = filter_files(&args.source_path, &args.excludes);
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints: HashMap<String, ParentFingerprint> = HashMap::new();
    let mut exceeding_threshold_fingerprints: BTreeSet<String> = BTreeSet::new();
    let mut content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)> = Vec::new();

    for file in files {
        if let Ok((blocks, tree, source_code)) = parse_file(&file) {
            let language = match file.extension().and_then(|ext| ext.to_str()) {
                Some("c") | Some("cpp") => c_language(),
                Some("java") => java_language(),
                Some("py") => python_language(),
                _ => continue,
            };

            for block in blocks {
                log::debug!(
                    "Processing block: start_line={}, end_line={}, content={}",
                    block.start_line,
                    block.end_line,
                    block.content
                );
                let block_length = block.end_line - block.start_line + 1;
                if block_length >= args.threshold {
                    log::debug!("Original content before fingerprinting: {}", block.content);
            
                    let mut block_parser = Parser::new();
                    block_parser.set_language(language).expect("Failed to set language");
                    let block_tree = block_parser.parse(&block.content, None).expect("Failed to parse block content");
            
                    let fingerprint = compute_ast_fingerprint(&block.content, Some(&block_tree));
                    let ast_content = format!("{:?}", block_tree.root_node());
                    log::debug!("After fingerprinting: {}", fingerprint);
                    fingerprints.entry(fingerprint.clone()).or_default().push(DuplicateBlock {
                        start_line_number: block.start_line,
                        end_line_number: block.end_line,
                        source_file: file.to_string_lossy().to_string(),
                    });
            
                    content_fingerprint_mappings.push((block.content.clone(), block.start_line, block.end_line, fingerprint.clone(), file.to_string_lossy().to_string(), ast_content.clone()));
            
                    // Get the parent node's content
                    if let Some(parent_content) = get_parent_content(&tree, &source_code, block.start_byte, block.end_byte) {
                        let parent_fingerprint = compute_ast_fingerprint(&parent_content, None);
                        parent_fingerprints.insert(
                            fingerprint.clone(),
                            ParentFingerprint {
                                fingerprint: parent_fingerprint.clone(),
                                content: parent_content.clone(),
                            },
                        );
            
                        log::debug!(
                            "Block exceeds threshold: start_line={}, end_line={}, content={}, parent_content={}, fingerprint={}, parent_fingerprint={}",
                            block.start_line,
                            block.end_line,
                            block.content,
                            parent_content,
                            fingerprint,
                            parent_fingerprint
                        );
                    }
                }
            }
        }
    }

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
                && debug_data.parent_fingerprints.get(fingerprint)
                .map_or(true, |pf| !debug_data.exceeding_threshold_fingerprints.contains(&pf.fingerprint));
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