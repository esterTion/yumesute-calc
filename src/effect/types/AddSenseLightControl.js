export default class AddSenseLightControl {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Control'
      switch (effect.FireTimingType) {
        case 'StartLive': { calc.liveSim.addSenseLight(type, idx, effect.activeEffect.Value); break }
        case 'Passive': { calc.liveSim.senseExtraLights[idx].push([type, effect.activeEffect.Value]); break }
      }
    })
  }
}
