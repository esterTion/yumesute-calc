export default class AddSenseLightVariable {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Variable'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
