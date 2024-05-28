export default class PrincipalGaugeLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`PrincipalGaugeLimitUp calc type: ${effect.CalculationType}`)
    calc.liveSim.addPGaugeLimit(effect.activeEffect.Value)
  }
}
