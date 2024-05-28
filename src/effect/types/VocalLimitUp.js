import StatBonus from '../../logic/StatBonus'

export default class VocalLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`VocalLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Vocal] += effect.activeEffect.Value
    })
  }
}
