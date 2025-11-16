'use strict'

const { SaveFileParser } = require("./d2s")

class ItemProperty {
  constructor ({ id, value, param }) {
    this.id = Number(id)
    if (!Number.isFinite(this.id)) {
      throw new Error(`bad item prop id=${id}`)
    }
    this.value = Number(value)
    if (!Number.isFinite(this.value)) {
      throw new Error(`bad item value id=${id} value=${value}`)
    }
    this.param = Number(param)
    if (!Number.isFinite(this.param)) {
      this.param = null
    }
  }
}

class PropertyParser {
  /**
   * 
   * @param {Diablo2Data} d2data 
   */
  constructor ({ d2data, resolver, defaults, parser }) {
    this.d2data = d2data
    this.resolver = resolver
    this.defaults = defaults
    this.parser = parser
    this.itemStatCost = this.d2data.itemStatCost()
    this.setup()
  }

  setup () {
    const skillDesc = this.d2data.skillDesc()
    // this will use the first skill in Skills.txt
    this.skillNameToSkillEntryMap = Object.fromEntries(this.d2data.skills().map(skill => {
      if (skill.skilldesc.length === 0) {
        return undefined
      }
      // block temps
      if (skill.Id !== '0' && skill.Id !== '5' && skill.srvstfunc === '1' && skill.srvdofunc === '1') {
        return undefined
      }
      const desc = skillDesc.first('skilldesc', skill.skilldesc)
      if (!desc) {
        return undefined
      }
      return [this.resolver.readable(desc['str name']).toLowerCase(), skill]
    }).filter(i => i).reverse())
    this.classNameToClassEntry = Object.fromEntries(this.d2data.charStats().map(e => {
      if (e['class'] === 'Expansion') {
        return undefined
      }
      return [this.resolver.readable(e['class']).toLowerCase(), e]
    }).filter(i => i))
    this.descriptionGroupToStatEntry = {}
    this.itemStatCost.reduce((map, e) => {
      if (e.dgrp.length === 0) {
        return map
      }
      const gid = `dgrp${e.dgrp}`
      map[gid] = map[gid] || []
      map[gid].push(e)
      return map
    }, this.descriptionGroupToStatEntry)
    this.skillTabFormatToClassEntry = Object.fromEntries(this.d2data.charStats().map(e => {
      if (e['class'] === 'Expansion') {
        return undefined
      }
      const res = []
      for (let i = 1; i <= 3; ++i) {
        let tabStr = this.resolver.readable(e[`StrSkillTab${i}`]).toLowerCase()
        res.push([ tabStr + ' ' + this.resolver.readable(e.StrClassOnly).toLowerCase(), { entry: e, index: i } ])
        if (tabStr.indexOf('skills') < 0) {
          tabStr += ' skills'
          res.push([ tabStr + ' ' + this.resolver.readable(e.StrClassOnly).toLowerCase(), { entry: e, index: i } ])
        }
      }
      return res
    }).filter(i => i).flat())
  }

  /**
   * 
   * @param {string} string 
   * @returns {ItemProperty}
   */
  parse (string) {
    const res = this.parseProp(string)
    if (res instanceof Array) {
      res.forEach(e => {
        if (!(e instanceof ItemProperty)) {
          console.error(res)
          throw new Error(`wrong prop type for ${string}`)
        }
      })
    } else if (!(res instanceof ItemProperty)) {
      console.error(res)
      throw new Error(`wrong prop type for ${string}`)
    }
    return res
  }

  parseProp (prop) {
    const parsed = this.parser(prop.toLowerCase())
    if (parsed) {
      parsed.original = prop
      if (this.descriptionGroupToStatEntry[parsed.name]) {
        return this.descriptionGroupToStatEntry[parsed.name].map(e => {
          const pseudo = structuredClone(parsed)
          pseudo.name = e.Stat
          return this.fromRegularParse(pseudo)
        })
      }
      return this.fromRegularParse(parsed)
    }
    const metaParsed = this.metaParse(prop)
    if (!metaParsed) {
      throw new Error(`unable to parse prop: ${prop}`)
    }
    if (!metaParsed.reviver) {
      throw new Error(`no reviver for ${prop}`)
    }
    return metaParsed.reviver(metaParsed.match)
  }

  metaParse (prop) {
    const possible = [
      {
        regex: /\+(\d+)% Enhanced Damage$/i,
        reviver: match => {
          const min = this.d2data.itemStatCost().first('Stat', 'item_mindamage_percent')
          const max = this.d2data.itemStatCost().first('Stat', 'item_maxdamage_percent')
          const value = Number(match[1])
          return [
            new ItemProperty({ id: min.ID, value }),
            new ItemProperty({ id: max.ID, value })
          ]
        }
      },
      {
        regex: /Repairs (.+?) Durability in (.+?) Seconds$/i,
        reviver: _ => {
          const corrupted = this.d2data.itemStatCost().first('Stat', 'corrupted')
          const rep = this.d2data.itemStatCost().first('Stat', 'item_replenish_durability')
          // accurate enough for the trade site as rep is always good enough to repair gear
          return [
            new ItemProperty({ id: rep.ID, value: 25 }),            
            new ItemProperty({ id: corrupted.ID, value: 1 })
          ]
        }
      },
      {
        regex: /Corrupted(?: \((\d+) Sockets)\)$/i,
        reviver: match => {
          const corrupted = this.d2data.itemStatCost().first('Stat', 'corrupted')
          return [
            new ItemProperty({ id: corrupted.ID, value: 1 })
          ]
        }
      },
      {
        regex: /Corrupt$/i,
        reviver: _ => {
          const corrupted = this.d2data.itemStatCost().first('Stat', 'corrupted')
          return [
            new ItemProperty({ id: corrupted.ID, value: 1 })
          ]
        }
      },
      {
        regex: /(.+?)%? Deadly Strike \(Based on Character Level\)$/i,
        reviver: match => {
          const value = ~~(Number(match[1]) * 8)
          if (value <= 0) {
            throw new Error('deadly/lvl should be positive')
          }
          const deadlyPerLevel = this.d2data.itemStatCost().first('Stat', 'item_deadlystrike_perlevel')
          return [
            new ItemProperty({ id: deadlyPerLevel.ID, value })
          ]
        }
      },
      {
        regex: /Reanimate as: (.+?)$/i,
        reviver: match => {
          const reanimate = this.d2data.itemStatCost().first('Stat', 'item_reanimate')
          const value = Number(match[1])
          return [
            new ItemProperty({ id: reanimate.ID, value })
          ]
        }
      },
      {
        regex: /Adds (\d+)-(\d+)(?: (Cold|Fire|Lightning|Magic))? Damage$/i,
        reviver: match => {
          if (match.length < 4) {
            throw new Error('did not expect physical damage')
          }
          const type = match[3].substring(0, 5).toLowerCase()
          const min = this.d2data.itemStatCost().first('Stat', `${type}mindam`)
          const max = this.d2data.itemStatCost().first('Stat', `${type}maxdam`)
          const minValue = Number(match[1])
          const maxValue = Number(match[2])
          const res = [
            new ItemProperty({ id: min.ID, value: minValue }),
            new ItemProperty({ id: max.ID, value: maxValue })
          ]
          if (type === 'cold') {
            const coldlength = this.d2data.itemStatCost().first('Stat', 'coldlength')
            res.push(new ItemProperty({
              // small but present value
              id: coldlength.ID, value: 50
            }))
          }
          return res
        }
      },
      {
        regex: /\+(.+?) to Life \(Based on Character Level\)$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_hp_perlevel')
          const value = ~~(Number(match[1]) * 8)
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(.+?) Durability$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'maxdurability')
          const value = Number(match[1])
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(.+?) to (Vitality|Strength|Dexterity|Energy) \(Based on Character Level\)$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', `item_${match[2].toLowerCase()}_perlevel`)
          const value = ~~(Number(match[1]) * 8)
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(.+?) to (.+?) Skills$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_addclassskills')
          const value = Number(match[1])
          const clazzName = match[2].toLowerCase()
          const param = Object.keys(this.classNameToClassEntry).findIndex(e => e.toLowerCase() === clazzName)
          return [
            new ItemProperty({ id: stat.ID, value, param })
          ]
        }
      },
      {
        regex: /(.+?)% Extra Gold from Monsters \(Based on Character Level\)$/i,
        reviver: match => {
          const value = ~~(Number(match[1]) * 8)
          if (value <= 0) {
            throw new Error('gf/lvl should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_find_gold_perlevel')
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /(.+?)% Better Chance of Getting Magic Items \(Based on Character Level\)$/i,
        reviver: match => {
          const value = ~~(Number(match[1]) * 8)
          if (value <= 0) {
            throw new Error('mf/lvl should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_find_magic_perlevel')
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /(\d+) poison damage over (\d+) seconds/i,
        reviver: match => {
          const lenthValue = Number(match[2])
          // poison damage isn't adjusted
          // const value = Math.ceil(((Number(match[1]) * 256) - 128) / lenthValue)
          const value = Number(match[1])
          if (value <= 0 || lenthValue <= 0) {
            throw new Error('poison stats should be positive')
          }
          const min = this.d2data.itemStatCost().first('Stat', 'poisonmindam')
          const max = this.d2data.itemStatCost().first('Stat', 'poisonmaxdam')
          const len = this.d2data.itemStatCost().first('Stat', 'poisonlength')
          return [
            new ItemProperty({ id: min.ID, value }),
            new ItemProperty({ id: max.ID, value }),
            new ItemProperty({ id: len.ID, value: lenthValue })
          ]
        }
      },
      {
        regex: /Attacker Takes Damage of (.+?) \(Based on Character Level\)/i,
        reviver: match => {
          const value = ~~(Number(match[1]) * 8)
          if (value <= 0) {
            throw new Error('thorns/lvl should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_thorns_perlevel')
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(\d+) to (Claw Mastery|Blade Dance|Enchant) \((Assassin|Sorceress) Only\)/i,
        reviver: match => {
          const skillName = match[2]
          const param = this.d2data.skills().first('skill', skillName).Id
          const value = Number(match[1])
          if (value <= 0) {
            throw new Error('skill level should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_singleskill')
          return [
            new ItemProperty({ id: stat.ID, value, param })
          ]
        }
      },
      {
        regex: /Level (\d+) (Blade Shield SelfAura) When Equipped/i,
        reviver: match => {
          const skillName = match[2]
          const param = this.d2data.skills().first('skill', skillName).Id
          const value = Number(match[1])
          if (value <= 0) {
            throw new Error('undead%/lvl should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_skillonequip')
          return [
            new ItemProperty({ id: stat.ID, value, param })
          ]
        }
      },
      {
        regex: /\+(.+)% Damage to Undead \(Based on Character Level\)/i,
        reviver: match => {
          const value = ~~(Number(match[1]) * 8)
          if (value <= 0) {
            throw new Error('undead%/lvl should be positive')
          }
          const stat = this.d2data.itemStatCost().first('Stat', 'item_damage_undead_perlevel')
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        // ?
        regex: /undefined$/i
      }
    ]
    for (const e of possible) {
      const match = e.regex.exec(prop.trim())
      if (match) {
        const res = Object.assign({}, e)
        res.type = e
        res.match = match
        return res
      }
    }
  }

  /**
   * 
   * @param {string} parsed 
   * @returns {ItemProperty}
   */
  fromRegularParse (parsed) {
    const entry = this.itemStatCost.first('Stat', parsed.name)
    const id = Number(entry.ID)
    switch (Number(entry.descfunc)) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 12: {
        if (entry.descfunc !== '3' && !parsed.percentages) {
          throw new Error(`expected value for ${parsed.name}`)
        }
        let value = parsed.percentages[0]?.value
        if (entry.descfunc === '3' && entry.descval === '0') {
          value = 1
        } else if (entry.descfunc === '12') {
          value = 1
        }
        // maxdamage, secondary_maxdamage, item_throw_maxdamage
        if (typeof value !== 'number') {
          throw new Error(`expected value for ${parsed.name}`)
        }
        if (Number(entry['op param']) > 0) {
          value <<= Number(entry['op param'])
        }
        return new ItemProperty({ id, value })
      }
      case 11: {
        // we can assume there's no rep-quant in pd2
        const value = Math.floor(2500 / ((parsed.percentages[0].value * 25) - 12))
        return new ItemProperty({ id, value })
      }
      case 13: {
        throw e
      }
      case 14: {
        const target = parsed.original.toLowerCase().trim()
        for (const [format, { index }] of Object.entries(this.skillTabFormatToClassEntry)) {
          const string = format.replace('%d', parsed.percentages[0].value)
          if (string === target) {
            const clazz = Object.keys(this.classNameToClassEntry).indexOf(parsed.strings[0])
            const value = parsed.percentages[0].value
            const param = (clazz << 3) | ((index - 1) & 0x3)
            return new ItemProperty({ id, value, param })
          }
        }
        throw new Error(`unknown description 14 for "${parsed.original}"`)
      }
      case 15: {
        const skill = this.skillNameToSkillEntryMap[parsed.strings[0]]
        const skillId = Number(skill.Id)
        const skillLevel = parsed.percentages[1].value
        const param = (skillId << 6) | (skillLevel & 0x3F)
        const value = parsed.percentages[0].value
        return new ItemProperty({ id, value, param })
      }
      case 16: {
        const skill = this.skillNameToSkillEntryMap[parsed.strings[0]]
        const param = skill.Id
        const value = parsed.percentages[0].value
        return new ItemProperty({ id, value, param })
      }
      case 20: {
        let shiftedId = id
        if (id === 305) {
          shiftedId = 335
        } else if (id === 306) {
          shiftedId = 333
        } else if (id === 307) {
          shiftedId = 334
        } else if (id === 308) {
          shiftedId = 336
        }
        const value = Math.abs(parsed.percentages[0].value)
        return new ItemProperty({ id: shiftedId, value })
      }
      case 24: {
        const skill = this.skillNameToSkillEntryMap[parsed.strings[0]]
        const skillId = Number(skill.Id)
        const skillLevel = parsed.percentages[0].value
        const a = parsed.percentages[1].value
        const b = parsed.percentages[2].value
        const value = (b << 8) | (a & 0xFF)
        const param = (skillId << 6) | (skillLevel & 0x3F)
        console.log(a, b, skillId, skillLevel, value, param)
        return new ItemProperty({ id, value, param })
      }
      case 27: {
        const skill = this.skillNameToSkillEntryMap[parsed.strings[0]]
        if (skill.charclass.length === 0) {
          throw new Error(`exepcted class req for ${parsed.original}`)
        }
        const value = parsed.percentages[0].value
        const param = Number(skill.Id)
        return new ItemProperty({ id, value, param })
      }
      case 28: {
        const skill = this.skillNameToSkillEntryMap[parsed.strings[0]]
        const param = skill.Id
        const value = parsed.percentages[0].value
        return new ItemProperty({ id, value, param })
      }
      default: {
        console.error(parsed)
        throw new Error(`unknown stat: ${entry.Stat}`)
      }
    }
  }
}

class ItemRejuvenated {
  constructor ({ raw, propertyParser, typeList }) {
    this.raw = raw
    this.propertyParser = propertyParser
    this.typeList = typeList
    const isJewel = raw.name.includes(' Jewel ')
    const isRune = raw.name.endsWith(' Rune')
    this.rarity = raw.type.startsWith('Low') ? 'Low Quality' : raw.type.split(' ', 1)[0].toLowerCase()
    const socketsIndex = raw.type.endsWith(')') ? raw.type.length - 4 : raw.type.length
    this.base = raw.type.substring(this.rarity.length + 1, socketsIndex)
    if (isRune) {
      this.rarity = 'normal'
      this.base = raw.name
    }
    if (isJewel) {
      this.rarity = 'magic'
      this.base = 'Jewel'
    }
    if (this.rarity.startsWith('L')) {
      this.rarity = 'inferior'
    }
    this.sockets = []
    this.socketCount = 0
    this.ethereal = raw.name.startsWith('(')
    this.name = raw.name.substring(this.ethereal ? raw.name.indexOf(')') + 2 : 0)
    if (raw.type.endsWith(')')) {
      this.socketCount = Number(raw.type.at(-2))
      this.sockets = raw.sockets.map(jew => {
        jew.type = jew.name.includes('Jewel') ? 'Jewel' : jew.name
        return new ItemRejuvenated({ raw: jew, propertyParser, typeList })
      })
    }
    this.props = this.parseProps(raw.props)
    console.log(this.props)
    this.props.forEach(prop => {
      if (prop.id === 360 || prop.id === 206) {
        prop.param = 0
      }
    })
    if (this.sockets.length > 0) {
      this.adjustForSockets()
    }
    this.merge()
  }

  merge () {
    // some damage types have to be merged after flatten
    this.props.sort((a, b) => {
      return a.id - b.id
    })
    const props = []
    // todo: don't ignore missing siblings/orphans
    for (let i = 0; i < this.props.length; ++i) {
      const id = this.props[i].id
      if (id === 55 || id === 56 || id === 58 || id === 59) {
        // these values should've been skipped
        console.error('ignored.')
        continue
      }
      props.push([])
      props.at(-1).push(this.props[i])
      if (id === 52 || id === 17 || id === 48 || id === 50) {
        if (i + 1 >= this.props.length || this.props[i + 1].id - 1 !== id) {
          props.at(-1).push(new ItemProperty({ id: id + 1, value: this.props[i].value }))
          continue
        }
        props.at(-1).push(this.props[i + 1])
        i += 1
      } else if (id === 54 || id === 57) {
        if (i + 1 >= this.props.length || this.props[i + 1].id - 1 !== id) {
          console.error('ignored...')
          props.pop()
          continue
        }
        props.at(-1).push(this.props[i + 1])
        i += 1
        if (i + 1 >= this.props.length || this.props[i + 1].id - 1 !== id) {
          console.error('ignored...')
          props.pop()
          props.pop()
          continue
        }
        props.at(-1).push(this.props[i + 1])
        i += 1
      }
    }
    this.props = props
  }

  parseProps (props) {
    return this.adjustProps(props.map(prop => this.propertyParser.parse(prop)).flat())
  }

  adjustProps (props) {
    const lut = props.reduce((lut, e) => {
      if (e.id in lut) {
        if (!lut[e.id][0].param) {
          lut[e.id][0].value += e.value
        } else {
          lut[e.id].push(e)
        }
      } else {
        lut[e.id] = [e]
      }
      return lut
    }, {})
    return Object.values(lut).flat()
  }

  adjustForSockets () {
    // rune props are added by the trade site
    const lut = this.props.reduce((lut, e) => {
      lut[e.id] = lut[e.id] || []
      lut[e.id].push(e)
      return lut
    }, {})
    this.sockets.forEach(e => {
      e.props.forEach(ps => {
        ps.forEach(p => {
          if (!(p.id in lut)) {
            return
          }
          lut[p.id][0].value -= p.value
          if (lut[p.id][0].param !== p.param) {
            throw new Error(`expected item prop (id=${p.id}) param to match socket param a=${lut[p.id].param} b=${p.param}`)
          }
        })
      })
    })
    this.props = Object.values(lut).filter(e => e.value !== 0).flat()
  }
}

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
    this.propertyParser = new PropertyParser({ d2data, resolver, defaults, parser })
    this.typeList = d2data.TypeList()
    this.nameToItemEntry = this.typeList.itemList.reduce((map, code) => {
      // only need socketable rune versions
      if (/r\d\ds/.test(code)) {
        return map
      }
      const entry = this.typeList.entry(code)
      const readable = this.resolver.readable(entry.namestr)
      map[readable] = entry
      return map
    }, {})
    this.runes = d2data.runes()
    this.nameToRuneEntries = this.runes.reduce((map, entry, i) => {
      if (entry.complete !== '1') {
        return map
      }
      entry._index = i
      const readable = this.resolver.readable(entry['Rune Name'])
      map[readable] = map[readable] || []
      map[readable].push(entry)
      return map
    }, {})
    this.nameToUniqueEntry = this.d2data.uniqueItems().reduce((map, entry, i) => {
      if (entry.enabled !== '1') {
        return map
      }
      entry._index = i
      const readable = this.resolver.readable(entry.index)
      map[readable] = entry
      return map
    }, {})
    this.nametoSetEntry = this.d2data.setItems().reduce((map, entry, i) => {
      entry._index = i
      const readable = this.resolver.readable(entry.index)
      map[readable] = entry
      return map
    }, {})
    this.setup()
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

    // const toItem = e => this.getItem(e)
    // this.rip.equipment.map(toItem)
    // this.rip.inventory.map(toItem)
    // this.rip.swap.map(toItem)
    // this.rip.mercenary.equipment.map(toItem)

    object.items = {
      header: 0x4d4an,
      list: []
    }
    this.rip.equipment.forEach((item, i) => {
      object.items.list.push(this.getItem(item))
      object.items.list.at(-1).compact.location = SaveFileParser.ItemMode.stored
      object.items.list.at(-1).compact.equipment = 0
      const dx = 2
      const dy = 4
      object.items.list.at(-1).compact.x = ~~((i * dx) % 10)
      object.items.list.at(-1).compact.y = ~~((i * dx) / 10) * dy
      object.items.list.at(-1).compact.page = 1
    })

    console.log(require('util').inspect(object, false, Infinity, true))

    this.name = name
    this.rejuvenatedObject = object
  }

  getItem (json, isSocketed = false) {
    const rejuv = new ItemRejuvenated({ raw: json, propertyParser: this.propertyParser, typeList: this.typeList })
    return this.getItemEncoded(rejuv, isSocketed)
  }

  getItemEncoded (rejuv, isSocketed) {
    const entry = this.nameToItemEntry[rejuv.base]
    const code = SaveFileParser.stringToCode(entry.code)
    console.log(rejuv.name, rejuv.base, entry.code, code.toString(16), rejuv.quality, rejuv.quality)
    const quality = Object.keys(SaveFileParser.ItemQuality).indexOf(rejuv.rarity.toLowerCase())
    const res = {
      code: entry.code,
      header: 19786n,
      compact: {
        flags: SaveFileParser.ItemFlags.identified | SaveFileParser.ItemFlags.item,
        version: 101n,
        code,
        socketed: rejuv.socketCount
      },
      extra: {
        id: 0xDEADBEEF,
        level: 99n,
        quality,
        graphics: 0,
        auto: 0,
        properties: 0,
        realm: 0,
        list: []
      }
    }
    if (isSocketed) {
      res.compact.location = SaveFileParser.ItemMode.socket
      res.compact.equipment = 0
      res.compact.x = 0
      res.compact.y = 0
      res.compact.page = 0
    }
    if (rejuv.ethereal) {
      res.compact.flags |= SaveFileParser.ItemFlags.ethereal
    }
    if (entry.compactsave === '1') {
      res.compact.flags |= SaveFileParser.ItemFlags.compact
      return res
    }
    switch (quality) {
      case SaveFileParser.ItemQuality.inferior: {
        res.extra.file = this.typeList.isArmor(entry.code) ? 2 : 0
        break
      }
      case SaveFileParser.ItemQuality.superior: {
        res.extra.file = 0
        break
      }
      case SaveFileParser.ItemQuality.magic: {
        res.extra.prefix = 0
        res.extra.suffix = 0
        res.extra.list.push(...rejuv.props)
        break
      }
      case SaveFileParser.ItemQuality.rare:
      case SaveFileParser.ItemQuality.crafted: {
        res.extra.rarePrefix = 1
        res.extra.rareSuffix = 2
        res.extra.prefix = []
        res.extra.suffix = []
        res.extra.list.push(...rejuv.props)
      }
      case SaveFileParser.ItemQuality.set: {
        res.extra.file = 0
        break
      }
      case SaveFileParser.ItemQuality.unique: {
        const uniqueEntry = this.nameToUniqueEntry[rejuv.raw.name]
        res.extra.file = uniqueEntry ? uniqueEntry._index - (uniqueEntry.version !== '0') : 0
        res.extra.list.push(...rejuv.props)
        break
      }
    }
    if (this.typeList.itemIs(entry.code, 'mele')) {
      res.extra.list.push([{
        id: 0x167,
        value: 0x46,
        param: 0x5981
      }])
    }
    const rw = this.nameToRuneEntries[rejuv.name]
    if (rw) {
      res.compact.flags |= SaveFileParser.ItemFlags.runeword
      // need to find d2lang string id for the set item but we can just set 1 bit so it reads the props
      res.extra.runeId = 0
      res.extra.runeProperty = 1
    }
    // todo: personalized?
    // unlikely to write ibk/tbk
    if (res.compact.code === BigInt(0x206B6269) || res.compact.code === BigInt(0x206B6274)) {
      res.extra.suffix = 1
    }
    res.extra.realm = 0
    if (this.typeList.isArmor(entry.code)) {
      res.extra.armor = Number(entry.maxac)
    }
    if (this.typeList.isArmor(entry.code) || this.typeList.isWeapon(entry.code)) {
      res.extra.durability = {
        max: entry.nodurability === '1' ? 0 : Number(entry.durability)
      }
      if (entry.nodurability !== '1') {
        res.extra.durability.current = Number(entry.durability)
        res.extra.durability.bit = 0
      }
    }
    if (entry.stackable === '1') {
      res.extra.quantity = 1
    }
    if (rejuv.socketCount > 0) {
      res.compact.flags |= SaveFileParser.ItemFlags.socketed
      res.extra.sockets = rejuv.socketCount
      res.compact.socketed = rejuv.sockets.length
      res.sockets = rejuv.sockets.map(s => this.getItemEncoded(s, true))
    }
    if (quality === SaveFileParser.ItemQuality.set) {
      // todo: set item completion
      res.extra.mask = 0
      res.extra.properties |= res.extra.mask
    }
    // todo: properties for set/runeword
    if (rw) {
      res.extra.property = []
      res.extra.property.push(rejuv.props)
    }
    return res
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

module.exports = {
  Rejuvenator
}
