'use strict'

const fs = require('fs')
const { SaveFileWriter, SaveFileParser } = require('./d2s.js')
const { Diablo2Data, StringResolver } = require('./d2data.js')
const Parser = require('./antlr')

class Rejuvenator {
  static classCode2nameMap = {
    'ama': 'Amazon',
    'sor': 'Sorceress',
    'nec': 'Necromancer',
    'pal': 'Paladin',
    'bar': 'Barbarian',
    'dru': 'Druid',
    'ass': 'Assassin'
  }
  /**
   * @typedef {object} RejuvenatorArgs
   * @property {Diablo2Data} d2data
   * @property {StringResolver} resolver
   * @property {object} rip
   * @property {object} defaults
   */
  /**
   * 
   * @param {RejuvenatorArgs} args
   */
  constructor ({ rip, d2data, resolver, defaults, parser }) {
    this.rip = rip
    this.d2data = d2data
    this.resolver = resolver
    this.defaults = defaults
    this.parser = parser
    this.setup()
  }

  metaParse (prop) {
    const possible = [
      {
        regex: /\+\d+% Enhanced Damage$/i
      },
      {
        regex: /Repairs (.+?) Durability in (.+?) Seconds$/i
      },
      {
        regex: /Corrupted(?: \((\d+) Sockets)\)$/i
      },
      {
        regex: /Corrupt$/i
      },
      {
        regex: /(.+?) Deadly Strike (Based on Character Level)$/i
      },
      {
        regex: /Reanimate as: (.+?)$/i
      },
      {
        regex: /Adds (\d+)-(\d+)(?: (Cold|Fire|Lightning))? Damage$/i
      },
      {
        regex: /\+(.+?) to Life \(Based on Character Level\)$/i
      },
      {
        regex: /\+(.+?) Durability$/i
      },
      {
        regex: /\+(.+?) to Vitality \(Based on Character Level\)/i
      },
      {
        regex: /\+(.+?) to (.+?) Skills$/i
      },
      {
        regex: /(.+?)% Extra Gold from Monsters \(Based on Character Level\)$/i
      },
      {
        regex: /(.+?)% Better Chance of Getting Magic Items \(Based on Character Level\)$/i
      },
      {
        regex: /(.+?)% Deadly Strike \(Based on Character Level\)$/i
      },
      {
        regex: /undefined$/i
      }
    ]
    return possible.find(e => {
      if (e.regex.test(prop.trim())) {
        return e
      }
      return false
    })
  }

  setup () {
    const name = this.rip.name
    const level = Number(this.rip.stats[0][1])
    const strength = Number(this.rip.stats[3][1])
    const dexterity = Number(this.rip.stats[4][1])
    const vitality = Number(this.rip.stats[5][1])
    const energy = Number(this.rip.stats[6][1])
    const clazz = this.determineClass()

    const { maxhp, maxmana, maxstamina, experience, statpts, newskills } = this.determineBaseStats(clazz, level, vitality, energy, strength, dexterity)

    const object = structuredClone(this.defaults)
    object.name = name
    object.lastPlayed = 0
    object.level = level
    object.classId = Object.keys(Rejuvenator.classCode2nameMap).indexOf(clazz)
    object.mapId = 666

    const attributes = {
      level,
      strength,
      dexterity,
      vitality,
      energy,
      maxhp,
      maxmana,
      maxstamina,
      experience,
      newskills,
      statpts,
      gold: 5e6,
      goldbank: 5e6
    }
    const pairedAttributes = {
      'maxhp': 'hitpoints',
      'maxmana': 'mana',
      'maxstamina': 'stamina',
    }
    const itemStatCost = this.d2data.itemStatCost()
    for (const [name, value] of Object.entries(attributes)) {
      const statEntry = itemStatCost.first('Stat', name)
      object.attributes.values.push({
        id: statEntry.ID,
        value: value << Number(statEntry.ValShift)
      })
      if (pairedAttributes[name]) {
        const pairEntry = itemStatCost.first('Stat', pairedAttributes[name])
        object.attributes.values.push({
          id: pairEntry.ID,
          value: value << Number(pairEntry.ValShift)
        })
      }
    }

    this.mercenary(level, object)

    // this.rip.equipment.forEach(parseProps)
    // this.rip.swap.forEach(parseProps)
    // this.rip.mercenary.equipment.forEach(parseProps)

    this.getItem(this.rip.equipment[0])

    this.name = name
    this.rejuvenatedObject = object
  }

  getItemRarity (json) {
    if (json.type.startsWith('Unique')) {
      return SaveFileParser.ItemQuality.unique
    }
    if (json.type.startsWith('Set')) {
      return SaveFileParser.ItemQuality.set
    }
    if (json.type.startsWith('Superior')) {
      return SaveFileParser.ItemQuality.superior
    }
    if (json.type.startsWith('Normal')) {
      return SaveFileParser.ItemQuality.normal
    }
    if (json.type.startsWith('Low Quality')) {
      return SaveFileParser.ItemQuality.inferior
    }
    if (json.type.startsWith('Magic')) {
      return SaveFileParser.ItemQuality.magic
    }
    if (json.type.startsWith('Rare')) {
      return SaveFileParser.ItemQuality.rare
    }
    if (json.type.startsWith('Crafted')) {
      return SaveFileParser.ItemQuality.rare
    }
  }

  getItem (json) {
    const rarity = this.getItemRarity(json)
  }

  parseProps (props) {
    const parseProp = prop => {
      const parsed = this.parser(prop.toLowerCase())
      if (parsed) {
        console.log(parsed)
        return parsed
      }
      const metaParsed = this.metaParse(prop)
      if (!metaParsed) {
        throw new Error(`unable to parse prop: ${prop}`)
      }
      return metaParsed
    }
    return props.map(parseProp)
  }

  mercenary (level, object) {
    const list = this.d2data.hireling().filter(r => {
      return r.Difficulty === '3' && r.Version === '100'
    })
    const type = this.rip.mercenary.stats[0].substring('Type: '.length)
    const potential = list.filter(r => {
      const key = `MercDesc${r.HireDesc}`.padEnd(12, ' ')
      const parts = this.resolver.get(key).split(' ')
      if (type.includes('Arrow')) {
        return parts.includes('Arrow') && parts.includes(type.split(' ', 1)[0])
      }
      return parts.some(p => type.includes(p))
    })
    if (potential.values.length !== 1) {
      return
    }
    const entry = potential.combineFromIndex(0)
    object.mercenary.id = 0x666
    object.mercenary.name = 0x0
    object.mercenary.type = entry.Id
    object.mercenary.experience = level * level * (level + 1) * entry['Exp/Lvl']
  }

  determineClass () {
    const skills = this.rip.stats.slice(7)
    if (skills.length === 0) {
      throw new Error('cannot infer class from skills')
    }
    const name2skillMap = {}
    this.d2data.skills().each(e => {
      if (e.charclass.length <= 0) {
        return
      }
      const desc = this.d2data.skillDesc().first('skilldesc', e.skilldesc)
      if (!desc) {
        return
      }
      const name = this.resolver.readable(desc['str name'])
      name2skillMap[name] = e
      name2skillMap[e.skill] = e
    })
    const classes = {}
    for (const [skill] of skills) {
      if (!name2skillMap[skill]) {
        throw new Error(`unknown skill: ${skill}`)
      }
      classes[name2skillMap[skill].charclass] = true
    }
    const keys = Object.keys(classes)
    if (keys.length > 1) {
      throw new Error('cannot determine class from provided skills')
    }
    return keys[0]
  }

  determineBaseStats (classCode, level, vitality, energy, strength, dexterity) {
    const clazz = Rejuvenator.classCode2nameMap[classCode]
    const entry = this.d2data.charStats().first('class', clazz)

    const hp1 = Number(entry.vit) + Number(entry.hpadd)
    const hpL = (level - 1) * entry.LifePerLevel / 4 + entry.LifePerVitality / 4 * (vitality - entry.vit)
    const maxhp = hp1 + hpL + 60

    const mp1 = Number(entry.int)
    const mpL = (level - 1) * entry.ManaPerLevel / 4 + entry.ManaPerMagic / 4 * (energy - entry.int)
    const maxmana = mp1 + mpL

    const stamina1 = Number(entry.stamina)
    const staminaL = (level - 1) * entry.StaminaPerLevel / 4 + entry.StaminaPerVitality / 4 * (vitality - entry.vit)
    const maxstamina = stamina1 + staminaL

    const experience = Number(this.d2data.experience().first('Level', (level - 1).toString())['Amazon'])

    // tome quest x3
    const statpts = (level - 1) * entry.StatPerLevel + 15 - (strength + dexterity + vitality + energy - entry.tot)

    // act skills x3
    const newskills = (level - 1) + 12

    return {
      maxhp,
      maxmana,
      maxstamina,
      experience,
      statpts,
      newskills
    }
  }

  object () {
    return this.rejuvenatedObject
  }
}

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
  const rejuv = new Rejuvenator({ rip, d2data, resolver, defaults: structuredClone(SaveFileWriter.defaults), parser: Parser.default })
  const data = new SaveFileWriter({ typeList, costs }).write(rejuv.object())
  const saveFileName = `${rejuv.name}.d2s`
  fs.writeFileSync(saveFileName, Buffer.from(data))
}

Main()
