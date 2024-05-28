import StatBonus from '../../logic/StatBonus'

export default class ExpressionLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ExpressionLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Expression] += effect.activeEffect.Value
    })
  }
}
