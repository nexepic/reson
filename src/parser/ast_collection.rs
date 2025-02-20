use blake3::Hasher;
use tree_sitter::Node;

pub fn compute_ast_fingerprint(ast_representation: &str) -> String {
    log::debug!("Computing AST fingerprint for AST representation: {}", ast_representation);
    let mut hasher = Hasher::new();

    hasher.update(ast_representation.as_bytes());
    let fingerprint = hasher.finalize().to_hex().to_string();
    log::debug!("Computed fingerprint: {}", fingerprint);
    fingerprint
}

/// Recursively collect the content of all nodes in the AST
pub fn collect_ast_content(node: Node, source: &str) -> String {
    let mut ast_output = String::new();
    let mut stack = vec![node];

    while let Some(current_node) = stack.pop() {
        if current_node.is_named() && !current_node.kind().contains("comment") {
            let node_text = &source[current_node.start_byte()..current_node.end_byte()];
            log::debug!("Node type: {:?}, text: {:?}", current_node.kind(), node_text);
            ast_output.push_str(&format!("{:?}\n", current_node.kind()));
        }

        for child in current_node.children(&mut current_node.walk()) {
            stack.push(child);
        }
    }

    ast_output
}

#[cfg(test)]
mod tests {
    use super::*;
    use tree_sitter::Parser;

    #[test]
    fn test_compute_ast_fingerprint() {
        let ast_representation = r#"
        (source_file
          (function_item
            name: (identifier)
            parameters: (parameters)
            body: (block
              (expression_statement
                (macro_invocation
                  name: (identifier)
                  arguments: (token_tree
                    (literal)))))))
        "#;
    
        let fingerprint = compute_ast_fingerprint(ast_representation);
    
        assert!(!fingerprint.is_empty());
        assert_eq!(fingerprint.len(), 64); // Blake3 hash length in hex is 64 characters
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
}