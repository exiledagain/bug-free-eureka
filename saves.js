'use strict'

const fs = require('fs')
const { SaveFileParser, SaveFileWriter } = require('./d2s.js')
const { Diablo2Data, StatFormat } = require('./d2data.js')

async function Main () {
  const version = Diablo2Data.defaultVersion

  global.fetch = async file => {
    return {
      ok: true,
      arrayBuffer: async () => fs.readFileSync(file).buffer,
      text: async () => fs.readFileSync(file, { encoding: 'ascii' }),
    }
  }

  const d2data = new Diablo2Data(version)
  await d2data.load()

  const resolver = await d2data.StringResolver()
  const typeList = d2data.TypeList()
  const costs = d2data.itemStatCost()
  const format = new StatFormat(d2data, resolver)

  const base = process.argv[2]
  const first = process.argv[3]
  const second = process.argv[4]

  const firstFileName = `${base}/${first}.d2s`
  const secondFileName = `${base}/${second}.d2s`

  const raw = fs.readFileSync(firstFileName)
  const firstParser = new SaveFileParser({ typeList, reader: raw, costs, format })
  const json = firstParser.json()
  fs.writeFileSync('dumpfirst.json', json)
  const saveObj = firstParser.object()
  saveObj.name = second
  saveObj.items.list.forEach(item => {
    if (item.compact.code === '0x73303172') {
      item.compact.flags = 0
    }
  })

  const data = new SaveFileWriter({ typeList, costs }).write(saveObj)

  fs.writeFileSync(secondFileName, Buffer.from(data))
  fs.writeFileSync('dumpsecond.json', new SaveFileParser({ typeList, reader: data, costs, format }).json())
}

Main()
