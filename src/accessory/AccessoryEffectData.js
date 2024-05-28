import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"
import BeautyText from "../db/BeautyText"

import _ from "../createElement"

export default class AccessoryEffectData {
  constructor(id, parent) {
    this.id = id
    this.data = GameDb.AccessoryEffect[id]
    if (!this.data) throw new Error(`AccessoryEffect ${id} not found`)
    this.level = 1
    this.effect = Effect.get(this.data.EffectMasterId, this.level)

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      _('span', {}, [_('text', this.data.Name + ': ')]),
      _('br'),
      this.descNode = _('span', { style: { paddingLeft: '1em' }}),
    ]))
  }

  update() {
    this.effect.level = this.level
    this.descNode.innerHTML = this.desc
  }

  get desc() {
    return BeautyText.convertGameTextToValidDom(this.data.Description)
      .replace(/\[:param1\]/g, _=>this.effect.activeEffectValueStr)
  }
}
