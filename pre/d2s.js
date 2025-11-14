'use strict'

const fs = require('fs')
const { Diablo2Data } = require('../d2data.js')

class GrammarConstructor {
  static Tokens = {
    Integer: 'percentage',
    Percentage: 'percentage',
    ExactInteger: 'exact_integer',
    ClassOnlySkill: 'class_only_skill',
    AnySkill: 'any_skill',
    Class: 'class'
  }

  static Classes = {
    'amazon': true,
    'sorceress': true,
    'necromancer': true,
    'paladin': true,
    'barbarian': true,
    'druid': true,
    'assassin': true
  }

  constructor ({ d2data, resolver }) {
    this.d2data = d2data
    this.resolver = resolver
  }

  static isClass (s) {
    return GrammarConstructor.Classes[s]
  }

  toAntlr (string) {
    if (string.length === 0) {
      return undefined
    }
    string = string.toLowerCase()
    string = string.replaceAll("'", "\\'").replaceAll('\n', '')
    // treat each word as a unique lexer token and ( or )
    return string.split(/(\s+|\(|\))/).map(s => {
      if (s.length > 0 && s.trim().length === 0) {
        s = ''
      }
      if (s === '+') {
        s = ''
      }
      if (s.match(/^(\+|\-)?\d+%?$/)) {
        return GrammarConstructor.Tokens.ExactInteger
      }
      if (GrammarConstructor.isClass(s)) {
        return GrammarConstructor.Tokens.Class
      }
      return `'${s}'`
    }).filter(e => e.length > 2).join(' ')
  }

  constructGrammarPart (name, func, val, pos, neg, str2) {
    // should replace '%d' with '' but trade site doesn't remove extra '%d'
    let res = this.constructGrammarPartInternal(name, func, val, pos, neg, str2)
    if (typeof res !== 'string') {
      return undefined
    }
    const prefix = `// ${name} ${func} ${val} ${pos} ${neg} ${str2}\n`
    return prefix + res
  }

  constructGrammarPartInternal (name, func, val, pos, neg, str2) {
    func = Number(func)
    val = Number(val)
    pos = this.resolver.readable(pos)
    neg = this.resolver.readable(neg)
    str2 = str2.length > 0 ? this.resolver.readable(str2) : str2
    if (pos !== neg && pos.replace('+', '') !== neg) {
      switch (name) {
        case 'hpregen': {
          if (func !== 1) {
            throw new Error('expected hpregen func to be 1')
          }
          return `hpregen: (${[pos, neg].map(this.toAntlr).join('|')}) ${GrammarConstructor.Tokens.Integer}`
        }
        default: {
          // ignore a couple unused map affixes
          return undefined
        }
      }
    }
    const str = pos
    const skillDesc = this.d2data.skillDesc()
    switch (func) {
      case 1:
      case 6: {
        if (val !== 1 && val !== 2) {
          throw new Error(`unknown val=${val} name=${name}`)
        }
        let res = `${name}: `
        if (val === 1) {
          res += GrammarConstructor.Tokens.Integer
          res += ' '
        }
        res += this.toAntlr(str, val)
        if (val === 2) {
          res += ' '
          res += GrammarConstructor.Tokens.Integer
        }
        if (str2.length > 0) {
          res += ' '
          res += this.toAntlr(str2, 1)
        }
        return res
      }
      case 2:
      case 7: {
        if (val !== 1 && val !== 2) {
          throw new Error(`unknown val=${val} name=${name}`)
        }
        let res = `${name}: `
        if (val === 1) {
          res += GrammarConstructor.Tokens.Percentage
          res += ' '
        }
        res += this.toAntlr(str, val)
        if (val === 2) {
          res += ' '
          res += GrammarConstructor.Tokens.Percentage
        }
        if (str2.length > 0) {
          res += ' '
          res += this.toAntlr(str2, 1)
        }
        return res
      }
      case 3:
      case 4:
      case 5:
      case 8:
      case 9:
      case 10: {
        let res = `${name}: `
        if (val === 1) {
          res += GrammarConstructor.Tokens.Percentage
          res += ' '
        }
        res += this.toAntlr(str, val)
        if (val === 2) {
          res += ' '
          res += GrammarConstructor.Tokens.Percentage
        }
        if (str2.length > 0 && (val === 0 || func === 8 || func === 9) && func !== 3) {
          res += ' '
          res += this.toAntlr(str2, 1)
        }
        return res
      }
      case 11: {
        return `${name}: ` + str.split(/(%d)/).map(s => {
          if (s !== '%d') {
            return this.toAntlr(s)
          }
          return GrammarConstructor.Tokens.Integer
        }).join(' ')
      }
      case 12: {
        let res = `${name}: `
        if (val === 1) {
          res += GrammarConstructor.Tokens.Percentage
          res += ' '
        }
        res += this.toAntlr(str, val)
        if (val === 2) {
          res += ' '
          res += GrammarConstructor.Tokens.Percentage
        }
        if (str2.length > 0) {
          res += ' '
          res += this.toAntlr(str2, 1)
        }
        return res
      }
      case 13: {
        // only item_addclassskills
        const classAllSkills = this.d2data.charStats().map(e => {
          if (e['class'].length === 'Expansion') {
            return undefined
          }
          return this.toAntlr(this.resolver.readable(e['StrAllSkills']), 1)
        }).filter(i => i).join(' | ')
        return `${name}: ${GrammarConstructor.Tokens.Integer} (${classAllSkills})`
      }
      case 14: {
        // only item_addskill_tab
        const classTabSkills = this.d2data.charStats().map(e => {
          if (e['class'].length === 'Expansion') {
            return undefined
          }
          const res = []
          for (let i = 1; i <= 3; ++i) {
            let tabStr = this.resolver.readable(e[`StrSkillTab${i}`])
            res.push(tabStr.split(/(%d)/).map(s => {
              if (s === '+' || s.trim().length === 0) {
                return undefined
              }
              if (s !== '%d') {
                // pd2 trade site adds 'skills'
                let opt = false
                if (s.indexOf('Skills') < 0) {
                  s += ' Skills'
                  opt = true
                }
                return [this.toAntlr(s) + (opt ? '?' : ''), this.toAntlr(this.resolver.readable(e.StrClassOnly))]
              }
              return GrammarConstructor.Tokens.Integer
            }).filter(e => e).flat().join(' '))
          }
          return res
        }).filter(i => i).flat().filter(i => i.length > 0).join(' | ')
        return `${name}: (${classTabSkills})`
      }
      case 15: {
        if (str.indexOf('%d') < 0) {
          return `${name}: ${this.toAntlr(str)}`
        }
        const rule = str.replace('%%', '').split(/(%[ds])/).map(s => {
          if (s !== '%d' && s !== '%s') {
            return this.toAntlr(s)
          }
          if (s === '%s') {
            return GrammarConstructor.Tokens.AnySkill
          }
          return GrammarConstructor.Tokens.Percentage
        }).filter(e => e).join(' ')
        return `${name}: ${rule}`
      }
      case 16: {
        const rule = str.split(/(%[ds])/).map(s => {
          if (s !== '%d' && s !== '%s') {
            return this.toAntlr(s)
          }
          if (s === '%s') {
            return GrammarConstructor.Tokens.AnySkill
          }
          return GrammarConstructor.Tokens.Integer
        }).join(' ')
        return `${name}: ${rule}`
      }
      case 19: {
        const rule = str.split(/(%d)/).map(s => {
          if (s !== '%d') {
            return this.toAntlr(s)
          }
          return GrammarConstructor.Tokens.Percentage
        }).filter(e => e).join(' ')
        return `${name}: ${rule}`
      }
      case 20: {
        return `${name}: ${GrammarConstructor.Tokens.Percentage} ${this.toAntlr(` ${str}`)}`
      }
      case 21: {
        return `${name}: ${GrammarConstructor.Tokens.Integer} ${this.toAntlr(` ${str}`)}`
      }
      case 22: {
        return `${name}: ${GrammarConstructor.Tokens.Integer} ${this.toAntlr(` ${str}`)}`
      }
      case 23: {
        return `${name}: ${GrammarConstructor.Tokens.Percentage} ${this.toAntlr(` ${str}`)} .*?`
      }
      case 24: {
        const charges = str.split(/(%d)/).map(s => {
          if (s !== '%d') {
            return this.toAntlr(s)
          }
          return GrammarConstructor.Tokens.Integer
        }).join(' ')
        return `${name}: ${this.toAntlr('Level')} ${GrammarConstructor.Tokens.Integer} ${GrammarConstructor.Tokens.AnySkill} ${charges}`
      }
      case 27: {
        return `${name}: ${GrammarConstructor.Tokens.Integer} ${this.toAntlr(' to ')} ${GrammarConstructor.Tokens.ClassOnlySkill}`
      }
      case 28: {
        return `${name}: ${GrammarConstructor.Tokens.Integer} ${this.toAntlr('to')} ${GrammarConstructor.Tokens.AnySkill}`
      }
    }
  }

  metaRules () {
    return [
      this.anySkill(),
      this.classOnlySkill(),
      this.classRule()
    ]
  }

  classRule () {
    return `${GrammarConstructor.Tokens.Class}: ${Object.keys(GrammarConstructor.Classes).map(e => `'${e}'`).join(' | ')}`
  }

  anySkill () {
    const skillDesc = this.d2data.skillDesc()
    const allSkillNames = this.d2data.skills().map(skill => {
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
      return this.toAntlr(this.resolver.readable(desc['str name']))
    }).filter(i => i).join(' | ')
    return `${GrammarConstructor.Tokens.AnySkill}: (${allSkillNames})`
  }

  classOnlySkill () {
    const skillDesc = this.d2data.skillDesc()
    const allClassySkillNames = this.d2data.skills().map(skill => {
      if (skill.skilldesc.length === 0) {
        return undefined
      }
      if (skill.charclass.length === 0) {
        return undefined
      }
      // block temps
      if (skill.Id !== '0' && skill.Id !== '5' && skill.srvstfunc === '1' && skill.srvdofunc === '1') {
        return undefined
      }
      // should probably use CharStats.txt
      const clazz = skill.charclass.substring(0, 1).toUpperCase() + skill.charclass.substring(1).toLowerCase()
      const clazzy = this.resolver.readable(`${clazz}Only`)
      const desc = skillDesc.first('skilldesc', skill.skilldesc)
      if (!desc) {
        return undefined
      }
      return this.toAntlr(`${this.resolver.readable(desc['str name'])} ${clazzy}`)
    }).filter(i => i).join(' | ')
    return `${GrammarConstructor.Tokens.ClassOnlySkill}: (${allClassySkillNames})`
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
  const costs = d2data.itemStatCost()

  const grammarParts = ['grammar ProjectDiablo2PropGrammar']
  const groupDescriptionSet = {}
  const constructor = new GrammarConstructor({ d2data, resolver })
  const names = []

  costs.each(({ Stat, descfunc, descval, descstrpos, descstrneg, descstr2, dgrp, dgrpfunc, dgrpval, dgrpstrpos, dgrpstrneg, dgrpstr2 }) => {
    if (descfunc.length > 0) {
      const statName = Stat.replace('%', 'percentage')
      const part = constructor.constructGrammarPart(statName, descfunc, descval, descstrpos, descstrneg, descstr2)
      if (part) {
        names.push(statName)
        grammarParts.push(part)
      }
    }
    if (dgrp.length > 0 && !groupDescriptionSet[dgrp]) {
      groupDescriptionSet[dgrp] = true
      const grpName = `dgrp${dgrp}`
      const part = constructor.constructGrammarPart(grpName, dgrpfunc, dgrpval, dgrpstrpos, dgrpstrneg, dgrpstr2)
      if (part) {
        names.push(grpName)
        grammarParts.push(part)
      }
    }
  })

  grammarParts.push(...constructor.metaRules())

  grammarParts.push(`property: (${names.join('|')}) EOF`)
  grammarParts.push(`percentage: PERCENTAGE`)
  grammarParts.push(`exact_integer: PERCENTAGE`)

  grammarParts.push('WS : [ \\t\\r\\n]+ -> skip')
  grammarParts.push("SIGN: '-' | '+'")
  grammarParts.push("PERCENTAGE: SIGN?[0-9]+'%'?;")

  const grammar = grammarParts.filter(i => i).flat().join(';\n')

  fs.writeFileSync('ProjectDiablo2PropGrammar.g4', grammar)
}

Main()
