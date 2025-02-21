use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use uuid::Uuid;

#[allow(dead_code)]
pub fn create_temp_file(content: &str, extension: &str) -> PathBuf {
    let mut path = PathBuf::from("tests/temp");
    fs::create_dir_all(&path).expect("Failed to create temp directory");

    let random_name = Uuid::new_v4().to_string();
    path.push(format!("{}.{}", random_name, extension));

    let mut file = File::create(&path).expect("Failed to create temp file");
    file.write_all(content.as_bytes()).expect("Failed to write to temp file");
    path
}

#[allow(dead_code)]
pub fn delete_temp_file(file_path: &PathBuf) {
    if file_path.exists() {
        fs::remove_file(file_path).expect("Failed to delete temp file");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_delete_temp_file() {
        let content = "Hello, world!";
        let extension = "txt";
        let path = create_temp_file(content, extension);

        assert!(path.exists());

        delete_temp_file(&path);

        assert!(!path.exists());
    }
}