export default class DecreaseRequireSpecialLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireSpecialLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[3] += effect.activeEffect.Value
    })
  }
}
