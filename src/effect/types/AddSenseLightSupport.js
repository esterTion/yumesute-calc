export default class AddSenseLightSupport {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Support'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
