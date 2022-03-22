import test from 'ava'
import Path from 'path'
import process from 'process'
import os from 'os'
import fs from 'graceful-fs'
import crypto from 'crypto'
import unlimited from 'unlimited'
import { promisify } from 'util'
import { filesFromPath, getFilesFromPath } from '../src/index.js'

test('yields files from fixtures folder', async t => {
  const files = []
  for await (const f of filesFromPath(`${process.cwd()}/test/fixtures`)) {
    files.push(f)
  }

  t.true(files.length === 2)
})

test('gets files from fixtures folder', async t => {
  const files = await getFilesFromPath(`${process.cwd()}/test/fixtures`)

  t.true(files.length === 2)
})

test('removes custom prefix', async t => {
  const files = await getFilesFromPath(`${process.cwd()}/test/fixtures`)

  const pathPrefix = Path.join(process.cwd(), 'test', 'fixtures')
  const filesWithoutPrefix = await getFilesFromPath(`${process.cwd()}/test/fixtures`, { pathPrefix })

  files.forEach(f => {
    t.true(f.name.includes('fixtures'))
  })

  filesWithoutPrefix.forEach(f => {
    t.false(f.name.includes('fixtures'))
  })
})

test('allows read of more files than ulimit maxfiles', async t => {
  /** @type {string} */
  let dir
  try {
    const totalFiles = 256
    dir = await generateTestData(totalFiles)

    // Restrict open files to less than the total files we'll read.
    unlimited(totalFiles - 1)

    const files = await getFilesFromPath(dir)
    t.is(files.length, totalFiles)

    // Restrict open files to less than the total files we'll read.
    unlimited(totalFiles - 1)

    // Make sure we can read ALL of these files at the same time.
    await t.notThrowsAsync(() => Promise.all(files.map(async f => {
      let i = 0
      for await (const _ of f.stream()) { // eslint-disable-line no-unused-vars
        if (i === 0) { // make slow so we open all the files
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        i++
      }
    })))
  } finally {
    if (dir) {
      await promisify(fs.rm)(dir, { recursive: true, force: true })
    }
  }
})

async function generateTestData (n) {
  const dirName = Path.join(os.tmpdir(), `files-from-path-test-${Date.now()}`)
  await promisify(fs.mkdir)(dirName)
  const minBytes = 1024
  const maxBytes = 1024 * 1024 * 5
  for (let i = 0; i < n; i++) {
    const numBytes = Math.floor(Math.random() * (maxBytes - minBytes) + minBytes)
    await promisify(fs.writeFile)(Path.join(dirName, `${i}.json`), crypto.randomBytes(numBytes))
  }
  return dirName
}
