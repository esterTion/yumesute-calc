export default class SenseCoolTimeRecastDown {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`SenseCoolTimeRecastDown calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.lastSenseTime[idx] -= effect.activeEffect.Value
    })
  }
}
