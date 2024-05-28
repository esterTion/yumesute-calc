import StatBonus from '../../logic/StatBonus'

export default class ConcentrationUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][StatBonus.Concentration] += effect.activeEffect.Value
    })
  }
}
