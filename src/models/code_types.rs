use std::cell::RefCell;
use std::cmp::Ordering;
use std::rc::{Rc, Weak};

#[derive(Debug, Clone, Eq)]
pub struct CodeBlock {
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_line: usize,
    pub end_line: usize,
    // pub content: String,
    // pub ast_representation: String,
    pub fingerprint: String,
    pub ast_lines: usize,
}

#[derive(Debug)]
pub struct CodeBlockNode {
    pub code_block: CodeBlock,
    pub parent: Option<Weak<RefCell<CodeBlockNode>>>,
}

pub type CodeBlockRef = Rc<RefCell<CodeBlockNode>>;

impl Ord for CodeBlock {
    fn cmp(&self, other: &Self) -> Ordering {
        self.start_byte.cmp(&other.start_byte)
            .then_with(|| self.end_byte.cmp(&other.end_byte))
            .then_with(|| self.start_line.cmp(&other.start_line))
            .then_with(|| self.end_line.cmp(&other.end_line))
            // .then_with(|| self.content.cmp(&other.content))
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
        // self.content == other.content
        self.fingerprint == other.fingerprint
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    #[test]
    fn test_codeblock_ordering() {
        let block1 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 0; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        let block2 = CodeBlock {
            start_byte: 11,
            end_byte: 20,
            start_line: 2,
            end_line: 2,
            // content: "int a = 10;".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        let block3 = CodeBlock {
            start_byte: 21,
            end_byte: 30,
            start_line: 3,
            end_line: 3,
            // content: "return a;".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        let mut blocks = BTreeSet::new();
        blocks.insert(block3);
        blocks.insert(block1);
        blocks.insert(block2);

        let blocks_vec: Vec<_> = blocks.iter().collect();
        assert_eq!(blocks_vec[0].start_byte, 0);
        assert_eq!(blocks_vec[1].start_byte, 11);
        assert_eq!(blocks_vec[2].start_byte, 21);
    }

    #[test]
    fn test_codeblock_equality() {
        let block1 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 0; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        let block2 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 0; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        assert_eq!(block1, block2);
    }

    #[test]
    fn test_codeblock_inequality() {
        let block1 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 0; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "a".to_string(),
            ast_lines: 5
        };

        let block2 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 1; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "b".to_string(),
            ast_lines: 5
        };

        assert_ne!(block1, block2);
    }

    #[test]
    fn test_codeblock_partial_cmp() {
        let block1 = CodeBlock {
            start_byte: 0,
            end_byte: 10,
            start_line: 1,
            end_line: 1,
            // content: "int main() { return 0; }".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        let block2 = CodeBlock {
            start_byte: 11,
            end_byte: 20,
            start_line: 2,
            end_line: 2,
            // content: "int a = 10;".to_string(),
            // ast_representation: "".to_string()
            fingerprint: "".to_string(),
            ast_lines: 5
        };

        assert!(block1 < block2);
    }
}