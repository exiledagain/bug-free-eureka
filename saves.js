const fs = require('fs')
const { SaveFileParser, BitReader, BitWriter } = require('./d2s.js')
const { DataFrame, TypeList } = require('./d2data.js')

const typeList = new TypeList(...['Misc.txt', 'ItemTypes.txt', 'Weapons.txt', 'Armor.txt'].map(el => new DataFrame().parse(fs.readFileSync(`data/s9/global/excel/${el}`, { encoding: 'ascii' }))))
const costs = new DataFrame().parse(fs.readFileSync('data/s9/global/excel/ItemStatCost.txt', { encoding: 'ascii' }))

console.log(new SaveFileParser(typeList, new BitReader(fs.readFileSync(process.argv[2])), costs).json())
