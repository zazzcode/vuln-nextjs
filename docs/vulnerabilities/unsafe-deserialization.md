# Unsafe deserialization (CWE-502)

A server-side handler can introduce unsafe deserialization when it passes untrusted bytes to a
parser that can reconstruct objects or interpret code. Base64 decoding changes the representation
of the bytes and carries their original source through to the parser. For untrusted data, use a
data-only format or YAML schema and validate the resulting fields.

## What the scanner checks

The Zazzles `deserialization` family follows request data into verified server-side deserializers.
It records the library binding, the applicable options or version, and the path from the request
to the data input. An unresolved loader, schema, or required version stays in Review.
[Zazzles coverage guide](https://github.com/zazzcode/zazzles/blob/d85d9421435ffaf04d075904fdcabdfc91a426ab/docs/scan/detection-capabilities/unsafe-deserialization.md)

| Evidence | Where to find it |
| --- | --- |
| Application-code SAST | Zazzles' static Next.js fixtures exercise cookie and body inputs with a data-only parser as the control. [Scanner tests](https://github.com/zazzcode/zazzles/blob/d85d9421435ffaf04d075904fdcabdfc91a426ab/scan/internal/langjs/deserialization_test.go) |
| Dependency SCA | This lab catalogs React2Shell as `SCA-001` for the affected Next.js dependency in the App Router fixture. [Scenario reference](react2shell.md#sca-001-agent) |

Run the Next.js source-only check from the Zazzles checkout containing the analyzer.

```sh
go test ./scan/internal/langjs -run '^TestDeserializationNextJS$' -count=1
```

The test parses temporary Pages API source files and checks the resulting candidates. It requires
no running Next.js app or model provider.
