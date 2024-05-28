import StatBonus from '../../logic/StatBonus'

export default class ConcentrationLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ConcentrationLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Concentration] += effect.activeEffect.Value
    })
  }
}
