use std::cell::RefCell;
use crate::models::code_types::{CodeBlock, CodeBlockNode, CodeBlockRef};
use crate::utils::language_mapping::get_language_from_extension;
use std::fs;
use std::rc::{Rc, Weak};
use tree_sitter::{Parser, Tree};
use tree_sitter_c::language as c_language;
use tree_sitter_cpp::language as cpp_language;
use tree_sitter_go::language as go_language;
use tree_sitter_java::language as java_language;
use tree_sitter_javascript::language as javascript_language;
use tree_sitter_python::language as python_language;
use tree_sitter_rust::language as rust_language;
use reson::TREE_PARSING_MAX_DEPTH;
use crate::parser::ast_node::should_skip_node;
use crate::parser::ast_collection::collect_ast_content;

pub fn parse_file(file_path: &std::path::Path, threshold: usize) -> Result<(Vec<CodeBlockRef>, Tree, String), String> {
    let source_code = fs::read_to_string(file_path).map_err(|_| "Failed to read file")?;
    let mut parser = Parser::new();

    let extension = file_path.extension().and_then(|ext| ext.to_str()).ok_or("Unsupported file extension")?;
    let language = get_language_from_extension(extension).ok_or("Unsupported file extension")?;

    let language = match language {
        "c" => c_language(),
        "cpp" => cpp_language(),
        "java" => java_language(),
        "javascript" => javascript_language(),
        "python" => python_language(),
        "golang" => go_language(),
        "rust" => rust_language(),
        _ => return Err("Unsupported file extension".to_string()),
    };

    parser.set_language(language).map_err(|_| "Failed to set language")?;
    let tree = parser.parse(&source_code, None).ok_or("Failed to parse code")?;

    let code_blocks = extract_code_blocks(tree.clone(), &source_code, threshold);

    Ok((code_blocks, tree, source_code))
}

pub fn extract_code_blocks(tree: Tree, source: &str, threshold: usize) -> Vec<CodeBlockRef> {
    let mut cursor = tree.walk();
    let mut code_blocks = Vec::new();

    traverse_tree(&mut cursor, source, &mut code_blocks, threshold, 0, None);

    code_blocks
}

fn traverse_tree(
    cursor: &mut tree_sitter::TreeCursor,
    source: &str,
    code_blocks: &mut Vec<CodeBlockRef>,
    threshold: usize,
    depth: usize,
    parent: Option<Weak<RefCell<CodeBlockNode>>>,
) {
    if depth > TREE_PARSING_MAX_DEPTH {
        return;
    }

    loop {
        let node = cursor.node();
        if node.is_named() {
            let start_line = node.start_position().row + 1;
            let end_line = node.end_position().row + 1;
            let line_count = end_line - start_line + 1;

            if line_count >= threshold {
                // Skip analyzing child nodes if the current node should be skipped
                if should_skip_node(&node, source) {
                    log::debug!("Skipping node at lines {}-{}", start_line, end_line);
                    return;
                }
                
                let content = source[node.start_byte()..node.end_byte()].to_string();
                let ast_representation = collect_ast_content(node, source);

                let code_block = CodeBlock {
                    start_byte: node.start_byte(),
                    end_byte: node.end_byte(),
                    start_line,
                    end_line,
                    content,
                    ast_representation,
                };

                // Create a new CodeBlockNode
                let node_ref = Rc::new(RefCell::new(CodeBlockNode {
                    code_block,
                    parent: parent.clone(),
                }));

                code_blocks.push(node_ref.clone());

                // Recursively traverse child nodes, passing the current node as the parent
                if cursor.goto_first_child() {
                    traverse_tree(cursor, source, code_blocks, threshold, depth + 1, Some(Rc::downgrade(&node_ref)));
                    cursor.goto_parent();
                }
            }
        }

        if !cursor.goto_next_sibling() {
            break;
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
        let content = r#"
        #include <stdio.h>
        
        void print_hello() {
            printf("Hello, World!\n");
        }
        
        int main() {
            print_hello();
            return 0;
        }
        "#;
        let file_path = create_temp_file(content, "c");
    
        let result = parse_file(&file_path, 5);
    
        assert!(result.is_ok(), "Parsing C file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();
    
        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);

        let result = parse_file(&file_path, 20);

        assert!(result.is_ok(), "Parsing C file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert_eq!(code_blocks.len(), 0);
    }

    #[test]
    fn test_parse_cpp_file() {
        let content = r#"
        #include <iostream>
        
        void print_hello() {
            std::cout << "Hello, World!" << std::endl;
        }
        
        int main() {
            print_hello();
            return 0;
        }
        "#;
        let file_path = create_temp_file(content, "cpp");

        let result = parse_file(&file_path, 5);

        assert!(result.is_ok(), "Parsing C++ file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);

        let result = parse_file(&file_path, 20);

        assert!(result.is_ok(), "Parsing C++ file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert_eq!(code_blocks.len(), 0);
    }

    #[test]
    fn test_parse_java_file() {
        let content = r#"
        public class Main {
            public static void main(String[] args) {
                System.out.println("Hello, World!");
                
                print_hello();
            }
            
            public static void print_hello() {
                System.out.println("Hello, World!");
            }
        }
        "#;
        let file_path = create_temp_file(content, "java");

        let result = parse_file(&file_path, 5);

        assert!(result.is_ok(), "Parsing Java file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);

        let result = parse_file(&file_path, 20);

        assert!(result.is_ok(), "Parsing Java file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert_eq!(code_blocks.len(), 0);
    }

    #[test]
    fn test_parse_python_file() {
        let content = r#"
        def print_hello():
            print("Hello, World!")
            
        def main():
            print_hello()
            
        if __name__ == "__main__":
            main()
        "#;
        let file_path = create_temp_file(content, "py");

        let result = parse_file(&file_path, 5);

        assert!(result.is_ok(), "Parsing Python file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);

        let result = parse_file(&file_path, 20);

        assert!(result.is_ok(), "Parsing Python file failed");
        let (code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert_eq!(code_blocks.len(), 0);
    }

    #[test]
    fn test_parse_unsupported_file() {
        let content = "unsupported content";
        let file_path = create_temp_file(content, "txt");

        let result = parse_file(&file_path, 5);

        assert!(result.is_err(), "Parsing unsupported file should fail");
        assert_eq!(result.err().unwrap(), "Unsupported file extension");
    }
}