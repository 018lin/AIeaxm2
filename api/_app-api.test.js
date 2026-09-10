import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { __test, executeByPath } from './_app-api.js'
import questionBankImportHandler from './v1/question-bank-batch/import.js'

const createRequest = url => ({
  method: 'GET',
  url,
  headers: {},
  body: {},
})

describe('dict query endpoint', () => {
  it('serves grouped dict data through the api/system path used by the frontend', async () => {
    const res = await executeByPath(
      createRequest('/api/system/dict-data/query-types?dictTypes[]=ipta_item_type&dictTypes[]=ipta_textbook_volume')
    )

    assert.equal(res.code, 0)
    assert.deepEqual(
      res.data.map(item => item.dictType),
      ['ipta_item_type', 'ipta_textbook_volume']
    )
    assert.deepEqual(res.data[0].dictTypeList[0], {
      id: 1,
      dictType: 'ipta_item_type',
      dictValue: 'sync',
      value: 'sync',
      label: '同步练习',
    })
  })
})

describe('question bank import endpoint', () => {
  it('has a concrete Vercel function route for the production upload path', async () => {
    let statusCode
    let payload
    const req = {
      method: 'POST',
      url: '/api/v1/question-bank-batch/import',
      headers: {},
      body: {},
      on() {},
    }
    const res = {
      setHeader() {},
      end(value) {
        statusCode = this.statusCode
        payload = JSON.parse(value)
      },
    }

    await questionBankImportHandler(req, res)

    assert.equal(statusCode, 200)
    assert.notEqual(payload?.msg, '接口不存在')
  })

  it('groups image_pairs files by questionFiles and answerFiles fields', () => {
    const files = [
      { fieldName: 'questionFiles', fileName: 'q1.png', mimeType: 'image/png', buffer: Buffer.from('q1') },
      { fieldName: 'answerFiles', fileName: 'a1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('a1') },
      { fieldName: 'questionFiles', fileName: 'q2.jpeg', mimeType: 'image/jpeg', buffer: Buffer.from('q2') },
    ]

    const grouped = __test.getImagePairFiles(files)

    assert.deepEqual(
      grouped.questionFiles.map(file => file.fileName),
      ['q1.png', 'q2.jpeg']
    )
    assert.deepEqual(
      grouped.answerFiles.map(file => file.fileName),
      ['a1.jpg']
    )
    assert.equal(grouped.invalidFiles.length, 0)
  })

  it('reports non-image files as invalid for image_pairs imports', () => {
    const grouped = __test.getImagePairFiles([
      { fieldName: 'questionFiles', fileName: 'q1.png', mimeType: 'image/png', buffer: Buffer.from('q1') },
      { fieldName: 'answerFiles', fileName: 'a1.gif', mimeType: 'image/gif', buffer: Buffer.from('a1') },
      { fieldName: 'questionFiles', fileName: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') },
    ])

    assert.deepEqual(
      grouped.invalidFiles.map(file => file.fileName),
      ['a1.gif', 'notes.txt']
    )
  })

  it('builds data-url image html for imported image questions and answers', () => {
    const html = __test.imageHtml(
      { fileName: 'q1.png', mimeType: 'image/png', buffer: Buffer.from('hello') },
      '第1题'
    )

    assert.match(html, /^<img src="data:image\/png;base64,/)
    assert.match(html, /aGVsbG8=/)
    assert.match(html, /alt="第1题"/)
  })
})
