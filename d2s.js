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
  }

  write (value, count) {
    if (typeof value !== 'bigint') {
      value = BigInt(value)
    }
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
    if (this.index >= this.bytes.length) {
      throw new Error('cannot write past buffer length')
    }
    this.bytes[this.index] |= Number(bit) << this.offset
    this.offset += 1
    if (this.offset >= 8) {
      this.offset = 0
      this.index += 1
    }
  }

  align () {
    if (this.offset !== 0) {
      this.offset = 0
      this.index += 1
    }
  }

  seek (index) {
    this.index = Number(index)
    this.offset = 0
    return this
  }

  rem () {
    return 8 - this.offset
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

  static isItemFlag (item, id) {
    return (BigInt(item.compact.flags) & BigInt(1 << id)) != BigInt(0)
  }

  /**
   *
   * @param {BitReader} reader
   * @param {DataFrame} costs
   */
  constructor ({ typeList, reader, costs, format }) {
    this.typeList = typeList
    this.reader = new BitReader(reader)
    this.costs = costs
    this.format = format
  }

  read () {
    if (this.data) {
      return
    }
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
    this.data.classId = this.reader.read(8)
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
    this.data.skills = this.skills()
    this.data.items = this.items()
    this.data.corpses = this.corpses()
    this.data.mercenaryItems = this.mercenaryItems()
  }

  skills () {
    const res = {}
    res.header = this.reader.read(16)
    res.list = []
    for (let i = 0; i < 33; ++i) {
      res.list.push(this.reader.read(8))
    }
    return res
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
    const item = {}
    item.header = this.reader.read(16)
    if (item.header !== 19786n) {
      throw new Error(`item header wrong: ${item.header.toString(16)}`)
    }
    item.compact = {}
    item.compact.flags = this.reader.read(32)
    item.compact.version = this.reader.read(10)
    item.compact.location = this.reader.read(3)
    item.compact.equipment = this.reader.read(4)
    item.compact.x = this.reader.read(4)
    item.compact.y = this.reader.read(4)
    item.compact.page = this.reader.read(3)
    if (!SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.ear)) {
      item.compact.code = this.reader.read(32)
      item.compact.socketed = this.reader.read(SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.compact) ? 1 : 3)
      item.code = this.codeToString(item.compact.code)
    } else {
      item.compact.ear = {}
      item.compact.ear.file = this.reader.read(3)
      item.compact.ear.level = this.reader.read(7)
      item.compact.ear.name = this.string()
    }
    if (!SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.compact)) {
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
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.runeword)) {
        extra.runeId = this.reader.read(12)
        extra.runeProperty = this.reader.read(4)
        extra.properties = 1 << (1 + Number(extra.runeProperty))
      }
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.personalized)) {
        extra.name = this.string()
      }
      if (item.compact.code === BigInt(0x206B6269) || item.compact.code === BigInt(0x206B6274)) {
        extra.suffix = this.reader.read(5)
      }
      extra.realm = this.reader.read(1)
      if (extra.realm !== BigInt(0)) {
        extra.realmData = this.reader.read(96)
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
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.socketed)) {
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
    res.real = {}
    res.real.name = this.costs.first('ID', id.toString())['Stat']
    const entry = this.costs.first('ID', id.toString())
    const bits = Number(entry['Save Param Bits'])
    if (bits !== 0) {
      res.param = this.reader.read(bits)
      if (entry['descfunc'] === '14') {
        res.real.skill = {}
        res.real.skill.table = Number(res.param & BigInt(0x7))
        res.real.skill.level = Number((res.param >> BigInt(3)) >> BigInt(0x1FFF))
      }
      switch (Number(entry['Encode'])) {
        case 2:
        case 3: {
          res.real.skill = {}
          res.real.skill.level = Number(res.param & BigInt(0x3F))
          res.real.skill.id = Number((res.param >> BigInt(6)) & BigInt(0x3FF))
          break
        }
      }
    }
    res.value = this.reader.read(Number(entry['Save Bits']))
    res.real.raw = res.value - BigInt(entry['Save Add'])
    if (this.format) {
      res.real.tooltip = this.format.get(res.real.name, { value: Number(res.real.raw), param: Number(res.param) })
    }
    switch (Number(entry['Encode'])) {
      case 3: {
        res.real.charges = (res.real.raw >> BigInt(8)) & BigInt(0xFF)
        res.real.current = res.real.raw & BigInt(0xFF)
        break
      }
    }
    res.real.raw = Number(res.real.raw)
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
    res.list = []
    for (let i = 0; i < res.count; ++i) {
      const item = this.item()
      item.id = i
      res.list.push(item)
      BigInt.prototype.toJSON = function () {
        return `0x${this.toString(16)}`
      }
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
      res.list.push(corpse)
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
    res.values = []
    for (;;) {
      const id = this.reader.read(9)
      if (id === BigInt(0x1FF)) {
        break
      }
      const el = this.costs.first('ID', id.toString())
      const n = Number(el['CSvBits'])
      const value = this.reader.read(n)
      res.values.push({
        real: {
          name: el['Stat']
        },
        id,
        value
      })
    }
    return res
  }

  object () {
    this.read()
    return this.data
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
      "dead": "0x0",
      "id": "0x0",
      "name": "0x0",
      "type": "0x0",
      "experience": "0x0"
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

  constructor ({ typeList, costs }) {
    this.typeList = typeList
    this.costs = costs
  }

  checksum (bytes) {
    let res = 0
    for (let i = 0; i < bytes.length; ++i) {
      let data = i >= 12 && i <= 15 ? 0 : bytes[i]
      if (res < 0) {
        data += 1
      }
      res = (res << 1) + data
    }
    return BigInt(res)
  }

  write (object) {
    const writer = new BitWriter()
    this.writer = writer
    writer.write(object.header.magic, 32)
    writer.write(object.header.version, 32)
    // reserve for length
    writer.write(BigInt(0), 32)
    // reserve for checksum
    writer.write(BigInt(0), 32)
    writer.write(object.activeWeapon, 32)
    this.writeName(object.name)
    writer.write(object.status, 8)
    writer.write(object.progression, 8)
    writer.write(object.unknown1, 16)
    writer.write(object.classId, 8)
    writer.write(object.unknown2, 16)
    writer.write(object.level, 8)
    writer.write(object.created, 32)
    writer.write(object.lastPlayed, 32)
    writer.write(object.unknown3, 32)
    for (let i = 0; i < 16; ++i) {
      writer.write(object.assignedSkills[i], 32)
    }
    writer.write(object.leftSkill, 32)
    writer.write(object.rightSkill, 32)
    writer.write(object.leftSkillAlt, 32)
    writer.write(object.rightSkillAlt, 32)
    writer.write(object.appearance, 32 * 8)
    writer.write(object.location, 24)
    writer.write(object.mapId, 32)
    writer.write(object.unknown4, 16)
    this.writeMercenary(object.mercenary)
    writer.write(object.realm, 140 * 8)
    writer.write(object.quests, 302 * 8)
    writer.write(object.waypoints, 80 * 8)
    writer.write(object.dialog, 52 * 8)
    this.writeAttributes(object.attributes)
    writer.align()
    this.writeSkills(object.skills)
    this.writeItems(object.items)
    this.writeCorpses(object.corpses)
    this.writeMercenaryItems(object.mercenaryItems)
    delete this.writer
    writer.seek(8)
    writer.write(writer.bytes.length, 32)
    writer.write(this.checksum(writer.bytes), 32)
    return writer.bytes
  }

  writeSkills (skills) {
    this.writer.write(skills.header, 16)
    for (let i = 0; i < 33; ++i) {
      this.writer.write(skills.list[i], 8)
    }
  }

  writeMercenaryItems (mercenaryItems) {
    this.writer.write(mercenaryItems.header, 16)
    if (mercenaryItems.items && mercenaryItems.items.length > 0) {
      this.writeItems(mercenaryItems.items)
    }
  }

  writeCorpses (corpses) {
    this.writer.write(corpses.header, 16)
    this.writer.write(BigInt(corpses.list?.length || 0), 16)
    if (corpses.list?.length > 0) {
      for (const { unknown, x, y, items } of corpses.list) {
        this.writer.write(unknown, 32)
        this.writer.write(x, 16)
        this.writer.write(y, 16)
        this.writeItems(items)
      }
    }
  }

  writeItemStat ({ id, param,  value }) {
    const entry = this.costs.first('ID', BigInt(id).toString())
    const bits = Number(entry['Save Param Bits'])
    if (bits !== 0) {
      this.writer.write(param, bits)
    }
    this.writer.write(value, Number(entry['Save Bits']))
  }

  writeItemStatList (list) {
    for (let i = 0; i < list.length; ++i) {
      // for stat pairs e.g. ed% -> min ed%, max ed%
      this.writer.write(list[i][0].id, 9)
      for (let j = 0; j < list[i].length; ++j) {
        this.writeItemStat(list[i][j])
      }
    }
    this.writer.write(BigInt(0x1FF), 9)
  }

  writeString (string) {
    for (let i = 0; i < string.length; ++i) {
      this.writer.write(BigInt(string.charCodeAt(i)), 7)
    }
    this.writer.write(BigInt(0), 7)
  }

  writeItem (item) {
    this.writer.write(item.header, 16)
    this.writer.write(item.compact.flags, 32)
    this.writer.write(item.compact.version, 10)
    this.writer.write(item.compact.location, 3)
    this.writer.write(item.compact.equipment, 4)
    this.writer.write(item.compact.x, 4)
    this.writer.write(item.compact.y, 4)
    this.writer.write(item.compact.page, 3)
    if (!SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.ear)) {
      this.writer.write(item.compact.code, 32)
      this.writer.write(item.compact.socketed, SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.compact) ? 1 : 3)
    } else {
      this.writer.write(item.compact.ear.file, 3)
      this.writer.write(item.compact.ear.level, 7)
      this.writeString(item.compact.ear.name)
    }
    if (!SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.compact)) {
      this.writer.write(item.extra.id, 32)
      this.writer.write(item.extra.level, 7)
      this.writer.write(item.extra.quality, 4)
      this.writer.write(item.extra.graphics, 1)
      if (BigInt(item.extra.graphics) !== BigInt(0)) {
        this.writer.write(item.extra.graphicsId, 3)
      }
      this.writer.write(item.extra.auto, 1)
      if (BigInt(item.extra.auto) !== BigInt(0)) {
        this.writer.write(item.extra.autoId, 11)
      }
      switch (Number(item.extra.quality)) {
        case SaveFileParser.ItemQuality.inferior:
        case SaveFileParser.ItemQuality.superior: {
          this.writer.write(item.extra.file, 3)
          break
        }
        case SaveFileParser.ItemQuality.magic: {
          this.writer.write(item.extra.prefix, 11)
          this.writer.write(item.extra.suffix, 11)
          break
        }
        case SaveFileParser.ItemQuality.rare:
        case SaveFileParser.ItemQuality.crafted: {
          this.writer.write(item.extra.rarePrefix, 8)
          this.writer.write(item.extra.rareSuffix, 8)
          for (let i = 0; i < 3; ++i) {
            if (i < item.extra.prefix.length) {
              this.writer.write(BigInt(1), 1)
              this.writer.write(item.extra.prefix[i], 11)
            } else {
              this.writer.write(BigInt(0), 1)
            }
            if (i < item.extra.suffix.length) {
              this.writer.write(BigInt(1), 1)
              this.writer.write(item.extra.suffix[i], 11)
            } else {
              this.writer.write(BigInt(0), 1)
            }
          }
          break
        }
        case SaveFileParser.ItemQuality.set:
        case SaveFileParser.ItemQuality.unique: {
          this.writer.write(item.extra.file, 12)
          break
        }
      }
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.runeword)) {
        this.writer.write(item.extra.runeId, 12)
        this.writer.write(item.extra.runeProperty, 4)
      }
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.personalized)) {
        this.writeString(item.extra.name)
      }
      if (item.compact.code === BigInt(0x206B6269) || item.compact.code === BigInt(0x206B6274)) {
        this.writer.write(item.extra.suffix, 5)
      }
      this.writer.write(item.extra.realm, 1)
      if (BigInt(item.extra.realm) !== BigInt(0)) {
        this.writer.write(item.extra.realmData, 96)
      }
      if (item.code) {
        const code = item.code
        const entry = this.typeList.entry(code)
        if (this.typeList.isArmor(code)) {
          this.writer.write(item.extra.armor, 11)
        }
        if (this.typeList.isArmor(code) || this.typeList.isWeapon(code)) {
          const bits = Number(this.costs.first('Stat', 'maxdurability')['Save Bits'])
          this.writer.write(item.extra.durability.max, bits)
          if (item.extra.durability.max > BigInt(0)) {
            this.writer.write(item.extra.durability.current, bits)
            this.writer.write(item.extra.durability.bit, 1)
          }
        }
        if (entry['stackable'] === '1') {
          this.writer.write(item.extra.quantity, 9)
        }
      }
      if (SaveFileParser.isItemFlag(item, SaveFileParser.ItemFlags.socketed)) {
        this.writer.write(item.extra.sockets, 4)
      }
      if (Number(item.extra.quality) === SaveFileParser.ItemQuality.set) {
        this.writer.write(item.extra.mask, 5)
      }
      this.writeItemStatList(item.extra.list)
      if (item.extra.property) {
        for (let i = 0; i < 7 && i < item.extra.property.length; ++i) {
          this.writeItemStatList(item.extra.property[i])
        }
      }
    }
    this.writer.align()
    if (item.compact.socketed > BigInt(0)) {
      for (let i = 0; i < item.sockets.length; ++i) {
        this.writeItem(item.sockets[i])
      }
    }
  }

  writeItems (items) {
    this.writer.write(items.header, 16)
    this.writer.write(BigInt(items.list.length), 16)
    for (let i = 0; i < items.list.length; ++i) {
      this.writeItem(items.list[i])
    }
  }

  writeAttributes (attributes) {
    if (this.writer.rem() !== 8) {
      throw new Error('attributes should begin on a byte')
    }
    this.writer.write(attributes.header, 16)
    for (const { id, value } of attributes.values) {
      this.writer.write(id, 9)
      const el = this.costs.first('ID', BigInt(id).toString())
      const n = Number(el['CSvBits'])
      this.writer.write(value, n)
    }
    this.writer.write(BigInt(0x1FF), 9)
  }

  writeMercenary (mercenary) {
    this.writer.write(mercenary.dead, 16)
    this.writer.write(mercenary.id, 32)
    this.writer.write(mercenary.name, 16)
    this.writer.write(mercenary.type, 16)
    this.writer.write(mercenary.experience, 32)
  }

  writeName (name) {
    for (let i = 0; i < 16; ++i) {
      if (i < name.length) {
        this.writer.write(BigInt(name.charCodeAt(i)), 8)
      } else {
        this.writer.write(BigInt(0), 8)
      }
    }
  }
}

module.exports = {
  BitReader,
  BitWriter,
  SaveFileParser,
  SaveFileWriter
}
