const fs = require('fs')
const { SaveFileParser, SaveFileWriter } = require('./d2s.js')
const { DataFrame, TypeList } = require('./d2data.js')

const typeList = new TypeList(...['Misc.txt', 'ItemTypes.txt', 'Weapons.txt', 'Armor.txt'].map(el => new DataFrame().parse(fs.readFileSync(`data/s9/global/excel/${el}`, { encoding: 'ascii' }))))
const costs = new DataFrame().parse(fs.readFileSync('data/s9/global/excel/ItemStatCost.txt', { encoding: 'ascii' }))

const base = process.argv[2]
const first = process.argv[3]
const second = process.argv[4]

const raw = fs.readFileSync(`${base}/${first}.d2s`)
console.log(raw.length.toString(16))
console.log(new SaveFileWriter().checksum(raw).toString(16))
const json = new SaveFileParser(typeList, raw, costs).object()
json.name = second
json.status = 0x20
const data = new SaveFileWriter(typeList, costs).write(json)

console.log(new SaveFileParser(typeList, raw, costs).json())

for (let i = 0; i < data.length; ++i) {
  if (data[i] !== raw[i]) {
    // console.log(i)
    // console.log(Buffer.from(data).slice(i - 8, i + 16))
    // console.log(raw.slice(i - 8, i + 16))
    // process.exit(-1)
  }
}

console.log(Buffer.from(data).slice(0, 16))

fs.writeFileSync(`${base}/${second}.d2s`, Buffer.from(data))
console.log(new SaveFileParser(typeList, fs.readFileSync(`${base}/${second}.d2s`), costs).json())
