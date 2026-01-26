export default class StarActProcrastinate {
  static applyEffect(effect, calc, targets, type) {
    const indices = calc.liveSim.starActScoreIndex
    if (!indices.length) return
    calc.liveSim.activeBuff.starAct.push({
      targets,
      effect,
      bonus: indices.length,
      skipCurrent: false,
      isStandaloneMultiplier: true,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    indices.forEach(idx => calc.result.starActScore[idx] = 0)
  }
}
