class DataFrame {
  constructor (uri) {
    this.uri = uri
    this.values = []
    this.computed = []
  }

  async load () {
    const res = await fetch(this.uri)
    const text = await res.text()
    const lines = text.split(/\r?\n/)
    lines.forEach((line, idx) => {
      const values = line.split('\t')
      if (idx === 0) {
        this.keys = values
      } else if (values.length === this.keys.length) {
        this.values.push(values)
      }
    })
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
  constructor (miscTxt, typesTxt) {
    this.build(miscTxt, typesTxt)
  }

  all () {
    const res = Object.keys(this.set)
    res.sort()
    return res
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

  build (miscTxt, typesTxt) {
    this.set = {}
    miscTxt.each(row => {
      this.add(row.code, [row.type, row.type2])
    })
    typesTxt.each(row => {
      this.add(row.Code, [row.Equiv1, row.Equiv2])
    })
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
    console.log(sum)
    this.list.values.forEach(el => {
      el.splice(nIndex + 1, 0, `${(el[pIndex] / sum * 100).toFixed(2)}%`)
      el[pIndex + 1] = `${el[pIndex + 1]}/${sum}`
    })
  }

  populate (container) {
    new DataView(this.list).populate(container)
  }
}
