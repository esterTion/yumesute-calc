import _ from "../../../createElement"
import Filter from "../Filter"
import GameDb from "../../../db/GameDb"

export default class extends Filter {
  constructor() {
    super()
		const companyMap = {}
		Object.values(GameDb.CharacterBase).forEach(c => {
			companyMap[c.CompanyMasterId] = companyMap[c.CompanyMasterId] || []
			companyMap[c.CompanyMasterId].push(c.Id)
		})
    this.state = [[],
			new Array(companyMap[1].length).fill(true),
			new Array(companyMap[2].length).fill(true),
			new Array(companyMap[3].length).fill(true),
			new Array(companyMap[4].length).fill(true),
		]
		const childs = [_('tr', {}, [_('td', {}, [_('label', {}, [
			this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
			_('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
		])])])]
    this.toggles = {}
		Object.keys(companyMap).forEach(c => {
			childs.push(_('tr', { style: { borderTop: '1px dashed black' } }, [_('td', {}, [_('label', {}, [
				this.toggles[c] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeCompany(c | 0) }}),
				_('span', { 'data-text-key': ['', 'SIRIUS', 'EDEN', 'GINGAZA', 'DENKI'][c] })
			])])]))
			companyMap[c].map(c => {
				const charaId = GameDb.CharacterBase[c].Id
				return _('td', {}, [_('label', {}, [
					this.toggles[charaId] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(charaId) }}),
					_('text', GameDb.CharacterBase[c].Name)
				])])
			}).reduce((a, b) => {
				if (a[0].length < 3) a[0].push(b)
				else a.unshift([b])
				return a
			}, [[]]).reverse().forEach(tr => childs.push(_('tr', {}, tr)))
		})
    this.container = _('div', {}, [
      _('hr'),
      _('details', {}, [
				_('summary', { 'data-text-key': 'FILTER_CHARACTER' }),
				_('table', { style: { borderCollapse: 'collapse' } }, childs)
			])
    ])
  }
  changeAll() {
    const target = this.toggleAll.checked
    this.toggleAll.indeterminate = false
    this.toggleAll.checked = target
    for (let i = 1; i < 5; i++) {
      this.changeCompany(i, target)
    }
  }
	changeCompany(company, target) {
		if (target === undefined) target = this.toggles[company].checked
		for (let toggleId in this.toggles) {
			let c = Math.floor(toggleId / 100)
			if (c !== company) continue
			const chara = (toggleId % 100) - 1
			this.toggles[toggleId].checked = target
			this.state[company][chara] = target
		}
		this.updateCompanyState()
	}
  change(i) {
		const company = Math.floor(i / 100)
		const chara = (i % 100) - 1
    this.state[company][chara] = this.toggles[i].checked
		this.updateCompanyState()
  }
	updateCompanyState() {
		const count = this.state.map(i => i.filter(v => v).length)
		let totalChecked = 0, totalCount = 0
		for (let i = 1; i < 5; i++) {
			this.toggles[i].checked = count[i] === this.state[i].length
			this.toggles[i].indeterminate = count[i] > 0 && count[i] < this.state[i].length
			totalChecked += count[i]
			totalCount += this.state[i].length
		}
		this.toggleAll.checked = totalChecked === totalCount
		this.toggleAll.indeterminate = totalChecked > 0 && totalChecked < totalCount
	}
  render() {
    return this.container
  }
  check(item) {
		const charaId = item.data.CharacterBaseMasterId
		const company = Math.floor(charaId / 100)
		const chara = (charaId % 100) - 1
    return this.state[company][chara]
  }
}
