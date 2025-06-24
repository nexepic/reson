# Quick start

To perform a quick detection for your project:

```shell
./reson --source-path <path_to_source>
```

## More options

To customize the detection process, you can use the following options:

[//]: # (use table to display options)
| Option            | Default value                                       | Possible values                                     | Description                                                           |
|-------------------|-----------------------------------------------------|-----------------------------------------------------|-----------------------------------------------------------------------|
| `--source-path`   | N/A                                                 | Any valid path                                      | Path to the source code directory                                     |
| `--languages`     | c,cpp,java,javascript,typescript,python,golang,rust | c,cpp,java,javascript,typescript,python,golang,rust | Comma-separated list of languages to detect                           |
| `--excludes`      | N/A                                                 | Any valid path                                      | Comma-separated list of directories to exclude from the detection     |
| `--threshold`     | 5                                                   | Any positive integer                                | Minimum number of lines for a code block to be considered a duplicate |
| `--output-format` | json                                                | xml,json                                            | Format of the output report                                           |
| `--output-file`   | N/A                                                 | Any valid file name                                 | Name of the output file                                               |
| `--max-file-size` | 1048576                                             | Any positive integer                                | Maximum file size to process in bytes                                 |
| `--threads`       | 10                                                  | Any positive integer                                | Number of threads to use for processing                               |

[//]: # (use table to display options)
