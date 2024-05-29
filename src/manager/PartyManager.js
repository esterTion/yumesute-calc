import Party from './Party'
import ConstText from '../db/ConstText'

import _ from '../createElement'
import removeAllChilds from '../removeAllChilds'

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
      }
    }}),
    ]))

    this.fillPartySelect()

    this.leaderSelection = []
    this.charaSlot = []
    this.posterSlot = []
    this.accessorySlot = []
    // create table with 5 rows of select
    this.partyTable = container.appendChild(_('table', {}, [
      _('thead', {}, [
        _('tr', {}, [
          _('th'),
          _('th', {}, [_('text', ConstText.get('TAB_CHARA'))]),
          _('th', {}, [_('text', ConstText.get('TAB_POSTER'))]),
          _('th', {}, [_('text', ConstText.get('TAB_ACCESSORY'))]),
        ]),
      ]),
      _('tbody', {}, Array(5).fill(0).map((__, idx) => _('tr', {}, [
          _('td', {}, [this.leaderSelection[idx] = _('input', { type: 'radio', name: 'leader', event: { change: e=>this.changeLeader(e, idx) }})]),
          _('td', {}, [this.charaSlot[idx] = _('select', { event: { change: e=>this.changeChara(e, idx) }})]),
          _('td', {}, [this.posterSlot[idx] = _('select', { event: { change: e=>this.changePoster(e, idx) }})]),
          _('td', {}, [this.accessorySlot[idx] = _('select', { event: { change: e=>this.changeAccessory(e, idx) }})]),
        ])),
      ),
    ]))
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
    this.charaSlot.forEach((select, idx) => {
      removeAllChilds(select)
      select.appendChild(_('option', { value: -1 }, [_('text', ConstText.get('NOT_SELECTED'))]))
      root.appState.characters.forEach((chara, charaIdx) => {
        select.appendChild(_('option', { value: charaIdx }, [_('text', chara.fullCardName)]))
      })
      select.value = root.appState.characters.indexOf(party.characters[idx])
      const senseLane = root.senseBox.children[idx]
      if (!senseLane) return
      senseLane.dataset.senseType = party.characters[idx] === null ? '' : party.characters[idx].sense.getType(party.characters)
    })
    this.posterSlot.forEach((select, idx) => {
      removeAllChilds(select)
      select.appendChild(_('option', { value: -1 }, [_('text', ConstText.get('NOT_SELECTED'))]))
      root.appState.posters.forEach((poster, posterIdx) => {
        select.appendChild(_('option', { value: posterIdx }, [_('text', poster.fullPosterName)]))
      })
      select.value = root.appState.posters.indexOf(party.posters[idx])
    })
    this.accessorySlot.forEach((select, idx) => {
      removeAllChilds(select)
      select.appendChild(_('option', { value: -1 }, [_('text', ConstText.get('NOT_SELECTED'))]))
      root.appState.accessories.forEach((accessory, accessoryIdx) => {
        let displayName = accessory.fullAccessoryName
        if (accessory.randomEffect) {
          displayName = `${displayName} (${accessory.randomEffect.data.Name})`
        }
        select.appendChild(_('option', { value: accessoryIdx }, [_('text', displayName)]))
      })
      select.value = root.appState.accessories.indexOf(party.accessories[idx])
    })
    this.partyNameInput.value = this.parties[this.currentSelection].name
  }

  changeChara(e, idx) {
    const party = this.parties[this.currentSelection]
    const prevLeaderIdx = party.characters.indexOf(party.leader)
    party.characters[idx] = root.appState.characters[e.target.value] || null
    if (prevLeaderIdx === idx) {
      party.leader = null
      if (e.target.value !== '-1') {
        party.leader = party.characters[idx]
      }
    }
    root.update({ party: true })
  }
  changePoster(e, idx) {
    const party = this.parties[this.currentSelection]
    party.posters[idx] = root.appState.posters[e.target.value] || null
    root.update({ party: true })
  }
  changeAccessory(e, idx) {
    const party = this.parties[this.currentSelection]
    party.accessories[idx] = root.appState.accessories[e.target.value] || null
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

  update() {
    this.changeParty()
    // disable select same item in other slots
    const charaSelected = this.charaSlot.map(i => i.value)
    const posterSelected = this.posterSlot.map(i => i.value)
    const accessorySelected = this.accessorySlot.map(i => i.value)
    this.charaSlot.forEach((select, idx) => {
      if (charaSelected[idx] === '-1') return
      const charaId = root.appState.characters[charaSelected[idx]].data.CharacterBaseMasterId
      this.charaSlot.forEach((otherSelect, otherIdx) => {
        if (idx === otherIdx) return
        root.appState.characters.forEach((chara, charaIdx) => {
          if (chara.data.CharacterBaseMasterId === charaId) {
            otherSelect.children[charaIdx+1].setAttribute('disabled', '')
          }
        })
      })
    })
    this.posterSlot.forEach((select, idx) => {
      if (posterSelected[idx] === '-1') return
      this.posterSlot.forEach((otherSelect, otherIdx) => {
        if (idx === otherIdx) return
        otherSelect.children[posterSelected[idx]*1+1].setAttribute('disabled', '')
      })
    })
    this.accessorySlot.forEach((select, idx) => {
      if (accessorySelected[idx] === '-1') return
      this.accessorySlot.forEach((otherSelect, otherIdx) => {
        if (idx === otherIdx) return
        otherSelect.children[accessorySelected[idx]*1+1].setAttribute('disabled', '')
      })
    })
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
