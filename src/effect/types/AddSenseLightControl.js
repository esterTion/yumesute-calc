export default class AddSenseLightControl {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Control'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
