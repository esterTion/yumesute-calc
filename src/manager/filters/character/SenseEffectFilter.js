import _ from "../../../createElement"
import Effect from "../../../effect/Effect"
import Filter from "../Filter"

const FILTER_KEYS = [
  'FILTER_EFFECT_SENSE_SCORE_UP',
  'FILTER_EFFECT_STARACT_SCORE_UP',
  'FILTER_EFFECT_PGAUGE_GAIN',
  'FILTER_EFFECT_PGAUGE_LIMIT_GAIN',
  'FILTER_EFFECT_SCORE_GAIN',
  'FILTER_EFFECT_LIFE_HEALING',
  'FILTER_EFFECT_CT_RECAST_DOWN',
  'FILTER_EFFECT_LIFE_GUARD',
  'FILTER_EFFECT_PERFORMANCE_DUPLICATE_UP',
  'FILTER_EFFECT_NONE',
]

export default class extends Filter {
  constructor() {
    super()
    this.state = new Array(FILTER_KEYS.length).fill(true)
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_CHARACTER_SENSE_EFFECT' }),
      _('div', { className: 'flex-container' }, [
        _('label', {}, [
          this.toggleAll = _('input', { type: 'checkbox', checked: true, event: { change: _ => this.changeAll() }}),
          _('span', { 'data-text-key': 'FILTER_SELECTION_ALL' })
        ]),
        ...FILTER_KEYS.map((type, i) => _('label', {}, [
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
    let matchedCategories = 0
    let matchResult = false
    const effects = []
    for (const effect of item.sense.data.PreEffects) {
      effects.push(Effect.get(effect.EffectMasterId, 1))
    }
    for (const branch of item.sense.data.Branches) {
      for (const be of branch.BranchEffects) {
        effects.push(Effect.get(be.EffectMasterId, 1))
      }
    }
    for (const effect of effects) {
      switch (effect.Type) {
        case 'ScoreUpByHighLife':
        case 'SenseScoreUp': { matchedCategories++; matchResult = matchResult || this.state[ 0 ]; break }
        case 'StarActScoreUp': { matchedCategories++; matchResult = matchResult || this.state[ 1 ]; break }
        case 'PrincipalGaugeBonus':
        case 'PrincipalGaugeGain': { matchedCategories++; matchResult = matchResult || this.state[ 2 ]; break }
        case 'PrincipalGaugeLimitUp': { matchedCategories++; matchResult = matchResult || this.state[ 3 ]; break }
        case 'ScoreGainOnScore':
        case 'ScoreGainOnVocal':
        case 'ScoreGainOnExpression':
        case 'ScoreGainOnConcentration': { matchedCategories++; matchResult = matchResult || this.state[ 4 ]; break }
        case 'LifeHealing': { matchedCategories++; matchResult = matchResult || this.state[ 5 ]; break }
        case 'SenseCoolTimeRecastDown': { matchedCategories++; matchResult = matchResult || this.state[ 6 ]; break }
        case 'LifeGuard': { matchedCategories++; matchResult = matchResult || this.state[ 7 ]; break }
        case 'PerformanceDuplicateUp': { matchedCategories++; matchResult = matchResult || this.state[ 8 ]; break }
        case 'SenseAlternative': { break }
        case 'CombinationSense': { break }
        default: {console.log(effect); break}
      }
    }
    if (item.sense.gaugeUp > 0) {
      matchedCategories++
      matchResult = matchResult || this.state[ 2 ]
    }
    // TODO: 发动加光效果（额外加不同色光） => 141570【ホエールウォッチング！】鳳ここな
    if (matchedCategories === 0) {
      return this.state[ this.state.length - 1 ]
    }
    return matchResult
  }
}
