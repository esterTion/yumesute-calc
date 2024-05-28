import ConstText from "../db/ConstText"

export default class Party {
  constructor() {
    this.name = ConstText.get('PARTY_DEFAULT_NAME') + ' 1'
    this.leader = null
    this.characters = [null,null,null,null,null]
    this.posters = [null,null,null,null,null]
    this.accessories = [null,null,null,null,null]
  }

  toJSON() {
    return [
      this.name,
      this.characters.map(i => root.appState.characters.indexOf(i)),
      this.posters.map(i => root.appState.posters.indexOf(i)),
      this.accessories.map(i => root.appState.accessories.indexOf(i)),
      this.characters.indexOf(this.leader)
    ]
  }
  static fromJSON(data) {
    const party = new Party()
    party.name = data[0]
    party.characters = data[1].map(i => root.appState.characters[i] || null)
    party.posters = data[2].map(i => root.appState.posters[i] || null)
    party.accessories = data[3].map(i => root.appState.accessories[i] || null)
    party.leader = party.characters[data[4]]
    return party
  }
}
