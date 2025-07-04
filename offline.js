'use strict'

const fs = require('fs')

const {
  Diablo2Data,
  TreasureTree,
  D2Random
} = require('./d2data.js')

const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require('worker_threads')

const { ChestDropper } = require('./chest.js')

global.TreasureTree = TreasureTree
global.Diablo2Data = Diablo2Data
global.D2Random = D2Random

function printBestRouteFromZero (histogram, p = 0) {
  const keys = Object.keys(histogram)
  keys.sort((a, b) => Number(a) - Number(b))
  let best = 0
  let res = []
  for (const k of keys) {
    const val = Number((histogram[k][0] || 0) + (histogram[k][1] > 0 ? histogram[k][1] * p : 0))
    if (best <= val) {
      best = val
      res.push([k, val])
    }
  }
  console.log(res)
}

async function Main () {
  const dropper = new ChestDropper()
  await dropper.setup()

  const treasureClasses = ['Act 2 (H) Chest B']
  const levels = [79]

  const queries = []

  for (const treasureClass of treasureClasses) {
    const chestDropLevel = treasureClass.at(-1).charCodeAt(0) - 'A'.charCodeAt(0)
    for (const itemLevel of levels) {
      for (let locked = 0; locked <= 1; ++locked) {
        for (let dc = 1; dc <= 1; ++dc) {
          for (let mf = 0; mf <= 300; ++mf) {
            queries.push({ treasureClass, itemLevel, chestDropLevel, locked, magicFind: mf, dropClass: dc })
          }
        }
      }
    }
  }

  let n = 16
  let step = ~~(queries.length / n)

  let childData = []

  for (let i = 0; i < n - 1; ++i) {
    childData.push(queries.slice(i * step, (i + 1) * step))
  }

  childData.push(queries.slice((n - 1) * step))

  let best = 0

  console.log('[')
  let messages = 0
  let rem = n
  const histogram = {}
  for (let i = 0; i < n; ++i) {
    const worker = new Worker(__filename, {
      workerData: JSON.stringify({
        queries: childData[i]
      })
    })
    worker.addListener('message', message => {
      histogram[message.query.magicFind] = histogram[message.query.magicFind] || []
      histogram[message.query.magicFind][message.query.locked] = message.value
      if (message.value >= best) {
        best = message.value
        console.error(message)
      }
      if (message.value) {
        return
      }
      if (messages > 0) {
        console.log(',')
      }
      console.log(JSON.stringify(message, null, 2))
      messages += 1
    })
    worker.addListener('exit', code => {
      rem -= 1
      if (rem === 0) {
        console.log(']')
        console.log(histogram)
        printBestRouteFromZero(histogram, .15)
      }
    })
  }
}

async function Child () {
  const { queries } = JSON.parse(workerData)
  const valuesChart = {
    'r01s': 0,
    'r02s': 0,
    'r03s': 0,
    'r04s': 0,
    'r05s': 0,
    'r06s': 0,
    'r07s': 0,
    'r08s': 0,
    'r09s': 0,
    'r10s': 0,
    'r11s': 0,
    'r12s': 0,
    'r13s': 0,
    'r14s': 0,
    'r15s': 0,
    'r16s': 0,
    'r17s': 0,
    'r18s': 0,
    'r19s': 0,
    'r20s': 0.025 / 3,
    'r21s': 0.025,
    'r22s': 0.05,
    'r23s': 0.1,
    'r24s': 0.15,
    'r25s': 0.25,
    'r26s': 0.5,
    'r27s': 1,
    'r28s': 1,
    'r29s': 1.5,
    'r30s': 3,
    'r31s': 1.25,
    'r32s': 2.5,
    'r33s': 5
  }
  const valuesSpecific = {
    // 'r28s': 1,
    // 'r27s': 1,
    // 'r33s': 1,
    // uar: { rarity: 'unique', value: 1 }
    r33s: 1,
    r29s: 1,
  }
  const values = valuesChart
  const filter1 = res => {
    return res.some(el => el.id === 'rin' && el.rarity === 'unique')
  }
  const filter2 = res => {
    return res.some(el => el.id === 'r30s')
  }
  const filter = filter1
  const evaluate = res => {
    return res.reduce((sum, el) => {
      let res = 0
      if (typeof values[el.id] === 'number') {
        res = values[el.id]
      } else if (values[el.id]) {
        if (values[el.id].rarity === el.rarity) {
          res = values[el.id].value
        }
      }
      return sum + res
    }, 0)
  }
  const evalValue = true
  const dropper = new ChestDropper()
  await dropper.setup()
  const sparklyMults = [
    .02,
    .04,
    .06,
    .2,
    .3,
    .38
  ]
  queries.forEach(query => {
    let sum = 0
    for (let type = 0; type <= 0; ++type) {
      for (let seed = 0; seed < (1 << 16) - 2; ++seed) {
        // for sparkly
        // query.locked = type
        query.seed = seed
        const res = dropper.simulateRegular(query)
        // const res = dropper.simulateSuper(query)
        if (evalValue) {
          const e = evaluate(res)
          // const e = evaluate(res) * sparklyMults[type]
          sum += e
          continue
        }
        if (filter(res)) {
          // parentPort.postMessage({
          //   query,
          //   drops: res,
          // })
          // sum += 1
        }
      }
    }
    if (sum > 0) {
      // query.locked = 0
      parentPort.postMessage({
        query,
        value: sum
      })
    }
  })
}

global.fetch = async file => {
  return {
    ok: true,
    arrayBuffer: async () => fs.readFileSync(file).buffer,
    text: async () => fs.readFileSync(file, { encoding: 'ascii' }),
  }
}

if (isMainThread) {
  Main()
} else {
  Child()
}
