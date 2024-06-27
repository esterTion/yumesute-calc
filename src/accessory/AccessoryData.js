import GameDb from "../db/GameDb"
import AccessoryEffectData from "./AccessoryEffectData"

import _ from "../createElement"


export default class AccessoryData {
  id;
  level;
  constructor(id, parent) {
    this.id = id
    this.level = 1
    this.data = GameDb.Accessory[id]
    if (!this.data) throw new Error(`Accessory ${id} not found`)

    if (!parent) return
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [_('td', { rowspan: 4, style: {textAlign: 'center', verticalAlign: 'top'} }, [_('span', {className: 'spriteatlas-accessories', 'data-id': this.id})]), _('td', {}, [_('text', this.fullAccessoryName)])]),
      _('tr', {}, [_('td', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })])]),
      this.effectBox = _('tr'),
      _('tr', {}, [
        this.randomEffectSelect = _('select', { event: { change: e=>this.setRandomEffect(e) } }),
        _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
      ]),
    ]))

    this.iconNode = root.accessoryIconList.appendChild(_('span', { className: 'list-icon-container small-text', event: { click: e => this.toggleSelection() } }, [
      this.iconNodeIcon = _('span', { className: 'spriteatlas-accessories', 'data-id': this.id }),
      _('br'),
      this.iconNodeLevelLabel = _('span', { style: { maxWidth: '64px' }}),
      this.iconSelectionInput = _('input', { type: 'checkbox', className: 'icon-selection' }),
    ]))
    this.node.style.display = 'none'

    this.mainEffects = this.data.FixedAccessoryEffects.map(i => new AccessoryEffectData(i, this.effectBox))
    this.data.RandomEffectGroups.forEach(i => {
      const group = GameDb.RandomEffectGroup[i]
      if (!group) throw new Error(`RandomEffectGroup ${i} not found`)
      group.AccessoryEffects.forEach(j => this.randomEffectSelect.appendChild(_('option', { value: j }, [_('text', GameDb.AccessoryEffect[j].Name)])))
    })
    if (this.data.RandomEffectGroups.length > 0) {
      this.randomEffectId = this.randomEffectSelect.value
      this.randomEffect = new AccessoryEffectData(this.randomEffectId, this.effectBox)
    } else {
      this.randomEffectSelect.setAttribute('disabled', '')
      this.randomEffectSelect.style.display = 'none'
    }

    for (let i = 1; i < 11; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
  }

  get fullAccessoryName() {
    return `${this.data.Rarity} ${this.data.Name}`
  }

  setRandomEffect(e, skipUpdate) {
    this.randomEffect.node.remove()
    this.randomEffectId = e.target.value
    this.randomEffect = new AccessoryEffectData(this.randomEffectId, this.effectBox)
    if (!skipUpdate) root.update({ accessory: true })
  }
  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ accessory: true })
  }

  update() {
    this.levelSelect.value = this.level;
    this.mainEffects.forEach(i => {
      i.level = this.level
      i.update()
    })
    this.iconNodeLevelLabel.textContent = this.level
    if (this.randomEffect) {
      this.randomEffect.level = this.level
      this.randomEffect.update()
      this.iconNodeLevelLabel.textContent = [this.level, this.randomEffect.data.Name].join(' | ')
    }
  }
  remove() {
    this.node.remove()
    this.iconNode.remove()
    root.removeAccessory(this)
  }
  toggleSelection() {
    this.iconSelectionInput.checked = !this.iconSelectionInput.checked
    this.iconNode.classList[this.iconSelectionInput.checked ? 'add' : 'remove']('selected')
    if (this.iconSelectionInput.checked) {
      this.node.style.display = ''
    } else {
      this.node.style.display = 'none'
    }

    root.update({ selection: true })
  }

  static fromJSON(data, parent) {
    const accessory = new AccessoryData(data[0], parent)
    accessory.level = data[1]
    if (data[2]) {
      accessory.randomEffectSelect.value = data[2]
      accessory.setRandomEffect({ target: accessory.randomEffectSelect }, true)
    }
    return accessory
  }
  toJSON() {
    return [this.id, this.level, this.randomEffectId]
  }
}

