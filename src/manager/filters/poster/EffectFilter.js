import _ from "../../../createElement"
import Effect from "../../../effect/Effect"
import Filter from "../Filter"

const FILTER_KEYS = [
  'FILTER_EFFECT_VOCAL_UP',
  'FILTER_EFFECT_EXPRESSION_UP',
  'FILTER_EFFECT_CONCENTRATION_UP',
  'FILTER_EFFECT_PERFORMANCE_UP',
  'FILTER_EFFECT_SENSE_LIGHT_SELF',
  'FILTER_EFFECT_SENSE_LIGHT_SUPPORT',
  'FILTER_EFFECT_SENSE_LIGHT_CONTROL',
  'FILTER_EFFECT_SENSE_LIGHT_AMPLIFICATION',
  'FILTER_EFFECT_SENSE_LIGHT_SPECIAL',
  'FILTER_EFFECT_SENSE_LIGHT_VARIABLE',
  'FILTER_EFFECT_PGAUGE_UP',
  'FILTER_EFFECT_PGAUGE_GAIN',
  'FILTER_EFFECT_PGAUGE_LIMIT_GAIN',
  'FILTER_EFFECT_SCORE_GAIN',
  'FILTER_EFFECT_LIFE_HEALING',
  'FILTER_EFFECT_LIFE_GUARD',
  'FILTER_EFFECT_RECAST_DOWN',
  'FILTER_EFFECT_OTHER',
]

export default class extends Filter {
  constructor() {
    super()
    this.state = new Array(FILTER_KEYS.length).fill(true)
    this.toggles = []
    this.container = _('div', {}, [
      _('hr'),
      _('div', { 'data-text-key': 'FILTER_POSTER_EFFECT' }),
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
    ]);
    ([4+6+4+2,6+4+2,4+2]).forEach(i => this.container.children[2].insertBefore(_('br'), this.container.children[2].children[i]))
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
      switch (effect.Type) {
        case 'VocalUp': { matchResult = matchResult || this.state[ 0 ]; break }
        case 'ExpressionUp': { matchResult = matchResult || this.state[ 1 ]; break }
        case 'ConcentrationUp': { matchResult = matchResult || this.state[ 2 ]; break }
        case 'PerformanceUp': { matchResult = matchResult || this.state[ 3 ]; break }

        case 'AddSenseLightSelf': { matchResult = matchResult || this.state[ 4 ]; break }
        case 'AddSenseLightSupport': { matchResult = matchResult || this.state[ 5 ]; break }
        case 'AddSenseLightControl': { matchResult = matchResult || this.state[ 6 ]; break }
        case 'AddSenseLightAmplification': { matchResult = matchResult || this.state[ 7 ]; break }
        case 'AddSenseLightSpecial': { matchResult = matchResult || this.state[ 8 ]; break }
        case 'AddSenseLightVariable': { matchResult = matchResult || this.state[ 9 ]; break }

        case 'PrincipalGaugeUp': { matchResult = matchResult || this.state[ 10 ]; break }
        case 'PrincipalGaugeGain': { matchResult = matchResult || this.state[ 11 ]; break }
        case 'PrincipalGaugeLimitUp': { matchResult = matchResult || this.state[ 12 ]; break }
        case 'ScoreGainOnVocal':
        case 'ScoreGainOnExpression':
        case 'ScoreGainOnConcentration':
        case 'ScoreGainOnScore': { matchResult = matchResult || this.state[ 13 ]; break }
        case 'LifeHealing': { matchResult = matchResult || this.state[ 14 ]; break }
        case 'LifeGuard': { matchResult = matchResult || this.state[ 15 ]; break }
        case 'SenseRecastDown': { matchResult = matchResult || this.state[ 16 ]; break }
        default: { matchResult = matchResult || this.state[ this.state.length-1 ]; break }
      }
    }
    return matchResult
  }
}
