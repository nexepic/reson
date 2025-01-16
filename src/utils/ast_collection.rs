use blake3::Hasher;
use tree_sitter::{Node, Parser};

pub fn compute_ast_fingerprint(content: &str, language: &str) -> (String, String) {
    log::debug!("Computing AST fingerprint for content: {}", content);
    let mut hasher = Hasher::new();

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
    hasher.update(ast_representation.as_bytes());
    let fingerprint = hasher.finalize().to_hex().to_string();
    log::debug!("Computed fingerprint: {}", fingerprint);
    (fingerprint, ast_representation)
}

/// Recursively collect the content of all nodes in the AST
fn collect_ast_content(node: Node, source_code: &str) -> String {
    let mut content = String::new();
    if node.is_named() && !node.kind().contains("comment") {
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
    fn test_collect_ast_content_with_comments_c() {
        let content = r#"
        /*
        This is a comment
        */
        int main() {
            // This is a comment
            int a = 0;
            /*
            Another comment
            */
            return 0; // Another comment
        }
        "#;
        let content_without_comments = r#"
        int main() {
            int a = 0;
            return 0;
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_c::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_cpp() {
        let content = r#"
        /*
        This is a comment
        */
        int main() {
            // This is a comment
            int a = 0;
            /*
            Another comment
            */
            return 0; // Another comment
        }
        "#;
        let content_without_comments = r#"
        int main() {
            int a = 0;
            return 0;
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_cpp::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_java() {
        let content = r#"
        /**
         * This is a comment
         */
        public class Test {
            // This is a comment
            public static void main(String[] args) {
                /*
                Another comment
                */
                System.out.println("Hello, World!"); // Another comment
            }
        }
        "#;
        let content_without_comments = r#"
        public class Test {
            public static void main(String[] args) {
                System.out.println("Hello, World!");
            }
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_java::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_javascript() {
        let content = r#"
        /*
        This is a comment
        */
        function main() {
            // This is a comment
            let a = 0;
            /*
            Another comment
            */
            return 0; // Another comment
        }
        "#;
        let content_without_comments = r#"
        function main() {
            let a = 0;
            return 0;
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_javascript::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_python() {
        let content = r#"
        def main():
            # This is a comment
            return 0 # Another comment
        "#;
        let content_without_comments = r#"
        def main():
            return 0
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_python::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_golang() {
        let content = r#"
        package main

        import "fmt"

        /*
        This is a comment
        */
        func main() {
            // This is a comment
            var a int = 0
            /*
            Another comment
            */
            fmt.Println("Hello, World!") // Another comment
        }
        "#;
        let content_without_comments = r#"
        package main
        
        import "fmt"
        
        func main() {
            var a int = 0
            fmt.Println("Hello, World!")
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_go::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }
    
    #[test]
    fn test_collect_ast_content_with_comments_rust() {
        let content = r#"
        /*
        This is a comment
        */
        fn main() {
            // This is a comment
            let a = 0;
            /*
            Another comment
            */
            println!("Hello, World!"); // Another comment
        }
        "#;
        let content_without_comments = r#"
        fn main() {
            let a = 0;
            println!("Hello, World!");
        }
        "#;
        let mut parser = Parser::new();
        let tree_sitter_language = tree_sitter_rust::language();
        parser.set_language(tree_sitter_language).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        let parsed_tree_without_comments = parser.parse(content_without_comments, None).expect("Failed to parse content without comments");

        let ast_representation = collect_ast_content(parsed_tree.root_node(), content);
        let ast_representation_without_comments = collect_ast_content(parsed_tree_without_comments.root_node(), content_without_comments);
        
        assert!(!ast_representation.contains("comment"));
        assert_eq!(ast_representation, ast_representation_without_comments);
    }

    #[test]
    #[should_panic(expected = "Unsupported language")]
    fn test_compute_ast_fingerprint_unsupported_language() {
        let content = "int main() { return 0; }";
        compute_ast_fingerprint(content, "unsupported_language");
    }
}