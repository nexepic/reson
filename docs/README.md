# reson

[![Build Status](https://github.com/nexepic/reson/actions/workflows/ci.yml/badge.svg)](https://github.com/nexepic/reson/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/nexepic/reson/branch/main/graph/badge.svg)](https://codecov.io/gh/nexepic/reson)
![License](https://img.shields.io/github/license/nexepic/reson)

> A high-performance tool designed for detecting code duplication across multiple source files. By leveraging Abstract Syntax Tree (AST) analysis, reson ensures accurate and reliable detection of duplicated code, supporting various programming languages.

This tool helps maintain high-quality codebases by identifying redundant code blocks, enabling effective refactoring and optimization.

---

## Features

- **AST-based Analysis**: Ensures precise duplication detection by analyzing the code structure rather than plain text.
- **Customizable Thresholds**: Define the minimum number of lines to consider as duplicates.
- **Exclude Directories/Files**: Easily exclude specific paths from the analysis.
- **Flexible Output Options**: Generate detailed reports in JSON and other formats.
- **Debug Mode**: Access additional logs for debugging and deeper analysis.

---

## Supported Languages

| Language     |
|--------------|
| C            |
| C++          |
| Java         |
| Go           |
| Python       |
| JavaScript   |
| TypeScript   |
| Rust         |

---

## Build from Source

Clone the repository and build the project using Rust's Cargo:

```bash
git clone https://github.com/nexepic/reson.git
cd reson
cargo build --release
```

---

## Usage

Run the tool using the following command:

```bash
./reson --source-path <path_to_source> [options]
```

---

## Example

Detect code duplication in the src directory, excluding tests and build directories, and output the results to result.json:

```bash
./reson \
  --source-path src \
  --excludes tests,build \
  --output-format json \
  --output-file result.json \
  --threshold 10
```

---

## Development

### Testing

Run the included test suite to validate functionality:

```bash
cargo test
```

### Contributing

We welcome contributions to enhance reson. Feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgements

reson was created by Nexepic to streamline the process of detecting and managing code duplication in diverse codebases. Your feedback and contributions are highly valued!