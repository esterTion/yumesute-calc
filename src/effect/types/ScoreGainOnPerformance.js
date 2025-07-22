import ConstText from "../../db/ConstText"
import ScoreBonusType from "../../logic/ScoreBonusType"

export default class ScoreGainOnPerformance {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnPerformance calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = effect.Range === 'All' ? calc.stat.finalTotal : calc.stat.final[idx].total
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      if (type === ScoreBonusType.Poster) {
        calc.result.senseScore.push(score)
        calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'pe']))
      } else if (type === ScoreBonusType.StarAct) {
        // 2025 sirius fes - sasu sa stock加分吃血条加成
        let multiplierText = effect.activeEffect.Value / 100
        let score1 = score
        calc.liveSim.activeBuff.starAct.forEach((buff) => {
          if (buff.isStandaloneMultiplier) {
            score1 *= 1 + buff.bonus
            multiplierText += ` × ${1 + buff.bonus}`
          }
        })
        score1 = Math.floor(score1)
        calc.result.starActScore.push(score1)
        calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_SCORE_EXTRA', [val, multiplierText, score1, 'pe']))
      } else {
        root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED', {type: type, id: effect.Id}))
      }
    })
  }
}
