import CharacterStat from '../character/CharacterStat'
import StatBonusType from './StatBonusType'

export default class StatCalculator {
  constructor(members) {
    this.initial = members.map(i => i ? i.statFinal : CharacterStat.Zero())
    /**
     * [0]: album
     *   [0]: percentage
     *     [0]: vo
     *     [1]: ex
     *     [2]: co
     *     [3]: perf
     *   [1]: addition
     *     ...
     * [1]: poster
     *   ...
     * [2]: accessory
     *   ...
     * [3]: other
     *   ...
     */
    this.buff = members.map(_ => ([0,0,0,0].map(_ => ([[0,0,0,0], [0,0,0,0]]))))
    this.buffLimit = members.map(_ => ([[20000,20000,20000,20000], [Infinity,Infinity,Infinity,Infinity]]))
    this.buffAfterCalc = members.map(_ => [10000,10000,10000,10000])
  }
  calc() {
    const buffRemaining = this.buffLimit.map(i=>i.map(i=>i.map(i=>i)))
    this.buffFinal = this.buff.map((charaBuf, charaIdx) => charaBuf.map(category => {
      return category.map((v,i) => v.map((v,j) => {
        v = Math.min(v, buffRemaining[charaIdx][i][j])
        buffRemaining[charaIdx][i][j] -= v
        return v
      }))
    }))
    this.bonus = this.buffFinal.map((charaBuf, charaIdx) => {
      const bonus = charaBuf.map(i => this.initial[charaIdx].mulStat(i[0]).add(CharacterStat.fromArray(i[1].slice(0, 3))))
      const bonusAddition = bonus.reduce((sum, category) => sum.add(category), CharacterStat.Zero())
      bonus.push(bonusAddition)
      const statWithAddition = this.initial[charaIdx].add(bonusAddition)
      const bonusPercentage = charaBuf.map(i => statWithAddition.mulPerformance(i[0]))
      bonusPercentage.push(bonusPercentage.reduce((sum, category) => sum.add(category), CharacterStat.Zero()))
      return bonus.map((i, idx) => i.add(bonusPercentage[idx]))
    })
    this.buffFinal.forEach(charaBuf => {
      charaBuf.push(charaBuf.reduce((sum, category) => {
        for (let i=0; i<2; i++) {
          for (let j=0; j<4; j++) {
            sum[i][j] += category[i][j]
          }
        }
        return sum
      }, [[0,0,0,0],[0,0,0,0]]))
    })
    this.final = this.initial.map((i, idx) => i.add(this.bonus[idx][StatBonusType.Total]))
    // 时间轴效果 / 电姬海报（FinalPerformanceUpCancelSense）
    // 目前只有演技力加成
    this.final = this.final.map((i, idx) => i.mulPerformance(this.buffAfterCalc[idx]))
    this.finalTotal = this.final.reduce((s, i) => s+i.total, 0)
  }
}
