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
    this.state = []
    for (let c in companyMap) {
      this.state[c] = []
      for (let charaId of companyMap[c]) {
        this.state[c][(charaId % 100) - 1] = true
      }
    }
    const childs = [_('tr', {}, [_('td', {}, [_('label', {}, [
      this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
      _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
    ])])])]
    this.toggles = {}
    Object.keys(companyMap).forEach(c => {
      childs.push(_('tr', { style: { borderTop: '1px dashed black' } }, [_('td', {}, [_('label', {}, [
        this.toggles[c] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeCompany(c | 0) }}),
        _('span', { 'data-text-key': {1:'SIRIUS', 2:'EDEN', 3:'GINGAZA', 4:'DENKI', 900:'AQUARS'}[c] })
      ])])]))
      companyMap[c].map(c => {
        const charaId = GameDb.CharacterBase[c].Id
        const companyId = GameDb.CharacterBase[c].CompanyMasterId
        return _('td', {}, [_('label', {}, [
          this.toggles[charaId] = _('input', { type: 'checkbox', checked: true, 'data-company': companyId, event: { change: _ => this.change(charaId) }}),
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
    for (let i in this.state) {
      this.changeCompany(i | 0, target)
    }
  }
  changeCompany(company, target) {
    if (target === undefined) target = this.toggles[company].checked
    for (let toggleId in this.toggles) {
      let c = this.toggles[toggleId].dataset.company | 0
      if (c !== company) continue
      const chara = (toggleId % 100) - 1
      this.toggles[toggleId].checked = target
      this.state[company][chara] = target
    }
    this.updateCompanyState()
  }
  change(charaId) {
    const company = this.toggles[charaId].dataset.company | 0
    const chara = (charaId % 100) - 1
    this.state[company][chara] = this.toggles[charaId].checked
    this.updateCompanyState()
  }
  updateCompanyState() {
    const count = this.state.map(i => i.filter(v => v).length)
    let totalChecked = 0, totalCount = 0
    for (let c in this.state) {
      this.toggles[c].checked = count[c] === Object.values(this.state[c]).length
      this.toggles[c].indeterminate = count[c] > 0 && count[c] < Object.values(this.state[c]).length
      totalChecked += count[c]
      totalCount += Object.values(this.state[c]).length
    }
    this.toggleAll.checked = totalChecked === totalCount
    this.toggleAll.indeterminate = totalChecked > 0 && totalChecked < totalCount
  }
  render() {
    return this.container
  }
  check(item) {
    const charaId = item.data.CharacterBaseMasterId
    const toggle = this.toggles[charaId]
    const subCharaId = item.data.SecondaryCharacterBaseMasterId
    return (toggle && toggle.checked) || (subCharaId && this.toggles[subCharaId] && this.toggles[subCharaId].checked)
  }
}
