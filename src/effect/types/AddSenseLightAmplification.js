export default class AddSenseLightAmplification {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Amplification'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
