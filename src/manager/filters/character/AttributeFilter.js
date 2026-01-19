import _ from "../../../createElement"
import Filter from "../Filter"

export default class extends Filter {
  constructor() {
    super()
    this.state = [true, true, true, true]
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_CHARACTER_ATTRIBUTE' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        ...['cute','cool','colorful','cheerful'].map((type, i) => _('label', {}, [
          this.toggles[i] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(i) }}),
          _('span', { className: 'card-attribute-' + type })
        ]))
      ])
    ])
  }
  changeAll() {
    const target = this.toggleAll.checked
    this.toggleAll.indeterminate = false
    this.toggleAll.checked = target
    for (let i = 0; i < this.state.length; i++) {
      this.toggles[i].checked = target
      this.state[i] = target
    }
  }
  change(i) {
    this.state[i] = this.toggles[i].checked
    const count = this.state.filter(v => v).length
    this.toggleAll.checked = count === this.state.length
    this.toggleAll.indeterminate = count > 0 && count < this.state.length
  }
  render() {
    return this.container
  }
  check(item) {
    let index = ['cute','cool','colorful','cheerful'].indexOf(item.attributeName)
    if (index === -1) index = 4
    if (this.state[ index ]) return true
    if (!item.secondaryAttributeName) return false
    index = ['cute','cool','colorful','cheerful'].indexOf(item.secondaryAttributeName)
    if (index === -1) index = 4
    return this.state[ index ]
  }
}
