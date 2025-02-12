# files-from-path

> Expand paths to file-like objects with name, readable stream and size.

[![Build](https://github.com/storacha/files-from-path/actions/workflows/main.yml/badge.svg)](https://github.com/storacha/files-from-path/actions/workflows/main.yml)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Downloads](https://img.shields.io/npm/dm/files-from-path.svg)](https://www.npmjs.com/package/files-from-path)

## Install

```sh
npm install files-from-path
```

## Usage

```js
import { filesFromPaths } from 'files-from-path'

// Given a file system like:
// path/to/file.txt
// path/to/dir/a.pdf
// path/to/dir/images/cat.gif

const files = await filesFromPaths(['path/to/file.txt', 'path/to/dir'])
console.log(files)

// Output:
// [
//   { name: 'file.txt', stream: [Function: stream] },
//   { name: 'dir/b.pdf', stream: [Function: stream] },
//   { name: 'dir/images/cat.gif', stream: [Function: stream] },
// ]
// Note: common sub-path ("path/to/") is removed.
```

## API

### `filesFromPaths`

The following parameters can be provided to `filesFromPaths`:

| Name | Type | Description |
|------|------|-------------|
| paths | `Iterable<string>` | File system path(s) to read from |
| [options] | `object` | options |
| [options.hidden] | `boolean` | Include .dot files in matched paths (default: `false`) |
| [options.sort] | `boolean` | Sort files by path (default: `true`) |

It returns an _array_ of file-like objects in the form:

```ts
{
  name: string
  stream: () => ReadableStream<Uint8Array>
  size: number
}
```

## Releasing

Releasing to npm is done via [`release-please`](https://github.com/googleapis/release-please). A Release PR will be opened with a CHANGELOG update in after a PR is merged to main. Merging the release PR will publish the new version to npm.

## Contributing

Feel free to join in. All welcome. Please [open an issue](https://github.com/storacha/files-from-path/issues)!

## License

Dual-licensed under [Apache 2.0 OR MIT](https://github.com/storacha/files-from-path/blob/main/LICENSE.md)
