use std::fs;
use std::path::{Path, PathBuf};
use glob::Pattern;
use serde::Serialize;
use std::fs::File;
use std::io::Write;
use tree_sitter::{Node, Parser};
use sha2::{Sha256, Digest};

/// Filters files based on glob patterns and returns matched file paths
pub fn filter_files(source_path: &Path, excludes: &[String]) -> Vec<PathBuf> {
    if source_path.is_file() {
        return if excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(source_path)) {
            vec![]
        } else {
            vec![source_path.to_path_buf()]
        };
    }

    let all_files = fs::read_dir(source_path)
        .unwrap()
        .filter_map(|entry| entry.ok().map(|e| e.path()))
        .collect::<Vec<PathBuf>>();

    all_files
        .into_iter()
        .filter(|file| {
            !excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(file))
        })
        .collect()
}

pub fn compute_ast_fingerprint(content: &str, language: &str) -> (String, String) {
    log::debug!("Computing AST fingerprint for content: {}", content);
    let mut hasher = Sha256::new();

    // Parse the AST from content
    let mut parser = Parser::new();
    let tree_sitter_language = match language {
        "c" => tree_sitter_c::language(),
        "cpp" => tree_sitter_cpp::language(),
        "java" => tree_sitter_java::language(),
        "js" => tree_sitter_javascript::language(),
        "py" => tree_sitter_python::language(),
        "go" => tree_sitter_go::language(),
        "rs" => tree_sitter_rust::language(),
        _ => panic!("Unsupported language"),
    };
    parser.set_language(tree_sitter_language).expect("Failed to set language");
    let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
    let ast_representation = collect_ast_content(parsed_tree.root_node(), content);

    log::debug!("AST representation: {}", ast_representation);
    hasher.update(&ast_representation);
    let fingerprint = format!("{:x}", hasher.finalize());
    log::debug!("Computed fingerprint: {}", fingerprint);
    (fingerprint, ast_representation)
}

/// Recursively collect the content of all nodes in the AST
fn collect_ast_content(node: Node, source_code: &str) -> String {
    let mut content = String::new();
    if node.is_named() {
        let start_byte = node.start_byte();
        let end_byte = node.end_byte();
        let node_text = &source_code[start_byte..end_byte];
        log::debug!("Node type: {:?}, text: {:?}", node.kind(), node_text);
        content.push_str(&format!("{:?}\n", node.kind()));
    }
    for child in node.children(&mut node.walk()) {
        content.push_str(&collect_ast_content(child, source_code));
    }
    content
}

/// Write output in JSON or other formats
pub fn write_output<T: Serialize>(results: &T, output_format: &str, output_file: Option<&Path>) -> Result<(), std::io::Error> {
    let output = match output_format {
        "json" => serde_json::to_string_pretty(results)?,
        "text" => serde_json::to_value(results)?
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .map(|result| format!("{:?}", result))
            .collect::<Vec<String>>()
            .join("\n"),
        _ => return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Unsupported format")),
    };

    if let Some(file_path) = output_file {
        let mut file = File::create(file_path)?;
        file.write_all(output.as_bytes())?;
    } else {
        println!("{}", output);
    }

    Ok(())
}


#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile;

    #[test]
    fn test_filter_files_with_single_file() {
        let file_path = Path::new("tests/rust/testA.rs");
    
        let excludes = vec!["*.rs".to_string()];
        let filtered_files = filter_files(&file_path, &excludes);
    
        assert!(filtered_files.is_empty());
    }
    
    #[test]
    fn test_filter_files_with_single_file_not_excluded() {
        let file_path = Path::new("tests/rust/testA.rs");
    
        let excludes = vec!["*.txt".to_string()];
        let filtered_files = filter_files(&file_path, &excludes);
    
        assert_eq!(filtered_files.len(), 1);
        assert_eq!(filtered_files[0], file_path);
    }

    #[test]
    fn test_filter_files() {
        let test_dir = Path::new("tests/rust");

        let excludes = vec!["*.txt".to_string()];
        let filtered_files = filter_files(test_dir, &excludes);

        assert_eq!(filtered_files.len(), 3);
        assert!(filtered_files.contains(&test_dir.join("testA.rs")));
        assert!(filtered_files.contains(&test_dir.join("testB.rs")));
        assert!(filtered_files.contains(&test_dir.join("testC.rs")));
    }

    #[test]
    fn test_compute_ast_fingerprint() {
        let content = r#"
        fn main() {
            println!("Hello, world!");
        }
        "#;
        // Test for Rust language
        let (fingerprint, ast_representation) = compute_ast_fingerprint(content, "rs");

        assert!(!fingerprint.is_empty());
        assert!(ast_representation.contains("expression_statement"));
    }
    
    #[test]
    #[should_panic(expected = "Unsupported language")]
    fn test_compute_ast_fingerprint_unsupported_language() {
        let content = "int main() { return 0; }";
        compute_ast_fingerprint(content, "unsupported_language");
    }

    #[test]
    fn test_write_output_json() {
        let results = json!([{"key": "value"}]);
        let output_format = "json";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        write_output(&results, output_format, output_file).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(written_content.contains("\"key\": \"value\""));
    }

    #[test]
    fn test_write_output_text() {
        let results = json!([{"key": "value"}]);
        let output_format = "text";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        write_output(&results, output_format, output_file).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(written_content.contains("Object"));
    }

    #[test]
    fn test_write_output_unsupported_format() {
        let results = json!([{"key": "value"}]);
        let output_format = "xml";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        let result = write_output(&results, output_format, output_file);
        assert!(result.is_err());
    }
}