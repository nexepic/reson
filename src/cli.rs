use clap::{Arg, Command, Parser};
use std::path::PathBuf;

#[derive(Parser)]
pub struct CliArgs {
    #[clap(short = 's', long = "source-path", value_parser(clap::value_parser!(PathBuf)))]
    pub source_path: PathBuf,

    #[clap(short = 'l', long = "languages", value_parser(clap::builder::ValueParser::string()))]
    pub languages: Vec<String>,

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
                Arg::new("languages")
                    .short('l')
                    .long("languages")
                    .value_name("LANGUAGES")
                    .help("Comma-separated list of languages to parse")
                    .default_value("")
                    .value_parser(clap::value_parser!(String)),
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

    fn parse_source_path(matches: &clap::ArgMatches) -> PathBuf {
        let source_path: PathBuf = matches.get_one::<PathBuf>("source-path").unwrap().to_path_buf();
        if let Err(err) = CliArgs::validate_source_path(&source_path) {
            eprintln!("{}", err);
            std::process::exit(1);
        }
        source_path
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
    
    fn parse_languages(matches: &clap::ArgMatches) -> Vec<String> {
        matches
            .get_one::<String>("languages")
            .unwrap()
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    }

    fn parse_excludes(matches: &clap::ArgMatches) -> Vec<String> {
        matches
            .get_one::<String>("excludes")
            .unwrap()
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    }

    fn parse_output_file(matches: &clap::ArgMatches) -> Option<PathBuf> {
        matches.get_one::<PathBuf>("output-file").cloned()
    }

    fn parse_threshold(matches: &clap::ArgMatches) -> usize {
        *matches.get_one::<usize>("threshold").unwrap()
    }

    fn parse_debug(matches: &clap::ArgMatches) -> bool {
        *matches.get_one::<bool>("debug").unwrap_or(&false)
    }

    fn parse_cli_args(matches: &clap::ArgMatches) -> CliArgs {
        CliArgs {
            source_path: CliArgs::parse_source_path(matches),
            languages: CliArgs::parse_languages(matches),
            excludes: CliArgs::parse_excludes(matches),
            output_format: matches
                .get_one::<String>("output-format")
                .unwrap()
                .to_string(),
            output_file: CliArgs::parse_output_file(matches),
            threshold: CliArgs::parse_threshold(matches),
            debug: CliArgs::parse_debug(matches),
        }
    }

    pub fn parse() -> Self {
        let matches = Self::command().get_matches();
        CliArgs::parse_cli_args(&matches)
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
    fn test_languages_parsing() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--languages",
            "rust,java",
        ]);

        assert!(matches.is_ok());
        let matches = matches.unwrap();

        let languages: Vec<String> = matches
            .get_one::<String>("languages")
            .unwrap()
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();

        assert_eq!(languages, vec!["rust", "java"]);
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
    fn test_parse_output_file() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--output-file",
            "result.json",
        ]).unwrap();

        let output_file = CliArgs::parse_output_file(&matches);
        assert_eq!(output_file, Some(PathBuf::from("result.json")));
    }

    #[test]
    fn test_parse_threshold() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--threshold",
            "10",
        ]).unwrap();

        let threshold = CliArgs::parse_threshold(&matches);
        assert_eq!(threshold, 10);
    }

    #[test]
    fn test_parse_debug() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--debug",
        ]).unwrap();

        let debug = CliArgs::parse_debug(&matches);
        assert!(debug);
    }

    #[test]
    fn test_parse_debug_default() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
        ]).unwrap();

        let debug = CliArgs::parse_debug(&matches);
        assert!(!debug);
    }

    #[test]
    fn test_parse_cli_args() {
        let matches = CliArgs::command().try_get_matches_from(vec![
            "code-duplication-detector",
            "--source-path",
            "src",
            "--excludes",
            "tests,temp,build",
            "--output-format",
            "json",
            "--output-file",
            "result.json",
            "--threshold",
            "10",
            "--debug",
        ]).unwrap();

        let cli_args = CliArgs::parse_cli_args(&matches);

        assert_eq!(cli_args.source_path, PathBuf::from("src"));
        assert_eq!(cli_args.excludes, vec!["tests", "temp", "build"]);
        assert_eq!(cli_args.output_format, "json");
        assert_eq!(cli_args.output_file, Some(PathBuf::from("result.json")));
        assert_eq!(cli_args.threshold, 10);
        assert!(cli_args.debug);
    }
}
