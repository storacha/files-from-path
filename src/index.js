import fs from 'graceful-fs'
import { promisify } from 'util'
import path from 'path'
import { Readable } from 'stream'

/** @typedef {Pick<File, 'stream'|'name'|'size'>} FileLike */

// https://github.com/isaacs/node-graceful-fs/issues/160
const fsStat = promisify(fs.stat)
const fsReaddir = promisify(fs.readdir)

/**
 * @param {Iterable<string>} paths
 * @param {object} [options]
 * @param {boolean} [options.hidden]
 * @returns {Promise<FileLike[]>}
 */
export async function filesFromPaths (paths, options) {
  /** @type {string[]|undefined} */
  let commonParts
  const files = []
  for (const p of paths) {
    for await (const file of filesFromPath(p, options)) {
      files.push(file)
      const nameParts = file.name.split(path.sep)
      if (commonParts == null) {
        commonParts = nameParts.slice(0, -1)
        continue
      }
      for (let i = 0; i < commonParts.length; i++) {
        if (commonParts[i] !== nameParts[i]) {
          commonParts = commonParts.slice(0, i)
          break
        }
      }
    }
  }
  const commonPath = `${(commonParts ?? []).join('/')}/`
  return files.map(f => ({ ...f, name: f.name.slice(commonPath.length) }))
}

/**
 * @param {string} filepath
 * @param {object} [options]
 * @param {boolean} [options.hidden]
 * @returns {AsyncIterableIterator<FileLike>}
 */
async function * filesFromPath (filepath, options = {}) {
  filepath = path.resolve(filepath)
  const hidden = options.hidden ?? false

  /** @param {string} filepath */
  const filter = filepath => {
    if (!hidden && path.basename(filepath).startsWith('.')) return false
    return true
  }

  const name = filepath
  const stat = await fsStat(name)

  if (!filter(name)) {
    return
  }

  if (stat.isFile()) {
    // @ts-expect-error node web stream not type compatible with web stream
    yield { name, stream: () => Readable.toWeb(fs.createReadStream(name)), size: stat.size }
  } else if (stat.isDirectory()) {
    yield * filesFromDir(name, filter)
  }
}

/**
 * @param {string} dir
 * @param {(name: string) => boolean} filter
 * @returns {AsyncIterableIterator<FileLike>}
 */
async function * filesFromDir (dir, filter) {
  const entries = await fsReaddir(path.join(dir), { withFileTypes: true })
  for (const entry of entries) {
    if (!filter(entry.name)) {
      continue
    }

    if (entry.isFile()) {
      const name = path.join(dir, entry.name)
      const { size } = await fsStat(name)
      // @ts-expect-error node web stream not type compatible with web stream
      yield { name, stream: () => Readable.toWeb(fs.createReadStream(name)), size }
    } else if (entry.isDirectory()) {
      yield * filesFromDir(path.join(dir, entry.name), filter)
    }
  }
}
