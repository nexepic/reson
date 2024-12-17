mod cli;
mod detector;
mod parser;
mod utils;

use crate::cli::CliArgs;
use crate::detector::detect_duplicates;
use crate::utils::write_output;

fn main() {
    // 解析命令行参数
    let args = CliArgs::parse();

    // 执行重复检测
    let duplicates = detect_duplicates(&args);

    // 根据格式输出结果
    if let Err(e) = write_output(&duplicates, &args.output_format.as_str()) {
        eprintln!("Failed to write output: {}", e);
    }
}