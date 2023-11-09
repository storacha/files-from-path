import gracefulfs from 'graceful-fs'
import { promisify } from 'util'
import path from 'path'
import { Readable } from 'stream'

/**
 * @typedef {Pick<File, 'stream'|'name'|'size'>} FileLike
 * @typedef {{
 *   name: string
 *   isFile: () => boolean
 *   isDirectory: () => boolean
 * }} Dirent
 * @typedef {{
 *   readdir: (path: string, options: { withFileTypes: true }) => Promise<Dirent[]>
 * }} DirReader
 * @typedef {{
 *   size: number
 *   isFile: () => boolean
 *   isDirectory: () => boolean
 * }} Stats
 * @typedef {{ stat: (path: string) => Promise<Stats> }} StatGetter
 * @typedef {{
 *   createReadStream: (path: string) => import('node:fs').ReadStream
 *   promises: DirReader & StatGetter
 * }} FileSystem
 */

const defaultfs = {
  createReadStream: gracefulfs.createReadStream,
  promises: {
    // https://github.com/isaacs/node-graceful-fs/issues/160
    stat: promisify(gracefulfs.stat),
    readdir: promisify(gracefulfs.readdir)
  }
}

/**
 * @param {Iterable<string>} paths
 * @param {object} [options]
 * @param {boolean} [options.hidden]
 * @param {boolean} [options.sort] Sort by path. Default: true.
 * @param {FileSystem} [options.fs] Custom FileSystem implementation.
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
  const commonPathFiles = files.map(f => ({ ...f, name: f.name.slice(commonPath.length) }))
  return options?.sort == null || options?.sort === true
    ? commonPathFiles.sort((a, b) => a.name === b.name ? 0 : a.name > b.name ? 1 : -1)
    : commonPathFiles
}

/**
 * @param {string} filepath
 * @param {object} [options]
 * @param {boolean} [options.hidden]
 * @param {FileSystem} [options.fs] Custom FileSystem implementation.
 * @returns {AsyncIterableIterator<FileLike>}
 */
async function * filesFromPath (filepath, options) {
  filepath = path.resolve(filepath)
  const fs = options?.fs ?? defaultfs
  const hidden = options?.hidden ?? false

  /** @param {string} filepath */
  const filter = filepath => {
    if (!hidden && path.basename(filepath).startsWith('.')) return false
    return true
  }

  const name = filepath
  const stat = await fs.promises.stat(name)

  if (!filter(name)) {
    return
  }

  if (stat.isFile()) {
    // @ts-expect-error node web stream not type compatible with web stream
    yield { name, stream: () => Readable.toWeb(fs.createReadStream(name)), size: stat.size }
  } else if (stat.isDirectory()) {
    yield * filesFromDir(name, filter, options)
  }
}

/**
 * @param {string} dir
 * @param {(name: string) => boolean} filter
 * @param {object} [options]
 * @param {FileSystem} [options.fs] Custom FileSystem implementation.
 * @returns {AsyncIterableIterator<FileLike>}
 */
async function * filesFromDir (dir, filter, options) {
  const fs = options?.fs ?? defaultfs
  const entries = await fs.promises.readdir(path.join(dir), { withFileTypes: true })
  for (const entry of entries) {
    if (!filter(entry.name)) {
      continue
    }

    if (entry.isFile()) {
      const name = path.join(dir, entry.name)
      const { size } = await fs.promises.stat(name)
      // @ts-expect-error node web stream not type compatible with web stream
      yield { name, stream: () => Readable.toWeb(fs.createReadStream(name)), size }
    } else if (entry.isDirectory()) {
      yield * filesFromDir(path.join(dir, entry.name), filter)
    }
  }
}
