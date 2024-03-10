class AffixTree {
  constructor (prefixList, suffixList) {
    const a = this.count(prefixList)
    const b = this.count(suffixList)
    const total = a * b
    const n = 200
    console.log(a, b, total / (n * n))
  }

  count (list) {
    const hist = {}
    list.each(({ row }) => {
      hist[row.group] = hist[row.group] + 1 || 1
    })
    const entries = [...Object.entries(hist)]
    console.log(hist, entries.length)
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
}
