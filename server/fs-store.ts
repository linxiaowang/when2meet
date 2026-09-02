import type { YueEvent } from '../src/shared/types'
import type { EventStore } from './handler'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

interface FileShape {
  events: Record<string, YueEvent>
}

export function createFsStore(file: string): EventStore {
  let chain = Promise.resolve()

  function withLock<T>(fn: () => T): Promise<T> {
    const run = chain.then(fn, fn)
    chain = run.then(() => undefined, () => undefined)
    return run
  }

  function load(): FileShape {
    if (!existsSync(file))
      return { events: {} }
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as FileShape
    }
    catch {
      return { events: {} }
    }
  }

  function save(data: FileShape) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  }

  return {
    get(id) {
      return withLock(() => load().events[id] || null)
    },
    set(id, event) {
      return withLock(() => {
        const data = load()
        data.events[id] = event
        save(data)
      })
    },
  }
}
