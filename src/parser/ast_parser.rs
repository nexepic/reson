use std::collections::BTreeMap;
use tree_sitter::{Node, Parser, Tree};
use tree_sitter_c::language as c_language;
use tree_sitter_cpp::language as cpp_language;
use tree_sitter_java::language as java_language;
use tree_sitter_python::language as python_language;
use tree_sitter_javascript::language as javascript_language;
use tree_sitter_go::language as go_language;
use tree_sitter_rust::language as rust_language;
use std::fs;
use crate::models::code_types::{CodeBlock, LineStats, LineType};
use crate::utils::language_mapping::get_language_from_extension;

pub fn parse_file(
    file_path: &std::path::Path,
    cumulative_stats: &mut Option<LineStats>,
) -> Result<(LineStats, Vec<CodeBlock>, Tree, String), String> {
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

    // Perform line counting and code block extraction in a single traversal
    let (line_stats, code_blocks) = extract_lines_and_code_blocks(tree.clone(), &source_code);

    if let Some(cumulative) = cumulative_stats.as_mut() {
        cumulative.total_lines += line_stats.total_lines;
        cumulative.code_lines += line_stats.code_lines;
        cumulative.comment_lines += line_stats.comment_lines;
    } else {
        *cumulative_stats = Some(line_stats.clone());
    }

    Ok((line_stats, code_blocks, tree, source_code))
}

fn extract_lines_and_code_blocks(tree: Tree, source_code: &str) -> (LineStats, Vec<CodeBlock>) {
    let total_lines = source_code.lines().count();
    let mut line_data: BTreeMap<usize, (LineType, bool, bool)> = BTreeMap::new(); // (is_code, is_comment, is_empty)
    let mut code_blocks = Vec::new();

    // Initialize line_data using the root node
    initialize_line_data(tree.root_node(), source_code, &mut line_data);

    // Traverse the AST for detailed parsing
    traverse_tree(
        tree.root_node(),
        source_code,
        &mut line_data,
        &mut code_blocks,
    );

    let line_stats = compute_line_stats(&line_data, total_lines);

    (line_stats, code_blocks)
}

fn compute_line_stats(line_data: &BTreeMap<usize, (LineType, bool, bool)>, total_lines: usize) -> LineStats {
    let mut code_lines = 0;
    let mut comment_lines = 0;
    let mut blank_lines = 0;

    for (_, (is_code, is_comment, is_blank)) in line_data {
        if *is_blank {
            blank_lines += 1;
        } else if *is_comment && *is_code != LineType::Code {
            comment_lines += 1;
        } else if *is_code != LineType::NotCode {
            code_lines += 1;
        }
    }
    
    LineStats {
        total_lines,
        code_lines,
        comment_lines,
        blank_lines,
    }
}

fn initialize_line_data(
    root_node: Node,
    source_code: &str,
    line_data: &mut BTreeMap<usize, (LineType, bool, bool)>,
) {
    let total_lines = source_code.lines().count();

    for line in 0..total_lines {
        let line_content = source_code.lines().nth(line).unwrap_or("").to_string();
        let is_empty = line_content.trim().is_empty();
        if is_empty {
            line_data.insert(line, (LineType::NotCode, false, true));
        } else {
            line_data.insert(line, (LineType::Unknown, false, false));
        }
    }

    // Traverse the first level of children nodes to analyze comments and update line_data
    // In order to identify comment blocks
    for child in root_node.children(&mut root_node.walk()) {
        if child.is_named() {
            let start_line = child.start_position().row;
            let end_line = child.end_position().row;

            for line in start_line..=end_line {
                if let Some(entry) = line_data.get_mut(&line) {
                    if child.kind().contains("comment") {
                        entry.1 = true; // Mark as comment
                        entry.0 = LineType::NotCode; // Mark as not code
                    }
                }
            }
        }
    }
}

fn traverse_tree(
    node: Node,
    source_code: &str,
    line_data: &mut BTreeMap<usize, (LineType, bool, bool)>,
    code_blocks: &mut Vec<CodeBlock>,
) {
    if node.is_named() {
        let start_line = node.start_position().row;
        let end_line = node.end_position().row;
        let node_content = &source_code[node.start_byte()..node.end_byte()];

        if start_line == end_line {
            let line_content = source_code.lines().nth(start_line).unwrap_or("");
            let mut is_code = LineType::Unknown;
            let mut is_comment = false;
        
            if node.kind().contains("comment") {
                is_comment = true;
            } else {
                let trimmed_line = line_content.trim();
                if !trimmed_line.is_empty() {
                    is_code = LineType::Code;
                }
            }
        
            if let Some(entry) = line_data.get_mut(&start_line) {
                if entry.0 == LineType::Unknown {
                    entry.0 = is_code;
                }
                entry.1 = is_comment;
            }
        }

        code_blocks.push(CodeBlock {
            start_byte: node.start_byte(),
            end_byte: node.end_byte(),
            start_line: start_line + 1,
            end_line: end_line + 1,
            content: node_content.to_string(),
        });
    }

    for child in node.children(&mut node.walk()) {
        traverse_tree(child, source_code, line_data, code_blocks);
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
        let file_path = std::path::Path::new("tests/c/testA.c");
        let content = fs::read_to_string(file_path).expect("Failed to read file");
    
        let result = parse_file(&file_path, &mut None);
    
        assert!(result.is_ok(), "Parsing C file failed");
        let (_line_stats, code_blocks, _tree, source_code) = result.unwrap();
    
        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
        assert_eq!(code_blocks[0].content, content);
    }

    #[test]
    fn test_parse_cpp_file() {
        let content = "#include <iostream>\nint main() { std::cout << \"Hello, World!\" << std::endl; return 0; }";
        let file_path = create_temp_file(content, "cpp");

        let result = parse_file(&file_path, &mut None);

        assert!(result.is_ok(), "Parsing C++ file failed");
        let (_line_stats, code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_java_file() {
        let content = "public class Test { public static void main(String[] args) { System.out.println(\"Hello, World!\"); } }";
        let file_path = create_temp_file(content, "java");

        let result = parse_file(&file_path, &mut None);

        assert!(result.is_ok(), "Parsing Java file failed");
        let (_line_stats, code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_python_file() {
        let content = "def main():\n    print(\"Hello, World!\")";
        let file_path = create_temp_file(content, "py");

        let result = parse_file(&file_path, &mut None);

        assert!(result.is_ok(), "Parsing Python file failed");
        let (_line_stats, code_blocks, _tree, source_code) = result.unwrap();

        assert_eq!(source_code, content);
        assert!(code_blocks.len() > 0);
    }

    #[test]
    fn test_parse_unsupported_file() {
        let content = "unsupported content";
        let file_path = create_temp_file(content, "txt");

        let result = parse_file(&file_path, &mut None);

        assert!(result.is_err(), "Parsing unsupported file should fail");
        assert_eq!(result.err().unwrap(), "Unsupported file extension");
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use tree_sitter::Parser;
        
        #[test]
        fn test_extract_lines_and_code_blocks() {
            // Read the source code from the file
            let file_path = std::path::Path::new("tests/rust/testA.rs");
            let source_code = fs::read_to_string(file_path).expect("Failed to read test file");
        
            // Initialize the parser with the Rust grammar
            let mut parser = Parser::new();
            let language = rust_language();
            parser.set_language(language).expect("Error loading Rust grammar");
        
            // Parse the source code
            let tree = parser.parse(&source_code, None).expect("Failed to parse source code");
        
            // Analyze the AST and source
            let (line_stats, code_blocks) = extract_lines_and_code_blocks(tree.clone(), &source_code);
        
            // Assertions for line statistics
            assert_eq!(line_stats.total_lines, 38, "Total lines should match.");
            assert_eq!(line_stats.code_lines, 26, "Code lines should match.");
            assert_eq!(line_stats.comment_lines, 10, "Comment lines should match.");
        
            // Assertions for code blocks
            assert!(!code_blocks.is_empty(), "Code blocks should not be empty.");
            assert_eq!(code_blocks.len(), 104, "Should detect two functions.");
            assert_eq!(
                code_blocks[2].content.trim().replace(" ", ""),
                r#"fn print_hello_test_a1() {
                println!("Hello, World!");
                for i in 0..5 {
                    println!("This is line {}", i);
                    if i % 2 == 0 {
                        println!("Even number");
                    } else {
                        // This is an odd number
                        println!("Odd number");
                    }
                }
            }"#.replace(" ", ""),
                "First function content should match."
            );
            assert_eq!(
                code_blocks[3].content.trim(),
                r#"print_hello_test_a1"#,
                "Second function content should match."
            );

            let file_path = std::path::Path::new("tests/java/testA.java");
            let source_code = fs::read_to_string(file_path).expect("Failed to read test file");

            let mut parser = Parser::new();
            let language = rust_language();
            parser.set_language(language).expect("Error loading Java grammar");

            // Parse the source code
            let tree = parser.parse(&source_code, None).expect("Failed to parse source code");

            // Analyze the AST and source
            let (line_stats, _code_blocks) = extract_lines_and_code_blocks(tree.clone(), &source_code);

            // Assertions for line statistics
            assert_eq!(line_stats.total_lines, 36, "Total lines should match.");
            assert_eq!(line_stats.code_lines, 29, "Code lines should match.");
            assert_eq!(line_stats.comment_lines, 5, "Comment lines should match.");
        }
    }

    #[test]
    fn test_get_parent_content() {
        let content = "int main() { int a = 10; return a; }";
        let file_path = create_temp_file(content, "c");

        let result = parse_file(&file_path, &mut None).expect("Failed to parse file");
        let (_line_stats, _code_blocks, tree, source_code) = result;

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

        let result = parse_file(&file_path, &mut None).expect("Failed to parse file");
        let (_line_stats, _code_blocks, tree, source_code) = result;

        // Assuming we want to extract parent node content for a non-existent block
        let parent_content = get_parent_content(&tree, &source_code, 0, source_code.len() + 1);

        assert!(parent_content.is_none(), "Parent content should not exist");
    }
}