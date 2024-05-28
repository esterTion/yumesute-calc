import StatBonus from "../../logic/StatBonus"

export default class FinalPerformanceUpCancelSense {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`FinalPerformanceUpCancelSense calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffAfterCalc[idx][StatBonus.Performance] *= effect.activeEffect.Value / 100
      calc.liveSim.skipSense[idx] = true
    })
  }
}
