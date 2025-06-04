import _ from "../createElement"
import removeAllChilds from "../removeAllChilds"
import ConstText from "../db/ConstText"
import GameDb from "../db/GameDb"
import CharacterData from "../character/CharacterData"
import PosterData from "../poster/PosterData"

export const GACHA_TYPE = {
  ACTOR: 'Character',
  POSTER: 'Poster',
}

export default class GachaViewer {
  static show(type) {
    return new GachaViewer(type)
  }

  constructor(type) {
    this.type = type
    this.container = document.body.appendChild(_('div', { className: 'picking-overlay', event: { click: e => e.target === this.container && this.close() } }, [
      _('div', { className: 'picking-container' }, [
        _('input', { type: 'button', value: ConstText.get('BACK'), event: { click: () => this.close() } }),
        this.contentContainer = _('div', {}, [_('text', 'Loading gacha table...')]),
      ])
    ]))

    GameDb.extraLoadPromise.Gacha.then(_ => this.renderAfterLoad()).catch(e => this.contentContainer.textContent = `Load failed: ${e}`)
    document.body.classList.add('picking')
  }

  renderAfterLoad() {
    removeAllChilds(this.contentContainer)
    const list = Object.values(GameDb.Gacha).filter(i => i.CardType === this.type)
    list.sort((a, b) => a.StartDate > b.StartDate ? -1 : a.StartDate < b.StartDate ? 1 : b.Order - a.Order)
    this.contentContainer.appendChild(_('div', {}, [
      _('div', {}, [_('select', { event: { change: e => this.changeGacha(e.target.value) } }, list.map(i => _('option', { value: i.Id }, [_('text', this.getGachaName(i))])))]),
      this.gachaTable = _('div')
    ]))

    this.changeGacha(list[0].Id)
  }
  getGachaName(g) {
    let str = `${g.Name} ${g.StartDate.slice(0, -3)}`
    if (!g.IsHideEndDate) str += ` ~ ${g.EndDate.slice(0, -3)}`
    return str
  }
  changeGacha(id) {
    const gacha = GameDb.Gacha[id]
    if (!gacha) return
    const categories = this.categorizeThings(gacha.Things)
    removeAllChilds(this.gachaTable)
    const owningList = this.getOwningThings()
    if (categories.PICKUP) {
      this.gachaTable.appendChild(_('p', {}, [_('text', ConstText.get('GACHA_TYPE_PICKUP')), _('br')].concat(categories.PICKUP.map(i => this.getThingPreviewNode(i, owningList.indexOf(i.ThingId) !== -1)))))
      this.gachaTable.appendChild(_('hr'))
    }
    if (categories.SELECT) {
      this.gachaTable.appendChild(_('p', {}, [_('text', ConstText.get('GACHA_TYPE_SELECT')), _('br')].concat(categories.SELECT.map(i => this.getThingPreviewNode(i, owningList.indexOf(i.ThingId) !== -1)))))
      this.gachaTable.appendChild(_('hr'))
    }
    for (let i = 3; i >= 1; i--) {
      if (categories[`RARITY_${i}`]) {
        this.gachaTable.appendChild(_('p', {}, categories[`RARITY_${i}`].map(i => this.getThingPreviewNode(i, owningList.indexOf(i.ThingId) !== -1))))
        this.gachaTable.appendChild(_('hr'))
      }
    }
    this.gachaTable.lastChild.remove()
  }
  categorizeThings(things) {
    const categories = {
      PICKUP: [],
      SELECT: [],
      RARITY_3: [],
      RARITY_2: [],
      RARITY_1: [],
    }
    things.forEach(i => {
      if (i.PickupOrder !== undefined) {
        categories.PICKUP[i.PickupOrder - 1] = i
        return
      }
      if (i.IsSelectable) {
        categories.SELECT.push(i)
        return
      }
      if (i.ThingType === 'Character') {
        const rarity = GameDb.Character[i.ThingId].Rarity.substring(4) - 1
        categories[`RARITY_${rarity}`].push(i)
        return
      }
      if (i.ThingType === 'Poster') {
        const rarity = {R:1, SR:2, SSR:3}[GameDb.Poster[i.ThingId].Rarity]
        categories[`RARITY_${rarity}`].push(i)
        return
      }
    })
    for (let cat in categories) {
      if (categories[cat].length === 0) delete categories[cat]
    }
    return categories
  }
  getOwningThings() {
    if (this.type === GACHA_TYPE.ACTOR) {
      return window.root.appState.characters.map(i => i.Id)
    }
    if (this.type === GACHA_TYPE.POSTER) {
      return window.root.appState.posters.map(i => i.id)
    }
  }
  getThingPreviewNode(item, owned) {
    if (item.ThingType === 'Character') {
      const chara = new CharacterData(item.ThingId, null)
      const charaEle = _('span', { className: 'list-icon-container hoz-item-with-name' }, [
        _('span', { className: 'spriteatlas-characters', 'data-id': chara.cardIconId }),
        _('span', { className: `card-attribute-${chara.attributeName}`}),
        _('span', { className: 'sense-star gray-background', 'data-sense-type': chara.sense.getType() }, [_('text', `${chara.sense.data.LightCount} `)]),
        _('text', chara.sense.ct),
        _('text', chara.rarityStr),
        _('br'),
        _('span', { className: 'item-name' }, [
          _('span', { className: 'obtain-type' }, [_('text', /フェス/.test(chara.data.UnlockText) ? 'フェス' : /限定/.test(chara.data.UnlockText) ? '限定' : /イベント/.test(chara.data.UnlockText) ? 'イベント' : '')]),
          _('text', `【${chara.cardName}】${chara.charaName}`)
        ]),
      ])
      if (owned) {
        charaEle.classList.add('selected')
      }
      return charaEle
    }
    if (item.ThingType === 'Poster') {
      const poster = new PosterData(item.ThingId, null)
      const posterEle = _('span', { className: 'list-icon-container hoz-item-with-name' }, [
        _('span', { className: 'spriteatlas-posters', 'data-id': poster.id }),
        _('span', { className: 'item-name' }, [_('text', poster.fullPosterName)]),
      ])
      if (owned) {
        posterEle.classList.add('selected')
      }
      return posterEle
    }
    return null
  }

  close() {
    this.container.remove()
    document.body.classList.remove('picking')
  }
}
