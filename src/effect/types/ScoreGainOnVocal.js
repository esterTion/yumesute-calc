import ConstText from "../../db/ConstText"
import ScoreBonusType from "../../logic/ScoreBonusType"

export default class ScoreGainOnVocal {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnVocal calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = calc.stat.final[idx].vo
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      if (type === ScoreBonusType.Poster) {
        calc.result.senseScore.push(score)
        calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'vo']))
      } else if (type === ScoreBonusType.Sense) {
        calc.result.senseScore.push(score)
        calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_SCORE_EXTRA', [val, effect.activeEffect.Value / 100, score, 'vo']))
      } else {
        root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED', {type: type, id: effect.Id}))
      }
    })
  }
}
