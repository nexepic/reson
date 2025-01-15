#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LineType {
    Unknown,
    Code,
    NotCode,
}

#[derive(Clone)]
pub struct LineStats {
    pub total_lines: usize,
    pub code_lines: usize,
    pub comment_lines: usize,
    pub blank_lines: usize,
}

// impl LineStats {
//     pub fn new() -> Self {
//         LineStats {
//             total_lines: 0,
//             code_lines: 0,
//             comment_lines: 0,
//             blank_lines: 0,
//         }
//     }
// 
//     pub fn add(&mut self, other: &LineStats) {
//         self.total_lines += other.total_lines;
//         self.code_lines += other.code_lines;
//         self.comment_lines += other.comment_lines;
//         self.blank_lines += other.blank_lines;
//     }
// }

#[derive(Debug)]
pub struct CodeBlock {
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_line: usize,
    pub end_line: usize,
    pub content: String,
}