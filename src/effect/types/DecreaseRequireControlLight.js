export default class DecreaseRequireControlLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireControlLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[1] += effect.activeEffect.Value
    })
  }
}
