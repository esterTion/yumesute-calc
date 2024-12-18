import Party from './Party'
import ConstText from '../db/ConstText'

import _ from '../createElement'
import removeAllChilds from '../removeAllChilds'

// import {Swappable} from '@shopify/draggable';

export default class PartyManager {
  constructor() {
    this.parties = [new Party()]
    this.currentSelection = 0
  }
  get currentParty() {
    return this.parties[this.currentSelection]
  }
  addParty() {
    let currentParty = this.currentParty
    let cloneParty = Party.fromJSON(currentParty.toJSON())
    cloneParty.name = `${ConstText.get('PARTY_DEFAULT_NAME')} ${this.parties.length + 1}`
    this.parties.push(cloneParty)
    this.currentSelection = this.parties.length - 1
    this.fillPartySelect()
    this.partyNameInput.value = this.parties[this.currentSelection].name
  }
  removeParty() {
    if (this.parties.length === 1) return alert(ConstText.get('PARTY_DELETE_LAST'))
    if (confirm(ConstText.get('PARTY_DELETE_CONFIRM')) === false) return
    this.parties.splice(this.currentSelection, 1)
    if (this.currentSelection >= this.parties.length) {
      this.currentSelection = this.parties.length - 1
    }
    this.fillPartySelect()
    root.update({ party: true })
  }

  init() {
    const container = root.partyManagerContainer
    removeAllChilds(container)

    container.appendChild(_('div', {}, [
      this.partySelect = _('select', { event: { change: e=>{
        this.currentSelection = e.target.value
        root.update({ party: true })
      } }}),
      _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: _=>this.addParty() }}),
      _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.removeParty() }}),
      this.partyNameInput = _('input', { type: 'text', event: { blur: e=>{
        this.parties[this.currentSelection].name = e.target.value
        this.fillPartySelect()
      }}}),
    ]))

    this.fillPartySelect()

    this.leaderSelection = []
    this.charaSlot = []
    this.posterSlot = []
    this.accessorySlot = []
    container.appendChild(_('div', {}, Array(5).fill(0).map((__, idx) => _('div', { className: 'party-member', 'data-idx': idx }, [
      this.leaderSelection[idx] = _('input', { type: 'radio', name: 'leader', event: { change: e=>this.changeLeader(e, idx) }}),
      this.charaSlot[idx] = _('span', { 'data-slot-key': 'charaSlot', 'data-data-key': 'characters', className: 'spriteatlas-characters', event: { click: e=>this.pickCharacter(e) }}),
      this.posterSlot[idx] = _('span', { 'data-slot-key': 'posterSlot', 'data-data-key': 'posters', className: 'spriteatlas-posters', event: { click: e=>this.pickPoster(e) }}),
      this.accessorySlot[idx] = _('span', { 'data-slot-key': 'accessorySlot', 'data-data-key': 'accessories', className: 'spriteatlas-accessories', event: { click: e=>this.pickAccessory(e) }}),
    ]))))

    if (root.nonPersistentState.swappable) {
      root.nonPersistentState.swappable.destroy()
    }
    const swappable = new Draggable.Swappable(container, {
      draggable: 'span',
      distance: 10,
      delay: 0,
    });
    root.nonPersistentState.swappable = swappable
    let swapSource, swapTarget, slots
    swappable.on('swappable:start', e => {
      if (!e.data.dragEvent.data.originalSource.dataset.id) return e.cancel()
    })
    swappable.on('swappable:swap', e => {
      const event = e.data.dragEvent.data
      const source = event.originalSource
      const target = event.over
      if (source.dataset.slotKey !== target.dataset.slotKey) return e.cancel()
      slots = this[source.dataset.slotKey]
      swapSource = slots.indexOf(source)
      swapTarget = target.parentNode.dataset.idx
    })
    swappable.on('swappable:stop', e => {
      const source = slots[swapSource]
      if (swapSource === swapTarget) return
      {
        const temp = slots[swapSource]
        slots[swapSource] = slots[swapTarget]
        slots[swapTarget] = temp
      }
      {
        const party = this.currentParty
        const temp = party[source.dataset.dataKey][swapSource]
        party[source.dataset.dataKey][swapSource] = party[source.dataset.dataKey][swapTarget]
        party[source.dataset.dataKey][swapTarget] = temp
      }
      root.update({ party: true })
    })
  }
  fillPartySelect() {
    removeAllChilds(this.partySelect)
    this.parties.forEach((party, idx) => {
      this.partySelect.appendChild(_('option', { value: idx }, [_('text', party.name)]))
    })
    this.partySelect.value = this.currentSelection
  }
  changeParty() {
    const party = this.currentParty
    this.leaderSelection.forEach((select, idx) => {
      select.checked = null !== party.leader && party.characters[idx] === party.leader
    })
    this.charaSlot.forEach((icon, idx) => {
      icon.dataset.id = party.characters[idx] ? party.characters[idx].cardIconId : ''
      const senseLane = root.senseBox.children[idx]
      if (!senseLane) return
      senseLane.dataset.senseType = party.characters[idx] === null ? '' : party.characters[idx].sense.getType(party.characters)
    })
    this.posterSlot.forEach((icon, idx) => {
      icon.dataset.id = party.posters[idx] ? party.posters[idx].id : ''
    })
    this.accessorySlot.forEach((icon, idx) => {
      icon.dataset.id = party.accessories[idx] ? party.accessories[idx].id : ''
    })
    this.partyNameInput.value = this.parties[this.currentSelection].name
  }

  changeChara(chara, idx) {
    const party = this.parties[this.currentSelection]
    const prevLeaderIdx = party.characters.indexOf(party.leader)
    // 寻找冲突，找到冲突角色互换两个角色的位置
    const newCharaBaseId = chara.data.CharacterBaseMasterId
    for (let i=0; i<5; i++) {
      if (i === idx) continue
      if (!party.characters[i]) continue
      if (party.characters[i].data.CharacterBaseMasterId === newCharaBaseId) {
        party.characters[i] = party.characters[idx]
        break
      }
    }
    party.characters[idx] = chara
    party.leader = party.characters[prevLeaderIdx]
    root.update({ party: true })
  }
  changePoster(poster, idx) {
    const party = this.parties[this.currentSelection]
    if (poster) {
      const restrictId = poster.data.OrganizeRestrictGroupId
      for (let i=0; i<5; i++) {
        if (i === idx) continue
        if (!party.posters[i]) continue
        if (party.posters[i] === poster) {
          party.posters[i] = party.posters[idx]
          break
        }
        if (restrictId && restrictId === party.posters[i].data.OrganizeRestrictGroupId) {
          party.posters[i] = party.posters[idx]
          break
        }
      }
    }
    party.posters[idx] = poster
    root.update({ party: true })
  }
  changeAccessory(accessory, idx) {
    const party = this.parties[this.currentSelection]
    if (accessory) {
      for (let i=0; i<5; i++) {
        if (i === idx) continue
        if (!party.accessories[i]) continue
        if (party.accessories[i] === accessory) {
          party.accessories[i] = party.accessories[idx]
          break
        }
      }
    }
    party.accessories[idx] = accessory
    root.update({ party: true })
  }
  changeLeader(e, idx) {
    const party = this.parties[this.currentSelection]
    this.leaderSelection.forEach((select, otherIdx) => {
      if (idx === otherIdx) return
      select.checked = false
    })
    party.leader = party.characters[idx]
    root.update({ party: true })
  }
  createPickingOverlay() {
    document.body.classList.add('picking')
    const overlay = _('div', { className: 'picking-overlay', event: { click: e=>this.closePicking(e) }})
    const container = _('div', { className: 'picking-container', event: { click: e=>this.confirmPicking(e) }})
    overlay.appendChild(container)
    document.body.appendChild(overlay)
    this.pickingOverlay = overlay
    this.pickingContainer = container
    overlay.scrollTop = 0
  }
  closePicking(e) {
    if (e.target === this.pickingOverlay) {
      document.body.classList.remove('picking')
      this.pickingOverlay.remove()
    }
  }
  confirmPicking(e) {
    let pick
    for (let el of this.pickingContainer.children) {
      if (el.contains(e.target)) {
        pick = el
        break
      }
    }
    if (!pick) return
    document.body.classList.remove('picking')
    const idx = pick.dataset.idx
    switch (this.currentPicking.type) {
      case 'chara': {
        this.changeChara(root.appState.characters[idx] || null, this.currentPicking.idx)
        break
      }
      case 'poster': {
        this.changePoster(root.appState.posters[idx] || null, this.currentPicking.idx)
        break
      }
      case 'accessory': {
        this.changeAccessory(root.appState.accessories[idx] || null, this.currentPicking.idx)
        break
      }
    }
    this.pickingOverlay.remove()
  }
  pickCharacter(e) {
    if (root.appState.characters.length === 0) return
    const idx = this.charaSlot.indexOf(e.target)
    this.currentPicking = { type: 'chara', idx }
    this.createPickingOverlay()
    const currentSelection = {}
    this.currentParty.characters.forEach((chara, i) => {
      if (!chara) return
      const icon = this.pickingContainer.appendChild(chara.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      if (idx === i) icon.classList.add('selected')
      currentSelection[chara.Id] = icon
    })
    root.appState.characters.forEach((chara, i) => {
      if (currentSelection[chara.Id]) {
        currentSelection[chara.Id].dataset.idx = i
        return
      }
      const icon = this.pickingContainer.appendChild(chara.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      icon.dataset.idx = i
    })
  }
  pickPoster(e) {
    const idx = this.posterSlot.indexOf(e.target)
    this.currentPicking = { type: 'poster', idx }
    this.createPickingOverlay()
    const currentSelection = {}
    this.pickingContainer.appendChild(_('span', { className: 'list-icon-container small-text arial', 'data-idx': -1 }, [
      _('span', { className: 'spriteatlas-posters empty-icon', 'data-id':'', style: {marginLeft:0} }),
      _('br'),
      _('span', {}, [_('text', ConstText.get('SELECTION_EMPTY'))]),
    ]))
    if (this.currentParty.posters[idx] === null) {
      this.pickingContainer.lastChild.classList.add('selected')
    }
    this.currentParty.posters.forEach((poster, i) => {
      if (!poster) return
      const icon = this.pickingContainer.appendChild(poster.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      if (idx === i) icon.classList.add('selected')
      currentSelection[poster.id] = icon
    })
    root.appState.posters.forEach((poster, i) => {
      if (currentSelection[poster.id]) {
        currentSelection[poster.id].dataset.idx = i
        return
      }
      const icon = this.pickingContainer.appendChild(poster.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      icon.dataset.idx = i
    })
  }
  pickAccessory(e) {
    const idx = this.accessorySlot.indexOf(e.target)
    this.currentPicking = { type: 'accessory', idx }
    this.createPickingOverlay()
    const currentSelection = {}
    this.pickingContainer.appendChild(_('span', { className: 'list-icon-container small-text', 'data-idx': -1 }, [
      _('span', { className: 'spriteatlas-accessories empty-icon', 'data-id':'', style: {marginLeft:0} }),
      _('br'),
      _('span', {}, [_('text', ConstText.get('SELECTION_EMPTY'))]),
    ]))
    if (this.currentParty.accessories[idx] === null) {
      this.pickingContainer.lastChild.classList.add('selected')
    }
    this.currentParty.accessories.forEach((accessory, i) => {
      if (!accessory) return
      const icon = this.pickingContainer.appendChild(accessory.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      if (idx === i) icon.classList.add('selected')
      currentSelection[root.appState.accessories.indexOf(accessory)] = icon
    })
    root.appState.accessories.forEach((accessory, i) => {
      if (currentSelection[i]) {
        currentSelection[i].dataset.idx = i
        return
      }
      const icon = this.pickingContainer.appendChild(accessory.iconNode.cloneNode(true))
      icon.classList.remove('selected')
      icon.dataset.idx = i
    })
  }

  update() {
    this.changeParty()
  }

  toJSON() {
    return [
      this.parties.map(i => i.toJSON()),
      this.currentSelection,
    ]
  }
  static fromJSON(data) {
    const manager = new PartyManager()
    manager.parties = data[0].map(i => Party.fromJSON(i))
    manager.currentSelection = data[1]
    return manager
  }
}
