import StatBonus from '../../logic/StatBonus'

export default class PerformanceLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PerformanceLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Performance] += effect.activeEffect.Value
    })
  }
}
