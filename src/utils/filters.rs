use std::path::{Path, PathBuf};
use glob::Pattern;
use walkdir::WalkDir;
use crate::utils::language_mapping::get_language_mapping;

/// Filters files based on glob patterns and returns matched file paths
pub fn filter_files(source_path: &Path, languages: &[String], excludes: &[String]) -> Vec<PathBuf> {
    let language_mapping = get_language_mapping();
    let valid_extensions: Vec<&str> = if languages.is_empty() {
        language_mapping.values().flatten().map(|s| *s).collect()
    } else {
        languages.iter()
            .filter_map(|lang| language_mapping.get(lang.as_str()))
            .flatten()
            .map(|s| *s)
            .collect()
    };

    if source_path.is_file() {
        let extension = source_path.extension().and_then(|ext| ext.to_str()).unwrap_or("");
        return if excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(source_path)) || !valid_extensions.contains(&extension) {
            vec![]
        } else {
            vec![source_path.to_path_buf()]
        };
    }

    WalkDir::new(source_path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file())
        .map(|entry| entry.path().to_path_buf())
        .filter(|file| {
            let extension = file.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            !excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(file)) && valid_extensions.contains(&extension)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile;

    #[test]
    fn test_filter_files_with_single_file() {
        let file_path = Path::new("tests/rust/testA.rs");

        let excludes = vec!["*.rs".to_string()];
        let languages = vec!["rust".to_string()];
        let filtered_files = filter_files(&file_path, &languages, &excludes);

        assert!(filtered_files.is_empty());
    }

    #[test]
    fn test_filter_files_with_single_file_not_excluded() {
        let file_path = Path::new("tests/rust/testA.rs");

        let excludes = vec!["*.txt".to_string()];
        let languages = vec!["rust".to_string()];
        let filtered_files = filter_files(&file_path, &languages, &excludes);

        assert_eq!(filtered_files.len(), 1);
        assert_eq!(filtered_files[0], file_path);
    }

    #[test]
    fn test_filter_files() {
        let test_dir = Path::new("tests/rust");

        let excludes = vec!["*.txt".to_string()];
        let languages = vec!["rust".to_string()];
        let filtered_files = filter_files(test_dir, &languages, &excludes);

        assert_eq!(filtered_files.len(), 3);
        assert!(filtered_files.contains(&test_dir.join("testA.rs")));
        assert!(filtered_files.contains(&test_dir.join("testB.rs")));
        assert!(filtered_files.contains(&test_dir.join("testC.rs")));
    }
}