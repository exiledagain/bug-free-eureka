'use strict'

class DataLoader {
  constructor () {
    this.loaded = {}
  }

  async load (version, file) {
    const uri = `data/${version}/global/excel/${file}`
    if (this.loaded[uri]) {
      return this.loaded[uri]
    }
    const res = this.loaded[uri] = new DataFrame(uri)
    await res.load()
    return res
  }

  async preload (version, files) {
    for (const file of files) {
      await this.load(version, file)
    }
  }

  get (version, file) {
    const uri = `data/${version}/global/excel/${file}`
    const res = this.loaded[uri]
    if (res) {
      return res
    }
    throw new Error(`file not loaded: ${uri}`)
  }
}

class DataFrame {
  constructor (uri) {
    this.uri = uri
    this.values = []
    this.firsts = new Map()
  }

  async load () {
    const res = await fetch(this.uri)
    if (!res.ok) {
      throw new Error(`fetch ${this.uri}: ${res.statusText}`)
    }
    const text = await res.text()
    this.parse(text)
  }

  parse (text) {    
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const values = line.split('\t')
      if (!this.keys) {
        this.keys = values
      } else if (values.length === this.keys.length) {
        this.values.push(values)
      }
    }
    return this
  }

  reset (keys) {
    this.keys = keys
  }

  add (values) {
    if (typeof values === 'object') {
      this.values.push(this.keys.map(key => values[key]))
      return
    }
    this.values.push(values)
  }

  first (key, val) {
    if (this.firsts.has(key)) {
      return this.firsts.get(key).get(val)
    }
    const k = this.keys.indexOf(key)
    if (k < 0) {
      throw new Error(`unknown key: ${key}`)
    }
    const map = new Map()
    this.firsts.set(key, map)
    this.each(value => {
      if (!map.has(value[key])) {
        map.set(value[key], value)
      }
    })
    return this.firsts.get(key).get(val)
  }

  combine (values) {
    const res = {}
    for (let i = 0; i < this.keys.length; ++i) {
      res[this.keys[i]] = values[i]
    }
    return res
  }

  combineFromIndex (idx) {
    return this.combine(this.values[idx])
  }

  each (cb) {
    this.values.forEach((values, idx) => {
      cb(this.combine(values), idx)
    })
  }

  keyIndex (needle) {
    for (let i = 0; i < this.keys.length; ++i) {
      if (this.keys[i] === needle) {
        return i
      }
    }
    return -1
  }

  filter (rowFilter, colFilter) {
    const cols = []
    const keys = []
    for (let i = 0; i < this.keys.length; ++i) {
      if (colFilter && !colFilter(this.keys[i], i)) {
        continue
      }
      keys.push(this.keys[i])
      cols.push(i)
    }
    const res = new DataFrame(this.uri)
    res.keys = keys
    const values = []
    for (let i = 0; i < this.values.length; ++i) {
      const value = []
      for (let j = 0; j < cols.length; ++j) {
        value.push(this.values[i][cols[j]])
      }
      if (rowFilter && !rowFilter(this.combineFromIndex(i), i)) {
        continue
      }
      values.push(value)
    }
    res.values = values
    return res
  }

  sort (cmp) {
    const res = new DataFrame(this.uri)
    res.keys = this.keys.map(i => i)
    res.values = this.values.map(i => i.map(i => i))
    res.values.sort((a, b) => {
      return cmp(this.combine(a), this.combine(b))
    })
    return res
  }

  ready () {
    return !!this.keys
  }
}

class DataFrameView {
  constructor (data) {
    this.data = data
  }

  populate (container) {
    const tbl = document.createElement('table')
    const hdr = document.createElement('thead')
    const bdy = document.createElement('tbody')
    tbl.appendChild(hdr)
    tbl.appendChild(bdy)
    this.populateRow(hdr, 'th', this.data.keys)
    const values = this.data.values
    for (let i = 0; i < values.length; ++i) {
      const value = values[i]
      const row = this.populateRow(bdy, 'td', value)
      row.setAttribute('index', i)
    }
    container.appendChild(tbl)
  }

  populateRow (container, type, list) {
    const row = document.createElement('tr')
    container.appendChild(row)
    for (let i = 0; i < list.length; ++i) {
      const val = list[i]
      const cell = document.createElement(type)
      cell.textContent = val
      cell.setAttribute('index', i)
      row.appendChild(cell)
    }
    return row
  }
}

class TypeList {
  constructor (miscTxt, typesTxt, weaponsTxt, armorsTxt) {
    this.build(miscTxt, typesTxt, weaponsTxt, armorsTxt)
    this.miscTxt = miscTxt
    this.typesTxt = typesTxt
    this.weaponsTxt = weaponsTxt
    this.armorsTxt = armorsTxt
  }

  all () {
    const res = Object.keys(this.set)
    res.sort()
    return res
  }

  has (type) {
    return !!this.set[type]
  }

  add (type, parents) {
    if (!type) {
      return
    }
    this.put(type)
    for (const parent of parents) {
      if (parent) {
        this.put(parent)
        this.parent(parent, type)
      }
    }
  }

  put (type) {
    this.set[type] = this.set[type] || {
      type,
      parents: new Set(),
      children: new Set()
    }
  }

  parent (parent, child) {
    this.set[parent].children.add(child)
    this.set[child].parents.add(parent)
  }

  parents (type) {
    return this.set[type].parents
  }

  children (type) {
    if (!this.set[type]) {
        throw new Error(`missing type: ${type}`)
    }
    return this.set[type].children
  }

  expand (type, set = new Set()) {
    if (set.has(type)) {
      return []
    }
    set.add(type)
    const children = []
    this.children(type).forEach(type => {
      children.push(this.expand(type, set))
    })
    return [
      type,
      children,
    ].flat(Infinity)
  }

  merge (types) {
    const set = new Set()
    types.forEach(type => {
      this.expand(type).forEach(type => {
        set.add(type)
      })
    })
    return set
  }

  overlap (type1, type2) {
    const types1 = this.expand(type1)
    const types2 = this.expand(type2)
    return types1.some(type1 => types2.includes(type1))
  }

  ancestors (type) {
    const set = {}
    const stack = [type]
    const res = new Set()
    while (stack.length > 0) {
      const u = stack.pop()
      set[u] = true
      res.add(u)
      for (const v of this.parents(u)) {
        if (!set[v]) {
          set[v] = true
          stack.push(v)
        }
      }
    }
    return res
  }

  build (miscTxt, typesTxt, weaponsTxt, armorsTxt) {
    this.set = {}
    miscTxt.each(row => {
      this.add(row.code, [row.type, row.type2])
    })
    typesTxt.each(row => {
      this.add(row.Code, [row.Equiv1, row.Equiv2])
    })
    if (weaponsTxt) {
      weaponsTxt.each(row => {
        this.add(row.code, [row.type, row.type2])
      })
    }
    if (armorsTxt) {
      armorsTxt.each(row => {
        this.add(row.code, [row.type, row.type2])
      })
    }
  }

  isWeapon (code) {
    return !!this.weaponsTxt.first('code', code)
  }

  isArmor (code) {
    return !!this.armorsTxt.first('code', code)
  }

  isMisc (code) {
    return !!this.miscTxt.first('code', code)
  }

  entry (code) {
    return this.weaponsTxt.first('code', code) || this.armorsTxt.first('code', code) || this.miscTxt.first('code', code)
  }
}

class AffixList {
  static modCodes = [1,2,3].map(id => `mod${id}code`)
  static modParams = [1,2,3].map(id => `mod${id}param`)
  static modMins = [1,2,3].map(id => `mod${id}min`)
  static modMaxs = [1,2,3].map(id => `mod${id}max`)
  static iTypes = [1,2,3,4,5,6,7].map(id => `itype${id}`)
  static eTypes = [1,2,3,4,5,6,7].map(id => `etype${id}`)
  static cellSet = new Set()

  static isCellIncluded (name) {
    if (AffixList.cellSet.size === 0) {
      const cellSet = AffixList.cellSet
      cellSet.add('Name')
      cellSet.add('group')
      cellSet.add('level')
      cellSet.add('frequency')
      cellSet.add('classspecific')
      AffixList.modCodes.forEach(el => cellSet.add(el))
      AffixList.modParams.forEach(el => cellSet.add(el))
      AffixList.modMins.forEach(el => cellSet.add(el))
      AffixList.modMaxs.forEach(el => cellSet.add(el))
      AffixList.iTypes.forEach(el => cellSet.add(el))
      AffixList.eTypes.forEach(el => cellSet.add(el))
    }
    return AffixList.cellSet.has(name)
  }

  static cellFilter (name) {
    return AffixList.isCellIncluded(name)
  }

  constructor (typeList, data, type, level, isRare) {
    this.typeList = typeList
    this.classSet = new Set(this.typeList.expand('clas'))
    this.classesMap = new Map()
    const clazzes = this.typeList.children('clas')
    for (const clazz of clazzes) {      
      for (const child of this.typeList.expand(clazz)) {
        this.classesMap.set(child, clazz.substring(0, 3))
      }
    }
    this.type = type
    this.level = level
    this.isRare = isRare
    this.data = data.filter(this.rowFilter.bind(this), AffixList.cellFilter)
  }

  getTypes (aff) {
    const ins = this.typeList.merge(AffixList.iTypes.map(i => aff[i]).filter(el => el))
    const outs = this.typeList.merge(AffixList.eTypes.map(i => aff[i]).filter(el => el))
    const res = new Set()
    for (const el of ins) {
      if (!outs.has(el)) {
        res.add(el)
      }
    }
    return res
  }

  rowFilter (aff) {
    const isTypeClassy = this.classSet.has(this.type)
    const matchingClass = !isTypeClassy || aff.classspecific === '' || aff.classspecific === this.classesMap.get(this.type)
    const withinLevel = aff.level <= this.level && (aff.maxlevel === '' || this.level <= aff.maxlevel)
    const matchingRarity = !this.isRare || aff.rare === '1'
    const matchingType = this.getTypes(aff).has(this.type)
    const hasFrequency = aff.frequency > 0
    const isSpawnable = aff.spawnable === '1'
    return matchingClass && matchingType && withinLevel && matchingRarity && hasFrequency && isSpawnable
  }

  empty () {
    return this.data.values.length <= 0
  }

  each (cb) {
    this.data.each(row => {
      const el = {
        row,
        mods: []
      }
      for (let i = 0; i < AffixList.modCodes.length; ++i) {
        if (row[AffixList.modCodes[i]].length === 0) {
          continue
        }
        el.mods.push({
          code: row[AffixList.modCodes[i]],
          param: row[AffixList.modParams[i]],
          min: row[AffixList.modMins[i]],
          max: row[AffixList.modMaxs[i]],
        })
      }
      cb(el)
    })
  }
}

class AffixView {
  static sort (a, b) {
    const cGroup = a.group - b.group
    if (cGroup !== 0) {
      return cGroup
    }
    return a.level - b.level
  }

  constructor (list) {
    this.list = list.data.sort(AffixView.sort)
    let nIndex = list.data.keyIndex('Name')
    this.list.keys.splice(nIndex + 1, 0, 'p')
    let pIndex = list.data.keyIndex('frequency')
    const sum = this.list.values.reduce((sum, el) => sum + Number(el[pIndex]), 0)
    this.list.values.forEach(el => {
      el.splice(nIndex + 1, 0, `${(el[pIndex] / sum * 100).toFixed(2)}%`)
      el[pIndex + 1] = `${el[pIndex + 1]}/${sum}`
    })
  }

  populate (container) {
    new DataFrameView(this.list).populate(container)
  }
}

class AffixMath {
  static distribution (n, magic) {
    if (magic) {
      if (n !== 2) {
        throw new Error('two affixes max for magic')
      }
      return [
        { prefix: 0, suffix: 1, p: 0.50 },
        { prefix: 1, suffix: 0, p: 0.25 },
        { prefix: 1, suffix: 1, p: 0.25 }
      ]
    }
    if (n <= 0 || n > 6 || Number(n) !== n) {
      throw new Error(`unknown n for affix distribution n=${n}`)
    }
    const hist = {}
    const k = 3
    const recur = (a, b, p) => {
      if (a + b >= n) {
        const key = `${a}/${b}`
        hist[key] = hist[key] + p || p
        return
      }
      if (a >= k) {
        recur(a, b + 1, p)
        return
      }
      if (b >= k) {
        recur(a + 1, b, p)
        return
      }
      recur(a + 1, b, p * 0.5)
      recur(a, b + 1, p * 0.5)
    }
    recur(0, 0, 1)
    const res = []
    for (const [key, val] of Object.entries(hist)) {
      const pair = key.split('/')
      const a = Number(pair[0])
      const b = Number(pair[1])
      res.push({
        prefix: a,
        suffix: b,
        p: val
      })
    }
    return res
  }
}

class MonsterSourcer {
  static monLevelKeys = Array.from({ length: 3 }, (_, id) => `MonLvl${id + 1}Ex`)
  static monNormalKeys = Array.from({ length: 25 }, (_ , id) => `mon${id + 1}`)
  static monHellKeys = Array.from({ length: 25 }, (_ , id) => `nmon${id + 1}`)
  static monUniqueKeys = Array.from({ length: 25 }, (_ , id) => `umon${id + 1}`)
  static monBossLevelKeys = ['Level', 'Level(N)', 'Level(H)']
  static monMinionKeys = ['minion1', 'minion2']
  static monNormalTreasureKeys = Array.from({ length: 4 }, (_, id) => `TreasureClass${id + 1}`)
  static monNightmareTreasureKeys = Array.from({ length: 4 }, (_, id) => `TreasureClass${id + 1}(N)`)
  static monHellTreasureKeys = Array.from({ length: 4 }, (_, id) => `TreasureClass${id + 1}(H)`)
  static monExpKey = 'Exp'
  static monTreasureKeys = [
    MonsterSourcer.monNormalTreasureKeys,
    MonsterSourcer.monNightmareTreasureKeys,
    MonsterSourcer.monHellTreasureKeys
  ]
  static superTreasureKeys = ['TC', 'TC(N)', 'TC(H)']

  constructor (levels, monsters, supers) {
    this.levelData = levels
    this.monsterData = monsters
    this.superData = supers
    this.setup()
  }

  setup () {
    this.inverseMonsterMap = new Map()
    this.monsterData.each(monster => {
      if (monster.killable === '1') {
        this.inverseMonsterMap.set(monster.Id, monster)
      }
    })
    this.inverseLevelMap = new Map()
    this.levelData.each(level => {
      this.inverseLevelMap.set(level.Name, level)
    })
  }

  bosses () {
    const res = []
    this.monsterData.each(monster => {
      if (monster.NameStr === '' || monster.boss !== '1' || monster.killable !== '1') {
        return
      }
      res.push(this.expand({
        Name: 'boss'
      }, 0, monster.Id, new Set(), false))
      res.push(this.expand({
        Name: 'boss'
      }, 1, monster.Id, new Set(), false))
      res.push(this.expand({
        Name: 'boss'
      }, 2, monster.Id, new Set(), false))
    })
    return res.flat(Infinity)
  }

  super (id) {
    return !!this.superData.first('Class', id)
  }

  supers () {
    const res = []
    this.superData.each(superUnique => {
      if (!superUnique.Class) {
        return
      }
      const monster = this.inverseMonsterMap.get(superUnique.Class)
      for (let difficulty = 0; difficulty < 3; ++difficulty) {
        const monLevel = Number(monster.boss === '1' ? monster[MonsterSourcer.monBossLevelKeys[difficulty]] : 1)
        res.push({
          id: monster.Id,
          rarity: 2,
          difficulty,
          level: monLevel + 3,
          treasure: superUnique[MonsterSourcer.superTreasureKeys[difficulty]],
          xp: Number(monster[MonsterSourcer.monExpKey]),
          from: 'superunique (beta)',
          string: monster['NameStr']
        })
      }
    })
    return res.flat(Infinity)
  }

  quests () {
    const res = []
    this.monsterData.each(monster => {
      if (monster.boss !== '1' || monster.killable !== '1') {
        return
      }
      res.push(this.expand({
        Name: 'boss'
      }, 0, monster.Id, new Set(), false))
      res.push(this.expand({
        Name: 'boss'
      }, 1, monster.Id, new Set(), false))
      res.push(this.expand({
        Name: 'boss'
      }, 2, monster.Id, new Set(), false))
    })
    return res.flat(Infinity)
  }

  levels (monsterId) {
    const monster = this.inverseMonsterMap.get(monsterId)
    if (!monster) {
      throw new Error(`unknown level: ${monsterId}`)
    }
  }

  monsters (levelId, nestable = true) {
    const level = this.inverseLevelMap.get(levelId)
    if (!level) {
      throw new Error(`unknown level: ${levelId}`)
    }
    const res = []
    MonsterSourcer.monNormalKeys.forEach(key => {
      const monsterId = level[key]
      if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
        return
      }
      res.push(this.expand(level, 0, monsterId, new Set(), nestable))
    })
    MonsterSourcer.monHellKeys.forEach(key => {
      const monsterId = level[key]
      if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
        return
      }
      res.push(this.expand(level, 1, monsterId, new Set(), nestable))
    })
    MonsterSourcer.monHellKeys.forEach(key => {
      const monsterId = level[key]
      if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
        return
      }
      res.push(this.expand(level, 2, monsterId, new Set(), nestable))
    })
    return this.filter(res.flat(Infinity))
  }

  expand (level, difficulty, monsterId, set, nestable = true) {
    const res = []
    if (set.has(monsterId)) {
      return res
    }
    set.add(monsterId)
    const monster = this.inverseMonsterMap.get(monsterId)
    const monLevel = Number(monster.boss !== '1' ? level[MonsterSourcer.monLevelKeys[difficulty]] : monster[MonsterSourcer.monBossLevelKeys[difficulty]])
    if (nestable) {
      // maybe check min too?
      if (monster.PartyMax > 0) {
        MonsterSourcer.monMinionKeys.forEach(minion => {
          const minionId = monster[minion]
          if (minionId && this.inverseMonsterMap.has(minionId)) {
            res.push(this.expand(level, difficulty, minionId, set))
          }
        })
      }
      if (monster.SplEndDeath === '1') {
        const minionId = monster[MonsterSourcer.monMinionKeys[0]]
        if (minionId && this.inverseMonsterMap.has(minionId)) {
          res.push(this.expand(level, difficulty, minionId, set))
        }
      }
      if (monster.placespawn === '1') {
        const minionId = monster.spawn
        if (minionId && this.inverseMonsterMap.has(minionId)) {
          res.push(this.expand(level, difficulty, minionId, set))
        }
      }
    }
    // normal, champion, unique
    const levelTable = [0, 2, 3]
    if (monster.boss === '1') {
      res.push({
        id: monsterId,
        rarity: 2,
        difficulty,
        level: monLevel + (this.super(monsterId) ? 3 : 0),
        treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][2]],
        xp: Number(monster[MonsterSourcer.monExpKey]),
        from: level.Name,
        string: monster['NameStr']
      })
      // quest tc
      if (monster[MonsterSourcer.monTreasureKeys[difficulty][3]]) {
        res.push({
          id: monsterId,
          rarity: 2,
          difficulty,
          level: monLevel + (this.super(monsterId) ? 3 : 0),
          treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][3]],
          xp: Number(monster[MonsterSourcer.monExpKey]),
          from: level.Name,
          string: monster['NameStr']
        })
      }
    } else {
      for (let j = 0; j < 4; ++j) {
        const treasure = monster[MonsterSourcer.monTreasureKeys[difficulty][j]]
        if (treasure.length > 0) {
          res.push({
            id: monsterId,
            rarity: j,
            difficulty,
            level: monLevel + levelTable[j < 4 ? j : 3],
            treasure,
            xp: Number(monster[MonsterSourcer.monExpKey]),
            from: level.Name,
            string: monster['NameStr']
          })
          if (j === 2) {
            res.push({
              id: monsterId,
              rarity: 5,
              difficulty,
              level: monLevel + 3,
              treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][0]],
              xp: Number(monster[MonsterSourcer.monExpKey]),
              from: level.Name,
              string: monster['NameStr']
            })
          }
        }
      }
    }
    return res
  }

  filter (monsters) {
    const cmp = (a, b) => {
      let c
      c = a.difficulty - b.difficulty
      if (c) {
        return c
      }
      c = a.id.localeCompare(b.id)
      if (c) {
        return c
      }
      c = a.rarity - b.rarity
      if (c) {
        return c
      }
      c = a.level - b.level
      if (c) {
        return c
      }
      return 0
    }
    monsters.sort(cmp)
    const res = []
    for (const monster of monsters) {
      if (res.length === 0) {
        res.push(monster)
      } else if (cmp(monster, res.at(-1))) {
        res.push(monster)
      }
    }
    return res
  }
}

class TreasureTree {
  static itemKeys = Array.from({ length: 10 }, (_, id) => `Item${id + 1}`)
  static probKeys = Array.from({ length: 10 }, (_, id) => `Prob${id + 1}`)
  static mergeKeys = ['unique', 'set', 'rare', 'magic']

  constructor (treasure, typeList, weapons, armors) {
    this.treasure = treasure
    this.weapons = weapons
    this.armors = armors
    this.typeList = typeList
    this.setup()
  }

  setup () {
    this.computedEval = new Map()
    this.inverseTreasureMap = new Map()
    this.groupMap = new Map()
    this.treasure.each(treasure => {
      this.inverseTreasureMap.set(treasure['Treasure Class'], treasure)
      const group = treasure.group
      if (group) {
        let list = this.groupMap.get(group)
        if (!list) {
          list = []
          this.groupMap.set(group, list)
        }
        list.push(treasure)
      }
    })
    const types = {
      'weap': {
        list: this.weapons,
        predicate: 'weap'
      },
      'armo': {
        list: this.armors,
        predicate: 'armo'
      },
      'mele': {
        list: this.weapons,
        predicate: 'mele'
      },
      'bow': {
        list: this.weapons,
        predicate: 'bow'
      }
    }
    this.typeMap = {}
    for (const type in types) {
      const { list, predicate } = types[type]
      const children = this.typeList.expand(predicate)
      list.each(el => {
        if (el.spawnable !== '1' || el.rarity <= 0) {
          return
        }
        if (!children.includes(el.code)) {
          return
        }
        const group = Math.ceil(el.level / 3) * 3
        const key = `${predicate}${group}`
        const pseudo = this.typeMap[key] = this.typeMap[key] || {
          id: key,
          sum: 0,
          noDrop: 0,
          picks: 1,
          unique: 0,
          set: 0,
          rare: 0,
          magic: 0,
          children: []
        }
        const p = Number(el.rarity)
        pseudo.sum += p
        pseudo.children.push({ id: el.code, p })
      })
    }
    for (const members of this.groupMap.values()) {
      members.sort((a, b) => {
        return Number(a.level) - Number(b.level)
      })
    }
  }

  has (id) {
    return this.inverseTreasureMap.has(id) || /(?:weap|armo|mele)\d+/.test(id)
  }

  upgrade (id, level) {
    const treasure = this.inverseTreasureMap.get(id)
    if (!treasure) {
      return id
    }
    const members = this.groupMap.get(treasure.group)
    if (!members) {
      return id
    }
    let best = 0
    let bestId = ''
    for (let i = 0; i < members.length; ++i) {
      if (members[i]['Treasure Class'] === id) {
        for (let j = i + 1; j < members.length; ++j) {
          if (members[j].level > level) {
            return members[j - 1]['Treasure Class']
          }
        }
        return members.at(-1)['Treasure Class']
      }
    }
    return id
  }

  noDrop (n, { noDrop, sum }) {
    return n <= 1 ? noDrop : Math.floor(sum / (1 / Math.pow(noDrop / (noDrop + sum), n) - 1))
  }

  walk (id, n, walker) {
    const override = {
      'Durielq (H)': 1,
      'Durielq (N)': 1,
      'Durielq': 1,
      'Duriel (H)': 1,
      'Duriel (N)': 1,
      'Duriel': 1
    }
    const stack = []
    stack.push({ treasure: this.eval(id), p: 1 })
    while (stack.length > 0) {
      const { treasure, p } = stack.pop()
      const noDrop = this.noDrop(n, treasure)
      if (treasure.picks > 0) { 
        let k = treasure.picks
        if (k > 6) {
          k = 6
        }
        if (treasure.id in override) {
          k = override[treasure.id]
        }
        for (const { id: childId, p: childP } of treasure.children) {
          const pickP = k * p * childP / (noDrop + treasure.sum)
          if (this.has(childId)) {
            const child = this.eval(childId)
            stack.push({ treasure: this.merge(child, treasure), p: pickP })
          } else {
            const val = Object.assign({}, treasure)
            val.id = childId
            walker.pre(val, pickP)
          }
        }
      } else {
        for (const { id: childId, p: childP } of treasure.children) {
          const pickP = p * childP / (noDrop + treasure.sum)
          if (this.has(childId)) {
            const child = this.eval(childId)
            stack.push({ treasure: this.merge(child, treasure), p: pickP })
          } else {
            const val = Object.assign({}, treasure)
            val.id = childId
            walker.pre(val, pickP)
          }
        } 
      }
    }
  }

  table (n) {
    const varys = new Map()
    const graph = new Graph()
    this.treasure.each(raw => {
      const treasure = this.eval(raw['Treasure Class'])
      const noDrop = this.noDrop(n, treasure)
      if (treasure.picks > 0 && (noDrop > 0 || (treasure.picks > 1 || treasure.picks < 0))) {
        varys.set(treasure.id, treasure)
      }
      treasure.children.forEach(child => {
        graph.edge(child.id, treasure.id)
      })
    })
    const cv = new Map()
    graph.top(node => {
      if (varys.has(node.name)) {
        node.children.forEach(child => {
          if (!varys.has(child)) {
            varys.set(child, this.eval(child))
          }
          if (!cv.has(child)) {
            cv.set(child, [])
          }
          cv.get(child).push(this.eval(node.name))
        })
      }
    })
  }

  merge (a, b) {
    a = Object.assign({}, a)
    TreasureTree.mergeKeys.forEach(key => {
      a[key] = Math.max(a[key], b[key])
    })
    return a
  }

  eval (id) {
    if (/(?:weap|armo|mele)\d+/.test(id)) {
      return this.pseudo(id)
    }
    let res = this.computedEval.get(id)
    if (res) {
      return res
    }
    const treasure = this.inverseTreasureMap.get(id)
    if (!treasure) {
      throw new Error(`unknown treasure class: ${id}`)
    }
    let children = []
    let sum = TreasureTree.probKeys.reduce((sum, key, idx) => {
      const itemId = treasure[TreasureTree.itemKeys[idx]]
      if (!itemId) {
        return sum
      }
      const p = Number(treasure[key])
      children.push({ id: itemId, p })
      return sum + p
    }, 0)
    let noDrop = Number(treasure.NoDrop)
    let picks = Number(treasure.Picks)
    let unique = Number(treasure.Unique)
    let set = Number(treasure.Set)
    let rare = Number(treasure.Rare)
    let magic = Number(treasure.Magic)
    res = {
      id,
      sum,
      noDrop,
      picks,
      unique,
      set,
      rare,
      magic,
      children
    }
    this.computedEval.set(id, res)
    return res
  }

  pseudo (id) {
    return  this.typeMap[id]
  }
}

class StringTable {
  static headerFormat = [
    { name: 'crc', size: 2 },
    { name: 'indices', size: 2 },
    { name: 'entries', size: 4 },
    { name: 'version', size: 1 },
    { name: 'first', size: 4 },
    { name: 'limit', size: 4 },
    { name: 'last', size: 4 }
  ]

  static entryFormat = [
    { name: 'used', size: 1 },
    { name: 'index', size: 2 },
    { name: 'hash', size: 4 },
    { name: 'keyIndex', size: 4 },
    { name: 'stringIndex', size: 4 },
    { name: 'length', size: 2 },
  ]

  static marshal = {
    1: (view, offset) => {
      return view.getUint8(offset, true)
    },
    2: (view, offset) => {
      return view.getUint16(offset, true)
    },
    4: (view, offset) => {
      return view.getUint32(offset, true)
    }
  }

  static read (buffer, format, offset = 0) {
    const view = new DataView(buffer)
    const res = { length: 0, value: {} }
    format.forEach(({ name, size }) => {
      if (!name) {
        res.length += size
        return
      }
      res.value[name] = StringTable.marshal[size](view, offset + res.length)
      res.length += size
    })
    return res
  }

  constructor (uri) {
    this.uri = uri
  }

  async load () {
    const res = await fetch(this.uri)
    if (!res.ok) {
      throw new Error(`fetch ${this.uri}: ${res.statusText}`)
    }
    const buffer = await res.arrayBuffer()
    this.parse(buffer)
  }

  parse (buffer) {
    let offset = 0
    let ret = StringTable.read(buffer, StringTable.headerFormat, offset)
    offset += ret.length
    this.header = ret.value
    // indicies occupy [offset, offset + indicies * 2)
    offset += this.header.indices * 2
    this.entries = []
    for (let i = 0; i < this.header.entries; ++i) {
      ret = StringTable.read(buffer, StringTable.entryFormat, offset)
      offset += ret.length
      this.entries.push(ret.value)
    }
    this.raw = buffer.slice(offset)
    this.rawIndex = offset
    const map = new Map()
    const view = new DataView(buffer)
    this.entries.forEach(entry => {
      let length = 0
      for (let i = entry.keyIndex; i < view.byteLength; ++i, ++length) {
        if (view.getInt8(i) === 0) {
          break
        }
      }
      const key = this.string(entry.keyIndex, length)
      const value = this.string(entry.stringIndex, entry.length - 1)
      map.set(key, value)
    })
    this.map = map
  }

  string (offset, length) {
    return new TextDecoder('latin1', { fatal: true }).decode(new DataView(this.raw, offset - this.rawIndex, length))
  }

  get (key) {
    if (!this.map) {
      return key
    }
    const res = this.map.get(key)
    if (!res) {
      return key
    }
    return res
  }
}

class StringResolver {
  constructor (uris) {
    this.uris = uris
    this.tables = uris.map(uri => new StringTable(uri))
  }

  async load () {
    return await Promise.all(this.tables.map(table => table.load()))
  }

  get (key) {
    let res = key
    this.tables.some(table => {
      res = table.get(key)
      if (!res || res.length === 0) {
        throw new Error(`key=${key}`)
      }
      return res !== key  
    })
    return res
  }
}

class MonsterMetrics {
  constructor (monsters, extended) {
    this.monsters = monsters
    this.extended = extended
  }

  blockRate ({ name, id }) {
    let monster = name ? this.monsters.first('Id', name) : this.monsters.first('hcIdx', id)
    if (monster['NoShldBlock'] || this.hasBlockMode(monster['MonStatsEx'])) {
      return [
        monster['ToBlock'],
        monster['ToBlock(N)'],
        monster['ToBlock(H)'],
      ]
    }
    return [0, 0, 0]
  }

  hasBlockMode (id) {
    return this.extended.first('Id', id)['mBL'] === '1'
  }
}

if (window.module && module.exports) {
  module.exports = {
    DataFrame,
    TypeList
  }
}
