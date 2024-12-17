use std::fs;
use std::path::{Path, PathBuf};
use glob::Pattern;
use serde::Serialize;
use std::fs::File;
use std::io::Write;

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
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content);
    format!("{:x}", hasher.finalize())
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