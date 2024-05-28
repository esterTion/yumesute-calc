export default class DecreaseRequireAmplificationLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireAmplificationLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[2] += effect.activeEffect.Value
    })
  }
}
