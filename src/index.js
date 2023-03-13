import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

/** @typedef {Pick<File, 'stream'|'name'|'size'>} FileLike */

/**
 * @param {string[]} paths
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
  const stat = await fs.promises.stat(filepath)

  if (!filter(name)) {
    return
  }

  if (stat.isFile()) {
    const stream = /** @type {File['stream']} */ (() => Readable.toWeb(fs.createReadStream(filepath)))
    yield { name, stream, size: stat.size }
  } else if (stat.isDirectory()) {
    yield * filesFromDir(filepath, filter)
  }
}

/**
 * @param {string} dir
 * @param {(name: string) => boolean} filter
 * @returns {AsyncIterableIterator<FileLike>}
 */
async function * filesFromDir (dir, filter) {
  const entries = await fs.promises.readdir(path.join(dir), { withFileTypes: true })
  for (const entry of entries) {
    if (!filter(entry.name)) {
      continue
    }

    if (entry.isFile()) {
      const name = path.join(dir, entry.name)
      const { size } = await fs.promises.stat(name)
      const stream = /** @type {File['stream']} */ (() => Readable.toWeb(fs.createReadStream(name)))
      yield { name, stream, size }
    } else if (entry.isDirectory()) {
      yield * filesFromDir(path.join(dir, entry.name), filter)
    }
  }
}
