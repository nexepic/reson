use std::collections::{BTreeSet, HashMap};
use serde::Serialize;
use std::hash::{Hash, Hasher};

#[derive(Serialize, Debug, Eq, Clone)]
pub struct DuplicateBlock {
    pub start_line_number: usize,
    pub end_line_number: usize,
    pub source_file: String,
}

impl PartialEq for DuplicateBlock {
    fn eq(&self, other: &Self) -> bool {
        self.start_line_number == other.start_line_number
            && self.end_line_number == other.end_line_number
            && self.source_file == other.source_file
    }
}

impl Hash for DuplicateBlock {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.start_line_number.hash(state);
        self.end_line_number.hash(state);
        self.source_file.hash(state);
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