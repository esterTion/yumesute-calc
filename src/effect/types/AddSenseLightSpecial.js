export default class AddSenseLightSpecial {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Special'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
