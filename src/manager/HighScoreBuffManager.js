import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"

import BeautyText from "../db/BeautyText"
import _ from "../createElement"
import removeAllChilds from "../removeAllChilds"

export default class HighScoreBuffManager {
  constructor() {
    this.buffMap = {}
  }

  init() {
    this.container = root.highScoreBuffContainer
    this.currentBuffGroup = {}
    this.currentBuffNodes = {}
    this.currentBuffEffects = {}
  }
  changeNotation(id) {
    if (this.buffMap[id] === this.currentBuffGroup) return
    removeAllChilds(this.container)
    this.currentBuffGroup = {}
    this.currentBuffNodes = {}
    this.currentBuffEffects = {}

    const buffItems = Object.values(GameDb.StoryEventHighScoreBuffSetting).filter(i => i.StoryEventHighScoreMasterId == id)
    if (buffItems.length == 0) {
      return
    }
    if (this.buffMap[id] === undefined) {
      this.buffMap[id] = {}
      buffItems.forEach(i => this.buffMap[id][i.StoryEventHighScoreBuffMasterId] = 0)
    }
    this.currentBuffGroup = this.buffMap[id]

    buffItems.forEach(i => {
      const id = i.StoryEventHighScoreBuffMasterId
      this.currentBuffNodes[id] = {}
      this.currentBuffEffects[id] = {
        effect: Effect.get(i.StoryEventHighScoreBuffMaster.EffectMasterId, 1),
        desc: i.StoryEventHighScoreBuffMaster.EffectDescription,
      }
      this.container.appendChild(_('div', {}, [
        this.currentBuffNodes[id].select = _('select', { 'data-id': id, event: { change: e=>this.setLevel(e) } }, this.generateLevelOptions()),
        this.currentBuffNodes[id].desc = _('span'),
      ]))
    })

    Object.keys(this.currentBuffGroup).forEach(id => {
      this.currentBuffNodes[id].select.value = this.currentBuffGroup[id]
      this.currentBuffEffects[id].effect.level = Math.max(1, this.currentBuffGroup[id])
      this.updateEffectDesc(id)
    })
  }

  updateEffectDesc(id) {
    this.currentBuffNodes[id].desc.innerHTML = BeautyText.convertGameTextToValidDom(this.currentBuffEffects[id].desc.replace('[:param1]', this.currentBuffEffects[id].effect.activeEffectValueStr))
    this.currentBuffNodes[id].desc.style.opacity = (this.currentBuffGroup[id] === 0) ? 0.5 : 1
  }
  setLevel(e) {
    const id = e.target.dataset.id
    this.currentBuffGroup[id] = e.target.value | 0
    this.currentBuffEffects[id].effect.level = Math.max(1, this.currentBuffGroup[id])
    this.updateEffectDesc(id)

    root.update({ party: true })
  }

  currentActiveEffects() {
    const list = []
    if (root.calcType !== 'highscore') return list
    Object.keys(this.currentBuffGroup).forEach(id => {
      if (this.currentBuffGroup[id] === 0) return
      list.push(this.currentBuffEffects[id].effect)
    })
    return list
  }

  generateLevelOptions() {
    const list = []
    for (let i=0; i<11; i++) {
      list.push(_('option', { 'value': i }, [_('text', i)]))
    }
    return list
  }

  toJSON() {
    return this.buffMap
  }
  static fromJSON(data) {
    const manager = new HighScoreBuffManager()
    manager.buffMap = data
    return manager
  }
}
