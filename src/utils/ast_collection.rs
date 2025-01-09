use sha2::{Digest, Sha256};
use tree_sitter::{Node, Parser};

pub fn compute_ast_fingerprint(content: &str, language: &str) -> (String, String) {
    log::debug!("Computing AST fingerprint for content: {}", content);
    let mut hasher = Sha256::new();

    // Parse the AST from content
    let mut parser = Parser::new();
    let tree_sitter_language = match language {
        "c" => tree_sitter_c::language(),
        "cpp" => tree_sitter_cpp::language(),
        "java" => tree_sitter_java::language(),
        "javascript" => tree_sitter_javascript::language(),
        "python" => tree_sitter_python::language(),
        "golang" => tree_sitter_go::language(),
        "rust" => tree_sitter_rust::language(),
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile;

    #[test]
    fn test_compute_ast_fingerprint() {
        let content = r#"
        fn main() {
            println!("Hello, world!");
        }
        "#;
        // Test for Rust language
        let (fingerprint, ast_representation) = compute_ast_fingerprint(content, "rust");

        assert!(!fingerprint.is_empty());
        assert!(ast_representation.contains("expression_statement"));
    }

    #[test]
    #[should_panic(expected = "Unsupported language")]
    fn test_compute_ast_fingerprint_unsupported_language() {
        let content = "int main() { return 0; }";
        compute_ast_fingerprint(content, "unsupported_language");
    }
}