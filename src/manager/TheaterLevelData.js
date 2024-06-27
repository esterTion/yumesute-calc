import GameDb from "../db/GameDb"
import Effect from "../effect/Effect"

export default class TheaterLevelData {
  levelData = {
    Sirius: 0,
    Eden: 0,
    Gingaza: 0,
    Denki: 0,
  }

  getLevel(company) {
    return this.levelData[company] || 0
  }
  setLevel(company, level) {
    this.levelData[company] = level | 0
  }
  getTotalLevel() {
    return this.levelData.Sirius
      + this.levelData.Eden
      + this.levelData.Gingaza
      + this.levelData.Denki
  }
  getEffects() {
    return Object.values(GameDb.CircleSupportCompanyLevelDetail).filter(i => i.Level <= this.getLevel(i.Company)).map(i => Effect.get(i.EffectMasterId, 1))
  }

  toJSON() {
    return this.levelData
  }
  static fromJSON(data) {
    const theater = new TheaterLevelData()
    theater.levelData = data
    return theater
  }
}

