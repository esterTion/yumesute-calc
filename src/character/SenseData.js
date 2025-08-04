import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"
import ConstText from "../db/ConstText"

export default class SenseData {
  constructor(id, level) {
    this.id = id
    this.level = level
    this.data = GameDb.Sense[id]
    this.recastDown = []
    if (!this.data) throw new Error(`Sense ${id} not found`)
    Object.assign(this, this.data)
  }
  get desc() {
    return this.Description
      .replace('[:score]', this.scoreUp)
      .replace('[:gauge]', this.gaugeUp)
      .replace(/\[:pre(\d)\]/g, (_,i)=>Effect.get(this.PreEffects[0].EffectMasterId, this.level).activeEffectValueStr)
      .replace('[:sec]', ()=>Effect.get(this.Branches[0].BranchEffects[0].EffectMasterId, this.level).DurationSecond)
      .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level).activeEffectValueStr)
      .replace(/<\/?size[^>]*>/g, '')
      .replace(/／/g, '／\n　')
  }
  getType(members = null) {
    switch (this.Type) {
      case 'Support':
      case 'Control':
      case 'Amplification':
      case 'Special': return this.Type.toLowerCase()
      case 'None': return ''
      case 'Alternative': {
        if (!members) return ''
        // 应该读SenseAlternative的，但是130380没有
        // 反正只有szk是，直接查找kkn
        const kokona = members.find(i => i && i.data.CharacterBaseMasterId === 101)
        if (!kokona) return '?'
        return kokona.sense.getType()
      }
    }
  }
  resetRecastDown() {
    this.recastDown = []
  }
  get ct() {
    return Math.max(1, this.CoolTime - this.recastDown.reduce((acc, cur) => acc + cur, 0))
  }
  get scoreUp() {
    return (this.AcquirableScorePercent + (this.level- 1) * this.ScoreUpPerLevel) / 100
  }
  get gaugeUp() {
    return this.AcquirableGauge
  }

  getActiveBranch(liveSim) {
    const branches = this.data.Branches
    let result = null
    let isLifeGuardBranch = false
    for (let branch of branches) {
      let conditionMet = true
      if (this.data.BranchCondition1 !== 'None') {
        let judgeValue
        switch (this.data.BranchCondition1) {
          case 'LifeGuardCount': { judgeValue = liveSim.lifeGuardCount; isLifeGuardBranch = true; break }
          case 'AttributeCount': { judgeValue = liveSim.calc.properties.attributeCount; isLifeGuardBranch = true; break }
          case 'CompanyMemberCount': { judgeValue = liveSim.calc.members.reduce((s,i) => GameDb.CharacterBase[i.data.CharacterBaseMasterId].CompanyMasterId === this.data.ConditionValue1 ? s+1 : s, 0); break }
          default: { root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_BRANCH_NOT_IMPLEMENTED', {condition:this.data.BranchCondition1, id: this.id})); return null }
        }
        switch (branch.JudgeType1) {
          case 'Equal': { conditionMet = judgeValue === branch.Parameter1; break }
          case 'MoreThan': { conditionMet = judgeValue >= branch.Parameter1; break }
          case 'LessThan': { conditionMet = judgeValue <= branch.Parameter1; break }
        }
      }
      if (this.data.BranchCondition2 !== 'None') {
        switch (this.data.BranchCondition2) {
          default: { root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_BRANCH_NOT_IMPLEMENTED', {condition:this.data.BranchCondition2, id: this.id})); return null }
        }
      }
      if (conditionMet) {
        result = branch
        result.isLifeGuardBranch = isLifeGuardBranch
        break
      }
    }
    return result
  }

  getCombinationSenseEffect(liveSim) {
    let effect
    for (effect of this.data.PreEffects) {
      effect = Effect.get(effect.EffectMasterId, this.level)
      if (effect.Type === 'CombinationSense') return effect
    }
    return null
  }
}
