import _ from "../../../createElement"
import Effect from "../../../effect/Effect"
import Filter from "../Filter"

const FILTER_KEYS = [
  'FILTER_EFFECT_CONDITION_CHARACTER',
  'FILTER_EFFECT_CONDITION_COMPANY',
  'FILTER_EFFECT_CONDITION_ATTRIBUTE',
  'FILTER_EFFECT_CONDITION_NONE',
]

export default class extends Filter {
  constructor() {
    super()
    this.state = new Array(FILTER_KEYS.length).fill(true)
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_EFFECT_CONDITION' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        _('br'),
        ...FILTER_KEYS.map((type, i) => _('label', {}, [
          this.toggles[i] = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.change(i) }}),
          _('span', { 'data-text-key': type })
        ])),
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
    let matchedCategories = 0
    let matchResult = false
    const effects = []
    for (const ability of item.abilities) {
      for (const branch of ability.data.Branches) {
        for (const be of branch.BranchEffects) {
          effects.push(Effect.get(be.EffectMasterId, 1))
        }
      }
    }
    for (const effect of effects) {
      for (const condition of effect.Conditions) {
        switch (condition.Condition) {
          case 'CharacterBase':
          case 'Character': { matchedCategories++; matchResult = matchResult || this.state[ 0 ]; break }
          case 'Company': { matchedCategories++; matchResult = matchResult || this.state[ 1 ]; break }
          case 'Attribute': { matchedCategories++; matchResult = matchResult || this.state[ 2 ]; break }
					// case 'SenseType':
					// case 'EquippedPoster':
        }
      }
      for (const trigger of effect.Triggers) {
        switch (trigger.Trigger) {
          case 'CharacterBase':
          case 'CharacterBaseGroup': { matchedCategories++; matchResult = matchResult || this.state[ 0 ]; break }
          case 'Company':
          case 'CompanyCount': { matchedCategories++; matchResult = matchResult || this.state[ 1 ]; break }
          case 'Attribute':
          case 'AttributeCount': { matchedCategories++; matchResult = matchResult || this.state[ 2 ]; break }
					// case 'OverLife':
					// case 'BelowLife':
					// case 'SenseType':
        }
      }
    }
    if (matchedCategories === 0) {
      return this.state[ this.state.length - 1 ]
    }
    return matchResult
  }
}
