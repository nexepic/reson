use tree_sitter::{Parser, Tree};
use tree_sitter_c::language as c_language;
use tree_sitter_cpp::language as cpp_language;
use tree_sitter_java::language as java_language;
use tree_sitter_python::language as python_language;
use tree_sitter_javascript::language as javascript_language;
use tree_sitter_go::language as go_language;
use tree_sitter_rust::language as rust_language;
use std::fs;
use crate::utils::language_mapping::get_language_from_extension;

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

    let extension = file_path.extension().and_then(|ext| ext.to_str()).ok_or("Unsupported file extension")?;
    let language = get_language_from_extension(extension).ok_or("Unsupported file extension")?;

    let language = match language {
        "c" => c_language(),
        "cpp" => cpp_language(),
        "java" => java_language(),
        "javascript" => javascript_language(),
        "py" => python_language(),
        "golang" => go_language(),
        "rust" => rust_language(),
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
            // log::debug!(
            //     "Node: kind={}, start_byte={}, end_byte={}, content={}",
            //     node.kind(),
            //     node.start_byte(),
            //     node.end_byte(),
            //     content
            // );

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

    // Traverse the entire tree to find the target child node
    loop {
        let node = cursor.node();

        // Ensure the node's range matches the target subtree
        if node.start_byte() == block_start_byte && node.end_byte() == block_end_byte {
            // Traverse upwards to find the parent node
            let parent_content = if let Some(parent_node) = node.parent() {
                let start_byte = parent_node.start_byte();
                let end_byte = parent_node.end_byte();

                // Extract the content of the parent node
                Some(source[start_byte..end_byte].to_string())
            } else {
                None
            };

            return parent_content;
        }

        if !cursor.goto_first_child() {
            while !cursor.goto_next_sibling() {
                if !cursor.goto_parent() {
                    return None; // Target child node not found
                }
            }
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use std::path::PathBuf;

    fn create_temp_file(content: &str, extension: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        path.push(format!("test_file.{}", extension));
        let mut file = File::create(&path).expect("Failed to create temp file");
        file.write_all(content.as_bytes()).expect("Failed to write to temp file");
        path
    }

    #[test]
    fn test_parse_c_file() {
        let content = "int main() { return 0; }";
        let file_path = create_temp_file(content, "c");

        let result = parse_file(&file_path);

        assert!(result.is_ok(), "Parsing C file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
        assert_eq!(code_blocks[0].content, content);
    }

    #[test]
    fn test_parse_cpp_file() {
        let content = "#include <iostream>\nint main() { std::cout << \"Hello, World!\" << std::endl; return 0; }";
        let file_path = create_temp_file(content, "cpp");

        let result = parse_file(&file_path);

        assert!(result.is_ok(), "Parsing C++ file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_java_file() {
        let content = "public class Test { public static void main(String[] args) { System.out.println(\"Hello, World!\"); } }";
        let file_path = create_temp_file(content, "java");

        let result = parse_file(&file_path);

        assert!(result.is_ok(), "Parsing Java file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_python_file() {
        let content = "def main():\n    print(\"Hello, World!\")";
        let file_path = create_temp_file(content, "py");

        let result = parse_file(&file_path);

        assert!(result.is_ok(), "Parsing Python file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_unsupported_file() {
        let content = "unsupported content";
        let file_path = create_temp_file(content, "txt");

        let result = parse_file(&file_path);

        assert!(result.is_err(), "Parsing unsupported file should fail");
        assert_eq!(result.err().unwrap(), "Unsupported file extension");
    }

    #[test]
    fn test_get_parent_content() {
        let content = "int main() { int a = 10; return a; }";
        let file_path = create_temp_file(content, "c");

        let result = parse_file(&file_path).expect("Failed to parse file");
        let (_code_blocks, tree, source_code) = result;

        // Assuming we want to extract parent node content for the first block
        let target_block = &_code_blocks[2];
        let parent_content = get_parent_content(&tree, &source_code, target_block.start_byte, target_block.end_byte);

        assert!(parent_content.is_some(), "Parent content should exist");
        assert!(parent_content.unwrap().contains("main"));
    }

    #[test]
    fn test_get_parent_content_no_parent() {
        let content = "int main() { int a = 10; return a; }";
        let file_path = create_temp_file(content, "c");

        let result = parse_file(&file_path).expect("Failed to parse file");
        let (_code_blocks, tree, source_code) = result;

        // Assuming we want to extract parent node content for a non-existent block
        let parent_content = get_parent_content(&tree, &source_code, 0, source_code.len() + 1);

        assert!(parent_content.is_none(), "Parent content should not exist");
    }
}