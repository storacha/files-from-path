/* global WritableStream */
import test from 'ava'
import Path from 'path'
import process from 'process'
import os from 'os'
import fs from 'fs'
import unlimited from 'unlimited'
import { filesFromPaths } from '../src/index.js'

test('gets files from node_modules', async (t) => {
  const files = await filesFromPaths(['node_modules'])
  t.log(`${files.length} files in node_modules`)
  t.true(files.length > 1)
})

test('includes file size', async (t) => {
  const files = await filesFromPaths(['test/fixtures/empty.car'])
  t.is(files.length, 1)
  t.is(files[0].size, 18)
})

test('removes common path prefix', async (t) => {
  const files = await filesFromPaths(['test/fixtures/dir/file2.txt', './test/fixtures/empty.car'])
  t.true(files.length > 1)
  for (const file of files) {
    t.false(file.name.startsWith('test/fixtures/'))
  }
})

test('single file has name', async (t) => {
  const files = await filesFromPaths(['test/fixtures/empty.car'])
  t.is(files.length, 1)
  t.is(files[0].name, 'empty.car')
})

test('gets files from fixtures folder', async t => {
  const files = await filesFromPaths([`${process.cwd()}/test/fixtures`])
  t.true(files.length === 3)
})

test('allows read of more files than ulimit maxfiles', async t => {
  const totalFiles = 256
  const dir = await generateTestData(totalFiles)

  try {
    const files = await filesFromPaths([dir])
    t.is(files.length, totalFiles)

    // Restrict open files to less than the total files we'll read.
    unlimited(totalFiles - 1)

    // Make sure we can read ALL of these files at the same time.
    await t.notThrowsAsync(() => Promise.all(files.map(async f => {
      await f.stream().pipeTo(new WritableStream({
        async write () {
          // make slow so we open all the files
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }))
    })))
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true })
  }
})

test('uses custom fs implementation', async t => {
  // it uses graceful-fs by default so passing node:fs is legit test
  const files = await filesFromPaths([`${process.cwd()}/test/fixtures`], { fs })
  t.true(files.length === 3)
})

test('sorts by path', async t => {
  const paths = ['dir/file2.txt', 'empty.car', 'file.txt']
  /** @param {string} name */
  const toDirEnt = name => ({ name, isFile: () => true, isDirectory: () => false })
  const files = await filesFromPaths([`${process.cwd()}/test/fixtures`], {
    fs: {
      createReadStream: fs.createReadStream,
      promises: {
        stat: fs.promises.stat,
        readdir: async () => [...paths].reverse().map(toDirEnt)
      }
    }
  })
  t.deepEqual(files.map(f => f.name), paths)
})

/**
 * @param {number} n
 */
async function generateTestData (n) {
  const dirName = Path.join(os.tmpdir(), `files-from-path-test-${Date.now()}`)
  await fs.promises.mkdir(dirName)
  for (let i = 0; i < n; i++) {
    await fs.promises.writeFile(Path.join(dirName, `${i}.json`), '{}')
  }
  return dirName
}
