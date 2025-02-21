use serde::Serialize;

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
    // pub content: String,
}