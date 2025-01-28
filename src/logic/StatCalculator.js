import CharacterStat from '../character/CharacterStat'
import StatBonusType from './StatBonusType'

export default class StatCalculator {
  initial;   // 初始值
  buff;      // 百分比加成 及 数值加成
  buffLimit; // 百分比上限
  buffFinal; // 百分比加成 及 数值加成 （上限限位后）
  bonus;     // 加成数值
  buffAfterCalc; // 计算结束后的额外加成
  finalBeforeBuff; // 演技额外加成前数值
  final;     // 最终数值
  finalTotal;// 最终数值总和

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
     * [1]: actor
     *   ...
     * [2]: poster
     *   ...
     * [3]: accessory
     *   ...
     * [4]: other
     *   ...
     */
    this.buff = members.map(_ => ([0,0,0,0,0].map(_ => ([[0,0,0,0], [0,0,0,0]]))))
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
    this.finalBeforeBuff = this.initial.map((i, idx) => i.add(this.bonus[idx][StatBonusType.Total]))
    // 时间轴效果 / 电姬海报（FinalPerformanceUpCancelSense）
    // 目前只有演技力加成
    this.final = this.finalBeforeBuff.map((i, idx) => i.mulPerformance(this.buffAfterCalc[idx]))
    this.finalTotal = this.final.reduce((s, i) => s+i.total, 0)
  }
}
