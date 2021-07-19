import test from 'ava'
import process from 'process'
import { filesFromPath } from '../src/index.js'

test('joins CARs', async t => {
  const files = []
  for await (const f of filesFromPath(`${process.cwd()}/test/fixtures`)) {
    files.push(f)
  }

  t.true(files.length === 2)
})
