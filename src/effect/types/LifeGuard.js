export default class LifeGuard {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`LifeGuard calc type: ${effect.CalculationType}`)
    calc.liveSim.lifeGuardCount += effect.activeEffect.Value
  }
}
