# Example

## Language specification

To specify the language of the source code:

```shell
./reson \
  --source-path src \
  --languages rust
```

To specify multiple languages, separate them with commas:

```shell
./reson \
  --source-path src \
  --languages rust,python
```

## Exclude directories

Glob patterns can be used to exclude directories from the detection. For example, to exclude all directories named `test`:

```shell
./reson \
  --source-path src \
  --excludes "**/test/**"
```

To exclude multiple directories, separate them with commas:

```shell
./reson \
  --source-path src \
  --excludes "test,build"
```

To exclude all files with a specific extension, use the following pattern:

```shell
./reson \
  --source-path src \
  --excludes "**/*.md"
```

To exclude all files with a specific name, use the following pattern:

```shell
./reson \
  --source-path src \
  --excludes "**/README.md"
```

## Custom threshold

To set a custom threshold for the minimum number of lines to consider as duplicates:

```shell
./reson \
  --source-path src \
  --threshold 10
```

## Output to file

To detect code duplication in the `src` directory, and output the results to `result.json`:

```shell
./reson \
  --source-path src \
  --output-format json \
  --output-file result.json
```

Without specifying the "--output-file" option, the results will be printed to the **duplications** file in the current directory.

```shell

## Maximum file size

To set the maximum file size to process in bytes:

```shell
./reson \
  --source-path src \
  --max-file-size 1048576
```

## Number of threads

To specify the number of threads to use for processing, more threads can speed up the detection process:

```shell
./reson \
  --source-path src \
  --threads 10
```