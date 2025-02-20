use reson::{LARGE_ARRAY_THRESHOLD, LARGE_CONTENT_LENGTH_THRESHOLD};

fn is_large_array(node: &tree_sitter::Node, source: &str, array_size_threshold: usize, content_length_threshold: usize) -> bool {
    let content = &source[node.start_byte()..node.end_byte()];
    
    if content.len() <= content_length_threshold {
        return false;
    }
    
    let normalized_content = content.lines()
        .map(|line| line.trim())
        .collect::<Vec<&str>>()
        .join("");

    // Split content by comma
    let parts: Vec<&str> = normalized_content.split(',').collect();

    // If there are more than size_threshold characters and all parts are separated by commas, consider it a large array
    if normalized_content.len() > array_size_threshold && parts.iter().all(|p| p.trim().len() > 0 && !p.trim().contains(' ')) {
        log::debug!("Large array detected: {:?}", content);
        return true;
    }

    false
}

pub fn should_skip_node(node: &tree_sitter::Node, source: &str) -> bool {
    is_large_array(node, source, LARGE_ARRAY_THRESHOLD, LARGE_CONTENT_LENGTH_THRESHOLD)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tree_sitter::{Language, Parser};

    extern "C" { fn tree_sitter_c() -> Language; }

    fn parse_source(source: &str) -> tree_sitter::Tree {
        let mut parser = Parser::new();
        let language = unsafe { tree_sitter_c() };
        parser.set_language(language).expect("Error loading C grammar");
        parser.parse(source, None).expect("Failed to parse source")
    }

    #[test]
    fn test_is_large_array() {
        let source = r#"
        const uint8_t pfe_class_fw_binary[PFE_CLASS_FW_BINARY_SIZE] __attribute__((section(".pfe_class_fw_mem"))) = {
            0x7fU, 0x45U, 0x4cU, 0x46U, 0x01U, 0x02U, 0x01U, 0x00U, 0x00U, 0x00U,
        };"#;
        let tree = parse_source(source);
        let root_node = tree.root_node();
        println!("Root node: {:?}", root_node);
        
        let child = root_node.child(2).expect("Expected a child node");
        println!("Child 2 content: {:?}", &source[child.start_byte()..child.end_byte()]);
    
        // Locate the array node (assuming it's the first child of the root)
        let array_node = root_node.child(2).expect("Expected a child node");
        assert!(is_large_array(&array_node, source, 8, 10));
    }

    #[test]
    fn test_small_array() {
        let source = r#"
        const uint8_t small_array[3] = { 0x01U, 0x02U, 0x03U };"#;
        let tree = parse_source(source);
        let root_node = tree.root_node();

        let array_node = root_node.child(0).expect("Expected a child node");
        assert!(!should_skip_node(&array_node, source));
    }

    #[test]
    fn test_non_array_node() {
        let source = r#"
        int x = 42;"#;
        let tree = parse_source(source);
        let root_node = tree.root_node();

        let node = root_node.child(0).expect("Expected a child node");
        assert!(!should_skip_node(&node, source));
    }
}