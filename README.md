# files-from-path

> Expand paths to file-like objects with name, readable stream and size.

[![Build](https://github.com/web3-storage/files-from-path/actions/workflows/main.yml/badge.svg)](https://github.com/web3-storage/files-from-path/actions/workflows/main.yml)
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

### filesFromPaths

The following parameters can be provided to `filesFromPaths`:

| Name | Type | Description |
|------|------|-------------|
| paths | `Iterable<string>` | File system path(s) to read from |
| [options] | `object` | options |
| [options.hidden] | `boolean` | Include .dot files in matched paths (default: `false`) |

It returns an _array_ of file-like objects in the form:

```ts
{
  name: String
  stream (): ReadableStream<Uint8Array>
  size: number
}
```

## Releasing

You can publish by either running npm publish in the dist directory or using npx ipjs publish.
