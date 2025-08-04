import ConstText from "../../db/ConstText"
import ScoreBonusType from "../../logic/ScoreBonusType"

export default class ScoreGainOnScore {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreGainOnScore calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const liveSim = calc.liveSim
      const scoreRightNow = liveSim.baseScore * liveSim.currentTiming / liveSim.lastSenseTiming
        + calc.result.senseScore.reduce((acc, cur) => acc + cur, 0)
        + calc.result.starActScore.reduce((acc, cur) => acc + cur, 0)
      const score = Math.floor(scoreRightNow * effect.activeEffect.Value / 10000)
      if (type === ScoreBonusType.Poster) {
        calc.result.senseScore.push(score)
        liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [scoreRightNow, (effect.activeEffect.Value / 100).toFixed(2) + '%', score, 'score']))
        root.addWarningMessage(ConstText.get('LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE'))
      } else if (type === ScoreBonusType.StarAct) {
        // sa分数百分比加分操作在sa算分后
        calc.liveSim.pendingActions.push(() => {
          const scoreRightNow = liveSim.baseScore * liveSim.currentTiming / liveSim.lastSenseTiming
            + calc.result.senseScore.reduce((acc, cur) => acc + cur, 0)
            + calc.result.starActScore.reduce((acc, cur) => acc + cur, 0)
          const score = Math.floor(scoreRightNow * effect.activeEffect.Value / 10000)
          calc.result.starActScore.push(score)
          liveSim.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_SCORE_EXTRA', [scoreRightNow, (effect.activeEffect.Value / 100).toFixed(2) + '%', score, 'score']))
        })
        root.addWarningMessage(ConstText.get('LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE'))
      } else {
        root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED', {type: type, id: effect.Id}))
      }
    })
  }
}
