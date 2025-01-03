use std::fs;
use std::path::{Path, PathBuf};
use glob::Pattern;
use serde::Serialize;
use std::fs::File;
use std::io::Write;
use tree_sitter::{Node, Parser, Tree};
use sha2::{Sha256, Digest};

/// Filters files based on glob patterns and returns matched file paths
pub fn filter_files(source_path: &Path, excludes: &[String]) -> Vec<PathBuf> {
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

/// Compute a simple fingerprint for a block of code (e.g., a hash)
pub fn compute_fingerprint(content: &str) -> String {
    let mut hasher = Sha256::new();
    let trimmed_content = content.trim();
    hasher.update(trimmed_content);
    format!("{:x}", hasher.finalize())
}

pub fn compute_ast_fingerprint(content: &str, tree: Option<&Tree>) -> (String, String) {
    log::debug!("Computing AST fingerprint for content: {}", content);
    let mut hasher = Sha256::new();
    let ast_representation = if let Some(tree) = tree {
        collect_ast_content(tree.root_node(), content)
    } else {
        // Parse the AST from content
        let mut parser = Parser::new();
        parser.set_language(tree_sitter_c::language()).expect("Failed to set language");
        let parsed_tree = parser.parse(content, None).expect("Failed to parse content");
        collect_ast_content(parsed_tree.root_node(), content)
    };
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

// /// Compute a fingerprint for a block of code based on its AST representation
// pub fn compute_ast_fingerprint(content: &str, tree: &Tree) -> String {
//     log::debug!("Computing AST fingerprint for content: {}", content);
//     let mut hasher = Sha256::new();
//     let ast_representation = collect_ast_content(tree.root_node(), content);
//     log::debug!("AST representation: {}", ast_representation);
//     hasher.update(ast_representation);
//     format!("{:x}", hasher.finalize())
// }
// 
// /// Recursively collect the content of all nodes in the AST
// fn collect_ast_content(node: Node, source_code: &str) -> String {
//     let mut content = String::new();
//     if node.is_named() {
//         let start_byte = node.start_byte();
//         let end_byte = node.end_byte();
//         let node_text = &source_code[start_byte..end_byte];
//         content.push_str(&format!(
//             "Node type: {:?}, text: {:?}\n",
//             node.kind(),
//             node_text
//         ));
//     }
//     for child in node.children(&mut node.walk()) {
//         content.push_str(&collect_ast_content(child, source_code));
//     }
//     content
// }

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