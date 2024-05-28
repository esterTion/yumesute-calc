export default class BaseScoreUpEffect {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`BaseScoreUp calc type: ${effect.CalculationType}`)
    calc.passiveEffects.baseScoreUp += effect.activeEffect.Value
  }
}
