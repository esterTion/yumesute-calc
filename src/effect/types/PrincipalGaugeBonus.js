export default class {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PrincipalGaugeBonus calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.pendingActions.push(() => {
        calc.liveSim.addPGauge(Math.floor(calc.liveSim.pGauge * effect.activeEffect.Value / 10000), true)
      })
    })
  }
}
