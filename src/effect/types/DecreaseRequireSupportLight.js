export default class DecreaseRequireSupportLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireSupportLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[0] += effect.activeEffect.Value
    })
  }
}
