import _ from "../../../createElement"
import Filter from "../Filter"

export default class extends Filter {
  constructor() {
    super()
    this.state = [true, true, true, true]
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_CHARACTER_OBTAIN_METHOD' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        ...['FILTER_CHARACTER_OBTAIN_DEFAULT','FILTER_CHARACTER_OBTAIN_GACHA','FILTER_CHARACTER_OBTAIN_LIMITED','FILTER_CHARACTER_OBTAIN_FES'].map((type, i) => _('label', {}, [
          this.toggles[i] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(i) }}),
          _('span', { 'data-text-key': type })
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
		let obtainMethod = 1
		const unlockText = item.data.UnlockText
		if (/フェス/.test(unlockText)) obtainMethod = 3
		else if (/限定/.test(unlockText)) obtainMethod = 2
		else if (/初期/.test(unlockText)) obtainMethod = 0
    return this.state[ obtainMethod ]
  }
}
