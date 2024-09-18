import _ from "../../createElement"

class PhotoEffectSortType {
  static NONE       = 'SORT_KEY_NONE'
  static CHARACTER  = 'SORT_KEY_CHARACTER'
  static LEVEL      = 'SORT_KEY_LEVEL'

  static getKeys() {
    return [
      this.NONE,
      this.CHARACTER,
      this.LEVEL,
    ]
  }
}

export default class {
  constructor() {
    this.node = _('form', { event: { change: _ => this.updateSort() }}, [
      _('div', { 'data-text-key': 'LABEL_SORT_BY' }),
      _('div', {}, PhotoEffectSortType.getKeys().map(key => _('label', {}, [
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

    this.sortType = PhotoEffectSortType.NONE
    this.node.sort.value = PhotoEffectSortType.NONE
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
    if (this.sortType === PhotoEffectSortType.NONE) return 0
    let result = 0
    let order = this.sortOrder === 'asc' ? 1 : -1
    switch (this.sortType) {
      case PhotoEffectSortType.CHARACTER:  { result = 0; break }
      case PhotoEffectSortType.LEVEL:      { result = a.level - b.level; break }
    }
    if (result === 0) {
      result = a.id - b.id
    }
    return result * order
  }
}
