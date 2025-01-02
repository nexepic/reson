use tree_sitter::{Node, Parser, Tree};
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

    traverse_tree(&mut cursor, source, &mut code_blocks);

    Ok(code_blocks)
}

fn traverse_tree(cursor: &mut tree_sitter::TreeCursor, source: &str, code_blocks: &mut Vec<CodeBlock>) {
    loop {
        let node = cursor.node();
        if node.is_named() {
            let content = source[node.start_byte()..node.end_byte()].to_string();
            log::debug!(
                "Node: kind={}, start_byte={}, end_byte={}, content={}",
                node.kind(),
                node.start_byte(),
                node.end_byte(),
                content
            );

            code_blocks.push(CodeBlock {
                start_byte: node.start_byte(),
                end_byte: node.end_byte(),
                start_line: node.start_position().row + 1,
                end_line: node.end_position().row + 1,
                content: content.clone(),
            });

            if cursor.goto_first_child() {
                traverse_tree(cursor, source, code_blocks);
                cursor.goto_parent();
            }
        }

        if !cursor.goto_next_sibling() {
            break;
        }
    }
}

pub fn get_parent_content(tree: &Tree, source: &str, block_start_byte: usize, block_end_byte: usize) -> Option<String> {
    let mut cursor = tree.walk();
    let mut found_target = false;

    // 1. 遍历整个树，找到目标子节点
    loop {
        let node = cursor.node();

        // 确保节点的范围匹配目标子树
        if node.start_byte() == block_start_byte && node.end_byte() == block_end_byte {
            found_target = true;
            break;
        }

        if !cursor.goto_first_child() {
            while !cursor.goto_next_sibling() {
                if !cursor.goto_parent() {
                    return None; // 未找到目标子节点
                }
            }
        }
    }

    if !found_target {
        return None; // 无法找到目标节点
    }

    // 2. 向上查找父节点
    if let Some(parent_node) = cursor.node().parent() {
        let start_byte = parent_node.start_byte();
        let end_byte = parent_node.end_byte();

        // 提取父节点的内容
        return Some(source[start_byte..end_byte].to_string());
    }

    None
}
