import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { executeByPath } from './_app-api.js'
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
})
