import ConstText from "../../db/ConstText"
import ScoreBonusType from "../../logic/ScoreBonusType"

export default class ScoreUpByHighLife {
  static LifeCap = 3000
  static PowerValue = 1.25
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreUpByHighLife calc type: ${effect.CalculationType}`)
    const life = Math.min(calc.liveSim.life, ScoreUpByHighLife.LifeCap)
    if (type === ScoreBonusType.Sense) {
      const bonus = Math.floor(0.01 * effect.activeEffect.Value * Math.pow(life / ScoreUpByHighLife.LifeCap, ScoreUpByHighLife.PowerValue)) / 100
      const bonusLine = `${effect.activeEffect.Value / 100} × (${life} / ${ScoreUpByHighLife.LifeCap}) ^ ${ScoreUpByHighLife.PowerValue} = ${Math.round(bonus * 100)}`
      calc.liveSim.activeBuff.sense.push({
        targets,
        effect,
        bonus,
        skipCurrent: false,
        isStandaloneMultiplier: false,
        lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
      })
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonusLine, effect.DurationSecond]))
    } else if (type === ScoreBonusType.StarAct) {
      const bonus = 0.01 * effect.activeEffect.Value * Math.pow(life / ScoreUpByHighLife.LifeCap, ScoreUpByHighLife.PowerValue) / 100
      const bonusLine = `${effect.activeEffect.Value / 100} × (${life} / ${ScoreUpByHighLife.LifeCap}) ^ ${ScoreUpByHighLife.PowerValue} = ${bonus * 100}`
      calc.liveSim.activeBuff.starAct.push({
        targets,
        effect,
        bonus,
        skipCurrent: false,
        isStandaloneMultiplier: true,
        lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
      })
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_UP', [bonusLine, effect.DurationSecond]))
    }
  }
}

