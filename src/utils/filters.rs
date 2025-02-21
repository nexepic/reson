use std::fs;
use std::path::{Path, PathBuf};
use glob::Pattern;
use walkdir::WalkDir;
use crate::utils::language_mapping::get_language_mapping;

/// Filters files based on glob patterns and returns matched file paths
pub fn filter_files(source_path: &Path, languages: &[String], excludes: &[String], max_file_size: u64) -> Vec<PathBuf> {
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
        let metadata = fs::metadata(source_path).unwrap();
        return if excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(source_path))
            || !valid_extensions.contains(&extension)
            || metadata.len() > max_file_size {
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
            let metadata = fs::metadata(file).unwrap();
            !excludes.iter().any(|pattern| Pattern::new(pattern).unwrap().matches_path(file))
                && valid_extensions.contains(&extension)
                && metadata.len() <= max_file_size
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use crate::utils::files::{create_temp_file, delete_temp_file};
    use super::*;

    #[test]
    fn test_filter_files_with_single_file() {
        let file_path = Path::new("tests/rust/testA.rs");

        let excludes = vec!["*.rs".to_string()];
        let languages = vec!["rust".to_string()];
        let max_file_size = 1048576;
        let filtered_files = filter_files(&file_path, &languages, &excludes, max_file_size);

        assert!(filtered_files.is_empty());
    }

    #[test]
    fn test_filter_files_with_single_file_not_excluded() {
        let file_path = Path::new("tests/rust/testA.rs");

        let excludes = vec!["*.txt".to_string()];
        let languages = vec!["rust".to_string()];
        let max_file_size = 1048576;
        let filtered_files = filter_files(&file_path, &languages, &excludes, max_file_size);

        assert_eq!(filtered_files.len(), 1);
        assert_eq!(filtered_files[0], file_path);
    }

    #[test]
    fn test_filter_files_with_large_file() {
        let content = &vec![0; 2 * 1048576]; // 2 MB content
        let large_file_path = create_temp_file(&String::from_utf8_lossy(content), "rs");
    
        // Debugging: Check if the file was created
        assert!(large_file_path.exists(), "Temporary file was not created");
    
        let excludes = vec![];
        let languages = vec!["rust".to_string()];
        let max_file_size = 1048576; // 1 MB
        let filtered_files = filter_files(&large_file_path.parent().unwrap(), &languages, &excludes, max_file_size);
    
        assert!(!filtered_files.contains(&large_file_path));
    
        // Clean up
        delete_temp_file(&large_file_path);
    }

    #[test]
    fn test_filter_files_with_small_file() {
        let test_dir = Path::new("tests/rust");
        let small_file_path = test_dir.join("testA.rs");
        
        let excludes = vec![];
        let languages = vec!["rust".to_string()];
        let max_file_size = 1048576; // 1 MB
        let filtered_files = filter_files(test_dir, &languages, &excludes, max_file_size);

        assert!(filtered_files.contains(&small_file_path));
    }

    #[test]
    fn test_filter_files() {
        let test_dir = Path::new("tests/rust");

        let excludes = vec!["*.txt".to_string()];
        let languages = vec!["rust".to_string()];
        let max_file_size = 1048576;
        let filtered_files = filter_files(test_dir, &languages, &excludes, max_file_size);

        assert_eq!(filtered_files.len(), 3);
        assert!(filtered_files.contains(&test_dir.join("testA.rs")));
        assert!(filtered_files.contains(&test_dir.join("testB.rs")));
        assert!(filtered_files.contains(&test_dir.join("testC.rs")));
    }
}