export default class LifeGuard {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`LifeGuard calc type: ${effect.CalculationType}`)
    calc.liveSim.lifeGuardCount += effect.activeEffect.Value
    if (effect.data.Id === 29301) {
      calc.liveSim.lifeGuardCount += effect.activeEffect.Value
    }
  }
}
