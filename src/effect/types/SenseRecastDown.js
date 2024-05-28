export default class SenseRecastDown {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`SenseRecastDown calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].sense.recastDown.push(effect.activeEffect.Value)
    })
  }
}
