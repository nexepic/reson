use clap::{Arg, Command, Parser};
use std::path::PathBuf;

#[derive(Parser)]
pub struct CliArgs {
    #[clap(short = 's', long = "source-path", value_parser(clap::value_parser!(PathBuf)))]
    pub source_path: PathBuf,

    #[clap(short = 'e', long = "excludes", value_parser(clap::builder::ValueParser::string()))]
    pub excludes: Vec<String>,

    #[clap(short = 'o', long = "output-format", default_value = "json", value_parser(clap::builder::ValueParser::string()))]
    pub output_format: String,

    #[clap(short = 'f', long = "output-file", value_parser(clap::value_parser!(PathBuf)))]
    pub output_file: Option<PathBuf>,

    #[clap(short = 't', long = "threshold", default_value = "5", value_parser(clap::value_parser!(usize)))]
    pub threshold: usize,

    #[clap(long = "debug")]
    pub debug: bool,
}

impl CliArgs {
    pub fn command() -> Command {
        Command::new("Code Duplication Detector")
            .version("1.0")
            .author("Nexepic")
            .about("Detects code duplication across multiple files")
            .arg(
                Arg::new("source-path")
                    .short('s')
                    .long("source-path")
                    .value_name("SOURCE")
                    .help("Path to the source code directory")
                    .required(true)
                    .value_parser(clap::value_parser!(PathBuf)),
            )
            .arg(
                Arg::new("excludes")
                    .short('e')
                    .long("excludes")
                    .value_name("EXCLUDES")
                    .help("Comma-separated list of paths to exclude")
                    .default_value("")
                    .value_parser(clap::value_parser!(String)),
            )
            .arg(
                Arg::new("output-format")
                    .short('o')
                    .long("output-format")
                    .value_name("FORMAT")
                    .help("Output format (e.g., json)")
                    .default_value("json")
                    .value_parser(clap::value_parser!(String)),
            )
            .arg(
                Arg::new("output-file")
                    .short('f')
                    .long("output-file")
                    .value_name("FILE")
                    .help("File to write the output to")
                    .value_parser(clap::value_parser!(PathBuf)),
            )
            .arg(
                Arg::new("threshold")
                    .short('t')
                    .long("threshold")
                    .value_name("THRESHOLD")
                    .help("Minimum number of lines to consider as duplicate")
                    .default_value("5")
                    .value_parser(clap::value_parser!(usize)),
            )
            .arg(
                Arg::new("debug")
                    .long("debug")
                    .help("Enable debug mode")
                    .action(clap::ArgAction::SetTrue),
            )
    }

    pub fn validate_source_path(source_path: &PathBuf) -> Result<(), String> {
        if !source_path.exists() {
            let error_message = format!(
                "Error: The source path '{}' does not exist.",
                source_path.display()
            );
            return Err(error_message);
        }
        Ok(())
    }

    pub fn parse() -> Self {
        let matches = Self::command().get_matches();

        let source_path: PathBuf = matches.get_one::<PathBuf>("source-path").unwrap().to_path_buf();
        if let Err(err) = CliArgs::validate_source_path(&source_path) {
            eprintln!("{}", err);
            std::process::exit(1);
        }

        let excludes: Vec<String> = matches
            .get_one::<String>("excludes")
            .unwrap()
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Self {
            source_path,
            excludes,
            output_format: matches
                .get_one::<String>("output-format")
                .unwrap()
                .to_string(),
            output_file: matches.get_one::<PathBuf>("output-file").cloned(),
            threshold: *matches.get_one::<usize>("threshold").unwrap(),
            debug: *matches.get_one::<bool>("debug").unwrap_or(&false),
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_source_path_invalid() {
        let invalid_path = PathBuf::from("invalid_path");
        let result = CliArgs::validate_source_path(&invalid_path);

        assert!(result.is_err());
        if let Err(err) = result {
            assert!(err.contains("The source path 'invalid_path' does not exist."));
        }
    }

    #[test]
    fn test_validate_source_path_valid() {
        let valid_path = std::env::current_dir().unwrap();
        let result = CliArgs::validate_source_path(&valid_path);

        assert!(result.is_ok());
    }

    #[test]
    fn test_required_source_path() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let source_path = matches.get_one::<PathBuf>("source-path").unwrap();
        assert_eq!(source_path, &PathBuf::from("src"));
    }

    #[test]
    fn test_excludes_parsing() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--excludes",
            "tests,temp,build",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let excludes: Vec<String> = matches
            .get_one::<String>("excludes")
            .unwrap()
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();

        assert_eq!(excludes, vec!["tests", "temp", "build"]);
    }

    #[test]
    fn test_output_format_default() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let output_format = matches.get_one::<String>("output-format").unwrap();
        assert_eq!(output_format, "json");
    }

    #[test]
    fn test_output_file_optional() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--output-file",
            "result.json",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let output_file = matches.get_one::<PathBuf>("output-file").cloned();
        assert_eq!(output_file, Some(PathBuf::from("result.json")));
    }

    #[test]
    fn test_debug_flag() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--debug",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let debug = matches.get_one::<bool>("debug").unwrap_or(&false);
        assert!(*debug);
    }
}
