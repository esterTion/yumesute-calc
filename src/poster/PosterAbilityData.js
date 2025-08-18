import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"
import BeautyText from "../db/BeautyText"

import _ from "../createElement"

export default class PosterAbilityData {
  constructor(id, parent) {
    this.id = id
    this.data = GameDb.PosterAbility[id]
    if (!this.data) throw new Error(`PosterAbility ${id} not found`)
    this.level = 1
    this.release = 0

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      _('div', {}, [_('text', this.data.Name + ': ' + (this.data.ReleaseLevelAt ? '(Lv'+this.data.ReleaseLevelAt+')' : ''))]),
      this.descNode = _('div', { translate: 'yes', style: { paddingLeft: '1em', maxWidth: '450px' }}),
    ]))
  }

  update() {
    this.descNode.innerHTML = this.desc
    this.node.style.opacity = this.unlocked ? 1 : 0.5
  }

  get unlocked() {
    return this.data.ReleaseLevelAt <= this.level
  }
  get desc() {
    return BeautyText.convertGameTextToValidDom(this.data.Description)
      .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.data.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level + this.release).activeEffectValueStr)
  }

  getActiveBranch(liveSim) {
    const branches = this.data.Branches
    let result = null
    for (let branch of branches) {
      let conditionMet = true
      if (this.data.BranchConditionType1 !== 'None') {
        let judgeValue
        switch (this.data.BranchConditionType1) {
          case 'AttributeCount': { judgeValue = liveSim.calc.properties.attributeCount; break }
          case 'CompanyMemberCount': { judgeValue = liveSim.calc.members.reduce((s,i) => i.isCharacterInCompany(this.data.ConditionValue1) ? s+1 : s, 0); break }
          default: { console.log(`Poster ability branch condition ${this.data.BranchConditionType1}`); return null }
        }
        switch (branch.JudgeType1) {
          case 'Equal': { conditionMet = judgeValue === branch.Parameter1; break }
          case 'MoreThan': { conditionMet = judgeValue >= branch.Parameter1; break }
          case 'LessThan': { conditionMet = judgeValue <= branch.Parameter1; break }
        }
      }
      if (this.data.BranchConditionType2 !== 'None') {
        switch (this.data.BranchConditionType2) {
          default: { console.log(`Poster ability branch condition ${this.data.BranchConditionType2}`); return null }
        }
      }
      if (conditionMet) {
        result = branch
        break
      }
    }
    return result
  }
}
