export default class AddSenseLightSelf {
  static applyEffect(effect, calc, targets, type) {
    // 为什么有 PercentageAddition ？
    // 全部视为 FixedAddition
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.senseExtraAmount[idx] += effect.activeEffect.Value
    })
  }
}
