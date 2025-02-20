use serde::Serialize;
use std::collections::{BTreeSet, HashMap};

#[derive(Serialize, Debug, Clone)]
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
pub struct DuplicateReportXML<T> {
    pub items: T,
}

#[derive(Serialize, Clone)]
pub struct ParentFingerprint {
    pub fingerprint: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct DebugData {
    pub parent_fingerprints: HashMap<String, ParentFingerprint>,
    pub exceeding_threshold_fingerprints: BTreeSet<String>,
    pub content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)>, // (content, start_line, end_line, fingerprint, file_name, ast_content)
}