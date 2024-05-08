'use strict'

class IgBuilder {
  static Generate (ig, n, fixes, requirement, stats, extras = [], forcedSeed) {
    const builder = new IgBuilder(ig)
    builder.forcedSeed = forcedSeed
    try {
      builder.setFixes(fixes)
      builder.setRequirement(requirement)
      builder.setExtras(extras)
      return {
        n: builder.generate(n, stats),
        histogram: builder.histogram,
        table: builder.table
      }
    } finally {
      builder.free()
      if (builder.ig._ig_alloc_count() > 0) {
        throw new Error('dangling mem')
      }
    }
  }

  constructor (ig) {
    this.ig = ig
    this.freeList = []
  }

  free () {
    this.freeList.forEach(ptr => {
      this.ig._ig_free(ptr)
    })
    this.freeList = []
  }

  check (ptr) {
    if (!ptr) {
      this.free()
      throw new Error('alloc')
    }
    this.freeList.push(ptr)
  }

  makeGroupList (n) {
    this.groupList = this.ig._ig_prepare_group_list(n)
    this.check(this.groupList)
  }

  makeCountList (n) {
    this.countList = this.ig._ig_prepare_ints(n)
    this.check(this.countList)
  }

  makeIntList (n) {
    const res = this.ig._ig_prepare_ints(n)
    this.check(res)
    return res
  }

  makeLengthList (n) {
    this.lengthList = this.ig._ig_prepare_ints(n)
    this.check(this.lengthList)
  }

  makeGroup (n) {
    const res = this.ig._ig_prepare_group(n)
    this.check(res)
    return res
  }

  makeEffects (n) {
    const res = this.ig._ig_prepare_effects(n)
    this.check(res)
    return res
  }

  makeSeedList () {
    const k = 4
    this.seedList = this.ig._ig_prepare_ints(k)
    this.check(this.seedList)
    for (let i = 0; i < k; ++i) {
      this.setInt(this.seedList, i, this.forcedSeed ? this.forcedSeed[i] : ((Math.random() * 1e9) | 0))
    }
  }

  setGroupList (groupList, id, group) {
    this.ig._ig_assign_group_list(groupList, id, group)
  }

  setGroup (group, id, weight, offset, length, effects) {
    this.ig._ig_assign_group(group, id, weight, offset, length, effects)
  }

  setEffect (effects, id, min, max, aff, par) {
    this.ig._ig_assign_effect(effects, id, min, max, aff, par)
  }

  setInt (ints, id, val) {
    this.ig._ig_assign_int(ints, id, val)
  }

  getInt (ints, id) {
    return this.ig._ig_get_int(ints, id)
  }

  setFixes (fixes) {
    const length = this.length = fixes.length
    this.makeCountList(length)
    this.makeGroupList(length)
    this.makeLengthList(length)
    this.makeSeedList(4)
    fixes.forEach((fix, idx) => this.setFix(fix, idx))
  }

  setFix (fix, idx) {
    let length = fix.groups.length
    fix.groups.forEach(group => {
      length += group.members.length
    })
    const groupPtr = this.makeGroup(length)
    this.setInt(this.countList, idx, fix.count)
    this.setInt(this.lengthList, idx, fix.groups.length)
    this.setGroupList(this.groupList, idx, groupPtr)
    let offset = fix.groups.length
    fix.groups.forEach((group, groupIdx) => {
      this.setGroup(groupPtr, groupIdx, group.weight, offset, group.members.length, 0)
      group.members.forEach((member, memberIdx) => {
        const effectsPtr = this.makeEffects(member.effects.length)
        this.setGroup(groupPtr, offset + memberIdx, member.weight, 0, member.effects.length, effectsPtr)
        member.effects.forEach((effect, effectIdx) => {
          this.setEffect(effectsPtr, effectIdx, effect.min, effect.max, effect.aff, effect.par)
        })
      })
      offset += group.members.length
    })
    const sanity = this.ig._ig_sanity_check(groupPtr, fix.groups.length)
    if (sanity) {
      throw new Error(`sanity check failed: ${sanity}`)
    }
  }

  setRequirement (requirement) {
    const effectsPtr = this.makeEffects(requirement.length)
    requirement.forEach((effect, effectIdx) => {
      this.setEffect(effectsPtr, effectIdx, effect.min, effect.max, effect.aff, effect.par)
    })
    this.requirements = effectsPtr
    this.requirementsLength = requirement.length
  }

  setExtras (extras) {
    const extrasPtr = this.makeEffects(extras.length)
    extras.forEach((extra, extraIdx) => {
      this.setEffect(extrasPtr, extraIdx, extra.min, extra.max, extra.aff, extra.par)
    })
    this.extraList = extrasPtr
    this.extrasLength = extras.length
  }

  generate (n, stats) {
    this.makeSeedList()
    const ptr = this.makeIntList(2)
    const cap = 1024
    const res = this.ig._ig_generate(n, this.countList, this.groupList, this.lengthList, this.length, this.requirements, this.requirementsLength, this.seedList, this.extraList, this.extrasLength, stats ? ptr : 0, cap)
    if (stats) {
      this.table = []
      for (let i = 0; i < this.requirementsLength; ++i) {
        const el = this.ig._ig_get_effect(this.requirements, i)
        this.table[i] = this.ig._ig_get_effect_max(el)
      }
      const buf = this.getInt(ptr, 0)
      const len = cap * this.requirementsLength
      const histogram = []
      for (let i = 0; i < len;) {
        const k = cap
        histogram.push({})
        for (let j = 0; j < k; ++j, ++i) {
          const key = j
          const val = this.getInt(buf, i)
          histogram.at(-1)[key] = val
        }
      }
      for (let i = 0; i < histogram.length; ++i) {
        let sum = 0
        for (const [, b] of Object.entries(histogram[i])) {
          sum += b
        }
        let prefix = 0
        for (let j = 0; j < cap; ++j) {
          histogram[i][j] += prefix
          prefix = histogram[i][j]
          histogram[i][j] /= sum
        }
      }
      this.histogram = histogram
      this.ig._ig_free(buf)
    } else {
      delete this.table
      delete this.histogram
    }
    return res
  }
}

class IgSetup {
  static getPseudoCode ({ code }) {
    if (code.startsWith('dmg-m')) {
      return 'dmg (flat)'
    }
    if (code === 'skilltab') {
      return 'skill (tab)'
    }
    if (code === 'hit-skill') {
      return 'hit skill (any)'
    }
  }

  static codeMap = {
    'swing1': 'swing',
    'swing2': 'swing',
    'swing3': 'swing',
    'move1': 'move',
    'move2': 'move',
    'move3': 'move',
  }

  constructor (lists) {
    this.lists = lists
    const codes = new Set()
    const params = new Map()
    this.params = params
    this.lists.forEach(list => {
      list.each(aff => {
        aff.mods.forEach(({ code, param }) => {
          const pcode = IgSetup.getPseudoCode({ code })
          if (pcode) {
            codes.add(pcode)
            this.addParam(pcode, '')
          }
          if (IgSetup.codeMap[code]) {
            code = IgSetup.codeMap[code]
          }
          codes.add(code)
          this.addParam(code, param)
        })
      })
    })
    codes.delete('')
    params.delete('')
    const array = [...codes]
    array.sort((a, b) => {
      return a.localeCompare(b) 
    })
    this.codes = new Set(array)
    this.codeInverse = {}
    let idx = 1
    for (let code of this.codes) {
      if (IgSetup.codeMap[code]) {
        code = IgSetup.codeMap[code]
      }
      this.codeInverse[code] = idx
      idx += 1
    }
  }

  addParam (code, param) {
    const params = this.params
    if (!params.has(code)) {
      params.set(code, new Set())
    }
    const paramSet = params.get(code)
    paramSet.add(param)
  }

  codeLookup (name) {
    if (IgSetup.codeMap[name]) {
      name = IgSetup.codeMap[name]
    }
    return this.codeInverse[name]
  }

  buildCache () {
    if (this.caches) {
      return
    }
    const caches = this.caches = []
    this.lists.forEach(list => {
      const cache = {
        group: new Map()
      }
      caches.push(cache)
      list.each(el => {
        const row = el.row
        let group = cache.group.get(row.group)
        if (!group) {
          group = []
          group.sum = 0
          cache.group.set(row.group, group)
        }
        row.frequency = Number(row.frequency)
        group.sum += row.frequency
        group.push(el)
      })
    })
  }

  setup (meta, requirements, typeList) {
    this.buildCache()
    const res = { affixes: [], requirements: [] }
    this.caches.forEach((cache, i) => {
      const groups = []
      let weight = 0
      for (const group of cache.group.values()) {
        weight += group.sum
        groups.push({
          weight,
          members: this.setupMembers(group)
        })
      }
      res.affixes.push({
        count: i === 0 ? meta.prefix : meta.suffix,
        groups
      })
    })
    res.affixes = res.affixes.filter(affix => affix.count > 0)
    res.requirements = requirements.map(requirement => {
      return {
        aff: this.codeLookup(requirement.code),
        par: Number(requirement.param),
        min: requirement.value
      }
    })
    res.extras = this.setupExtras(meta, requirements, typeList)
    return res
  }

  setupExtras (meta, requirements, typeList) {
    if (!meta.rarity.startsWith('Crafted')) {
      return []
    }
    const types = typeList.ancestors(meta.type)
    switch (meta.rarity) {
      case 'Crafted - Blood':
        if (types.has('weap')) {
          return [
            {
              aff: this.codeLookup('dmg%'),
              par: 0,
              min: 50,
              max: 81
            }
          ]
        }
        return []
      case 'Crafted - Diamond':
        if (types.has('weap')) {
          return [
            {
              aff: this.codeLookup('dmg%'),
              par: 0,
              min: 20,
              max: 41
            },
            {
              aff: this.codeLookup('swing'),
              par: 0,
              min: 20,
              max: 21
            }
          ]
        }
        return []
      default:
        return []
    }
  }

  setupMembers (group) {
    const members = []
    let weight = 0
    for (const { mods, row } of group) {
      weight += row.frequency
      const effects = mods.reduce((list, mod) => {
        const pcode = IgSetup.getPseudoCode(mod)
        if (pcode) {
          list.push({
            code: pcode,
            aff: this.codeLookup(pcode),
            par: 0,
            min: Math.abs(Number(mod.min)) || 1,
            max: Number(mod.max) + 1 // [a, b)
          })
        }
        list.push({
          code: mod.code,
          aff: this.codeLookup(mod.code),
          par: Number(mod.param),
          min: Math.abs(Number(mod.min)) || 1,
          max: Number(mod.max) + 1 // [a, b)
        })
        return list
      }, [])
      members.push({
        group: row.group,
        weight,
        effects
      })
    }
    return members
  }
}

class IgMetaForm {
  static defaultCounts (type) {
    switch (type) {
      case 'Rare':
        return 3
      case 'Magic':
        return 1
      default:
        if (type.startsWith('Crafted')) {
          return 3
        }
        throw new Error('unknown type for default count')
    }
  }

  constructor (typeList) {
    this.typeList = typeList
  }

  populate (container) {
    const levelInput = document.createElement('input')
    levelInput.id = 'level-input'
    levelInput.name = 'level'
    levelInput.type = 'text'
    levelInput.setAttribute('list', 'levels')
    levelInput.setAttribute('pattern', /\d\d?/.source)
    levelInput.setAttribute('required', true)
    const typeInput = document.createElement('select')
    typeInput.id = 'type-input'
    this.typeList.all().forEach(type => {
      const opt = document.createElement('option')
      opt.value = type
      opt.textContent = type
      typeInput.appendChild(opt)
    })
    const rarityInput = document.createElement('select')
    rarityInput.id = 'rarity-input'
    const rarity = ['Magic', 'Rare']
    const crafts = ['Blood', 'Diamond']
    crafts.forEach(craft => {
      rarity.push(`Crafted - ${craft}`)
    })
    rarity.forEach(type => {
      const opt = document.createElement('option')
      opt.value = type
      opt.textContent = type
      rarityInput.appendChild(opt)
    })
    levelInput.value = '94'
    typeInput.value = '2hsw'
    rarityInput.value = 'Rare'
    const prefixInput = document.createElement('select')
    this.populateAffixCount(rarityInput.value, prefixInput)
    const suffixInput = document.createElement('select')
    this.populateAffixCount(rarityInput.value, suffixInput)
    this.inputs = {
      level: levelInput,
      type: typeInput,
      rarity: rarityInput,
      prefix: prefixInput,
      suffix: suffixInput
    }
    rarityInput.onchange = e => {
      Array.from(prefixInput.children).forEach(child => child.remove())
      Array.from(suffixInput.children).forEach(child => child.remove())
      this.populateAffixCount(rarityInput.value, prefixInput)
      this.populateAffixCount(rarityInput.value, suffixInput)
    }
    prefixInput.onchange = suffixInput.onchange = e => {
      e.stopPropagation()
      return false
    }
    container.appendChild(levelInput)
    container.appendChild(typeInput)
    container.appendChild(rarityInput)
    container.appendChild(prefixInput)
    container.appendChild(suffixInput)
  }

  populateAffixCount (rarity, input) {
    for (let i = 0; i <= IgMetaForm.defaultCounts(rarity); ++i) {
      const opt = document.createElement('option')
      opt.value = opt.textContent = i
      input.appendChild(opt)
    }
    input.value = input.firstElementChild.value
  }

  values () {
    const res = {}
    res.level = Number(this.inputs.level.value)
    res.type = this.inputs.type.value
    res.rarity = this.inputs.rarity.value
    res.prefix = Number(this.inputs.prefix.value)
    res.suffix = Number(this.inputs.suffix.value)
    return res
  }
}

class IgRequirementForm {
  constructor (codes, params) {
    this.codes = codes
    this.params = params
    this.requirements = []
  }

  populate (container) {
    this.container = container
    this.populateCreation()
    this.populateRequirements()
  }

  populateRequirements () {
    if (this.required) {
      this.required.remove()
    }
    this.required = document.createElement('p')
    if (this.requirements.length === 0) {
      this.required.textContent = 'nothing yet'
    } else {
      const requirements = this.requirements.map(requirement => JSON.stringify(requirement))
      requirements.forEach((requirement, idx) => {
        const removeInput = document.createElement('button')
        removeInput.textContent = '-'
        this.required.appendChild(removeInput)
        this.required.append(requirement)
        this.required.appendChild(document.createElement('br'))
        removeInput.onclick = () => {
          this.requirements.splice(idx, 1)
          this.populateRequirements()
        }
      })
    }
    this.container.appendChild(this.required)
  }

  populateCreation () {
    if (this.creation) {
      this.creation.remove()
    }
    this.creation = document.createElement('div')
    const codeInput = document.createElement('select')
    this.populateSelectInput(codeInput, this.codes)
    const paramInput = document.createElement('select')
    this.populateSelectInput(paramInput, this.params.get(codeInput.firstElementChild.textContent))
    const valueInput = document.createElement('input')
    valueInput.type = 'text'
    valueInput.pattern = /0*[1-9]\d*/.source
    valueInput.value = '1'
    codeInput.onchange = () => {
      while (paramInput.firstElementChild) {
        paramInput.firstElementChild.remove()
      }
      this.populateSelectInput(paramInput, this.params.get(codeInput.value))
    }
    const appendInput = document.createElement('button')
    appendInput.textContent = '+'
    appendInput.onclick = () => {
      if (!codeInput.validity.valid || !paramInput.validity.valid || !valueInput.validity.valid) {
        return
      }
      this.requirements.push({
        code: codeInput.value,
        param: paramInput.value,
        value: Number(valueInput.value)
      })
      this.populateCreation()
      this.populateRequirements()
    }
    this.creation.appendChild(codeInput)
    this.creation.appendChild(paramInput)
    this.creation.appendChild(valueInput)
    this.creation.appendChild(appendInput)
    this.container.appendChild(this.creation)
  }

  populateSelectInput (input, iterable) {
    for (const param of iterable) {
      const opt = document.createElement('option')
      opt.value = param
      opt.textContent = param
      input.appendChild(opt)
    }
  }

  values () {
    return this.requirements
  }
}
