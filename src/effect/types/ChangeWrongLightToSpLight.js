export default class ChangeWrongLightToSpLight {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      switch (effect.FireTimingType) {
        case 'Passive': { calc.liveSim.wrongLightToSpAmount[idx] += effect.activeEffect.Value; break }
      }
    })
  }
}
