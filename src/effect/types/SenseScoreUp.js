import ConstText from "../../db/ConstText"

export default class SenseScoreUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`SenseScoreUp calc type: ${effect.CalculationType}`)
    const lifeGuardFix = effect.isLifeGuardBranch ? 100 : 1
    const bonus = lifeGuardFix * 0.0001 * effect.activeEffect.Value
    calc.liveSim.activeBuff.sense.push({
      targets,
      effect,
      bonus,
      skipCurrent: effect.Range === 'All',
      isStandaloneMultiplier: effect.isLifeGuardBranch,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonus * 100, effect.DurationSecond]))
  }
}
