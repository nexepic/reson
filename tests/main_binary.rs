use std::process::Command;
use tempfile::NamedTempFile;

#[test]
fn test_binary_entrypoint_with_valid_args() {
    let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let source_path = manifest_dir.join("tests/rust");
    let output_file = NamedTempFile::new().expect("failed to create temp output file");
    let output_path = output_file
        .path()
        .to_str()
        .expect("output path must be valid UTF-8");

    let output = Command::new(env!("CARGO_BIN_EXE_reson"))
        .current_dir(&manifest_dir)
        .args([
            "--source-path",
            source_path
                .to_str()
                .expect("source path must be valid UTF-8"),
            "--languages",
            "rust",
            "--output-format",
            "json",
            "--output-file",
            output_path,
            "--threshold",
            "5",
            "--min-ast-nodes",
            "10",
            "--threads",
            "1",
        ])
        .output()
        .expect("failed to execute reson binary");

    assert!(
        output.status.success(),
        "reson binary exited with failure.\nstderr: {}\nstdout: {}",
        String::from_utf8_lossy(&output.stderr),
        String::from_utf8_lossy(&output.stdout)
    );

    let output_content =
        std::fs::read_to_string(output_path).expect("failed to read coverage output file");
    let json: serde_json::Value =
        serde_json::from_str(&output_content).expect("output should be valid JSON");

    assert!(json.get("summary").is_some(), "summary field is missing");
    assert!(json.get("records").is_some(), "records field is missing");
}
