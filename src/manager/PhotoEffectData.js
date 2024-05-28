import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"

import _ from "../createElement"

export default class PhotoEffectData {
  constructor(id, level, parent, enabled = false) {
    this.id = id
    this.level = level
    this.data = GameDb.PhotoEffect[id]
    this.enabled = enabled

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      this.enableToggle = _('input', { type: 'checkbox', event: { change: e=>this.setEnabled(e) }}),
      this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } }),
      this.desc = _('span'),
      _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
    ]))

    for (let i = 1; i < 26; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
  }
  get effectLevel() {
    if (this.level < 1 || this.level > 25) return 1
    return [0,
      1,1,1,1,2,
      3,3,3,3,4,
      5,5,5,5,6,
      7,7,7,7,8,
      9,9,9,9,10
    ][this.level]
  }
  get selectName() {
    return `【${this.targetCharcterName}】${this.data.Name}`
  }
  get targetCharcterName() {
    const charaId = Math.floor(this.id / 1000)
    if (charaId === 0) return '全体'
    return GameDb.CharacterBase[charaId].Name
  }
  get description() {
    return this.data.Description.replace('[:param1]', this.effect.activeEffectValueStr)
  }

  update() {
    this.levelSelect.value = this.level;
    this.effect = Effect.get(this.data.EffectMasterId, this.effectLevel)
    this.desc.textContent = `${this.data.Name}：${this.description}`;
    this.enableToggle.checked = this.enabled
  }
  remove() {
    this.node.remove()
    root.removePhotoEffect(this)
  }
  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ album: true })
  }
  setEnabled(e) {
    this.enabled = e.target.checked;
    root.update({ album: true })
  }

  static fromJSON(data, parent) {
    return new PhotoEffectData(data[0], data[1], parent, data[2])
  }
  toJSON() {
    return [this.id, this.level, this.enabled]
  }
}
