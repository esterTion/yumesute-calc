export default class PrincipalGaugeGain {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PrincipalGaugeGainPercentageOfLimit calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.addPGauge(Math.floor(effect.activeEffect.Value * calc.liveSim.pGaugeLimit / 10000))
    })
  }
}
