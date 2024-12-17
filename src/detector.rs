use crate::parser::tree_sitter::parse_file;
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
        if let Ok(blocks) = parse_file(&file) {
            for block in blocks {
                let fingerprint = compute_fingerprint(&block.content);
                fingerprints.entry(fingerprint).or_default().push(DuplicateBlock {
                    start_line_number: block.start_line,
                    end_line_number: block.end_line,
                    source_file: file.to_string_lossy().to_string(),
                });
            }
        }
    }

    fingerprints
        .into_iter()
        .filter(|(_, blocks)| blocks.len() > 1)
        .map(|(fingerprint, blocks)| DuplicateReport {
            fingerprint,
            line_count: blocks[0].end_line_number - blocks[0].start_line_number + 1,
            blocks,
        })
        .collect()
}
