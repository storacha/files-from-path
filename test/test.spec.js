import test from 'ava'
import Path from 'path'
import process from 'process'
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
    console.log('n', f.name)
    t.true(f.name.includes('fixtures'))
  })

  filesWithoutPrefix.forEach(f => {
    t.false(f.name.includes('fixtures'))
  })
})
