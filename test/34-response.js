import { describe, it, after } from 'node:test'
import * as assert from 'node:assert'
// import * as utils from './test-utils.js'
import * as esma from '../lib/esma.js'
import { rmSync } from 'node:fs'
const port = 30034
const url = `http://localhost:${port}`

const DATA = {
  html: '<b>this is the body</b>',
  buffer: 'buffer payload',
  object: { type: 'object' },
  array: [1, 2, 3]
}

const server = esma.createServer().listen(port)

server.get('/response/:type', async req => {
  const { type } = req.params
  let body
  if (type === 'html') body = DATA.html
  if (type === 'buffer') body = Buffer.from(DATA.buffer)
  if (type === 'object') body = DATA.object
  if (type === 'array') body = DATA.array
  if (type === 'null') body = null
  if (type === 'undefined') body = undefined
  return body
})
server.get('/builtin', async req => {
  return {
    $statusCode: 202,
    $headers: { 'X-Type': 'test' },
    $body: 'body content',
  }
})
server.get('/builtin-error', async req => {
  throw Error('*error message*')
})

describe('response object - response types', () => {

  it('html', async () => {
    const res = await fetch(url + '/response/html')
    assert.strictEqual(res.headers.get('content-type'), 'text/html; charset=utf-8')
    assert.strictEqual(Number(res.headers.get('content-length')), Buffer.from(DATA.html).byteLength)
    assert.strictEqual(await res.text(), DATA.html)
  })

  it('buffer', async () => {
    const res = await fetch(url + '/response/buffer')
    assert.strictEqual(res.headers.get('content-type'), 'application/octet-stream')
    assert.strictEqual(Number(res.headers.get('content-length')), Buffer.from(DATA.buffer).byteLength)
    assert.strictEqual(await res.text(), DATA.buffer)
  })

  it('object', async () => {
    const res = await fetch(url + '/response/object')
    assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8')
    assert.strictEqual(Number(res.headers.get('content-length')), Buffer.from(JSON.stringify(DATA.object)).byteLength)
    assert.strictEqual(await res.text(), JSON.stringify(DATA.object))
  })

  it('array', async () => {
    const res = await fetch(url + '/response/array')
    assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8')
    assert.strictEqual(Number(res.headers.get('content-length')), Buffer.from(JSON.stringify(DATA.array)).byteLength)
    assert.strictEqual(await res.text(), JSON.stringify(DATA.array))
  })

  it('null', async () => {
    const res = await fetch(url + '/response/null')
    assert.strictEqual(Number(res.headers.get('content-length')), 0)
    assert.strictEqual(await res.text(), '')
  })

  it('undefined', async () => {
    const expected = 'HTTP 404 - Cannot GET /response/undefined'
    const res = await fetch(url + '/response/undefined')
    assert.strictEqual(await res.text(), expected)
    assert.strictEqual(Number(res.headers.get('content-length')), expected.length)
    assert.strictEqual(res.status, 404)
  })

})

describe('response object - built-in properties', () => {

  it('$statusCode', async () => {
    const res = await fetch(url + '/builtin')
    assert.strictEqual(res.status, 202)
  })

  it('$headers', async () => {
    const res = await fetch(url + '/builtin')
    assert.strictEqual(res.headers.get('x-type'), 'test')
  })

  it('$body', async () => {
    const res = await fetch(url + '/builtin')
    assert.strictEqual(await res.text(), 'body content')
  })

})

describe('response object - errors', () => {

  it('handle error', async () => {
    const res = await fetch(url + '/builtin-error')
    assert.strictEqual(res.status, 500)
    const body = await res.text()
    assert.strictEqual(body.split('\n')[0], 'HTTP 500 - Error: *error message*')
  })

  after(() => {
    server.close()
  })

})

