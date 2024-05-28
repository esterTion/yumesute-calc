import ConstText from "../../db/ConstText"

export default class ScoreGainOnVocal {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnVocal calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = calc.stat.final[idx].vo
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'vo']))
    })
  }
}
