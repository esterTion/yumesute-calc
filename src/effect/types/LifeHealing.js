export default class LifeHealing {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`LifeHealing calc type: ${effect.CalculationType}`)
    calc.liveSim.addLife(effect.activeEffect.Value)
  }
}
