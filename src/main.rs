mod cli;
mod detector;
mod parser;
mod utils;

use crate::cli::CliArgs;
use crate::detector::detect_duplicates;
use crate::utils::write_output;
use log::LevelFilter;
use env_logger::Env;

fn main() {
    // Parse command-line arguments
    let args = CliArgs::parse();

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
    if let Err(e) = write_output(&duplicates, &args.output_format.as_str(), args.output_file.as_deref()) {
        eprintln!("Failed to write output: {}", e);
    }
}