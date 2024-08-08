export default class PrincipalGaugeGain {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`PrincipalGaugeGain calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.addPGauge(effect.activeEffect.Value)
    })
  }
}
