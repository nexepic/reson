#[derive(Debug)]
pub struct CodeBlock {
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_line: usize,
    pub end_line: usize,
    pub content: String,
}