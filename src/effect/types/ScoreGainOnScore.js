import ConstText from "../../db/ConstText"
import ScoreBonusType from "../../logic/ScoreBonusType"

export default class ScoreGainOnScore {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreGainOnScore calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const liveSim = calc.liveSim
      const addScoreTask = (scoreArr, logKey) => {
        const scoreRightNow = liveSim.baseScore * liveSim.currentTiming / liveSim.lastSenseTiming
          + calc.result.senseScore.reduce((acc, cur) => acc + cur, 0)
          + calc.result.starActScore.reduce((acc, cur) => acc + cur, 0)
        const score = Math.floor(scoreRightNow * effect.activeEffect.Value / 10000)
        scoreArr.push(score)
        liveSim.phaseLog.push(ConstText.get(logKey, [scoreRightNow, (effect.activeEffect.Value / 100).toFixed(2) + '%', score, 'score']))
        root.addWarningMessage(ConstText.get('LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE'))
      }
      if (type === ScoreBonusType.Poster) {
        // 海报分数百分比加分操作在sense算分最后
        calc.liveSim.pendingActions.push(() => addScoreTask(calc.result.senseScore, 'LIVE_LOG_POSTER_SCORE'))
      } else if (type === ScoreBonusType.Sense) {
        // sense分数百分比加分操作在sense算分后
        calc.liveSim.pendingActions.unshift(() => addScoreTask(calc.result.senseScore, 'LIVE_LOG_SENSE_SCORE_EXTRA'))
      } else if (type === ScoreBonusType.StarAct) {
        // sa分数百分比加分操作在sa算分后
        calc.liveSim.pendingActions.push(() => addScoreTask(calc.result.starActScore, 'LIVE_LOG_STARACT_SCORE_EXTRA'))
      } else {
        root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED', {type: type, id: effect.Id}))
      }
    })
  }
}
