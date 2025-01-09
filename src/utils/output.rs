use std::fs::File;
use std::io::Write;
use std::path::Path;
use serde::Serialize;

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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile;
    use std::fs;

    #[test]
    fn test_write_output_json() {
        let results = json!([{"key": "value"}]);
        let output_format = "json";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        write_output(&results, output_format, output_file).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(written_content.contains("\"key\": \"value\""));
    }

    #[test]
    fn test_write_output_text() {
        let results = json!([{"key": "value"}]);
        let output_format = "text";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        write_output(&results, output_format, output_file).unwrap();

        let written_content = fs::read_to_string(temp_file.path()).unwrap();
        assert!(written_content.contains("Object"));
    }

    #[test]
    fn test_write_output_unsupported_format() {
        let results = json!([{"key": "value"}]);
        let output_format = "xml";
        let temp_file = tempfile::NamedTempFile::new().unwrap();
        let output_file = Some(temp_file.path());

        let result = write_output(&results, output_format, output_file);
        assert!(result.is_err());
    }
}