class BitReader {
  constructor (bytes) {
    this.bytes = bytes
    this.offset = 0
    this.index = 0
  }

  read (bits = 1) {
    let bytes = []
    while (bits > 0) {
      const rem = Math.min(8, bits)
      let byte = BigInt(0)
      for (let i = 0; i < rem; ++i) {
        byte |= BigInt(this.advance()) << BigInt(i)
      }
      bytes.push(byte)
      bits -= 8
    }
    let res = BigInt(0)
    for (let i = bytes.length - 1; i >= 0; --i) {
      res <<= BigInt(8)
      res |= bytes[i]
    }
    return res
  }

  rem () {
    return 8 - this.offset
  }

  count () {
    return (this.length() - this.index) * 8 - this.offset
  }

  string (bits = 1) {
    let res = ''
    for (let i = 0; i < bits; ++i) {
      res += this.advance() ? '1' : '0'
    }
    return res
  }

  advance () {
    if (this.index >= this.bytes.length) {
      throw new Error(`no more bits`)
    }
    const set = 1 << this.offset
    const res = (this.bytes[this.index] & set) != 0
    this.offset += 1
    if (this.offset >= 8) {
      this.offset = 0
      this.index += 1
    }
    return res
  }
  
  all () {
    return this.string(this.count())
  }

  skip (bits = 1) {
    const index = Math.floor(bits / 8)
    const offset = bits % 8
    this.offset += offset
    this.index += index
    if (this.offset >= 8) {
      this.offset %= 8
      this.index += 1
    }
    return this
  }

  length () {
    return this.bytes.length
  }

  reset () {
    this.index = 0
    this.offset = 0
  }

  seek (index) {
    this.index = index
    this.offset = 0
    return this
  }

  align () {
    if (this.rem() !== 8) {
      this.skip(this.rem())
    }
  }
}

class BitWriter {
  constructor () {
    this.bytes = [0]
    this.index = 0
    this.offset = 0
    this.length = 0
  }

  write (value, count) {
    this.length += count
    for (let i = 0; i < count; ++i) {
      this.put(value & BigInt(1))
      value >>= BigInt(1)
    }
    return this
  }

  put (bit) {
    if (bit !== BigInt(0) && bit !== BigInt(1)) {
      throw new Error(`cannot put non-binary value`)
    }
    if (this.index === this.bytes.length) {
      this.bytes.push(0)
    }
    this.bytes[this.index] |= Number(bit) << this.offset
    this.offset += 1
    if (this.offset >= 8) {
      this.offset = 0
      this.index += 1
      this.bytes.push(0)
    }
  }

  align () {
    if (this.offset !== 0) {
      this.offset = 0
      this.index += 1
      this.length = this.bytes.length * 8
    }
  }
}

class SaveFileParser {
  static ItemFlags = {
    identified: 4,
    socketed: 11,
    new: 13,
    ear: 16,
    starter: 17,
    compact: 21,
    ethereal: 22,
    personalized: 24,
    runeword: 26
  }

  static ItemQuality = {
    inferior: 1,
    normal: 2,
    superior: 3,
    magic: 4,
    set: 5,
    rare: 6,
    unique: 7,
    crafted: 8,
    tempered: 9
  }

  /**
   * 
   * @param {BitReader} reader 
   * @param {DataFrame} costs 
   */
  constructor (typeList, reader, costs) {
    this.typeList = typeList
    this.reader = reader
    this.costs = costs
  }

  read () {
    this.data = {}
    this.data.header = {}
    this.data.header.magic = this.reader.read(32)
    this.data.header.version = this.reader.read(32)
    this.data.header.size = this.reader.read(32)
    this.data.header.checksum = this.reader.read(32)
    this.data.activeWeapon = this.reader.read(32)
    this.data.name = ''
    for (let i = 0, skip = false; i < 16; ++i) {
      const code = Number(this.reader.read(8))
      if (!skip && code > 0) {
        this.data.name += String.fromCharCode(code)
      } else {
        skip = true
      }
    }
    this.data.status = this.reader.read(8)
    this.data.progression = this.reader.read(8)
    this.data.unknown1 = this.reader.read(16)
    this.classId = this.reader.read(8)
    this.data.unknown2 = this.reader.read(16)
    this.data.level = this.reader.read(8)
    this.data.created = this.reader.read(32)
    this.data.lastPlayed = this.reader.read(32)
    this.data.unknown3 = this.reader.read(32)
    this.data.assignedSkills = []
    for (let i = 0; i < 16; ++i) {
      this.data.assignedSkills[i] = this.reader.read(32)
    }
    this.data.leftSkill = this.reader.read(32)
    this.data.rightSkill = this.reader.read(32)
    this.data.leftSkillAlt = this.reader.read(32)
    this.data.rightSkillAlt = this.reader.read(32)
    this.data.appearance = this.reader.read(32 * 8)
    this.data.location = this.reader.read(24)
    this.data.mapId = this.reader.read(32)
    this.data.unknown4 = this.reader.read(16)
    this.data.mercenary = this.mercenary()
    this.data.realm = this.reader.read(140 * 8)
    this.data.quests = this.reader.read(302 * 8)
    this.data.waypoints = this.reader.read(80 * 8)
    this.data.dialog = this.reader.read(52 * 8)
    this.data.attributes = this.attributes()
    this.reader.align()
    this.data.skills = this.reader.read(35 * 8)
    this.data.items = this.items()
    this.data.corpses = this.corpses()
    this.data.mercenaryItems = this.mercenaryItems()
  }

  mercenary () {
    const res = {}
    res.dead = this.reader.read(16)
    res.id = this.reader.read(32)
    res.name = this.reader.read(16)
    res.type = this.reader.read(16)
    res.experience = this.reader.read(32)
    return res
  }

  mercenaryItems () {
    const res = {}
    res.header = this.reader.read(16)
    if (this.data.mercenary.id !== BigInt(0)) {
      res.items = this.items()
    } else {
      res.items = {}
    }
    return res
  }

  string () {
    let res = ''
    for (;;) {
      const code = this.reader.read(7)
      if (code === BigInt(0)) {
        break
      }
      res += String.fromCharCode(Number(code))
    }
    return res
  }

  item () {
    const isItemFlag = (item, id) => (item.compact.flags & BigInt(1 << id)) != BigInt(0)
    const item = {}
    item.header = this.reader.read(16)
    if (item.header !== 19786n) {
      throw new Error('item header wrong')
    }
    item.compact = {}
    item.compact.flags = this.reader.read(32)
    item.compact.version = this.reader.read(10)
    item.compact.location = this.reader.read(3)
    item.compact.equipment = this.reader.read(4)
    item.compact.x = this.reader.read(4)
    item.compact.y = this.reader.read(4)
    item.compact.page = this.reader.read(3)
    if (!isItemFlag(item, SaveFileParser.ItemFlags.ear)) {
      item.compact.code = this.reader.read(32)
      item.compact.socketed = this.reader.read(isItemFlag(item, SaveFileParser.ItemFlags.compact) ? 1 : 3)
      item.code = this.codeToString(item.compact.code)
    } else {
      item.ear = {}
      item.ear.file = this.reader.read(3)
      item.ear.level = this.reader.read(7)
      item.ear.name = this.string()
    }
    if (!isItemFlag(item, SaveFileParser.ItemFlags.compact)) {
      const extra = item.extra = {}
      extra.id = this.reader.read(32)
      extra.level = this.reader.read(7)
      extra.quality = this.reader.read(4)
      extra.graphics = this.reader.read(1)
      if (extra.graphics !== BigInt(0)) {
        extra.graphicsId = this.reader.read(3)
      }
      extra.auto = this.reader.read(1)
      if (extra.auto) {
        extra.autoId = this.reader.read(11)
      }
      switch (Number(extra.quality)) {
        case SaveFileParser.ItemQuality.inferior:
        case SaveFileParser.ItemQuality.superior: {
          extra.file = this.reader.read(3)
          break
        }
        case SaveFileParser.ItemQuality.magic: {
          extra.prefix = this.reader.read(11)
          extra.suffix = this.reader.read(11)
          break
        }
        case SaveFileParser.ItemQuality.rare:
        case SaveFileParser.ItemQuality.crafted: {
          extra.rarePrefix = this.reader.read(8)
          extra.rareSuffix = this.reader.read(8)
          extra.prefix = []
          extra.suffix = []
          for (let i = 0; i < 3; ++i) {
            if (this.reader.read(1) !== BigInt(0)) {
              extra.prefix.push(this.reader.read(11))
            }
            if (this.reader.read(1) !== BigInt(0)) {
              extra.suffix.push(this.reader.read(11))
            }
          }
          break
        }
        case SaveFileParser.ItemQuality.set:
        case SaveFileParser.ItemQuality.unique: {
          extra.file = this.reader.read(12)
        }
      }
      extra.properties = 0
      if (isItemFlag(item, SaveFileParser.ItemFlags.runeword)) {
        extra.runeId = this.reader.read(12)
        extra.runeProperty = this.reader.read(4)
        extra.properties = 1 << (1 + Number(extra.runeProperty))
      }
      if (isItemFlag(item, SaveFileParser.ItemFlags.personalized)) {
        extra.name = this.string()
      }
      if (item.compact.code === BigInt(0x206B6269) || item.compact.code === BigInt(0x206B6274)) {
        extra.suffix = [this.reader.read(5)]
      }
      extra.realm = this.reader.read(1)
      if (extra.realm !== BigInt(0)) {
        extra.realm = this.reader.read(96)
      }
      if (item.code) {
        const code = item.code
        const entry = this.typeList.entry(code)
        if (this.typeList.isArmor(code)) {
          extra.armor = this.reader.read(11)
        }
        if (this.typeList.isArmor(code) || this.typeList.isWeapon(code)) {
          extra.durability = {}
          const bits = Number(this.costs.first('Stat', 'maxdurability')['Save Bits'])
          extra.durability.max = this.reader.read(bits)
          if (extra.durability.max > 0) {
            extra.durability.current = this.reader.read(bits)
            extra.durability.bit = this.reader.read(1)
          }
        }
        if (entry['stackable'] === '1') {
          extra.quantity = this.reader.read(9)
        }
      }
      if (isItemFlag(item, SaveFileParser.ItemFlags.socketed)) {
        extra.sockets = this.reader.read(4)
      }
      if (Number(extra.quality) === SaveFileParser.ItemQuality.set) {
        extra.mask = this.reader.read(5)
        extra.properties |= Number(extra.mask)
      }
      extra.list = this.itemStatList()
      for (let i = 0; i < 7; ++i) {
        if ((extra.properties & (1 << i)) !== 0) {
          extra.property = extra.property || []
          extra.property.push(this.itemStatList())
        }
      }
    }
    this.reader.align()
    if (item.compact.socketed > BigInt(0)) {
      item.sockets = []
      for (let i = 0; i < Number(item.compact.socketed); ++i) {
        item.sockets.push(this.item())
      }
    }
    return item
  }

  codeToString (itemCode) {
    let res = ''
    for (let i = 0; i < 4; ++i) {
      const code = Number((itemCode >> BigInt(i * 8)) & BigInt(0xFF))
      res += String.fromCharCode(code)
    }
    return res.trim()
  }

  itemStat (id) {
    const res = { id }
    const entry = this.costs.first('ID', id.toString())
    const bits = Number(entry['Save Param Bits'])
    if (bits !== 0) {
      res.param = this.reader.read(bits)
      if (entry['descfunc'] === '14') {
        res.skill = {}
        res.skill.table = Number(res.param & BigInt(0x7))
        res.skill.level = Number((res.param >> BigInt(3)) >> BigInt(0x1FFF))
      }
      switch (Number(entry['Encode'])) {
        case 2:
        case 3: {
          res.skill = {}
          res.skill.level = Number(res.param & BigInt(0x3F))
          res.skill.id = Number((res.param >> BigInt(6)) & BigInt(0x3FF))
          break
        }
      }
    }
    res.value = this.reader.read(Number(entry['Save Bits']))
    res.raw = res.value - BigInt(entry['Save Add'])
    switch (Number(entry['Encode'])) {
      case 3: {
        res.charges = (res.raw >> BigInt(8)) & BigInt(0xFF)
        res.current = res.raw & BigInt(0xFF)
        break
      }
    }
    res.raw = Number(res.raw)
    return res
  }

  itemStatList () {
    const res = []
    for (;;) {
      const id = this.reader.read(9)
      if (id === BigInt(0x1FF)) {
        break
      }
      const first = this.itemStat(id)
      const list = [first]
      if (id === BigInt(52) || id === BigInt(17) || id === BigInt(48) || id === BigInt(50)) {
        list.push(this.itemStat(id + BigInt(1)))
      } else if (id === BigInt(54) || id === BigInt(57)) {
        list.push(this.itemStat(id + BigInt(1)))
        list.push(this.itemStat(id + BigInt(2)))
      }
      res.push(list)
    }
    return res
  }

  items () {
    const res = {}
    res.header = this.reader.read(16)
    res.count = this.reader.read(16)
    res.items = []
    for (let i = 0; i < res.count; ++i) {
      const item = this.item()
      res.items.push(item)
    }
    return res
  }

  corpses () {
    const res = {}
    res.header = this.reader.read(16)
    res.count = this.reader.read(16)
    res.corpses = []
    for (let i = 0; i < res.count; ++i) {
      const corpse = {}
      res.corpses.push(corpse)
      corpse.unknown = this.reader.read(32)
      corpse.x = this.reader.read(16)
      corpse.y = this.reader.read(16)
      corpse.items = this.items()
    }
    return res
  }

  attributes () {
    if (this.reader.rem() !== 8) {
      throw new Error('attributes should begin on a byte')
    }
    const res = {}
    res.header = this.reader.read(16)
    res.values = {}
    for (;;) {
      const id = this.reader.read(9)
      if (id === BigInt(0x1FF)) {
        break
      }
      const el = this.costs.first('ID', id.toString())
      const n = Number(el['CSvBits'])
      res.values[el['Stat']] = this.reader.read(n)
    }
    return res
  }

  json () {
    this.read()
    const prev = BigInt.prototype.toJSON
    BigInt.prototype.toJSON = function () {
      return `0x${this.toString(16)}`
    }
    const res = JSON.stringify(this.data, null, 2)    
    BigInt.prototype.toJSON = prev
    return res
  }
}

class SaveFileWriter {
  static defaults = {
    header: {
      "magic": "0xaa55aa55",
      "version": "0x60",
      "size": "0x3d3",
      "checksum": "0x2fc84721"
    },
    "activeWeapon": "0x0",
    "name": "SynthSave",
    "status": "0x28",
    "progression": "0xf",
    "unknown1": "0x0",
    "unknown2": "0x2110",
    "level": "0x5a",
    "created": "0x0",
    "lastPlayed": "0x0",
    "unknown3": "0xffffffff",
    "assignedSkills": [
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff",
      "0xffff"
    ],    
    "leftSkill": "0x0",
    "rightSkill": "0x0",
    "leftSkillAlt": "0x0",
    "rightSkillAlt": "0x0",
    "appearance": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "location": "0x840000",
    "mapId": "0x1",
    "unknown4": "0x0",
    "mercenary": {
      "dead": "0x1",
      "id": "0xa7870272",
      "name": "0x7",
      "type": "0x0",
      "experience": "0x57f19ec"
    },
    "realm": "0x0",
    "quests": "0x80029ffd9ffd000c17899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c391011000100019ffd9ffd9ffd804a9ffd1001000100000000000000000000000080029ffd9ffd000417899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c791011000100019ffd9ffd9ffd804a9ffd1001000100000000000000000000000080029ffd9ffd000417899fed802200000000000100000000000000019ffd9ffd10010001000197fd9ffd10019ffd9ffd1001000100011fe59ffd9ffd9ffd1c79100100000001101910151019804e101110010001012a00000006216f6f5700000000",
    "waypoints": "0x7fffffffff010200000000000000000000000000000000007fffffffff010200000000000000000000000000000000007fffffffff01020050000000015357",
    "dialog": "0x7e00000006c880002e00000000c880002400000000c88000ac00347701",
    "attributes": {
      "header": "0x6667",
      "values": {
        "strength": "0x14",
        "energy": "0x19",
        "dexterity": "0x14",
        "vitality": "0x14",
        "statpts": "0x1cc",
        "newskills": "0x65",
        "hitpoints": "0x12000",
        "maxhp": "0x12000",
        "mana": "0xca00",
        "maxmana": "0xca00",
        "stamina": "0x14b40",
        "maxstamina": "0x14b40",
        "level": "0x5a",
        "experience": "0x627c1b67",
        "goldbank": "0x2536cf"
      }
    },
    "skills": "0x6669",
    "items": {
      "header": "0x4d4a",
      "count": "0x0"
    },
    "corpses": {
      "header": "0x4d4a",
      "count": "0x0",
      "corpses": []
    },
    "mercenaryItems": {
      "header": "0x666a",
      "items": {
        "header": "0x4d4a",
        "count": "0x0",
        "items": []
      }
    }
  }

  constructor () {

  }
}

module.exports = {
  BitReader,
  BitWriter,
  SaveFileParser,
  SaveFileWriter
}
