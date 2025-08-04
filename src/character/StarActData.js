import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"
import BeautyText from "../db/BeautyText"
import ConstText from "../db/ConstText"

export default class StarActData {
  constructor(id, level) {
    this.id = id
    this.level = level
    this.data = GameDb.StarAct[id]
    if (!this.data) throw new Error(`StarAct ${id} not found`)
    Object.assign(this, this.data)

    this.condition = GameDb.StarActCondition[this.StarActConditionMasterId]
    if (!this.condition) throw new Error(`StarActCondition ${this.StarActConditionMasterId} not found`)

    this.requirements = [
      this.condition.SupportLight,
      this.condition.ControlLight,
      this.condition.AmplificationLight,
      this.condition.SpecialLight
    ]
    this.requireDecrease = [0,0,0,0]
  }
  get desc() {
    return BeautyText.convertGameTextToValidDom(this.Description)
      .replace('[:score]', this.scoreUp)
      .replace(/\[:pre(\d)\]/g, (_,i)=>Effect.get(this.PreEffects[0].EffectMasterId, this.level).activeEffectValueStr)
      .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level+1).activeEffectValueStr)
      .replace(/／/g, '／\n　')
  }
  get scoreUp() {
    return (this.AcquirableScorePercent + this.level * this.ScoreUpPerLevel) / 100
  }
  resetRequireDecrease() {
    this.requireDecrease = [0,0,0,0]
  }
  get actualRequirements() {
    return this.requirements.map((req, i) => (req > 0 ? Math.max(1, req - this.requireDecrease[i]) : 0))
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
          case 'StorageSenseLightCount': { judgeValue = liveSim.overflownLights[this.data.ConditionValue1 - 1]; break }
          case 'CompanyMemberCount': { judgeValue = liveSim.calc.members.reduce((s,i) => i.isCharacterInCompany(this.data.ConditionValue1) ? s+1 : s, 0); break }
          case 'AttributeCount': { judgeValue = liveSim.calc.properties.attributeCount; isLifeGuardBranch = true; break }
          case "CharacterBaseGroup": { judgeValue = liveSim.calc.members.reduce((s,i) => i.isCharacterBaseIdInList(GameDb.EffectTriggerCharacterBaseGroup[this.data.ConditionValue1].CharacterBaseMasterIds) ? s+1 : s, 0); break }
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
}
