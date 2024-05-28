import ConstText from "../../db/ConstText"

export default class ScoreGainOnScore {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnScore calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const liveSim = calc.liveSim
      const scoreRightNow = liveSim.baseScore * liveSim.currentTiming / liveSim.lastSenseTiming
      + calc.result.senseScore.reduce((acc, cur) => acc + cur, 0)
      + calc.result.starActScore.reduce((acc, cur) => acc + cur, 0)
      const score = Math.floor(scoreRightNow * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [scoreRightNow, effect.activeEffect.Value / 100, score, 'score']))
      root.addWarningMessage(ConstText.get('LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE'))
    })
  }
}
