use crate::parser::ast_parser::{parse_file, get_parent_content};
use crate::utils::{filter_files, compute_fingerprint};
use serde::Serialize;
use std::collections::{HashMap, BTreeSet};
use std::fs::File;
use std::io::Write;

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

#[derive(Serialize)]
struct ParentFingerprint {
    fingerprint: String,
    content: String,
}

pub fn detect_duplicates(args: &crate::cli::CliArgs) -> Vec<DuplicateReport> {
    let files = filter_files(&args.source_path, &args.excludes);
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();
    let mut parent_fingerprints: HashMap<String, ParentFingerprint> = HashMap::new();
    let mut exceeding_threshold_fingerprints: BTreeSet<String> = BTreeSet::new();

    for file in files {
        if let Ok((blocks, tree, source_code)) = parse_file(&file) {
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
                    let fingerprint = compute_fingerprint(&block.content);
                    log::debug!("After fingerprinting: {}", fingerprint);
                    fingerprints.entry(fingerprint.clone()).or_default().push(DuplicateBlock {
                        start_line_number: block.start_line,
                        end_line_number: block.end_line,
                        source_file: file.to_string_lossy().to_string(),
                    });
    
                    let mut cursor = tree.walk();
                    while cursor.node().start_byte() != block.start_byte {
                        if !cursor.goto_first_child() {
                            while !cursor.goto_next_sibling() {
                                if !cursor.goto_parent() {
                                    break;
                                }
                            }
                        }
                    }
    
                    // Get the parent node's content
                    if let Some(parent_content) = get_parent_content(&cursor, &source_code) {
                        let parent_fingerprint = compute_fingerprint(&parent_content);
                        parent_fingerprints.insert(
                            fingerprint.clone(),
                            ParentFingerprint {
                                fingerprint: parent_fingerprint.clone(),
                                content: parent_content.clone(),
                            },
                        );
    
                        // Log the parent node's content
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

    // Insert into exceeding_threshold_fingerprints after processing all files
    for (fingerprint, blocks) in &fingerprints {
        if blocks.len() > 1 && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold {
            exceeding_threshold_fingerprints.insert(fingerprint.clone());
        }
    }

    // Save parent_fingerprints to a local file if debug mode is enabled
    if args.debug {
        if let Ok(json) = serde_json::to_string_pretty(&parent_fingerprints) {
            let mut file = File::create("parent_fingerprints.json").expect("Failed to create file");
            file.write_all(json.as_bytes()).expect("Failed to write to file");
        }

        // Save exceeding_threshold_fingerprints to a local file if debug mode is enabled
        if let Ok(json) = serde_json::to_string_pretty(&exceeding_threshold_fingerprints) {
            let mut file = File::create("exceeding_threshold_fingerprints.json").expect("Failed to create file");
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