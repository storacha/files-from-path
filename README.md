# files-from-path

> Match provided glob paths to file objects with readable stream

## Install

```sh
# install it as a dependency
$ npm i files-from-path
```

## Usage

```js
import { filesFromPath } from 'files-from-path'

for await (const f of filesFromPath(`path/to/somewhere`)) {
  console.log(f)
  // { name: '/path/to/me', stream: [Function: stream] }
}
```

## API

### filesFromPath

The following parameters can be provided to `filesFromPath`.

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

### getFilesFromPath

This takes the same parameters as `filesFromPath`, but returns a `Promise<{ name: String, stream: AsyncIterator<Buffer> }[]>` by creating an array with all the yield file like objects from the path.

## Releasing

You can publish by either running npm publish in the dist directory or using npx ipjs publish.
