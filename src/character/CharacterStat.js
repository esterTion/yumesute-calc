import StatBonus from "../logic/StatBonus"

export default class CharacterStat {
  constructor(vo, ex, co) {
    this.vo = vo
    this.ex = ex
    this.co = co
  }
  get total() {
    return this.vo + this.ex + this.co
  }
  // add another Stat
  add(stat) {
    const newStat = new CharacterStat(this.vo, this.ex, this.co)
    newStat.vo += stat.vo
    newStat.ex += stat.ex
    newStat.co += stat.co
    return newStat
  }
  // multiple a percentage, including performance
  mul(percentage) {
    const newStat = new CharacterStat(
      Math.floor(this.vo * (percentage[StatBonus.Vocal        ] + percentage[StatBonus.Performance]) / 10000),
      Math.floor(this.ex * (percentage[StatBonus.Expression   ] + percentage[StatBonus.Performance]) / 10000),
      Math.floor(this.co * (percentage[StatBonus.Concentration] + percentage[StatBonus.Performance]) / 10000)
    )
    return newStat
  }
  mulStat(percentage) {
    const newStat = new CharacterStat(
      Math.floor(this.vo * percentage[StatBonus.Vocal        ] / 10000),
      Math.floor(this.ex * percentage[StatBonus.Expression   ] / 10000),
      Math.floor(this.co * percentage[StatBonus.Concentration] / 10000)
    )
    return newStat
  }
  mulPerformance(percentage) {
    const newStat = new CharacterStat(
      Math.floor(this.vo * percentage[StatBonus.Performance] / 10000),
      Math.floor(this.ex * percentage[StatBonus.Performance] / 10000),
      Math.floor(this.co * percentage[StatBonus.Performance] / 10000)
    )
    return newStat
  }
  static Zero() {
    return new CharacterStat(0,0,0)
  }
  static fromArray(arr) {
    return new CharacterStat(arr[0], arr[1], arr[2])
  }
}
