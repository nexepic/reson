use crate::parser::ast_parser::{parse_file, get_parent_content};
use crate::utils::{filter_files, compute_fingerprint};
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
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

pub fn detect_duplicates(args: &crate::cli::CliArgs) -> Vec<DuplicateReport> {
    let files = filter_files(&args.source_path, &args.excludes);
    let mut fingerprints: HashMap<String, Vec<DuplicateBlock>> = HashMap::new();

    for file in files {
        if let Ok((blocks, tree, source_code)) = parse_file(&file) {
            for block in blocks {
                let fingerprint = compute_fingerprint(&block.content);
                fingerprints.entry(fingerprint).or_default().push(DuplicateBlock {
                    start_line_number: block.start_line,
                    end_line_number: block.end_line,
                    source_file: file.to_string_lossy().to_string(),
                });

                // Check if the block length exceeds the threshold
                let block_length = block.end_line - block.start_line + 1;
                if block_length >= args.threshold {
                    // Create a new cursor for each block
                    let mut cursor = tree.walk();
                    // Move the cursor to the current block node
                    cursor.goto_first_child_for_byte(block.start_byte);

                    // Get the parent node's content
                    let parent_content = get_parent_content(&cursor, &source_code).unwrap_or_default();
                    // Log the parent node's content
                    log::debug!(
                        "Block exceeds threshold: start_line={}, end_line={}, content={}, parent_content={}",
                        block.start_line,
                        block.end_line,
                        block.content,
                        parent_content
                    );
                }
            }
        }
    }

    fingerprints
        .into_iter()
        .filter(|(_, blocks)| blocks.len() > 1 && (blocks[0].end_line_number - blocks[0].start_line_number + 1) >= args.threshold)
        .map(|(fingerprint, blocks)| DuplicateReport {
            fingerprint,
            line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
            blocks,
        })
        .collect()
}