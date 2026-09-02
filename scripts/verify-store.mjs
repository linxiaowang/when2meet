#!/usr/bin/env node
/**
 * 验证共享存储：创建活动 → 甲保存 → 乙保存 → 再读仍能看到两人。
 * 使用与 H5 相同的 restful-api.dev（CORS *）。
 */
import process from 'node:process'

const BASE = process.env.VITE_EVENT_STORE_BASE || 'https://api.restful-api.dev/objects'

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:5173',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok)
    throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`)
  return JSON.parse(text)
}

const cors = await fetch(BASE, {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  },
})
const allowOrigin = cors.headers.get('access-control-allow-origin')
if (allowOrigin !== '*')
  throw new Error(`CORS 失败，Allow-Origin=${allowOrigin}`)

const draft = {
  name: '周会',
  data: {
    title: '周会',
    dates: ['2026-09-03', '2026-09-04'],
    startHour: 9,
    endHour: 12,
    slotMinutes: 60,
    timezone: 'Asia/Shanghai',
    participants: [],
    createdAt: new Date().toISOString(),
  },
}

const created = await req('POST', BASE, draft)
const id = created.id
if (!id)
  throw new Error('创建未返回 id')

async function putWith(name, slots) {
  const cur = await req('GET', `${BASE}/${id}`)
  const people = (cur.data.participants || []).filter(p => p.name !== name)
  people.push({ name, slots })
  cur.data.participants = people
  return req('PUT', `${BASE}/${id}`, { name: cur.data.title, data: cur.data })
}

await putWith('甲', ['2026-09-03T09:00', '2026-09-03T10:00'])
await putWith('乙', ['2026-09-03T10:00', '2026-09-04T09:00'])

const again = await req('GET', `${BASE}/${id}`)
const names = again.data.participants.map(p => p.name).sort()
if (names.join(',') !== '乙,甲')
  throw new Error(`期望甲和乙，实际 ${names.join(',')}`)

const ten = again.data.participants.filter(p => p.slots.includes('2026-09-03T10:00')).map(p => p.name)
if (ten.length !== 2)
  throw new Error('10:00 应有两人重叠')

console.log('store ok')
console.log(`id=${id}`)
console.log(`share=#/pages/event?id=${id}`)
console.log(`cors=Access-Control-Allow-Origin: ${allowOrigin}`)
console.log(`people=${again.data.participants.map(p => `${p.name}:${p.slots.length}`).join(' ')}`)
