import test from 'ava'
import Path from 'path'
import process from 'process'
import os from 'os'
import fs from 'fs'
import crypto from 'crypto'
import unlimited from 'unlimited'
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
  let dir
  try {
    const totalFiles = 512
    dir = await generateTestData(totalFiles)

    const files = await getFilesFromPath(dir)
    t.is(files.length, totalFiles)

    // Restrict to 256 open files max
    // Note: this doesn't work on MacOS Monterey, you need to run:
    // sudo sysctl kern.maxfilesperproc=256
    unlimited(totalFiles / 2)

    // Make sure we can read ALL of these files at the same time.
    t.notThrowsAsync(() => Promise.all(files.map(async f => {
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
      await fs.promises.rm(dir, { recursive: true, force: true })
    }
  }
})

async function generateTestData (n) {
  const dirName = Path.join(os.tmpdir(), `files-from-path-test-${Date.now()}`)
  await fs.promises.mkdir(dirName)
  const minBytes = 1024
  const maxBytes = 1024 * 1024 * 5
  for (let i = 0; i < n; i++) {
    const numBytes = Math.floor(Math.random() * (maxBytes - minBytes) + minBytes)
    await fs.promises.writeFile(Path.join(dirName, `${i}.json`), crypto.randomBytes(numBytes))
  }
  return dirName
}
