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
    const promises = []
    for (const file of files) {
      promises.push(this.load(version, file))
    }
    await Promise.all(promises)
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
    this.alls = new Map()
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

  all (key, val) {
    if (this.alls.has(key)) {
      return this.alls.get(key).get(val) || []
    }
    const k = this.keys.indexOf(key)
    if (k < 0) {
      throw new Error(`unknown key: ${key}`)
    }
    const map = new Map()
    this.alls.set(key, map)
    this.each(value => {
      if (!map.has(value[key])) {
        map.set(value[key], [])
      }
      map.get(value[key]).push(value)
    })
    return this.alls.get(key).get(val) || []
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

  map (cb) {
    const res = []
    this.each(value => {
      res.push(cb(value))
    })
    return res
  }

  reduce (cb, first) {
    this.each((value, i) => {
      first = cb(first, value, i)
    })
    return first
  }

  keyIndex (needle) {
    return this.keys.indexOf(needle)
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
      this.populateRow(bdy, 'td', value)
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
    this.cache = {}
    this.ancestorCache = {}
  }

  all () {
    const res = Object.keys(this.set)
    return res
  }

  types () {
    return this.all()
  }

  items () {
    return this.itemList
  }

  same (a, b) {
    if (a === b) {
      return true
    }
    return this.equivalent(a, b)
  }

  itemIs (item, type) {
    const entry = this.entry(item)
    return this.equivalent(entry.type, type) || (entry.type2.length > 0 && this.equivalent(entry.type2, type))
  }

  equivalent (a, b) {
    if (!this.has(a) || !this.has(b)) {
      return false
    }
    if (a in this.cache && b in this.cache[a]) {
      return this.cache[a][b]
    }
    const res = this.ancestors(a).has(b)
    this.cache[a] = this.cache[a] || {}
    return this.cache[a][b] = res
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
    if (this.ancestorCache[type]) {
      return new Set(this.ancestorCache[type])
    }
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
    this.ancestorCache[type] = res
    return new Set(res)
  }

  build (miscTxt, typesTxt, weaponsTxt, armorsTxt) {
    this.set = {}
    this.itemList = []
    typesTxt.each(row => {
      this.add(row.Code, [row.Equiv1, row.Equiv2])
    })
    miscTxt.each(entry => {
      if (entry.code.length > 0) {
        this.itemList.push(entry.code)
      }
    })
    weaponsTxt.each(entry => {
      if (entry.code.length > 0) {
        this.itemList.push(entry.code)
      }
    })
    armorsTxt.each(entry => {
      if (entry.code.length > 0) {
        this.itemList.push(entry.code)
      }
    })
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
      cellSet.add('*comment')
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

  constructor (item, typeList, data, level, isRare) {
    this.item = item
    const entry = typeList.entry(item.code)
    this.type = entry.type
    this.type2 = entry.type2
    this.typeList = typeList
    this.classSet = new Set(this.typeList.expand('clas'))
    this.classesMap = new Map()
    const clazzes = this.typeList.children('clas')
    for (const clazz of clazzes) {
      for (const child of this.typeList.expand(clazz)) {
        this.classesMap.set(child, clazz.substring(0, 3))
      }
    }
    this.level = level
    this.isRare = isRare
    this.data = data.filter(this.rowFilter.bind(this), AffixList.cellFilter)
    if (entry['magic lvl'] > 0) {
      const fIdx = this.data.keyIndex('frequency')
      const lIdx = this.data.keyIndex('level')
      this.data.values.forEach(value => {
        value[fIdx] *= value[lIdx]
      })
    }
  }

  matchingType (aff) {
    const ins = AffixList.iTypes.map(i => aff[i]).filter(el => el)
    const outs = AffixList.eTypes.map(i => aff[i]).filter(el => el)
    const fn = el => this.typeList.same(this.type, el) || (this.type2.length > 0 && this.typeList.same(this.type2, el))
    return ins.some(fn) && !outs.some(fn)
  }

  rowFilter (aff) {
    const isTypeClassy = this.classSet.has(this.type)
    const matchingClass = !isTypeClassy || aff.classspecific === '' || aff.classspecific === this.classesMap.get(this.type)
    const withinLevel = aff.level <= this.level && (aff.maxlevel === '' || this.level <= aff.maxlevel)
    const matchingRarity = !this.isRare || aff.rare === '1'
    const matchingType = this.matchingType(aff)
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
    this.list.keys[list.data.keyIndex('*comment')] = 'id'
    this.list.keys.splice(nIndex + 2, 0, 'p')
    let pIndex = list.data.keyIndex('frequency')
    const sum = this.list.values.reduce((sum, el) => sum + Number(el[pIndex]), 0)
    this.list.values.forEach(el => {
      el.splice(nIndex + 2, 0, `${(el[pIndex] / sum * 100).toFixed(2)}%`)
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
  static monExpKeys = ['Exp', 'Exp(N)', 'Exp(H)']
  static monTreasureKeys = [
    MonsterSourcer.monNormalTreasureKeys,
    MonsterSourcer.monNightmareTreasureKeys,
    MonsterSourcer.monHellTreasureKeys
  ]
  static superTreasureKeys = ['TC', 'TC(N)', 'TC(H)']
  static staticMonsters = {
    'act2hireTraitorBoss': { area: 'Caldeum Map' },
    'andariel': { area: 'Act 1 - Catacombs 4' },
    'ArcaneBoss': { area: 'Arcane' },
    'archerBoss': { area: 'Pandemonium Map' },
    'AshenBoss': { area: 'Ashen Plains Map', boss: true },
    'baalclone': { area: 'Act 5 - World Stone' },
    'baalclone': { area: 'PD2 Pandemonium Finale' },
    'baalcrab': { area: 'Act 5 - World Stone' },
    'baalminionboss': { area: 'River Of Blood' },
    'baaltentacle3': { area: 'Act 5 - World Stone' },
    'baaltentacle3': { area: 'PD2 Pandemonium Finale' },
    'baaltentacle4': { area: 'PD2 Pandemonium Finale' },
    'baaltentacle4': { area: 'PD2 Pandemonium Finale' },
    'BastionBoss': { area: 'Fortress Map' },
    'boneprison1': { area: ['Necropolis Swamp', 'PD2 Pandemonium Finale'] },
    'boneprison2': { area: ['Necropolis Swamp', 'PD2 Pandemonium Finale'] },
    'boneprison3': { area: ['Necropolis Swamp', 'PD2 Pandemonium Finale'] },
    'boneprison4': { area: ['Necropolis Swamp', 'PD2 Pandemonium Finale'] },
    'CanyonBoss': { area: 'Frozen Forest Map' },
    'CowBoss': { area: 'Graveyard Map' },
    'dcloneskele': { area: 'UberDiabloLvl' },
    'dcloneskelearcher': { area: 'UberDiabloLvl' },
    'dcloneskmage_cold': { area: 'UberDiabloLvl' },
    'dcloneskmage_fire': { area: 'UberDiabloLvl' },
    'dcloneskmage_ltng': { area: 'UberDiabloLvl' },
    'dcloneskmage_pois': { area: 'UberDiabloLvl' },
    'diablo': { area: 'Act 4 - Diablo 1' },
    'doomknight3LibraryBoss': { area: 'Library Map' },
    'duriel': { area: 'Act 2 - Duriel\'s Lair' },
    'fingermageboss': { area: 'Hole of Terror' },
    'griswoldmap': { area: 'River Of Blood' },
    'IceBoss': { area: 'Ice Map' },
    'Iskatu': { area: 'Diamond Gate' },
    'KanemithBoss': { area: 'Kanemith Dungeon' },
    'leoricMapBoss': { area: 'Crypts Map' },
    'lernaeanhydra1': { area: 'Ruined Cistern Map' },
    'lernaeanhydra2': { area: 'Ruined Cistern Map', boss: true },
    'lightningspire': { area: 'Arcane' },
    'MarketBoss': { area: 'Desert Map' },
    'megademon6': { area: 'PD2 Pandemonium Finale' },
    'megademonboss': { area: 'Lava' },
    'mephisto': { area: 'Act 3 - Mephisto 3' },
    'rathmaBloodGolem': { area: 'Necropolis Jungle' },
    'rathmaBone': { area: 'Necropolis Swamp' },
    'rathmaBoneClone': { area: 'Necropolis Void' },
    'rathmaPoison': { area: 'Necropolis Jungle' },
    'rathmaPoisonClone': { area: 'Necropolis Void' },
    'rathmaTotem': { area: ['Necropolis Swamp', 'Necropolis Void'] },
    'reanimatedhorde3': { area: 'Act 5 - Temple Entrance' },
    'SewerBoss': { area: 'Sewers' },
    'SharpToothBoss': { area: 'Kanemith Outside' },
    'siegebeastMapBoss': { area: 'Black Abyss Map' },
    'siegebeastMapBossFallen': { area: 'Black Abyss Map' },
    'SiegeBoss': { area: 'Siege Map' },
    'sk_archer11': { area: 'PD2 Pandemonium Finale' },
    'skeleton8': { area: 'PD2 Pandemonium Finale' },
    'skmage_cold6': { area: 'PD2 Pandemonium Finale' },
    'skmage_fire7': { area: 'PD2 Pandemonium Finale' },
    'skmage_ltng7': { area: 'PD2 Pandemonium Finale' },
    'skmage_pois7': { area: 'PD2 Pandemonium Finale' },
    'spiderboss': { area: 'Spider Map' },
    'ThroneBoss': { area: 'Throne Map' },
    'TombBoss': { area: 'Tomb Map' },
    'torajanBoss': { area: 'Jungle Map' },
    'torajanBossMaggot': { area: 'Jungle Map' },
    'uberandariel': { area: 'Act 5 - Pandemonium 1' },
    'uberbaal': { area: 'PD2 Pandemonium Finale' },
    'uberdiablo': { area: 'PD2 Pandemonium Finale' },
    'uberdiablonew': { area: 'UberDiabloLvl' },
    'uberduriel': { area: 'Act 5 - Pandemonium 2' },
    'uberizual': { area: 'Act 5 - Pandemonium 3' },
    'ubermephisto': { area: 'PD2 Pandemonium Finale' },
    'unravelerboss': { area: 'Kurast' },
    'vampire9': { area: 'PD2 Pandemonium Finale' },
    'voidKnightCold': { area: ['Necropolis Swamp', 'Necropolis Void'] },
    'voidKnightFire': { area: ['Necropolis Swamp', 'Necropolis Void'] },
    'voidKnightPhys': { area: ['Necropolis Swamp', 'Necropolis Void'] },
    'voidKnightPoison': { area: ['Necropolis Swamp', 'Necropolis Void'] },
    'WarlordMiniBossDefiler': { area: 'Hellcave Fortress' },
    'WarlordMiniBossShaman': { area: 'Hellcaves' },
    'WarlordOfBlood': { area: 'Hellcave Fortress' },
    'westmarchMapBoss': { area: 'Westmarch Map' },
    'willowispboss': { area: 'Realm of Terror', boss: true },
    'willowispminion': { area: 'Hole of Terror' },
    'willowisptotem': { area: 'Hole of Terror' },
    'wraith9': { area: 'PD2 Pandemonium Finale' },
    'ZharMiniBossBaboon': { area: 'Zhar Kurast' },
    'ZharMiniBossBigHead': { area: 'Zhar Ice' },
    'ZharMiniBossCantor': { area: 'Zhar Rivers' },
    'ZharTheMad': { area: 'Zhar Library' },
    'uberancientbarb1': { area: 'Uber Ancients' },
    'uberancientbarb2': { area: 'Uber Ancients' },
    'uberancientbarb3': { area: 'Uber Ancients' },
    'izual': { area: 'Act 4 - Mesa 2' },
    'bloodraven': { area: 'Act 1 - Graveyard' },
    'SkovosBoss': { area: 'Skovos Stronghold Map' },
    'DemonRoadBoss': { area: 'Demon Road Map' },
    'ImperialPalaceMiniBoss': { area: 'Imperial Palace Map' },
    'ImperialPalaceBossMinion': { area: 'Imperial Boss Map' },
    'ImperialPalaceBoss': { area: 'Imperial Boss Map' },
    'TortureHallsBoss': { area: 'Halls of Torture Map' },
    'RadamentBoss': { area: 'Sanctuary Of Sin Map' },
    'LucionSpawner': { area: 'Lucion Arena' },
    'LucionSpawn': { area: 'Lucion Arena' },
    'LucionSpawnRanged': { area: 'Lucion Arena' },
    'LucionSpawnTank': { area: 'Lucion Arena' },
    'Lucion': { area: 'Lucion Arena' },
  }
  static staticSuperMonsters = {
    'Bishibosh': { area: 'Act 1 - Wilderness 2' },
    'Bonebreak': { area: 'Act 1 - Crypt 1 A' },
    'Coldcrow': { area: 'Act 1 - Cave 2' },
    'Rakanishu': { area: 'Act 1 - Wilderness 3' },
    'Treehead WoodFist': { area: 'Act 1 - Wilderness 4' },
    'Griswold': { area: 'Act 1 - Tristram' },
    'The Countess': { area: 'Act 1 - Crypt 3 E' },
    'Pitspawn Fouldog': { area: 'Act 1 - Jail 2' },
    'Boneash': { area: 'Act 1 - Cathedral' },
    'Radament': { area: 'Act 2 - Sewer 1 C' },
    'Bloodwitch the Wild': { area: 'Act 2 - Tomb 2 Treasure' },
    'Fangskin': { area: 'Act 2 - Tomb 3 Treasure' },
    'Beetleburst': { area: 'Act 2 - Desert 3' },
    'Leatherarm': { area: 'Act 2 - Tomb 1 Treasure' },
    'Coldworm the Burrower': { area: 'Act 2 - Lair 1 Treasure' },
    'Fire Eye': { area: 'Act 2 - Basement 3' },
    'Dark Elder': { area: 'Act 2 - Desert 4' },
    'The Summoner': { area: 'Act 2 - Arcane' },
    'Ancient Kaa the Soulless': { area: 'Act 2 - Tomb Tal 1' },
    'The Smith': { area: 'Act 1 - Barracks' },
    'Web Mage the Burning': { area: 'Act 3 - Spider 2' },
    'Witch Doctor Endugu': { area: 'Act 3 - Dungeon 2 Treasure' },
    'Stormtree': { area: 'Act 3 - Kurast 1' },
    'Sarina the Battlemaid': { area: 'Act 3 - Temple 1' },
    'Icehawk Riftwing': { area: 'Act 3 - Sewer 1' },
    'Ismail Vilehand': { area: 'Act 3 - Travincal' },
    'Geleb Flamefinger': { area: 'Act 3 - Travincal' },
    'Bremm Sparkfist': { area: 'Act 3 - Mephisto 3' },
    'Toorc Icefist': { area: 'Act 3 - Travincal' },
    'Wyand Voidfinger': { area: 'Act 3 - Mephisto 3' },
    'Maffer Dragonhand': { area: 'Act 3 - Mephisto 3' },
    'Infector of Souls': { area: 'Act 4 - Diablo 1' },
    'Lord De Seis': { area: 'Act 4 - Diablo 1' },
    'Grand Vizier of Chaos': { area: 'Act 4 - Diablo 1' },
    'The Cow King': { area: 'Act 1 - Moo Moo Farm' },
    'Corpsefire': { area: 'Act 1 - Cave 1' },
    'The Feature Creep': { area: 'Act 4 - Lava 1' },
    'Siege Boss': { area: 'Act 5 - Siege 1' },
    'Ancient Barbarian 1': { area: 'Act 5 - Mountain Top' },
    'Ancient Barbarian 2': { area: 'Act 5 - Mountain Top' },
    'Ancient Barbarian 3': { area: 'Act 5 - Mountain Top' },
    'Bonesaw Breaker': { area: 'Act 5 - Ice Cave 2' },
    'Dac Farren': { area: 'Act 5 - Siege 1' },
    'Megaflow Rectifier': { area: 'Act 5 - Barricade 1' },
    'Eyeback Unleashed': { area: 'Act 5 - Barricade 1' },
    'Threash Socket': { area: 'Act 5 - Barricade 2' },
    'Pindleskin': { area: 'Act 5 - Temple Entrance' },
    'Snapchip Shatter': { area: 'Act 5 - Ice Cave 3A' },
    'Sharp Tooth Sayer': { area: 'Act 5 - Barricade 1' },
    'Frozenstein': { area: 'Act 5 - Ice Cave 1A' },
    'Nihlathak Boss': { area: 'Act 5 - Temple Boss' },
    'Baal Subject 1': { area: 'Act 5 - Throne Room' },
    'Baal Subject 2': { area: 'Act 5 - Throne Room' },
    'Baal Subject 3': { area: 'Act 5 - Throne Room' },
    'Baal Subject 4': { area: 'Act 5 - Throne Room' },
    'Baal Subject 5': { area: 'Act 5 - Throne Room' },
  }
  static reduceToMonsterMap = (map, value) => {
    const areas = value[1].area instanceof Array ? value[1].area : [value[1].area]
    areas.forEach(area => {
      const list = map.has(area) ? map.get(area) : map.set(area, []).get(area)
      list.push(value[0])
    })
    return map
  }
  static staticMonsterMap = Object.entries(MonsterSourcer.staticMonsters).reduce(this.reduceToMonsterMap, new Map())
  static staticSuperMonsterMap = Object.entries(MonsterSourcer.staticSuperMonsters).reduce(this.reduceToMonsterMap, new Map())

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
      if (superUnique.Class.length === 0) {
        return
      }
      for (let difficulty = 0; difficulty < 3; ++difficulty) {
        const from = MonsterSourcer.staticSuperMonsters[superUnique.Superunique] ? MonsterSourcer.staticSuperMonsters[superUnique.Superunique].area : 'superunique (beta)'
        res.push(this.fromSuper(from, difficulty, superUnique))
      }
    })
    return res.flat(Infinity)
  }

  fromSuper (from, difficulty, superUnique) {
    if (!superUnique.Class) {
      throw new Error(`unknown super: ${superUnique.Superunique || superUnique}`)
    }
    const monster = this.inverseMonsterMap.get(superUnique.Class)
    const level = 3 + Number(monster.boss === '1' ? monster[MonsterSourcer.monBossLevelKeys[difficulty]] : this.inferLevel(superUnique.Superunique, difficulty))
    return {
      id: monster.Id,
      rarity: 2,
      difficulty,
      level,
      treasure: superUnique[MonsterSourcer.superTreasureKeys[difficulty]],
      xp: Number(monster[MonsterSourcer.monExpKeys[difficulty]]),
      from,
      string: superUnique['Name'],
      special: true,
    }
  }

  inferLevel (id, difficulty) {
    if (MonsterSourcer.staticSuperMonsters[id]) {
      const area = MonsterSourcer.staticSuperMonsters[id].area
      return this.levelData.first('Name', area)[MonsterSourcer.monLevelKeys[difficulty]]
    }
    return 1
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
    // todo
  }

  monsters (levelId, nestable = true) {
    const level = this.inverseLevelMap.get(levelId)
    if (!level) {
      throw new Error(`unknown level: ${levelId}`)
    }
    const res = []
    if (level['MonDen'] > 0) {
      MonsterSourcer.monNormalKeys.forEach(key => {
        const monsterId = level[key]
        if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
          return
        }
        res.push(this.expand(level, 0, monsterId, new Set(), nestable))
      })
    }
    // nightmare, hell keys are the same
    if (level['MonDen(N)'] > 0) {
      MonsterSourcer.monHellKeys.forEach(key => {
        const monsterId = level[key]
        if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
          return
        }
        res.push(this.expand(level, 1, monsterId, new Set(), nestable))
      })
    }
    if (level['MonDen(H)'] > 0) {
      MonsterSourcer.monHellKeys.forEach(key => {
        const monsterId = level[key]
        if (!monsterId || !this.inverseMonsterMap.has(monsterId)) {
          return
        }
        res.push(this.expand(level, 2, monsterId, new Set(), nestable))
      })
    }
    if (MonsterSourcer.staticSuperMonsterMap.has(level.Name)) {
      MonsterSourcer.staticSuperMonsterMap.get(level.Name).forEach(monster => {
        for (let difficulty = 0; difficulty < 3; ++difficulty) {
          res.push(this.fromSuper(level.Name, difficulty, this.superData.first('Superunique', monster)))
          res.at(-1).special = true
        }
      })
    }
    if (MonsterSourcer.staticMonsterMap.has(level.Name)) {
      MonsterSourcer.staticMonsterMap.get(level.Name).forEach(monster => {
        for (let difficulty = 0; difficulty < 3; ++difficulty) {
          const statics = this.expand(level, difficulty, monster, new Set())
          statics.forEach(monster => {
            const entry = this.monsterData.first('Id', monster.id)
            monster.special = entry.boss === '1'
          })
          res.push(...statics)
        }
      })
    }
    return this.deduplicate(res.flat(Infinity))
  }

  expand (level, difficulty, monsterId, set, nestable = true) {
    const res = []
    if (set.has(monsterId)) {
      return res
    }
    set.add(monsterId)
    const monster = this.inverseMonsterMap.get(monsterId)
    if (!monster) {
      // s8/s9/sX differences
      return []
    }
    const monLevel = Number(monster.boss !== '1' ? level[MonsterSourcer.monLevelKeys[difficulty]] : monster[MonsterSourcer.monBossLevelKeys[difficulty]])
    if (nestable) {
      // maybe check min too?
      if (monster.PartyMax > 0) {
        MonsterSourcer.monMinionKeys.forEach(minion => {
          const minionId = monster[minion]
          if (minionId && this.inverseMonsterMap.has(minionId)) {
            res.push(...this.expand(level, difficulty, minionId, set))
          }
        })
      }
      if (monster.SplEndDeath === '1') {
        const minionId = monster[MonsterSourcer.monMinionKeys[0]]
        if (minionId && this.inverseMonsterMap.has(minionId)) {
          res.push(...this.expand(level, difficulty, minionId, set))
        }
      }
      // might need to check more than 1 skill or Minion Spawner
      if (monster.placespawn === '1' || monster.Skill1 === 'Nest' || monster.Skill1 === 'MagottUp' || monster.Skill1 === 'MaggotEgg') {
        const minionId = monster.spawn
        if (minionId && this.inverseMonsterMap.has(minionId)) {
          res.push(...this.expand(level, difficulty, minionId, set))
        }
      }
    }
    // normal, champion, unique
    const levelTable = [0, 2, 3]
    if (monster.boss === '1' || (MonsterSourcer.staticMonsters[monsterId] && MonsterSourcer.staticMonsters[monsterId].boss)) {
      res.push({
        id: monsterId,
        rarity: 2,
        difficulty,
        level: monLevel + (this.super(monsterId) ? 3 : 0),
        treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][2]],
        xp: Number(monster[MonsterSourcer.monExpKeys[difficulty]]),
        from: level.Name,
        string: monster['NameStr'],
        weight: Number(monster.Rarity)
      })
      // quest tc
      if (monster[MonsterSourcer.monTreasureKeys[difficulty][3]]) {
        res.push({
          id: monsterId,
          rarity: 2,
          difficulty,
          level: monLevel + (this.super(monsterId) ? 3 : 0),
          treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][3]],
          xp: Number(monster[MonsterSourcer.monExpKeys[difficulty]]),
          from: level.Name,
          string: monster['NameStr'],
          weight: Number(monster.Rarity)
        })
      }
    } else {
      for (let j = 0; j < 4; ++j) {
        const treasure = monster[MonsterSourcer.monTreasureKeys[difficulty][j]]
        if (treasure.length > 0 || j < 3) {
          res.push({
            id: monsterId,
            rarity: j,
            difficulty,
            level: monLevel + levelTable[j < 3 ? j : 2],
            treasure,
            xp: Number(monster[MonsterSourcer.monExpKeys[difficulty]]),
            from: level.Name,
            string: monster['NameStr'],
            weight: Number(monster.Rarity)
          })
          if (j === 2) {
            res.push({
              id: monsterId,
              rarity: 5,
              difficulty,
              level: monLevel + 3,
              treasure: monster[MonsterSourcer.monTreasureKeys[difficulty][0]],
              xp: Number(monster[MonsterSourcer.monExpKeys[difficulty]]),
              from: level.Name,
              string: monster['NameStr'],
              weight: Number(monster.Rarity)
            })
          }
        }
      }
    }
    return res
  }

  deduplicate (monsters) {
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
      c = a.special !== b.special
      if (c) {
        return a.special ? 1 : -1
      }
      if (a.special) {
        return -1
      }
      c = a.treasure.localeCompare(b.treasure)
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
        // might need to stable sort by level
        // tcs are usually sorted by level but not guaranteed
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
      const children = new Set(this.typeList.items().reduce((list, item) => {
        if (this.typeList.itemIs(item, predicate)) {
          list.push(item)
        }
        return list
      }, []))
      list.each(el => {
        if (el.spawnable !== '1' || el.rarity <= 0) {
          return
        }
        if (!children.has(el.code)) {
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
        // rarity is from item type, not rarity in armor/weapon text files
        // use type
        const p = Number(this.typeList.typesTxt.first('Code', el.type).Rarity)
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
    return this.inverseTreasureMap.has(id) || /^(?:weap|armo|mele)\d+/.test(id)
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
        // picks should add up to abs(picks) but it doesn't always
        let picks = Math.abs(treasure.picks)
        for (const { id: childId, p: childP } of treasure.children) {
          const pickP = p * Math.min(picks, childP)
          if (this.has(childId)) {
            const child = this.eval(childId)
            stack.push({ treasure: this.merge(child, treasure), p: pickP })
          } else {
            const val = Object.assign({}, treasure)
            val.id = childId
            walker.pre(val, pickP)
          }
          picks -= childP
          if (picks < 0) {
            break
          }
        }
      }
    }
  }

  countess (id, n, walker) {
    const f = [1]
    for (let i = 1; i < 10; ++i) {
      f[i] = f[i - 1] * i
    }
    const C = (n, k) => {
      if (k > n) {
        throw new Error('k > n')
      }
      return f[n] / (f[k] * f[n - k])
    }
    const B = (n, k, p) => {
      return C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
    }
    const treasure = this.eval(id)
    // runeTc/lootTc are accurate as of s9. if the order changes it won't matter
    const runeTc = this.eval(treasure.children[0].id)
    const lootTc = this.eval(treasure.children[1].id)
    const noDrop = this.noDrop(n, runeTc)
    if (runeTc.picks <= 0) {
      throw new Error(`countess rune drop: ${runeTc.picks}`)
    }
    const dropP = 1 - noDrop / (noDrop + runeTc.sum)
    for (let i = 0; i <= runeTc.picks; ++i) {
      const p = B(runeTc.picks, i, dropP)
      const possible = Math.min(lootTc.picks, 6 - i)
      // drop i runes before items
      if (p > 0 && possible > 0) {
        let sum = 0
        const noDrop = this.noDrop(n, lootTc)
        const dropP = 1 - noDrop / (noDrop + lootTc.sum)
        for (let i = 0; i <= lootTc.picks; ++i) {
          const pi = B(lootTc.picks, i, dropP)
          sum += p * pi * Math.min(i, possible)
        }
        if (sum > 0) {
          this.walk(lootTc.id, 64, {
            pre: (v, baseP) => {
              const realP = baseP / lootTc.picks
              walker.pre(v, realP * sum)
            }
          })
        }
      }
      if (i > 0) {
        // no drop has been considered so we need to set no drop to 0
        this.walk(runeTc.id, 64, {
          pre: (v, baseP) => {
            const realP = p * baseP / runeTc.picks * i
            walker.pre(v, realP)
          }
        })
      }
    }
  }

  merge (a, b) {
    a = Object.assign({}, a)
    TreasureTree.mergeKeys.forEach(key => {
      a[key] = Math.max(a[key], b[key])
    })
    return a
  }

  eval (id) {
    if (/^(?:weap|armo|mele)\d+/.test(id)) {
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

  simulate ({ id, rem = 6, rng = n => ~~(Math.random() * n), cb, dc = 1 }) {
    const stack = []
    const get = id => Object.assign({}, this.eval(id))
    stack.push(get(id))
    let limit = 8192
    const res = []
    while (--limit > 0 && res.length < rem && stack.length > 0) {
      let top = stack.pop()
      if (top.picks > 0) {
        if (top.picks > 1) {
          top.picks -= 1
          stack.push(top)
        }
        const tc = top
        const noDrop = this.noDrop(dc, tc)
        let roll
        if (noDrop > 0) {
          roll = rng(tc.sum + noDrop)
          if (roll < noDrop) {
            continue
          }
          roll -= noDrop
        } else {
          roll = rng(tc.sum)
        }
        let random = roll
        const pick = tc.children.find(child => {
          random -= child.p
          if (random < 0) {
            return true
          }
          return false
        })
        if (!this.has(pick.id)) {
          res.push(pick.id)
          if (cb) {
            cb(pick, tc)
          }
          continue
        }
        stack.push(get(pick.id))
      } else if (top.picks < 0) {
        top.index = top.index || top.picks
        const index = top.index - top.picks
        if (index + 1 < -top.picks) {
          stack.push(top)
        }
        const tc = top
        let random = index
        const pick = tc.children.find(child => {
          random -= child.p
          if (random < 0) {
            return true
          }
          return false
        })
        if (!this.has(pick.id)) {
          res.push(pick.id)
          continue
        }
        top.index += 1
        stack.push(get(pick.id))
      }
    }
    return res
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
      if (entry.length <= 0) {
        return
      }
      let length = 0
      for (let i = entry.keyIndex; i < view.byteLength; ++i, ++length) {
        if (view.getInt8(i) === 0) {
          break
        }
      }
      const key = this.string(entry.keyIndex, length)
      // is the first entry always the correct (key, value) pair?
      if (map.has(key)) {
        return
      }
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

  has (key) {
    if (!this.map) {
      throw new Error(`unknown has ${key}: not loaded?`)
    }
    return this.map && this.map.has(key)
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
    const table = this.tables.find(table => table.has(key))
    if (!table) {
      return key
    }
    return table.get(key)
  }

  readable (key) {
    return this.get(key).replace(/\xC3.../g, '')
  }

  all (key) {
    return this.tables.map(table => table.get(key))
  }

  has (key) {
    return this.tables.some(table => table.has(key))
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

class StatFormat {
  static clazzNames = [
    'Amazon',
    'Sorceress',
    'Necromancer',
    'Paladin',
    'Barbarian',
    'Druid',
    'Assassin'
  ]

  constructor (data, resolver) {
    this.resolver = resolver
    this.data = data
  }

  get (stat, value, group = false) {
    const el = this.data.itemStatCost().first('Stat', stat)
    return this.format(value, this.describe(el, group))
  }

  describe (row, group = false) {
    const id = !group ? 'descfunc' : 'dgrpfunc'
    const position = !group ? 'descval' : 'dgrpval'
    const positive = !group ? 'descstrpos' : 'dgrpstrpos'
    const negative = !group ? 'descstrneg' : 'dgrpstrneg'
    const secondary = !group ? 'descstr2' : 'dgrpstr2'
    return {
      id: Number(row[id]),
      position: Number(row[position]),
      positive: this.resolver.get(row[positive]),
      negative: this.resolver.get(row[negative]),
      secondary: this.resolver.get(row[secondary])
    }
  }

  format ({ value, param = 0 }, { id, position, positive, negative, secondary }) {
    // positive (read: non-negative)
    const primary = value >= 0 ? positive : negative
    const sign = value > 0 ? '+' : ''
    switch (id) {
      case 0: {
        return ''
      }
      case 6:
      case 1: {
        switch (position) {
          case 1: {
            return `${sign}${value} ${primary}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          case 2: {
            return `${primary} ${sign}${value}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          default: {
            throw new Error(`unknown position: ${position}`)
          }
        }
      }
      case 7:
      case 2: {
        switch (position) {
          case 1: {
            return `${value}% ${primary}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          case 2: {
            return `${primary} ${value}%` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          default: {
            throw new Error(`unknown position: ${position}`)
          }
        }
      }
      case 8:
      case 3: {
        switch (position) {
          case 1: {
            return `${sign}${value}% ${primary}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          case 2: {
            return `${primary} ${sign}${value}%` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          default: {
            return primary
          }
        }
      }
      case 9:
      case 4: {
        switch (position) {
          case 1: {
            return `${sign}${value}% ${primary}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          case 2: {
            return `${primary} ${sign}${value}%` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          default: {
            throw new Error(`unknown position: ${position}`)
          }
        }
      }
      case 10:
      case 5: {
        value = (value * 100) >> 7
        switch (position) {
          case 1: {
            return `${sign}${value}% ${primary}` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          case 2: {
            return `${primary} ${sign}${value}%` + (secondary.length > 0 ? ` ${secondary}` : '')
          }
          default: {
            throw new Error(`unknown position: ${position}`)
          }
        }
      }
      case 11: {
        // from: D2Client.dll
        const quotient = Math.floor(2500 / value)
        if (quotient >= 30) {
          // Repairs %d durability in %d seconds
          const hardcoded = this.resolver.get('ModStre9u')
          const rate = Math.floor((quotient + 12) / 25)
          return hardcoded.replace('%d', '1').replace('%d', rate)
        }
        return primary.replace('%d', 1)
      }
      case 12: {
        switch (position) {
          case 0:
            return primary
          case 1:
            return `${sign}${value} ${primary}`
          case 2:
            if (value === 1) {
              return primary
            }
            return `${primary} ${sign}${value}`
        }
        return primary
      }
      case 13: {
        switch (position) {
          case 1: {
            const classStringId = this.data.charStats().first('class', StatFormat.clazzNames[param])['StrAllSkills']
            const classString = this.resolver.get(classStringId)
            return `${sign}${value} ${classString}`
          }
          default: {
            throw new Error(`unknown position: ${position}`)
          }
        }
      }
      case 14: {
        const tab = (param & 0x3) + 1
        const clazz = param >> 3
        const clazzEntry = this.data.charStats().first('class', StatFormat.clazzNames[clazz])
        const clazzy = this.resolver.get(clazzEntry['StrClassOnly'])
        const tabFormat = this.resolver.get(clazzEntry[`StrSkillTab${tab}`])
        return `${tabFormat.replace('%d', value)} ${clazzy}`
      }
      case 15: {
        // nStuff
        const skillId = param >> 6
        const skillLevel = param & 0x3F
        const skill = this.data.skills().first('Id', skillId.toString())
        const desc = this.data.skillDesc().first('skilldesc', skill['skilldesc'])
        if (!desc) {
          return primary
        }
        const name = this.resolver.get(desc['str name'])
        return primary.replace('%d', value).replace('%%', '%').replace('%d', skillLevel).replace('%s', name)
      }
      case 16: {
        const skill = this.data.skills().first('Id', param.toString())
        const desc = this.data.skillDesc().first('skilldesc', skill['skilldesc'])
        const name = this.resolver.get(desc['str name'])
        return primary.replace('%d', value).replace('%s', name)
      }
      case 18:
      case 17: {
        // time-base affix
        return ''
      }
      case 19: {
        return primary.replace('%d', value.toString() + '%')
      }
      case 20: {
        return `-${value}% ${primary}`
      }
      case 21: {
        return `-${value} ${primary}`
      }
      case 22: {
        // not implemented?
        return `${value} ${primary}`
      }
      case 23: {
        const name = this.resolver.get(this.data.monStats().first('hcIdx', param.toString())['NameStr'])
        return `${value}% ${primary} ${name}`
      }
      case 24: {
        const skillId = param >> 6
        const skillLevel = param & 0x3F
        const skill = this.data.skills().first('Id', skillId.toString())
        const desc = this.data.skillDesc().first('skilldesc', skill['skilldesc'])
        const name = this.resolver.get(desc['str name'])
        const a = value & 0xFF
        const b = value >> 8
        const charges = primary.replace('%d', a).replace('%d', b)
        return `Level ${skillLevel} ${name} ${charges}`
      }
      case 27: {
        const skill = this.data.skills().first('Id', param.toString())
        const clazz = skill['charclass'].substring(0, 1).toUpperCase() + skill['charclass'].substring(1).toLowerCase()
        const desc = this.data.skillDesc().first('skilldesc', skill['skilldesc'])
        const name = this.resolver.get(desc['str name'])
        // PD2 only?
        const clazzy = this.resolver.get(`${clazz}Only`)
        return `${sign}${value} to ${name} ${clazzy}`
      }
      case 28: {
        const skill = this.data.skills().first('Id', param.toString())
        const desc = this.data.skillDesc().first('skilldesc', skill['skilldesc'])
        const name = this.resolver.get(desc['str name'])
        return `${sign}${value} to ${name}`
      }
      default: {
        throw new Error(`unknown stat id: ${id}`)
      }
    }
  }
}

class SkillData {
  constructor ({ skills, skillDesc, resolver }) {
    this.skills = skills
    this.skillDesc = skillDesc
    this.resolver = resolver
    this.setup()
  }

  setup () {
    this.skillz = {}
    this.skills.each(skill => {
      if (skill.charclass.length === 3) {
        const desc = this.skillDesc.first('skilldesc', skill.skilldesc)
        if (desc) {
          const name = this.resolver.get(desc['str name'])
          this.skillz[name] = {
            class: skill.charclass,
            skill: skill,
            desc: desc
          }
        }
      }
    })
  }

  get (name) {
    return this.skillz[name]
  }
}

class D2Random {
  static constant = BigInt('0x6AC690C5')
  static lower = ((BigInt(1) << BigInt(32)) - BigInt(1))

  constructor (seed = BigInt(0)) {
    this.lower(seed)
  }

  lower (seed) {
    this.high = BigInt(666)
    this.low = BigInt(seed)
  }

  next () {
    const seed = BigInt.asUintN(64, BigInt.asUintN(64, this.low * D2Random.constant) + this.high)
    return this.reset(seed)
  }

  max (n) {
    n = BigInt(n)
    if (n <= BigInt(0)) {
      return 0
    }
    return Number(this.next() % n)
  }

  n (n) {
    const res = []
    for (let i = 0; i < n; ++i) {
      res.push(this.next())
    }
    return res
  }

  skip (n) {
    for (let i = 0; i < n; ++i) {
      this.next()
    }
    return this
  }

  reset (seed) {
    seed = BigInt(seed)
    this.low = seed & D2Random.lower
    this.high = seed >> BigInt(32)
    return this.low
  }

  set (low, high) {
    this.high = BigInt(high)
    this.low = BigInt(low)
  }

  toString () {
    return `0x${this.low.toString(16)} 0x${this.high.toString(16)}`
  }
}

class Diablo2Data {
  static gameFiles = [
    'Experience.txt',
    'ItemStatCost.txt',
    'MonStats.txt',
    'MonStats2.txt',
    'Skilldesc.txt',
    'Skills.txt',
    'Misc.txt',
    'ItemTypes.txt',
    'Weapons.txt',
    'Armor.txt',
    'Levels.txt',
    'SuperUniques.txt',
    'MagicPrefix.txt',
    'MagicSuffix.txt',
    'AutoMagic.txt',
    'TreasureClassEx.txt',
    'ItemRatio.txt',
    'UniqueItems.txt',
    'SetItems.txt',
    'MonLvl.txt',
    'Objects.txt',
    'ObjGroup.txt',
    'CharStats.txt',
    'Hireling.txt',
    'Runes.txt',
    'Properties.txt'
  ]

  static defaultVersion = 's12'

  constructor (version = Diablo2Data.defaultVersion) {
    this.version = version
  }

  async load () {
    this.loader = new DataLoader()
    await this.loader.preload(this.version, Diablo2Data.gameFiles)
  }

  charStats () {
    return this.loader.get(this.version, 'CharStats.txt')
  }

  hireling () {
    return this.loader.get(this.version, 'Hireling.txt')
  }

  experience () {
    return this.loader.get(this.version, 'Experience.txt')
  }

  itemStatCost () {
    return this.loader.get(this.version, 'ItemStatCost.txt')
  }

  skillDesc () {
    return this.loader.get(this.version, 'Skilldesc.txt')
  }

  skills () {
    return this.loader.get(this.version, 'Skills.txt')
  }

  monStats () {
    return this.loader.get(this.version, 'MonStats.txt')
  }

  monStats2 () {
    return this.loader.get(this.version, 'MonStats2.txt')
  }

  misc () {
    return this.loader.get(this.version, 'Misc.txt')
  }

  weapons () {
    return this.loader.get(this.version, 'Weapons.txt')
  }

  armor () {
    return this.loader.get(this.version, 'Armor.txt')
  }

  itemTypes () {
    return this.loader.get(this.version, 'ItemTypes.txt')
  }

  levels () {
    return this.loader.get(this.version, 'Levels.txt')
  }

  supers () {
    return this.loader.get(this.version, 'SuperUniques.txt')
  }

  prefix () {
    return this.loader.get(this.version, 'MagicPrefix.txt')
  }

  suffix () {
    return this.loader.get(this.version, 'MagicSuffix.txt')
  }

  automagic () {
    return this.loader.get(this.version, 'AutoMagic.txt')
  }

  treasureClassEx () {
    return this.loader.get(this.version, 'TreasureClassEx.txt')
  }

  itemRatio () {
    return this.loader.get(this.version, 'ItemRatio.txt')
  }

  uniqueItems () {
    return this.loader.get(this.version, 'UniqueItems.txt')
  }

  setItems () {
    return this.loader.get(this.version, 'SetItems.txt')
  }

  monLvl () {
    return this.loader.get(this.version, 'MonLvl.txt')
  }

  runes () {
    return this.loader.get(this.version, 'Runes.txt')
  }

  properties () {
    return this.loader.get(this.version, 'Properties.txt')
  }

  TypeList () {
    return new TypeList(this.misc(), this.itemTypes(), this.weapons(), this.armor())
  }

  MonsterSourcer () {
    return new MonsterSourcer(this.levels(), this.monStats(), this.supers())
  }

  SkillData ({ resolver }) {
    return new SkillData({ skills: this.skills(), skillDesc: this.skillDesc(), resolver })
  }

  objects () {
    return this.loader.get(this.version, 'Objects.txt')
  }

  objGroup () {
    return this.loader.get(this.version, 'ObjGroup.txt')
  }

  async StringResolver () {
    const version = this.version
    const strings = new StringResolver([
      `data/${version}/global/excel/patchstring.tbl`,
      `data/${version}/global/excel/expansionstring.tbl`,
      `data/${version}/global/excel/string.tbl`,
    ])
    await strings.load()
    return strings
  }
}

class GambleInventory {
  // ordered by qsort of level (visual studio 2003)
  static GambleListExtracted = [
    'amu ',
    'rin ',
    'sbw ',
    'jav ',
    'cap ',
    'qui ',
    'buc ',
    'ssd ',
    'tkf ',
    'lbt ',
    'hax ',
    'lea ',
    'lbl ',
    'lgl ',
    'hbw ',
    'sml ',
    'bar ',
    'skp ',
    'hla ',
    'scm ',
    'spr ',
    'lxb ',
    'lax ',
    'vbt ',
    'axe ',
    'tax ',
    'vgl ',
    'vbl ',
    'mac ',
    'stu ',
    'sbr ',
    'lbw ',
    'tri ',
    '2hs ',
    'pil ',
    'rng ',
    'lrg ',
    'spk ',
    'vou ',
    'hlm ',
    'crs ',
    'flc ',
    'bax ',
    'mgl ',
    'mbt ',
    'cbw ',
    'mbl ',
    '2ax ',
    'bkf ',
    'scl ',
    'mst ',
    'mxb ',
    'kit ',
    'scy ',
    'bsd ',
    'chn ',
    'fhl ',
    'ssp ',
    'bal ',
    'brn ',
    'btx ',
    'clm ',
    'brs ',
    'sbb ',
    'mpi ',
    'bsh ',
    'fla ',
    'msk ',
    'tbl ',
    'spl ',
    'lsd ',
    'tbt ',
    'tgl ',
    'spt ',
    'gis ',
    'pax ',
    'mau ',
    'bhm ',
    'tow ',
    'ghm ',
    'glv ',
    'gax ',
    'lbb ',
    'plt ',
    'ci0 ',
    'pik ',
    'hxb ',
    'bsw ',
    'wax ',
    'whm ',
    'swb ',
    'hbl ',
    'hbt ',
    'flb ',
    'hgl ',
    'gix ',
    'wsd ',
    'fld ',
    'tsp ',
    'hal ',
    'crn ',
    'gts ',
    'lwb ',
    'gma ',
    'gth ',
    'rxb ',
    'gsd ',
    'wsc ',
    'ltp ',
    'ful ',
    'aar ',
    'ci1 ',
  ]

  constructor ({ d2data }) {
    this.d2data = d2data
    this.tl = this.d2data.TypeList()
  }

  async load () {
    this.gamble = await this.d2data.loader.load(this.d2data.version, 'Gamble.txt')
    this.gambleList = this.gamble.map(({ name, code}) => {
      if (code.length === 0) {
        return
      }
      return {
        name,
        code,
        level: this.tl.entry(code).level || 1
      }
    }).filter(i => i).sort((a, b) => a.level - b.level)
  }
}

if (typeof window === 'undefined' && typeof self === 'undefined') {
  module.exports = {
    AffixList,
    D2Random,
    DataFrame,
    DataLoader,
    Diablo2Data,
    StatFormat,
    StringResolver,
    TreasureTree,
    TypeList,
  }
}
