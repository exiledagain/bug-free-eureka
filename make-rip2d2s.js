'use strict'

const fs = require('fs')
const { SaveFileWriter, SaveFileParser } = require('./d2s.js')
const { Diablo2Data, PropertiesConverter, ItemProperty } = require('./d2data.js')
const Parser = require('./antlr')

global.SaveFileParser = SaveFileParser
global.PropertiesConverter = PropertiesConverter
global.ItemProperty = ItemProperty

const { Rejuvenator } = require('./rip2d2s.js')

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

  const rip = JSON.parse(fs.readFileSync('rip.json'))
  rip.name = 'rejuved'
  const rejuv = new Rejuvenator({ rip, d2data, resolver, defaults: structuredClone(SaveFileWriter.defaults), parser: Parser.default })
  const data = new SaveFileWriter({ typeList, costs, addSaveAdd: true }).write(rejuv.object())
  const saveFileName = `${rejuv.name}.d2s`
  fs.writeFileSync(saveFileName, Buffer.from(data))

  const sfr = new SaveFileParser({ typeList, reader: fs.readFileSync(saveFileName), costs })
  sfr.read()
  fs.writeFileSync('rejuved.json', sfr.json())
}

Main()
