export default class CharacterStarRankData {
  rankData = {}

  get(Id) {
    if (this.rankData[Id] === undefined) {
      this.rankData[Id] = 0
    }
    return this.rankData[Id]
  }
  set(Id, val) {
    this.rankData[Id] = val
  }

  toJSON() {
    return this.rankData
  }
  static fromJSON(data) {
    const rank = new CharacterStarRankData()
    rank.rankData = data
    return rank
  }
}
