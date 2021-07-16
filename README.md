# glob-to-files

> Match provided glob paths to file objects with readable stream

## Install

```sh
# install it as a dependency
$ npm i glob-to-files
```

## Usage

```js
import globToFiles from 'glob-to-files'

for await (const f of globToFiles(`path/to/somewhere`)) {
  console.log(f)
  // { name: '/path/to/me', stream: [Function: stream] }
}
```

## API

The following parameters can be provided to `globToFfiles`.

| Name | Type | Description |
|------|------|-------------|
| paths | `Iterable<string> | AsyncIterable<string> | string` | File system path(s) to glob from |
| [options] | `object` | options |
| [options.hidden] | `boolean` | Include .dot files in matched paths |
| [options.ignore] | `string[]` | Glob paths to ignore |
| [options.followSymlinks] | `boolean` | follow symlinks |
| [options.preserveMode] | `boolean` | preserve mode |
| [options.mode] | `number` | mode to use - if preserveMode is true this will be ignored |
| [options.preserveMtime] | `boolean` | preserve mtime |

It `yields` file like objects in the form of `{ name: String, stream: AsyncIterator<Buffer> }`
