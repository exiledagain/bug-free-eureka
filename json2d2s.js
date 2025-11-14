'use strict'

const fs = require('fs')
const path = require('path')

const { SaveFileWriter } = require('./d2s.js')
const { Diablo2Data, StringResolver } = require('./d2data.js')

class d2s {
  static classIds = {
    'ama': 0,
    'sor': 1,
    'nec': 2,
    'pal': 3,
    'bar': 4,
    'dru': 5,
    'ass': 6
  }

  constructor ({ d2data, resolver, json }) {
    this.d2data = d2data
    this.resolver = resolver
    this.json = json
    this.typeList = d2data.TypeList()
    this.costs = d2data.itemStatCost()
    this.skills = this.d2data.SkillData(this)
  }

  parse () {
    if (this.save) {
      return this.save
    }
    this.save = {}
    this.header()
    this.save.activeWeapon = '0x0'
    this.save.name = this.json.name
    this.save.status = '0x20',
    this.save.progression = '0xf',
    this.save.unknown1 = '0x0',
    this.save.classId = this.inferClassId().toString()
    this.save.unknown2 = '0x2110'
    this.save.level = this.json.stats[0][1]
    this.save.created = '0x0'
    this.save.lastPlayed = '0x0',
    this.save.unknown3 = '0xffffffff'
    this.save.assignedSkills = Array.from({ length: 16 }, () => '0xffff')
    this.save.leftSkill = '0x0',
    this.save.rightSkill = '0x0',
    this.save.leftSkillAlt = '0x0',
    this.save.rightSkillAlt = '0x0',
    this.save.appearance = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    this.save.location = '0x840000',
    this.save.mapId = '0x6abfc434'
    this.save.unknown4 = '0x0',
    this.save.mercenary = {
      dead: '0x0',
      id: '0x0',
      name: '0x0',
      type: '0x0',
      experience: '0x0'
    }
    this.save.realm = '0x0'
    this.save.quests = '0x80029ffd9ffd000c17899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c391011000100019ffd9ffd9ffd804a9ffd1001000100000000000000000000000080029ffd9ffd000417899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c791011000100019ffd9ffd9ffd804a9ffd1001000100000000000000000000000080029ffd9ffd000417899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c79100100000001101910151019804e101110010001012a00000006216f6f5700000000'
    this.save.waypoints = '0x7fffffffff010200000000000000000000000000000000007fffffffff010200000000000000000000000000000000007fffffffff01020050000000015357'
    this.save.dialog = '0x7e00000006c880002e00000000c880002400000000c88000ac00347701'
    this.save.attributes = {
      header: '0x6667',
      values: [
        {
          // strength
          id: '0x0',
          value: this.json.stats[3][1]
        },
        {
          // energy
          id: '0x1',
          value: this.json.stats[6][1]
        },
        {
          // dexterity
          id: '0x2',
          value: this.json.stats[4][1]
        },
        {
          // vitality
          id: '0x3',
          value: this.json.stats[5][1]
        },
        {
          // statpts
          id: '0x4',
          value: '0x0'
        },
        {
          // newskills
          id: '0x5',
          value: '0x0'
        },
        {
          // hitpoints
          id: '0x6',
          value: BigInt(this.json.stats[1][1]) * BigInt(256)
        },
        {
          // maxhp
          id: '0x7',
          value: BigInt(this.json.stats[1][1]) * BigInt(256)
        },
        {
          // mana
          id: '0x8',
          value: BigInt(this.json.stats[2][1]) * BigInt(256)
        },
        {
          // maxmana
          id: '0x9',
          value: BigInt(this.json.stats[2][1]) * BigInt(256)
        },
        {
          // stamina
          id: '0xA',
          value: BigInt(256 * 2048)
        },
        {
          // maxstamina
          id: '0xB',
          value: BigInt(256 * 2048)
        },
        {
          // level
          id: '0xC',
          value: this.json.stats[0][1]
        },
        {
          // experience
          id: '0xD',
          value: '1618470619'
        },
        {
          // goldbank
          id: '0xF',
          value: '0x64'
        },
      ]
    }
    this.save.skills = {
      header: '0x6669',
      list: Array.from({ length: 35 }, () => '0x0')
    }
    this.save.items = {
      header: '0x4d4a',
      list: []
    }
    this.save.corpses = {
      header: '0x4d4a',
      count: '0x0'
    }
    this.save.mercenaryItems = {
      header: '0x666a',
      items: {
        header: '0x4d4a',
        list: []
      }
    }
    return this.save
  }

  inferClassId () {
    for (let i = 7; i < this.json.stats.length; ++i) {
      const clazz = this.skills.get(this.json.stats[i][0])
      if (clazz) {
        return d2s.classIds[clazz.class]
      }
    }
    throw new Error('unknown class')
  }

  header () {
    this.save.header = {
      magic: '0xaa55aa55',
      version: '0x60'
    }
  }

  name () {
    this.parse()
    return this.save.name
  }

  buffer () {
    this.parse()
    const writer = new SaveFileWriter(this)
    return Buffer.from(writer.write(this.save))
  }
}

async function Main () {
  const version = Diablo2Data.defaultVersion

  const input = process.argv[2]
  const output = process.argv[3]

  global.fetch = async file => {
    return {
      ok: true,
      arrayBuffer: async () => fs.readFileSync(file).buffer,
      text: async () => fs.readFileSync(file, { encoding: 'ascii' }),
    }
  }
  const tables = [
    `data/${version}/global/excel/patchstring.tbl`,
    `data/${version}/global/excel/expansionstring.tbl`,
    `data/${version}/global/excel/string.tbl`,
  ]
  const resolver = new StringResolver(tables)
  await resolver.load()
  const d2data = new Diablo2Data(version)
  await d2data.load()
  const json = JSON.parse(fs.readFileSync(input))
  const save = new d2s({ d2data, resolver, json })
  fs.writeFileSync(`${path.join(output, save.name())}.d2s`, save.buffer())
  console.log(save.parse())
}

Main()
