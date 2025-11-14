const fs = require('fs')

const a = process.argv[2]
const b = process.argv[3]

const ad = `data/${a}/global/excel`
const bd = `data/${b}/global/excel`

const as = fs.readdirSync(ad, { withFileTypes: true })
const bs = fs.readdirSync(bd, { withFileTypes: true })

const ai = as.filter(e => e.name.endsWith('.txt')).reduce((s, e) => {
  const full = `${e.path}/${e.name}`
  s[e.name.toLocaleLowerCase()] = {
    full,
    name: e.name
  }
  return s
}, {})
bs.filter(e => e.name.endsWith('.txt')).forEach(e => {
  const full = `${e.path}/${e.name}`
  const ib = ai[e.name.toLocaleLowerCase()]
  if (ib.name !== e.name) {
    console.log(`rename a=${ib.name} b=${e.name}`)
    fs.renameSync(full, `${e.path}/${ib.name}`)
  }
})
