mod cli;
mod detector;
mod parser;
mod utils;

use crate::cli::CliArgs;
use crate::detector::detect_duplicates;
use log::LevelFilter;
use env_logger::Env;
use crate::utils::output::write_output;

fn run(args: CliArgs) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logger
    let log_level = if args.debug {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    };
    env_logger::Builder::from_env(Env::default().default_filter_or(log_level.to_string())).init();

    // Execute duplicate detection
    let duplicates = detect_duplicates(&args);

    // Output results based on format
    write_output(&duplicates, &args.output_format.as_str(), args.output_file.as_deref())?;

    Ok(())
}

fn main() {
    let args = CliArgs::parse();
    if let Err(e) = run(args) {
        eprintln!("Application error: {}", e);
    }
}

#[cfg(test)]
mod integration_tests {
    use super::run;
    use super::cli::CliArgs;
    use clap::Parser;
    use tempfile::NamedTempFile;

    #[test]
    fn test_run() {
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let output_path = temp_file.path().to_str().unwrap();

        let args = CliArgs::parse_from(vec![
            "program_name",
            "--source-path", "src",
            "--languages", "rust",
            "--excludes", "tests,temp,build",
            "--output-format", "json",
            "--output-file", output_path,
        ]);

        let result = run(args);
        assert!(result.is_ok());
    }
}