import _ from "../../../createElement"
import Filter from "../Filter"

export default class extends Filter {
  constructor() {
    super()
    this.state = [true, true]
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_CHARACTER_MAX_TALENT' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        ...[5,6].map((type, i) => _('label', {}, [
          this.toggles[i] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(i) }}),
          _('span', {}, [_('text', type)])
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
		const maxTalent = item.data.MaxTalentStage
		let maxTalentType = 0
		if (maxTalent === 6) maxTalentType = 1
    return this.state[ maxTalentType ]
  }
}
