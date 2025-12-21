const dotenv = require('dotenv')
const express = require('express')
const fs = require('fs')
const https = require('https')

const WaitMs = ms => new Promise(resolve => setTimeout(resolve, ms))

class Lock {
  constructor () {
    this._locked = false
    this._queue = []
  }

  async acquire () {
    if (!this._locked) {
      this._locked = true
      return
    }

    let resolver
    const promise = new Promise(resolve => {
      resolver = resolve
    })
    this._queue.push(resolver)
    return await promise
  }

  release () {
    if (this._queue.length > 0) {
      const resolver = this._queue.shift()
      resolver()
    } else {
      this._locked = false
    }
  }
}

dotenv.config({ quiet: true })

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

https.createServer({
  key: fs.readFileSync(process.env.ep_cs_key),
  cert: fs.readFileSync(process.env.ep_cs_cert)
}, app).listen(8443)

const AllowCors = (_, res) => {
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  res.setHeader('Allow', 'OPTIONS, POST')
  res.setHeader('Vary', 'Origin')
  res.end()
}

app.options('/export', AllowCors)

const lock = new Lock()

app.post('/export', async (req, res) => {
  console.log(`/export at ${new Date().toLocaleString()}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  const payload = req.body
  let data
  try {
    data = payload.name
    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('bad req name')
    }
    data = data.trim()
    const isCharNameish = !(data.length > 16 || !data.match(/^[\da-z_\-]+$/i))
    const isSnapshotish = !(data.length !== 24 || !data.match(/^[\da-z]{24}]$/i))
    if (!isCharNameish && !isSnapshotish) {
      throw new Error('bad req name')
    }
  } catch (e) {
    console.error(e)
    res.statusCode = 400
    res.end('Your data could not be parsed.')
    return
  }
  try {
    await lock.acquire()
    if (res.closed) {
      res.end('Nothing to do here.')
      return
    }
    const req = await fetch(`https://api.projectdiablo2.com/game/character/${data}`)
    const ret = await req.text()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    if (typeof ret === 'string') {
      res.end(ret)
      return
    }
    throw new Error('?')
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.end('We tried and failed.')
  } finally {
    // rate limit :ez:
    await WaitMs(1000)
    lock.release()
  }
})
