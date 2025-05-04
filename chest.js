'use strict'

class ChestDropper {
  static constants = {
    'unique': 250,
    'set': 500,
    'rare': 600,
    'magic': 0
  }

  static mustBeNormal = new Set([
    'gld'
  ])

  async setup (version = Diablo2Data.defaultVersion) {
    const d2data = new Diablo2Data(version)
    this.d2data = d2data
    await d2data.load()
    const typeList = d2data.TypeList()
    const tree = new TreasureTree(d2data.treasureClassEx(), typeList, d2data.weapons(), d2data.armor())
    this.tree = tree
    this.clazzes = new Set(typeList.expand('clas'))
    // very cool blizzard, thank you
    const diffs = ['', ' (N)', ' (H)']
    const acts = [1, 2, 3, 4, 5]
    const abcs = ['A', 'B', 'C']
    this.chestTcs = []
    diffs.forEach(diff => {
      acts.forEach(act => {
        abcs.forEach(abc => {
          this.chestTcs.push(`Act ${act}${diff} Chest ${abc}`)
        })
      })
    })
    this.misc = this.d2data.misc()
    this.weapons = this.d2data.weapons()
    this.armor = this.d2data.armor()
    this.itemTypes = this.d2data.itemTypes()
    this.itemRatio = this.d2data.itemRatio()
    this.uniques = this.d2data.uniqueItems()
    this.sets = this.d2data.setItems()
  }

  simulate (random, { treasureClass, itemLevel, chestDropLevel, magicFind = 0, forcedQuality, dropClass = 1, confirmRarity = false }) {
    const drops = []
    this.tree.simulate({
      dc: dropClass,
      id: treasureClass,
      rng: n => random.max(n),
      cb: ({ id }, tc) => {
        let dropRarity = forcedQuality
        const item = this.findItem(id)
        const itemType = this.findItemType(id)
        if (!dropRarity) {
          if (itemType.Normal === '1') {
            dropRarity = 'normal'
          }
          if (item.unique === '1' || (itemType.Magic === '1' && item.quest === '1')) {
            dropRarity = 'unique'
          }
          if (!dropRarity) {
            const passedRarity = rarity => {
              const p = this.p(id, rarity, magicFind, chestDropLevel, tc[rarity])
              if (p <= 0 || random.max(p) < 128) {
                return true
              }
              return false
            }
            dropRarity = ['unique', 'set'].find(passedRarity)
            if (!dropRarity) {
              if (itemType.Rare === '1' && passedRarity('rare')) {
                dropRarity = 'rare'
              }
              if (!dropRarity && (itemType.Magic === '1' || passedRarity('magic'))) {
                dropRarity = 'magic'
              }
            }
            if (!dropRarity) {
              const highQualityRatio = this.findRatio(id, 'HiQuality')
              let p = (highQualityRatio.base - ~~((chestDropLevel - item.level) / highQualityRatio.divisor)) << 7
              if (p <= 0 || random.max(p) < 128) {
                dropRarity = 'high'
              }
              if (!dropRarity) {
                const normalRatio = this.findRatio(id, 'Normal')
                p = (normalRatio.base - ~~((chestDropLevel - item.level) / normalRatio.divisor)) << 7
                if (p <= 0 || random.max(p) < 128) {
                  dropRarity = 'normal'
                } else {
                  dropRarity = 'low'
                }
              }
            }
          }
        }
        drops.push({
          id,
          rarity: dropRarity
        })
        if (confirmRarity) {
          dropRarity = this.getRealRarity(id, itemLevel, dropRarity, item, itemType)
          const last = drops.at(-1)
          last.downgrade = last.rarity
          last.rarity = dropRarity
        }
      },
    })
    return drops
  }

  simulateRegular (opts) {
    opts.confirmRarity = true
    const random = new D2Random()
    if (opts.debug) {
      this.debugRandom(random)
    }
    random.lower(opts.seed)
    const drops = []
    let i = 1 + opts.locked
    while (i-- > 0) {
      drops.push(this.simulate(random, opts))
    }
    return drops.flat()
  }

  hasMagicItem (drops) {
    return drops.length > 0 && (drops[0].rarity !== 'low' && drops[0].rarity !== 'high' && drops[0].rarity !== 'normal')
  }

  simulateSuper (opts) {
    opts.confirmRarity = true
    const random = new D2Random()
    if (opts.debug) {
      this.debugRandom(random)
    }
    random.lower(opts.seed)
    opts.forcedQuality = 'magic'
    const drops = []
    let chestCount = 1 + opts.locked
    let magicCount = 0
    while (chestCount-- > 0) {
      const drop = this.simulate(random, opts)
      drops.push(drop)
      if (this.hasMagicItem(drop)) {
        magicCount += 1
      }
    }
    if (magicCount === 0) {
      do {
        const drop = this.simulate(random, opts)
        drops.push(drop)
        if (this.hasMagicItem(drop)) {
          break
        }
        magicCount += 1
      } while (magicCount < 10)
    }
    return drops.flat()
  }

  simulateSparkly (opts) {
    opts.confirmRarity = true
    const random = new D2Random()
    if (opts.debug) {
      this.debugRandom(random)
    }
    random.lower(opts.seed)
    const type = opts.locked
    const res = []
    let drops = 0, dropped = 0, counter = 0
    switch (type) {
      case 0: {
        opts.forcedQuality = 'unique'
        drops = 2
        do {
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length === 0) {
            break
          }
          if (this.hasMagicItem(drop)) {
            return res.flat()
          }
          drops -= 1
        } while (drops > 0)
        break
      }
      case 1: {
        opts.forcedQuality = 'set'
        drops = 2
        do {
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length === 0) {
            break
          }
          if (this.hasMagicItem(drop)) {
            return res.flat()
          }
          drops -= 1
        } while (drops > 0)
        break
      }
      case 2: {
        opts.forcedQuality = 'rare'
        drops = 2
        do {
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length === 0) {
            break
          }
          if (this.hasMagicItem(drop)) {
            return res.flat()
          }
          drops -= 1
        } while (drops > 0)
        break
      }
      case 3: {
        opts.forcedQuality = 'magic'
        let magics = 0
        for (let i = 0; i < 10 && magics < 3; ++i) {
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length > 0) {
            if (this.hasMagicItem(drop)) {
              magics += 1
            }
            dropped += 1
          }
        }
        if (dropped > 0) {
          return res.flat()
        }
        break
      }
      case 4: {
        opts.forcedQuality = 'magic'
        let magics = 0
        for (let i = 0; i < 10 && magics < 2; ++i) {
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length > 0) {
            if (this.hasMagicItem(drop)) {
              magics += 1
            }
            dropped += 1
          }
        }
        if (dropped > 0) {
          if (dropped > 6) {
            return res.flat()
          }
        } else {
          opts.forcedQuality = undefined
          const drop = this.simulate(random, opts)
          res.push(drop)
          if (drop.length > 0) {
            dropped = 1
          }
        }
        // skip up to 7 golds
        return res.flat()
      }
      case 5:
        break
      default:
        throw new Error(`unknown sparky chest type: ${type}`)
    }
    drops = dropped
    opts.forcedQuality = 'magic'
    for (let i = 0; i < 10; ++i) {
      const drop = this.simulate(random, opts)
      res.push(drop)
      if (drop.length > 0) {
        if (this.hasMagicItem(drop)) {
          break
        }
        drops += 1
      }
    }
    // d2moo?????
    opts.forcedQuality = undefined
    if (drops < 4) {
      for (let i = drops; i < 4; ++i) {
        const drop = this.simulate(random, opts)
        res.push(drop)
        drops -= 1
      }
    }
    // skip gold, hp, mp
    return res.flat()
  }

  getRealRarity (id, level, rarity, item, type) {
    // we only care about magic+
    // a superior/low/normal doesn't affect chest drops
    // unique
    // rare -> magic w/ prefix & suffix -> superior? -> normal
    // magic w/o prefix & suffix -> normal
    // low/high non-armor/weapon -> normal
    switch (rarity) {
      case 'unique': {
        if (type.unique === '1') {
          break
        }
        const eligible = this.uniques.all('code', id)
        if (eligible.length === 0) {
          return this.getRealRarity(id, level, 'rare', item, type)
        }
        if (!eligible.some(unique => unique.enabled && unique.rarity > 0 && unique.lvl <= level)) {
          return this.getRealRarity(id, level, 'rare', item, type)
        }
        break
      }
      case 'set': {
        if (type.unique === '1') {
          break
        }
        const eligible = this.sets.all('item', id)
        if (eligible.length === 0) {
          return this.getRealRarity(id, level, 'magic', item, type)
        }
        if (!eligible.some(set => set.lvl <= level)) {
          return this.getRealRarity(id, level, 'magic', item, type)
        }
        break
      }
      case 'rare': {
        if (type.Rare !== '1') {
          return this.getRealRarity(id, level, 'magic', item, type)
        }
        break
      }
      // for magic, if an item has no prefix/suffix, it cannot be magic...
      case 'magic': {
        if (ChestDropper.mustBeNormal.has(id)) {
          return 'normal'
        }
        if (type.Normal === '1') {
          return 'normal'
        }
        break
      }
    }
    return rarity
  }

  p (id, rarity, magicFind, level, extra) {
    const item = this.findItem(id)
    const ratio = this.findRatio(id, rarity.substring(0, 1).toUpperCase() + rarity.substring(1).toLowerCase())
    return this.chance(magicFind, extra, level - item.level, rarity === 'magic', ratio.base, ratio.divisor, ratio.min, ChestDropper.constants[rarity])
  }

  chance (magicFind, extra, difference, isMagic, rarityBase, divisor, min, constant) {
    const effectiveMF = !isMagic && magicFind > 10 ? ~~(magicFind * constant / (magicFind + constant)) : magicFind
    const div = ~~(difference / divisor)
    const chance = Math.max(min, ~~((rarityBase - div) * 12800 / (100 + effectiveMF)))
    const final = chance - ~~((chance * extra) / 1024)
    return final
  }

  findRatio (id, rarity) {
    const item = this.findItem(id)
    const clazzy = this.clazzes.has(id)
    const uber = item.szFlavorText !== undefined && (item.ubercode === id || item.ultracode === id) && item.type !== 'tpot' && !item.quest
    // assume version is ascending
    let ratio
    this.itemRatio.each(el => {
      const isClazzy = el['Class Specific'] === '1'
      const isUber = el['Uber'] === '1'
      if (clazzy === isClazzy && uber === isUber) {
        ratio = el
      }
    })
    return {
      base: Number(ratio[rarity]),
      divisor: Number(ratio[`${rarity}Divisor`]),
      min: Number(ratio[`${rarity}Min`]),
      class: clazzy,
      raw: ratio
    }
  }

  findItem (id) {
    let ret
    ret = this.misc.first('code', id)
    if (ret) {
      return ret
    }
    ret = this.weapons.first('code', id)
    if (ret) {
      return ret
    }
    ret = this.armor.first('code', id)
    if (ret) {
      return ret
    }
    throw new Error(`unknown item for id: ${id}`)
  }

  findItemType (id) {
    return this.itemTypes.first('Code', this.findItem(id).type)
  }

  debugRandom (random) {
    const oldrandom = random.max
    let count = 0
    const list = []
    this.debugList = list
    random.max = n => {
      console.log(`${n} ${random.toString()} ${++count}`)
      list.push({
        string: random.toString(),
        n: n.toString(),
      })
      return oldrandom.call(random, n)
    }
  }
}

if (typeof window === 'undefined' && typeof self === 'undefined') {
  module.exports = {
    ChestDropper
  }
}
