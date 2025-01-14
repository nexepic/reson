use std::fs::File;
use std::io::Write;
use std::path::Path;
use serde::Serialize;
use quick_xml::se::to_string;

#[derive(Serialize)]
struct DuplicateReport<T> {
    items: T,
}

/// Write output in JSON or other formats
pub fn write_output<T: Serialize>(results: &T, output_format: &str, output_file: Option<&Path>) -> Result<(), std::io::Error> {
    let output = match output_format {
        "json" => serde_json::to_string_pretty(results)?,
        "xml" => {
            // Wrap results in a root element with a name
            let wrapped = DuplicateReport { items: results };
            to_string(&wrapped).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile;
    use std::fs;
    use crate::detector::{DuplicateBlock, DuplicateReport};

    #[test]
    fn test_write_output_json() {
        let results = json!([{
            "fingerprint": "f40bd2979a68336ba4862f08d3372ef5f8b369172b4c38bd9039031dce0a084b",
            "line_count": 19,
            "blocks": [
                {"start_line_number": 121, "end_line_number": 139, "source_file": "./file1.c"},
                {"start_line_number": 121, "end_line_number": 139, "source_file": "./file2.c"}
            ]
        }]);
        let output_format = "json";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        write_output(&results, output_format, output_file).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(written_content.contains("f40bd2979a68336ba4862f08d3372ef5f8b369172b4c38bd9039031dce0a084b"));
    }

    #[test]
    fn test_write_output_xml() {
        let results = vec![
            DuplicateReport {
                fingerprint: "f40bd2979a68336ba4862f08d3372ef5f8b369172b4c38bd9039031dce0a084b".to_string(),
                line_count: 19,
                blocks: vec![
                    DuplicateBlock {
                        start_line_number: 121,
                        end_line_number: 139,
                        source_file: "./rtos/file1.c".to_string(),
                    },
                    DuplicateBlock {
                        start_line_number: 121,
                        end_line_number: 139,
                        source_file: "./rtos/file2.c".to_string(),
                    },
                ],
            },
        ];

        let temp_file = tempfile::NamedTempFile::new().unwrap();
        write_output(&results, "xml", Some(temp_file.path())).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        println!("{}", written_content);
        assert!(written_content.contains("<fingerprint>"));
    }

    #[test]
    fn test_write_output_unsupported_format() {
        let results = json!([{
            "fingerprint": "f40bd2979a68336ba4862f08d3372ef5f8b369172b4c38bd9039031dce0a084b",
            "line_count": 19,
            "blocks": [
                {"start_line_number": 121, "end_line_number": 139, "source_file": "./file1.c"}
            ]
        }]);
        let output_format = "yaml";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        let result = write_output(&results, output_format, output_file);
        assert!(result.is_err());
    }
}
