import type { EventStore } from '../../server/handler'
import type { YueEvent } from '../../src/shared/types'
import { Buffer } from 'node:buffer'
import { getStore } from '@netlify/blobs'
import { CORS_HEADERS, createHandler } from '../../server/handler'

function createBlobStore(): EventStore {
  const store = getStore('yue-events')
  return {
    async get(id) {
      const event = await store.get(id, { type: 'json' })
      return (event as YueEvent | null) || null
    },
    async set(id, event) {
      await store.setJSON(id, event)
    },
  }
}

export async function handler(event: {
  httpMethod?: string
  path?: string
  rawUrl?: string
  body?: string | null
  isBase64Encoded?: boolean
}) {
  const method = event.httpMethod || 'GET'
  let path = event.path || '/api'
  if (event.rawUrl) {
    try {
      path = new URL(event.rawUrl).pathname
    }
    catch {
      // keep path
    }
  }
  let body = event.body || ''
  if (body && event.isBase64Encoded)
    body = Buffer.from(body, 'base64').toString('utf8')

  const result = await createHandler(createBlobStore())({ method, path, body })
  return {
    statusCode: result.status,
    headers: { ...CORS_HEADERS, ...result.headers },
    body: result.body,
  }
}
