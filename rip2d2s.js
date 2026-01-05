'use strict'

class SkillMapper {
  constructor ({ d2data, resolver }) {
    this.d2data = d2data
    this.resolver = resolver
    this.skills = this.d2data.skills()
    this.skillDesc = this.d2data.skillDesc()
    this.classSkillCounts = {}
    this.classSkillMap = {}
    this.inverseMap = Object.fromEntries(this.skills.map(e => {
      if (e.charclass === '') {
        return null
      }
      this.classSkillCounts[e.charclass] = this.classSkillCounts[e.charclass] || 0
      const skillIndex = this.classSkillCounts[e.charclass]
      this.classSkillCounts[e.charclass] += 1
      const desc = this.skillDesc.first('skilldesc', e.skilldesc)
      if (!desc) {
        return null
      }
      if (desc.SkillPage <= 0 || desc.SkillRow <= 0 || desc.SkillColumn <= 0) {
        return null
      }
      this.classSkillMap[e.charclass] = this.classSkillMap[e.charclass] || []
      this.classSkillMap[e.charclass].push({
        skill: e,
        desc
      })
      e.$skillIndex = skillIndex
      return [
        [e.skill.toLowerCase(), [e, desc]],
        [this.resolver.readable(e.skill).toLowerCase(), [e, desc]],
        [this.resolver.readable(desc['str name']).toLowerCase(), [e, desc]]
      ]
    }).flat().filter(i => i))
  }

  getSkillData (name) {
    return this.inverseMap[name.toLowerCase()]
  }
}

class InventorySlotProvider {
  constructor ({ d2data, resolver, fallbackProvider }) {
    this.d2data = d2data
    this.resolver = resolver
    this.fallbackProvider = fallbackProvider
    this.typeList = this.d2data.TypeList()
    const slots = SaveFileParser.ItemEquipmentSlot
    this.itemTypes = this.d2data.itemTypes()
    this.bodyLocations = this.itemTypes.reduce((set, e) => {
      if (e.BodyLoc1.length === 0 || e.BodyLoc2.length === 0) {
        return set
      }
      const location1 = slots.indexOf(e.BodyLoc1.toUpperCase())
      const location2 = slots.indexOf(e.BodyLoc2.toUpperCase())
      set[e.Code] = set[e.Code] || new Set()
      set[e.Code].add(location1)
      set[e.Code].add(location2)
      return set
    }, {})
    this.usedLocations = {}
    if (!this.fallbackProvider) {
      this.fallbackProvider = (function* () {
        const dx = 2
        const dy = 4
        for (let i = 0; i < 20; ++i) {
          const location = SaveFileParser.ItemMode.stored
          const equipment = 0
          const x = ~~((i * dx) % 10)
          const y = ~~((i * dx) / 10) * dy
          const page = 5
          yield {
            location,
            equipment,
            x,
            y,
            page
          }
        }
        throw new Error('far too many items')
      })()
    }
  }

  getSlot (code) {
    for (const k in this.bodyLocations) {
      if (this.typeList.itemIs(code, k)) {
        for (const slot of this.bodyLocations[k]) {
          if (this.usedLocations[slot]) {
            continue
          }
          this.usedLocations[slot] = true
          return {
            location: SaveFileParser.ItemMode.equip,
            equipment: slot,
            page: 0,
            x: slot,
            y: 0
          }
        }
      }
    }
    return this.fallbackProvider.next().value
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
      return [[skill.skill.toLowerCase(), skill], [this.resolver.readable(desc['str name']).toLowerCase(), skill], [this.resolver.readable(skill.skill).toLowerCase(), skill]]
    }).flat().filter(i => i).reverse())
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
    try {
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
    } catch (e) {
      console.error(string)
      throw e
    }
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
          const deadlyPerLevel = this.d2data.itemStatCost().first('Stat', 'item_deadlystrike_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(deadlyPerLevel['op param'])))
          if (value <= 0) {
            throw new Error('deadly/lvl should be positive')
          }
          return [
            new ItemProperty({ id: deadlyPerLevel.ID, value })
          ]
        }
      },
      {
        regex: /Heal Stamina Plus (.+)% \(Based on Character Level\)/i,
        reviver: match => {
          const deadlyPerLevel = this.d2data.itemStatCost().first('Stat', 'item_regenstamina_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(deadlyPerLevel['op param'])))
          if (value <= 0) {
            throw new Error('deadly/lvl should be positive')
          }
          return [
            new ItemProperty({ id: deadlyPerLevel.ID, value })
          ]
        }
      },
      {
        regex: /Reanimate as: (.+?)$/i,
        reviver: match => {
          const reanimate = this.d2data.itemStatCost().first('Stat', 'item_reanimate')
          const value = 6
          const param = Number(match[1])
          return [
            new ItemProperty({ id: reanimate.ID, value, param })
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
        regex: /(\d+) poison damage over (\d+) seconds/i,
        reviver: match => {
          const min = this.d2data.itemStatCost().first('Stat', `poisonmindam`)
          const max = this.d2data.itemStatCost().first('Stat', `poisonmaxdam`)
          const len = this.d2data.itemStatCost().first('Stat', `poisonlength`)
          const minValue = Number(match[1])
          const maxValue = Number(match[1])
          const lengthValue = Number(match[2]) * 25
          // text = (min * len + 128) / 256
          // Math.ceil((256 * text - 128) / len) = min
          const encodedMinValue = Math.ceil((256 * minValue - 128) / lengthValue)
          const encodedMaxValue = encodedMinValue
          const res = [
            new ItemProperty({ id: min.ID, value: encodedMinValue }),
            new ItemProperty({ id: max.ID, value: encodedMaxValue }),
            new ItemProperty({ id: len.ID, value: lengthValue })
          ]
          return res
        }
      },
      {
        regex: /(\d+)-(\d+) poison damage over (\d+) seconds/i,
        reviver: match => {
          const min = this.d2data.itemStatCost().first('Stat', `poisonmindam`)
          const max = this.d2data.itemStatCost().first('Stat', `poisonmaxdam`)
          const len = this.d2data.itemStatCost().first('Stat', `poisonlength`)
          const minValue = Number(match[1])
          const maxValue = Number(match[2])
          const lengthValue = Number(match[2]) * 25
          // text = (min * len + 128) / 256
          // Math.ceil((256 * text - 128) / len) = min
          const encodedMinValue = Math.ceil((256 * minValue - 128) / lengthValue)
          const encodedMaxValue = Math.ceil((256 * maxValue - 128) / lengthValue)
          const res = [
            new ItemProperty({ id: min.ID, value: encodedMinValue }),
            new ItemProperty({ id: max.ID, value: encodedMaxValue }),
            new ItemProperty({ id: len.ID, value: lengthValue })
          ]
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
        regex: /\+(.+?) to Mana \(Based on Character Level\)$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_mana_perlevel')
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
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
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
          const stat = this.d2data.itemStatCost().first('Stat', 'item_find_gold_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('gf/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /(.+?)% Better Chance of Getting Magic Items \(Based on Character Level\)$/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_find_magic_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('mf/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /Attacker Takes Damage of (.+?) \(Based on Character Level\)/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_thorns_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('thorns/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(\d+) to (Claw Mastery|Blade Dance|Enchant|Berserker) \((Assassin|Sorceress|Barbarian) Only\)/i,
        reviver: match => {
          const skillName = match[2]
          const param = this.skillNameToSkillEntryMap[skillName.toLowerCase()].Id
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
        regex: /\+(.+)% Damage to (Undead|Demons) \(Based on Character Level\)/i,
        reviver: match => {
          const statId = match[2].toLowerCase() === 'undead' ? 'item_damage_undead_perlevel' : 'item_damage_demon_perlevel'
          const stat = this.d2data.itemStatCost().first('Stat', statId)
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('undead%/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(.+) to Attack Rating \(Based on Character Level\)/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_tohit_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('att/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /\+(.+)% to Attack Rating \(Based on Character Level\)/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_tohitpercent_perlevel')
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('att%/lvl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /Hit Causes Monster to Flee (.+)/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'item_howl')
          const value = ~~(Number(match[1]) * 128 / 100)
          if (value <= 0) {
            throw new Error('item_howl should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /(.+) Absorbs (Cold|Fire|Lightning|Poison) Damage \(Based on Character Level\)/i,
        reviver: match => {
          const type2code = {
            cold: 'cold',
            fire: 'fire',
            lightning: 'ltng',
            poison: 'pois'
          }
          const stat = this.d2data.itemStatCost().first('Stat', `item_absorb_${type2code[match[2].toLowerCase()]}_perlevel`)
          const value = ~~(Number(match[1]) * (1 << Number(stat['op param'])))
          if (value <= 0) {
            throw new Error('absorb should be positive')
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /Joust's Cooldown Is Reduced By (.+) Seconds/i,
        reviver: match => {
          const type2stat = {
            '1.5': 'joustreduction_zeraes',
            '0.75': 'joustreduction_leorics',
            '0.5': 'joustreduction'
          }
          const stat = this.d2data.itemStatCost().first('Stat', type2stat[match[1]])
          if (!stat) {
            throw new Error(`unknown joust cooldown reduction time ${match[1]}`)
          }
          const value = Math.ceil(25 * Number(match[1]))
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /Dragon Flight's Cooldown Is Reduced By (.+) Seconds/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'dragonflightreduction')
          const value = Math.ceil(25 * Number(match[1]))
          if (!Number.isFinite(value)) {
            throw new Error(`unknown dragon flight cooldown reduction time ${match[1]}`)
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        regex: /Gust(?:'s)? Cooldown Is Reduced By (.+) Seconds/i,
        reviver: match => {
          const stat = this.d2data.itemStatCost().first('Stat', 'gustreduction')
          const value = Math.ceil(25 * Number(match[1]))
          if (!Number.isFinite(value)) {
            throw new Error(`unknown gust cooldown reduction time ${match[1]}`)
          }
          return [
            new ItemProperty({ id: stat.ID, value })
          ]
        }
      },
      {
        // seen in items that must be eth
        regex: /undefined$/i,
        reviver: _ => {
          return []
        }
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
    parsed.name = parsed.name.replace('percentage', '%')
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
        if (entry.Stat === 'map_mon_cannotbefrozen' || entry.Stat === 'map_mon_splash') {
          value = 1
        }
        // maxdamage, secondary_maxdamage, item_throw_maxdamage
        if (typeof value !== 'number') {
          throw new Error(`expected value for ${parsed.name}`)
        }
        if (Number(entry['op param']) > 0 && entry['op'] !== '4' && entry['op'] !== '5') {
          value <<= Number(entry['op param'])
        }
        // some stats have required param bits (unused but should be 0)
        const param = Number(entry['Save Param Bits']) > 0 ? 0 : undefined
        const res = new ItemProperty({ id, value, param })
        // normal_damage_reduction collides with damageresist since the only difference is a %
        const normal_damage_reduction = this.itemStatCost.first('Stat', 'normal_damage_reduction')
        if (id === Number(normal_damage_reduction.ID) && parsed.percentages[0].text.endsWith('%')) {
          const damageresist = this.itemStatCost.first('Stat', 'damageresist')
          return new ItemProperty({
            id: damageresist.ID,
            value,
            param
          })
        }
        const lut = {
          item_elemskill_fire: 1,
          item_elemskill_cold: 4,
          item_elemskill_lightning: 2,
          item_elemskill_poison: 5,
          item_elemskill_magic: 3
        }
        if (entry.Stat in lut) {
          const pairEntry = this.itemStatCost.first('Stat', 'item_elemskill')
          return [
            new ItemProperty({ id: pairEntry.ID, value, param: lut[entry.Stat] }),
            res
          ]
        }
        if (entry.Stat === 'item_replenish_charges') {
          // some items aren't 33 but the text is always 'replenish 1 charge in 3 seconds'
          res.value = 33
        }
        return res
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
        if (parsed.strings.length === 0 && 'Melee Attacks Deal Splash Damage'.toLowerCase() === parsed.original.toLowerCase()) {
          return new ItemProperty({
            id: 0x167,
            value: 0x46,
            param: 0x5981
          })
        }
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
        // es on equip has es efficiency at the same level or hard cap (20)
        if (skill.skill === 'Energy Shield SelfAura') {
          const efficiency = this.itemStatCost.first('Stat', 'es_efficiency')
          if (efficiency) {
            return [
              new ItemProperty({ id, value, param }),
              new ItemProperty({ id: efficiency.ID, value: Math.min(value, 20) })
            ]
          }
        }
        return new ItemProperty({ id, value, param })
      }
      case 19: {
        const value = parsed.percentages[0].value
        return new ItemProperty({ id, value })
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
        throw new Error(`unknown stat func: ${entry.Stat}`)
      }
    }
  }
}

class ItemRejuvenated {
  constructor ({ raw, propertyParser, typeList, nameToItemEntry }) {
    this.raw = raw
    this.propertyParser = propertyParser
    this.typeList = typeList
    const isGem = !!nameToItemEntry[raw.name] && nameToItemEntry[raw.name].type.startsWith('gem')
    const isJewel = raw.name.includes('Jewel ') || raw.name.includes(' Jewel') || raw.name === 'Jewel' || raw.name === 'Rainbow Facet'
    const isRune = raw.name.endsWith(' Rune')
    this.rarity = raw.type.startsWith('Low') ? 'Low Quality' : raw.type.split(' ', 1)[0].toLowerCase()
    const socketsIndex = raw.type.endsWith(')') ? raw.type.length - 4 : raw.type.length
    this.base = raw.type.substring(this.rarity.length + 1, socketsIndex)
    if (isRune || isGem) {
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
        return new ItemRejuvenated({ raw: jew, propertyParser, typeList, nameToItemEntry })
      })
    }
    this.props = this.parseProps(raw.props)
    this.props.forEach(prop => {
      if (prop.id === 360 || prop.id === 206) {
        prop.param = 0
      }
    })
    if (this.sockets.length > 0) {
      this.adjustForSockets()
    }
    this.merge()
    this.purge()
  }

  purge () {
    const props = []
    for (let i = 0; i < this.props.length; ++i) {
      if (this.props[i][0].value !== 0) {
        props.push(this.props[i])
        continue
      }
    }
    this.props = props
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
        i += 1
        props.at(-1).push(this.props[i])
        if (i + 1 >= this.props.length || this.props[i + 1].id - 1 !== this.props[i].id) {
          console.error('ignored...')
          props.pop()
          props.pop()
          continue
        }
        i += 1
        props.at(-1).push(this.props[i])
      }
    }
    this.props = props
    // damage props should be > 0 but (ele?) facets aren't added to the site tooltip correctly
    for (let i = 0; i < this.props.length; ++i) {
      const a = this.props[i][0]
      const id = a.id
      if (!(id === 52 || id === 17 || id === 48 || id === 50 || id === 54 || id === 57)) {
        continue
      }
      const b = this.props[i][1]
      const c = id === 54 || id === 87 ? this.props[i][2] : undefined
      if (a.value < 0) {
        console.error('corrected..', id)
        a.value = 0
        b.value = 0
        if (c) {
          c.value = 0
        }
        continue
      }
      if (b.value < 0) {
        console.error('corrected...', b.id)
        a.value = 0
        b.value = 0
        if (c) {
          c.value = 0
        }
        continue
      }
    }
  }

  clamp (v, d) {
    if (!Number.isFinite(v)) {
      return d
    }
    return v
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
          for (const prop of lut[p.id]) {
            if (prop.param === p.param) {
              prop.value -= p.value
            }
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
    this.propertiesConverter = new PropertiesConverter({ d2data })
    this.propertyParser = new PropertyParser({ d2data, resolver, defaults, parser })
    this.typeList = d2data.TypeList()
    this.nameToItemEntry = this.typeList.itemList.reduce((map, code) => {
      const entry = this.typeList.entry(code)
      // only need socketable rune/gem versions
      if (entry.name.endsWith(' Stack')) {
        return map
      }
      if (entry.name === '2H Phase Blade') {
        map['2H Phase Blade'] = entry
        return map
      }
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
      const readable = this.resolver.readable(entry['Name'])
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
      map[entry.index] = entry
      map[readable] = entry
      return map
    }, {})
    if (this.nameToUniqueEntry['Siggard\'s Staunch']) {
      this.nameToUniqueEntry['Siggard\'s Stealth'] = this.nameToUniqueEntry['Siggard\'s Staunch']
    }
    let delta = 0
    this.nameToSetEntry = this.d2data.setItems().reduce((map, entry, i) => {
      if (entry.index === 'Expansion') {
        delta += 1
        return map
      }
      entry._index = i - delta
      const readable = this.resolver.readable(entry.index)
      map[entry.index] = entry
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

    const allocatedPoints = this.pickSkills(object)

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
    attributes.newskills -= allocatedPoints
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
    this.fillItems(object)

    this.name = name
    this.rejuvenatedObject = object
  }

  pickSkills (object) {
    let sum = 0
    const mapper = new SkillMapper({ d2data: this.d2data, resolver: this.resolver })
    this.rip.stats.slice(7).forEach(([name, points]) => {
      points = Number(points)
      if (!Number.isInteger(points)) {
        throw new Error(`unknown skill points for ${name}`)
      }
      const data = mapper.getSkillData(name)
      if (!data) {
        throw new Error(`unable to map skill: ${name}`)
      }
      const idx = data[0].$skillIndex
      object.skills.list[idx] = points
      sum += points
    })
    return sum
  }

  fillItems (object) {
    object.items = {
      header: 0x4d4an,
      list: []
    }
    let isp = new InventorySlotProvider({ d2data: this.d2data, resolver: this.resolver })
    this.rip.equipment.forEach(item => {
      object.items.list.push(this.getItem(item))
      const { location, equipment, page, x, y } = isp.getSlot(object.items.list.at(-1).code)
      object.items.list.at(-1).compact.location = location
      object.items.list.at(-1).compact.equipment = equipment
      object.items.list.at(-1).compact.x = x
      object.items.list.at(-1).compact.y = y
      object.items.list.at(-1).compact.page = page
    })
    const swapLocations = ['SWRARM', 'SWLARM']
    this.rip.swap.forEach(item => {
      const slot = SaveFileParser.ItemEquipmentSlot.indexOf(swapLocations.pop())
      object.items.list.push(this.getItem(item))
      object.items.list.at(-1).compact.location = SaveFileParser.ItemMode.equip
      object.items.list.at(-1).compact.equipment = slot
      object.items.list.at(-1).compact.x = slot
      object.items.list.at(-1).compact.y = 0
      object.items.list.at(-1).compact.page = 0
    })
    this.rip.inventory.filter(i => i.type.includes(' Charm') && i.position.y >= 4).forEach((item, i) => {
      object.items.list.push(this.getItem(item))
      object.items.list.at(-1).compact.location = SaveFileParser.ItemMode.stored
      object.items.list.at(-1).compact.equipment = 0
      object.items.list.at(-1).compact.x = item.position.x
      object.items.list.at(-1).compact.y = item.position.y
      // page 1 = inventory
      // page 5 = stash
      object.items.list.at(-1).compact.page = 1
    })
    const staticItems = [
      {
        name: 'Horadric Navigator',
        type: 'Normal Horadric Navigator',
        props: []
      },
      {
        name: 'Horadric Almanac',
        type: 'Normal Horadric Almanac',
        props: []
      },
      {
        name: 'Horadric Cube',
        type: 'Normal Horadric Cube',
        props: []
      },
    ]
    staticItems.forEach((item, i) => {
      const dx = 1
      const dy = 0
      object.items.list.push(this.getItem(item))
      object.items.list.at(-1).compact.location = SaveFileParser.ItemMode.stored
      object.items.list.at(-1).compact.equipment = 0
      object.items.list.at(-1).compact.x = ~~((i * dx) % 10)
      object.items.list.at(-1).compact.y = ~~((i * dx) / 10) * dy
      // page 1 = inventory
      // page 5 = stash
      object.items.list.at(-1).compact.page = 1
    })
    if (object.mercenary.id > 0) {
      if (this.rip.mercenary.equipment.length > 0) {
        object.mercenaryItems = {
          header: 0x666a,
          items: {
            header: 0x4d4a,
            list: []
          }
        }
      }
      isp = new InventorySlotProvider({ d2data: this.d2data, resolver: this.resolver, fallbackProvider: isp.fallbackProvider })
      this.rip.mercenary.equipment.forEach(item => {
        object.mercenaryItems.items.list.push(this.getItem(item))
        const { location, equipment, page, x, y } = isp.getSlot(object.mercenaryItems.items.list.at(-1).code)
        object.mercenaryItems.items.list.at(-1).compact.location = location
        object.mercenaryItems.items.list.at(-1).compact.equipment = equipment
        object.mercenaryItems.items.list.at(-1).compact.x = x
        object.mercenaryItems.items.list.at(-1).compact.y = y
        object.mercenaryItems.items.list.at(-1).compact.page = page
      })
    } else {
      this.rip.mercenary.equipment.forEach(item => {
        object.items.list.push(this.getItem(item))
        const { location, equipment, page, x, y } = isp.getSlot('')
        object.items.list.at(-1).compact.location = location
        object.items.list.at(-1).compact.equipment = equipment
        object.items.list.at(-1).compact.x = x
        object.items.list.at(-1).compact.y = y
        object.items.list.at(-1).compact.page = page
      })
    }
  }

  getItem (json, isSocketed = false) {
    const rejuv = new ItemRejuvenated({ raw: json, propertyParser: this.propertyParser, typeList: this.typeList, nameToItemEntry: this.nameToItemEntry })
    const res = this.getItemEncoded(rejuv, isSocketed)
    return res
  }

  getItemEncoded (rejuv, isSocketed) {
    if (rejuv.base === 'Phase Blade' && rejuv.rarity.toLowerCase() === 'unique' && rejuv.raw.props.includes('75% Chance to Cast Level 50 Firestorm on Striking')) {
      rejuv.base = '2H Phase Blade'
    }
    const entry = this.nameToItemEntry[rejuv.base]
    const code = SaveFileParser.stringToCode(entry.code)
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
        break
      }
      case SaveFileParser.ItemQuality.set: {
        const setEntry = this.nameToSetEntry[rejuv.name]
        const properties = []
        const getProp = (setEntry, i, j) => {
          return {
            propCode: setEntry[`aprop${i}${j}`],
            min: setEntry[`amin${i}${j}`],
            max: setEntry[`amax${i}${j}`],
            param: setEntry[`apar${i}${j}`]
          }
        }
        let bitset = 0
        for (let i = 1; i <= 5; ++i) {
          properties.push([])
          const a = getProp(setEntry, i, 'a')
          const b = getProp(setEntry, i, 'b')
          if (a.propCode.length > 0) {
            properties.at(-1).push(this.propertiesConverter.convert(a))
          }
          if (b.propCode.length > 0) {
            properties.at(-1).push(this.propertiesConverter.convert(b))
          }
          if (properties.at(-1).length === 0) {
            properties.pop()
          } else {
            bitset |= 1 << (i - 1)
          }
        }
        res.extra.file = setEntry._index
        res.extra.mask = bitset
        res.extra.property = properties
        res.extra.list.push(...rejuv.props)
        break
      }
      case SaveFileParser.ItemQuality.unique: {
        const uniqueEntry = this.nameToUniqueEntry[rejuv.name]
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
      // +1 from max is possible
      res.extra.armor = Number(entry.maxac) + Number(this.d2data.itemStatCost().first('Stat', 'armorclass')['Save Add']) + 1
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
    if (rw) {
      res.extra.property = [rejuv.props]
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
      const nameTs = this.resolver.readable(e.skill)
      name2skillMap[name] = e
      name2skillMap[e.skill] = e
      name2skillMap[nameTs] = e
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

if (typeof window === 'undefined' && typeof self === 'undefined') {
  module.exports = {
    Rejuvenator
  }
}
