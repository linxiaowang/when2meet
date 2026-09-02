import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import { createFsStore } from './fs-store'
import { createHandler } from './handler'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', chunk => data += String(chunk))
    req.on('end', () => resolveBody(data))
    req.on('error', reject)
  })
}

export function yueApiPlugin(root = process.cwd()): Plugin {
  const store = createFsStore(resolve(root, '.data/events.json'))
  const handle = createHandler(store)

  return {
    name: 'yue-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/') && url.split('?')[0] !== '/api')
          return next()
        try {
          const body = await readBody(req)
          const result = await handle({
            method: req.method || 'GET',
            path: url,
            body,
          })
          res.statusCode = result.status
          for (const [key, value] of Object.entries(result.headers))
            res.setHeader(key, value)
          res.end(result.body)
        }
        catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : '服务器错误' }))
        }
      })
    },
  }
}
