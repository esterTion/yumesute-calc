import _ from "../../../createElement"
import Filter from "../Filter"

export default class extends Filter {
  constructor() {
    super()
    this.state = [true, true, true, true, true]
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_CHARACTER_SENSE' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        ...['support','control','amplification','special','sp'].map((type, i) => _('label', {}, [
          this.toggles[i] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(i) }}),
          _('span', { className: 'sense-star', 'data-sense-type': type })
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
    let index = ['support','control','amplification','special'].indexOf(item.sense.Type.toLowerCase())
    if (index === -1) index = 4
    return this.state[ index ]
  }
}
