import ConstText from "../../db/ConstText"

export default class StarActScoreUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`SenseScoreUp calc type: ${effect.CalculationType}`)
    const lifeGuardFix = effect.isLifeGuardBranch ? 100 : 1
    const bonus = lifeGuardFix * 0.0001 * effect.activeEffect.Value
    calc.liveSim.activeBuff.starAct.push({
      targets,
      effect,
      bonus,
      skipCurrent: false,
      isLifeGuardEffect: effect.isLifeGuardBranch,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_UP', [bonus * 100, effect.DurationSecond]))
  }
}
