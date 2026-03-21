export default class PrincipalGaugeLimitUp {
  static applyEffect(effect, calc, targets, type) {
    // 【新たなる王、翠玉の戴冠】阿岐留カミラ
    // 无视计算类型，一概判断为加
    // if (effect.CalculationType !== 'FixedAddition') throw new Error(`PrincipalGaugeLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.addPGaugeLimit(effect.activeEffect.Value)
    })
  }
}
