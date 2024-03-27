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
    this.computed = []
    this.firsts = new Map()
  }

  async load () {
    const res = await fetch(this.uri)
    const text = await res.text()
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const values = line.split('\t')
      if (!this.keys) {
        this.keys = values
      } else if (values.length === this.keys.length) {
        this.values.push(values)
      }
    }
  }

  first (key, val) {
    if (this.firsts.has(key)) {
      this.firsts.get(key).get(val)
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

  set (idx, val) {
    this.computed[idx] = val
  }

  get (idx) {
    return this.computed[idx]
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

class DataView {
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

  expand (type) {
    const children = []
    this.children(type).forEach(type => {
      children.push(this.expand(type))
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
    new DataView(this.list).populate(container)
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
  static monTreasureKeys = [
    MonsterSourcer.monNormalTreasureKeys,
    MonsterSourcer.monNightmareTreasureKeys,
    MonsterSourcer.monHellTreasureKeys
  ]

  constructor (levels, monsters) {
    this.levelData = levels
    this.monsterData = monsters
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

  monsters (levelId) {
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
      res.push(this.expand(level, 0, monsterId, new Set()))
    })
    MonsterSourcer.monHellKeys.forEach(key => {
      const monsterId = level[key]
      if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
        return
      }
      res.push(this.expand(level, 1, monsterId, new Set()))
    })
    MonsterSourcer.monHellKeys.forEach(key => {
      const monsterId = level[key]
      if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
        return
      }
      res.push(this.expand(level, 2, monsterId, new Set()))
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
        level: monLevel + 3,
        treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][2]],
        from: level.Name
      })
    } else {
      for (let j = 0; j < 3; ++j) {
        res.push({
          id: monsterId,
          rarity: j,
          difficulty,
          level: monLevel + levelTable[j],
          treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][j]],
          from: level.Name
        })
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

  constructor (treasure) {
    this.treasure = treasure
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
    for (const members of this.groupMap.values()) {
      members.sort((a, b) => {
        return Number(a.level) - Number(b.level)
      })
    }
  }

  has (id) {
    return this.inverseTreasureMap.has(id)
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
    for (let i = 0; i < members.length; ++i) {
      if (members[i]['Treasure Class'] === id) {
        for (let j = i + 1; j < members.length; ++j) {
          if (members[j].level > level) {
            return members[j - 1]['Treasure Class']
          }
        }
        break
      }
    }
    return id
  }

  noDrop (n, noDrop, sum) {
    return n <= 1 ? noDrop : Math.floor(sum / (1 / Math.pow(noDrop / (noDrop + sum), n) - 1))
  }

  walk (id, n, walker) {
    const stack = []
    stack.push({ treasure: this.eval(id), p: 1 })
    while (stack.length > 0) {
      const { treasure, p } = stack.pop()
      const noDrop = this.noDrop(n, treasure.noDrop, treasure.sum)
      for (const { id: childId, p: childP } of treasure.children) {
        const pickP = p * childP / (noDrop + treasure.sum)
        if (this.has(childId)) {
          const child = this.eval(childId)
          stack.push({ treasure: this.merge(child, treasure), p: pickP })
        } else {
          const val = Object.assign({}, treasure)
          delete val.children
          delete val.picks
          delete val.sum
          delete val.noDrop
          val.id = childId
          walker.pre(val, pickP)
        }
      }
    }
  }

  table (id, n) {

  }

  merge (a, b) {
    a = Object.assign({}, a)
    TreasureTree.mergeKeys.forEach(key => {
      a[key] = Math.max(a[key], b[key])
    })
    return a
  }

  eval (id) {
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
}
