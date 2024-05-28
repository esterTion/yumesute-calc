export default class PrincipalGaugeUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PrincipalGaugeUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.pGaugeBonus[idx] += effect.activeEffect.Value
    })
  }
}
