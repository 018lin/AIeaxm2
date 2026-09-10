import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { executeByPath } from './_app-api.js'

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
