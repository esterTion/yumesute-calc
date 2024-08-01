import GameDb from "../db/GameDb"

export default class LeaderSenseData {
  constructor(id) {
    this.id = id
    this.data = GameDb.LeaderSense[id]
    if (!this.data) throw new Error(`LeaderSense ${id} not found`)
    Object.assign(this, this.data)
  }
  get desc() {
    return this.Description
  }
}
