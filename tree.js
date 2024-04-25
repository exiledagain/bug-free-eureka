class AffixTree {
  constructor (prefixList, suffixList) {
    const a = this.count(prefixList)
    const b = this.count(suffixList)
    const total = a * b
    const n = 200
    console.log(a, b, total / (n * n) / 1e6, total / 1e9)
    console.log(this.count1(prefixList), this.count1(suffixList), this.count1(prefixList) * this.count1(suffixList))
  }

  count (list) {
    const hist = {}
    list.each(({ row }) => {
      hist[row.group] = hist[row.group] + 1 || 1
    })
    const entries = [...Object.entries(hist)]
    console.log(entries.length)
    let sum = 0
    for (let i = 0; i < entries.length; ++i) {
      if (!list.isRare) {
        const prod = entries[i][1]
        sum += prod
        continue
      }
      for (let j = 0; j < entries.length; ++j) {
        if (j === i) {
          continue
        }
        for (let k = 0; k < entries.length; ++k) {
          if (i === k || j === k) {
            continue
          }
          const prod = entries[i][1] * entries[j][1] * entries[k][1]
          sum += prod
        }
      }
    }
    return sum
  }

  count1 (list) {
    const hist = {}
    list.each(({ row }) => {
      hist[row.group] = hist[row.group] + 1 || 1
    })
    const entries = [...Object.entries(hist)]
    let sum = 0
    for (let i = 0; i < entries.length; ++i) {
      if (!list.isRare) {
        const prod = entries[i][1]
        sum += prod
        continue
      }
      for (let j = i + 1; j < entries.length; ++j) {
        for (let k = j + 1; k < entries.length; ++k) {
          const prod = entries[i][1] * entries[j][1] * entries[k][1] * 6
          sum += prod
        }
      }
    }
    return sum
  }
}
