import _ from "../../createElement"

class CharacterSortType {
  static NONE       = 'SORT_KEY_NONE'
  static CHARACTER  = 'SORT_KEY_CHARACTER'
  static LEVEL      = 'SORT_KEY_LEVEL'
  static RARITY     = 'SORT_KEY_RARITY'
  static SENSELEVEL = 'SORT_KEY_SENSELEVEL'
  static BLOOM      = 'SORT_KEY_BLOOM'
  static CT         = 'SORT_KEY_CT'
  static RELDATE    = 'SORT_KEY_RELEASE_DATE'

  static getKeys() {
    return [
      this.NONE,
      this.CHARACTER,
      this.LEVEL,
      this.RARITY,
      this.SENSELEVEL,
      this.BLOOM,
      this.CT,
      this.RELDATE,
    ]
  }
}

export default class {
  constructor() {
    this.node = _('form', { event: { change: _ => this.updateSort() }}, [
      _('div', { 'data-text-key': 'LABEL_SORT_BY' }),
      _('div', {}, CharacterSortType.getKeys().map(key => _('label', {}, [
        _('input', { type: 'radio', name: 'sort', value: key }),
        _('span', { 'data-text-key': key }),
      ]))),
      _('div', {}, [
        _('span', { 'data-text-key': 'LABEL_SORT_DIRECTION' }),
        _('label', {}, [
          _('input', { type: 'radio', name: 'order', value: 'asc' }),
          _('span', { 'data-text-key': 'LABEL_SORT_ASC' }),
        ]),
        _('label', {}, [
          _('input', { type: 'radio', name: 'order', value: 'desc' }),
          _('span', { 'data-text-key': 'LABEL_SORT_DESC' }),
        ]),
      ])
    ])

    this.sortType = CharacterSortType.NONE
    this.node.sort.value = CharacterSortType.NONE
    this.node.order.value = 'asc'
  }
  render() {
    return this.node
  }
  updateSort() {
    this.sortType = this.node.sort.value
    this.sortOrder = this.node.order.value
  }

  compare(a, b) {
    if (this.sortType === CharacterSortType.NONE) return 0
    let result = 0
    let order = this.sortOrder === 'asc' ? 1 : -1
    switch (this.sortType) {
      case CharacterSortType.CHARACTER:  { result = a.data.CharacterBaseMasterId - b.data.CharacterBaseMasterId; break }
      case CharacterSortType.LEVEL:      { result = a.lvl - b.lvl; break }
      case CharacterSortType.RARITY:     { result = a.rarityStr.length - b.rarityStr.length; break }
      case CharacterSortType.SENSELEVEL: { result = a.senselv - b.senselv; break }
      case CharacterSortType.BLOOM:      { result = a.bloom - b.bloom; break }
      case CharacterSortType.CT:         { result = a.sense.ct - b.sense.ct; break }
      case CharacterSortType.RELDATE:    { result = a.data.DisplayStartAt.localeCompare(b.data.DisplayStartAt); break }
    }
    if (result === 0) {
      result = a.Id - b.Id
    }
    return result * order
  }
}
