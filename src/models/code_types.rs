use std::cmp::Ordering;

#[derive(Debug, Clone, Eq)]
pub struct CodeBlock {
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_line: usize,
    pub end_line: usize,
    pub content: String,
}

impl Ord for CodeBlock {
    fn cmp(&self, other: &Self) -> Ordering {
        self.start_byte.cmp(&other.start_byte)
            .then_with(|| self.end_byte.cmp(&other.end_byte))
            .then_with(|| self.start_line.cmp(&other.start_line))
            .then_with(|| self.end_line.cmp(&other.end_line))
            .then_with(|| self.content.cmp(&other.content))
    }
}

impl PartialOrd for CodeBlock {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for CodeBlock {
    fn eq(&self, other: &Self) -> bool {
        self.start_byte == other.start_byte &&
        self.end_byte == other.end_byte &&
        self.start_line == other.start_line &&
        self.end_line == other.end_line &&
        self.content == other.content
    }
}