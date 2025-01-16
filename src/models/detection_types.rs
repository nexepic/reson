use std::cmp::Ordering;
use serde::Serialize;
use std::collections::{BTreeSet, HashMap};

#[derive(Serialize, Debug, Clone, Eq)]
pub struct DuplicateBlock {
    pub start_line_number: usize,
    pub end_line_number: usize,
    pub source_file: String,
}

impl Ord for DuplicateBlock {
    fn cmp(&self, other: &Self) -> Ordering {
        self.start_line_number.cmp(&other.start_line_number)
            .then_with(|| self.end_line_number.cmp(&other.end_line_number))
            .then_with(|| self.source_file.cmp(&other.source_file))
    }
}

impl PartialOrd for DuplicateBlock {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for DuplicateBlock {
    fn eq(&self, other: &Self) -> bool {
        self.start_line_number == other.start_line_number &&
            self.end_line_number == other.end_line_number &&
            self.source_file == other.source_file
    }
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
    pub ast_content: String,
}

#[derive(Serialize)]
pub struct DebugData {
    pub parent_fingerprints: HashMap<String, ParentFingerprint>,
    pub exceeding_threshold_fingerprints: BTreeSet<String>,
    pub content_fingerprint_mappings: Vec<(String, usize, usize, String, String, String)>, // (content, start_line, end_line, fingerprint, file_name, ast_content)
}