import GameDb from "../db/GameDb"
import PosterAbilityData from "./PosterAbilityData"

import _ from "../createElement"
import imgErrorHandler from "../logic/imgErrorHandler"
import PosterDetailBoard from "./PosterDetailBoard"

export default class PosterData {
  constructor(id, parent) {
    this.id = id
    this.level = 1
    this.release = 0
    this.data = GameDb.Poster[id]
    if (!this.data) throw new Error(`Poster ${id} not found`)

    if (!parent) return
    this.node = parent.appendChild(_('tr', {}, [_('td', {}, [
      _('div', {}, [_('text', this.fullPosterName), _('span', { className: 'obtain-type' }, [_('text', /特別/.test(this.data.UnlockText) ? '特別' : /限定/.test(this.data.UnlockText) ? '限定' : /イベント/.test(this.data.UnlockText) ? 'イベント' : '')])]),
      _('div', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })]),
      _('div', {}, [_('text', '解放: '), this.releaseSelect = _('select', { event: { change: e=>this.setRelease(e) } })]),
      _('div', {}, [_('text', 'Leader: ')]),
      this.leaderAbilityBox = _('div'),
      _('div', {}, [_('text', 'Normal: ')]),
      this.normalAbilityBox = _('div'),
      _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
    ]), _('td', {}, [_('div', { className: 'expandable' }, [this.posterImg = imgErrorHandler(_('img', { src: 'about:blank', style: { width: '200px' }, event: { click: _=>PosterDetailBoard.show(this.id) } }))])])]))

    this.iconNode = root.posterIconList.appendChild(_('span', { className: 'list-icon-container small-text arial', event: { click: e => this.toggleSelection() } }, [
      this.iconNodeIcon = _('span', { className: 'spriteatlas-posters', 'data-id': this.id }),
      _('br'),
      this.iconNodeLevelLabel = _('span'),
      this.iconSelectionInput = _('input', { type: 'checkbox', className: 'icon-selection' }),
    ]))
    this.node.style.display = 'none'

    for (let i = 1; i <= this.maxLevel; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
    for (let i = 0; i < 5; i++) {
      this.releaseSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }

    this.abilitiesData = Object.values(GameDb.PosterAbility).filter(i => i.PosterMasterId === this.id)
    this.abilities = []
    this.abilitiesData.filter(i=>i.Type === 'Leader').forEach(i => this.abilities.push(new PosterAbilityData(i.Id, this.leaderAbilityBox)))
    this.abilitiesData.filter(i=>i.Type === 'Normal').forEach(i => this.abilities.push(new PosterAbilityData(i.Id, this.normalAbilityBox)))
  }

  get imageUrl() {
    return `https://redive.estertion.win/wds/poster/${this.id}_0.webp@w400`
  }
  get currentMaxLevel() {
    return this.maxLevel - (4 - this.release)
  }
  get maxLevel () {
    switch (this.data.Rarity) {
      case 'R': return 6
      case 'SR': return 8
      case 'SSR': return 10
    }
    return 0
  }
  get fullPosterName() {
    return `${this.data.Rarity} ${this.data.Name}`
  }

  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ poster: true })
  }
  setRelease(e) {
    this.release = e.target.value | 0;
    root.update({ poster: true })
  }
  updateToMax() {
    this.release = 4
    this.level = this.maxLevel
  }

  update() {
    this.level = Math.min(this.level, this.currentMaxLevel)
    this.levelSelect.value = this.level;
    for (let i = 0, currentMax = this.currentMaxLevel, max = this.maxLevel; i < max; i++) {
      if (i < currentMax) {
        this.levelSelect.children[i].removeAttribute('disabled')
      } else {
        this.levelSelect.children[i].setAttribute('disabled', '')
      }
    }
    this.releaseSelect.value = this.release;
    this.abilities.forEach(i => {
      i.level = this.level
      i.release = this.release
      i.update()
    })
    const releaseLabel = '◆'.repeat(this.release) + '◇'.repeat(4 - this.release)
    this.iconNodeLevelLabel.textContent = `${releaseLabel} ${this.level}`
  }
  appendNode(parent) {
    root.posterIconList.appendChild(this.iconNode)
    parent.appendChild(this.node)
  }
  remove() {
    this.node.remove()
    this.iconNode.remove()
    root.removePoster(this)
  }
  toggleSelection() {
    this.iconSelectionInput.checked = !this.iconSelectionInput.checked
    this.iconNode.classList[this.iconSelectionInput.checked ? 'add' : 'remove']('selected')
    if (this.iconSelectionInput.checked) {
      this.node.style.display = ''
      this.posterImg.src = this.imageUrl
      this.posterImg.classList.add('preview-loading')
    } else {
      this.node.style.display = 'none'
    }
    root.update({ selection: true })
  }

  static fromJSON(data, parent) {
    const poster = new PosterData(data[0], parent)
    poster.level = data[1]
    poster.release = data[2]
    return poster
  }
  toJSON() {
    return [this.id, this.level, this.release]
  }
}
