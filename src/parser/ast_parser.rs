use tree_sitter::{Parser, Tree};
use tree_sitter_c::language as c_language;
use tree_sitter_java::language as java_language;
use tree_sitter_python::language as python_language;
use std::fs;

#[derive(Debug)]
pub struct CodeBlock {
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_line: usize,
    pub end_line: usize,
    pub content: String,
}

pub fn parse_file(file_path: &std::path::Path) -> Result<(Vec<CodeBlock>, Tree, String), String> {
    let source_code = fs::read_to_string(file_path).map_err(|_| "Failed to read file")?;
    let mut parser = Parser::new();

    // Select language based on file extension
    let language = match file_path.extension().and_then(|ext| ext.to_str()) {
        Some("c") | Some("cpp") => c_language(),
        Some("java") => java_language(),
        Some("py") => python_language(),
        _ => return Err("Unsupported file extension".to_string()),
    };

    parser.set_language(language).map_err(|_| "Failed to set language")?;
    let tree = parser.parse(&source_code, None).ok_or("Failed to parse code")?;

    let code_blocks = extract_code_blocks(tree.clone(), &source_code)?;

    Ok((code_blocks, tree, source_code))
}

fn extract_code_blocks(tree: Tree, source: &str) -> Result<Vec<CodeBlock>, String> {
    let mut cursor = tree.walk();
    let mut code_blocks = Vec::new();

    traverse_tree(&mut cursor, source, &mut code_blocks, None);

    Ok(code_blocks)
}

fn traverse_tree(cursor: &mut tree_sitter::TreeCursor, source: &str, code_blocks: &mut Vec<CodeBlock>, parent_content: Option<String>) {
    loop {
        let node = cursor.node();
        if node.is_named() {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_line = node.start_position().row + 1; // increase line number by 1
            let end_line = node.end_position().row + 1; // increase line number by 1
            let content = source[start_byte..end_byte].to_string();

            log::debug!("Found node: start_line={}, end_line={}, content={}", start_line, end_line, content);

            code_blocks.push(CodeBlock {
                start_byte,
                end_byte,
                start_line,
                end_line,
                content: content.clone(),
            });

            if cursor.goto_first_child() {
                log::debug!("Going to first child of node at line {}", node.start_position().row + 1);
                traverse_tree(cursor, source, code_blocks, Some(content));
                cursor.goto_parent();
                log::debug!("Returning to parent of node at line {}", node.start_position().row + 1);
            }
        }

        if !cursor.goto_next_sibling() {
            log::debug!("No more siblings for node at line {}", node.start_position().row + 1);
            break;
        } else {
            log::debug!("Going to next sibling of node at line {}", node.start_position().row + 1);
        }
    }
}

pub fn get_parent_content(cursor: &tree_sitter::TreeCursor, source: &str) -> Option<String> {
    let mut parent_cursor = cursor.clone();
    if parent_cursor.goto_parent() {
        let node = parent_cursor.node();
        let start_byte = node.start_byte();
        let end_byte = node.end_byte();
        return Some(source[start_byte..end_byte].to_string());
    }
    None
}