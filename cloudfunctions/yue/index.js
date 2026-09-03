const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const COL = 'events'
const TTL_MS = 90 * 24 * 60 * 60 * 1000

function strip(doc) {
  if (!doc)
    return null
  return {
    id: doc.id || doc._id,
    title: doc.title,
    startDate: doc.startDate,
    dayCount: doc.dayCount,
    startHour: doc.startHour,
    endHour: doc.endHour,
    slotMinutes: doc.slotMinutes,
    participants: doc.participants || [],
  }
}

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function wxOpenid() {
  const ctx = cloud.getWXContext()
  return String((ctx && ctx.OPENID) || '')
}

function ok(doc, openid) {
  return { ok: true, event: strip(doc), openid }
}

exports.main = async (event) => {
  const col = db.collection(COL)
  const action = event && event.action
  const openid = wxOpenid()
  try {
    if (action === 'create') {
      const id = createId()
      const row = {
        _id: id,
        id,
        title: String(event.title || '约').slice(0, 80),
        startDate: event.startDate,
        dayCount: Number(event.dayCount) || 7,
        startHour: Number(event.startHour) || 9,
        endHour: Number(event.endHour) || 21,
        slotMinutes: Number(event.slotMinutes) || 30,
        participants: [],
        createdAt: Date.now(),
      }
      await col.add({ data: row })
      return ok(row, openid)
    }
    if (action === 'get') {
      const id = String(event.id || '')
      if (!id)
        return { ok: false, error: 'not found' }
      const snap = await col.doc(id).get()
      const doc = snap.data
      if (!doc)
        return { ok: false, error: 'not found' }
      if (doc.createdAt && Date.now() - doc.createdAt > TTL_MS) {
        await col.doc(id).remove()
        return { ok: false, error: 'not found' }
      }
      return ok(doc, openid)
    }
    if (action === 'put') {
      const id = String(event.id || '')
      if (!openid)
        return { ok: false, error: 'no openid' }
      const snap = await col.doc(id).get()
      const doc = snap.data
      if (!doc)
        return { ok: false, error: 'not found' }
      const mine = {
        id: openid,
        name: String(event.name || '').trim() || '匿名',
        slots: Array.isArray(event.slots) ? event.slots.map(String) : [],
      }
      const list = [...(doc.participants || [])]
      const idx = list.findIndex(p => p && p.id === openid)
      if (idx >= 0)
        list[idx] = mine
      else
        list.push(mine)
      await col.doc(id).update({ data: { participants: list } })
      return ok({ ...doc, participants: list }, openid)
    }
    return { ok: false, error: 'unknown action' }
  }
  catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) }
  }
}
