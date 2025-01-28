
export default class PerformanceDuplicateUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PerformanceDuplicateUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.pendingActions.push(() => {
        calc.liveSim.performanceDuplicateUp[idx] += effect.activeEffect.Value
      })
    })
  }
}
