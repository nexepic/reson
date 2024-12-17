use std::fs;
use std::path::{Path, PathBuf};
use glob::Pattern;
use serde::Serialize;

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
pub fn write_output<T: Serialize>(results: &T, output_format: &str) -> Result<(), std::io::Error> {
    match output_format {
        "json" => {
            let json = serde_json::to_string_pretty(results)?;
            println!("{}", json);
        }
        "text" => {
            for result in serde_json::to_value(results)?
                .as_array()
                .unwrap_or(&vec![])
            {
                println!("{:?}", result);
            }
        }
        _ => return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Unsupported format")),
    }
    Ok(())
}