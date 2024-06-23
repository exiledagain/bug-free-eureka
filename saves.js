'use strict'

const fs = require('fs')
const { SaveFileParser, SaveFileWriter } = require('./d2s.js')
const { DataFrame, TypeList, Diablo2Data, StatFormat, StringResolver } = require('./d2data.js')

async function Main () {
  const version = 's9'

  global.fetch = async file => {
    return {
      ok: true,
      arrayBuffer: async () => fs.readFileSync(file).buffer,
      text: async () => fs.readFileSync(file, { encoding: 'ascii' }),
    }
  }

  const typeList = new TypeList(...['Misc.txt', 'ItemTypes.txt', 'Weapons.txt', 'Armor.txt'].map(el => new DataFrame().parse(fs.readFileSync(`data/s9/global/excel/${el}`, { encoding: 'ascii' }))))
  const costs = new DataFrame().parse(fs.readFileSync('data/s9/global/excel/ItemStatCost.txt', { encoding: 'ascii' }))
  const tables = [
    `data/${version}/global/excel/patchstring.tbl`,
    `data/${version}/global/excel/expansionstring.tbl`,
    `data/${version}/global/excel/string.tbl`,
  ]
  const resolver = new StringResolver(tables)
  const d2data = new Diablo2Data(version)
  await resolver.load()
  await d2data.load()
  const format = new StatFormat(d2data, resolver)

  const base = process.argv[2]
  const first = process.argv[3]
  const second = process.argv[4]

  const raw = fs.readFileSync(`${base}/${first}.d2s`)
  const json = new SaveFileParser({ typeList, reader: raw, costs, format }).object()
  json.name = second
  json.status = 0x20
  const data = new SaveFileWriter({ typeList, costs }).write(json)

  fs.writeFileSync(`${base}/${second}.d2s`, Buffer.from(data))
  console.log(new SaveFileParser({ typeList, reader: fs.readFileSync(`${base}/${first}.d2s`), costs, format }).json())
}

Main()
