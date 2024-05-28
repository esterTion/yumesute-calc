import ConstText from "../../db/ConstText"

export default class ScoreUpByLowLife {
  static LifeCap = 1000
  static PowerValue = 2
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreUpByLowLife calc type: ${effect.CalculationType}`)
    const life = Math.min(calc.liveSim.life, ScoreUpByLowLife.LifeCap)
    const bonus = Math.floor(0.01 * effect.activeEffect.Value * Math.pow((1001 - life) / ScoreUpByLowLife.LifeCap, ScoreUpByLowLife.PowerValue)) / 100
    calc.liveSim.activeBuff.sense.push({
      targets,
      effect,
      bonus,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    const bonusLine = `${effect.activeEffect.Value / 100} × ((1001 -${life}) / ${ScoreUpByLowLife.LifeCap}) ^ ${ScoreUpByLowLife.PowerValue} = ${Math.round(bonus * 100)}`
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonusLine, effect.DurationSecond]))
  }
}
