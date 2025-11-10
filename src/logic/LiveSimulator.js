import GameDb from "../db/GameDb"
import ConstText from "../db/ConstText"
import Effect from "../effect/Effect"

import _ from "../createElement"
import ScoreBonusType from "./ScoreBonusType"
import { SenseTypeInternalEnum } from "../db/Enum"
import removeAllChilds from "../removeAllChilds"

export default class LiveSimulator {
  /**
   * @type {ScoreCalculator}
   */
  calc;
  /**
   * @type {number[]}
   * @description sense发动冷却
   */
  senseCt;
  senseTiming;
  /**
   * @type {number[]}
   * @description sense上次发动时间
   */
  lastSenseTime;
  skipSense;
  /**
   * @type {number}
   * @description 基础分（海报按当前分加分计算用，反正在不拿谱面的情况下算不准，为了简化计算只存stella分数）
   */
  baseScore;
  starActRequirements;
  starActCurrent;
  life;
  lifeGuardCount;
  pGauge;
  pGaugeLimit;
  pGaugeBonus;
  phase;
  phaseLog;
  pendingActions;
  currentTiming;
  lastSenseTiming;
  activeBuff;
  senseExtraAmount;
  senseExtraLights;
  overflownLightCount;
  newLightCurrentStep;
  wrongLightToSpAmount;
  holdingLights;
  holdingStockLights;
  maxStockCount;
  stockType;
  performanceDuplicateUp;
  combinationSenseList;
  isDuringCombinationSense;
  scoreIsInaccurate;

  constructor(calc) {
    this.calc = calc
    this.senseTiming = GameDb.SenseNotation[root.senseNoteSelect.value | 0]
    if (!this.senseTiming) throw new Error('Sense timeline not found')
    this.senseTiming = this.senseTiming.Details.slice()
    this.senseTiming.sort((a,b) => a.TimingSecond - b.TimingSecond)
    this.skipSense = new Array(5).fill(false)
    this.baseScore = 0
    this.life = 1000
    this.lifeGuardCount = 0
    this.pGauge = 0
    this.pGaugeLimit = 1000
    this.pGaugeBonus = [0,0,0,0,0]
    this.phase = ConstText.get('LIVE_PHASE_START')
    this.phaseLog = []
    this.pendingActions = []
    this.currentTiming = 0
    this.lastSenseTiming = this.senseTiming[this.senseTiming.length - 1].TimingSecond
    this.activeBuff = { sense: [], starAct: [] }
    this.starActCurrent = [0,0,0,0,0,0]
    this.senseExtraAmount = [0,0,0,0,0]
    this.senseExtraLights = [[],[],[],[],[]]
    this.overflownLightCount = 0
    this.newLightCurrentStep = new Array(5).fill(0).map(_ => new Array(5).fill(0))
    this.wrongLightToSpAmount = [0,0,0,0,0]
    this.holdingLights = []
    this.holdingStockLights = []
    this.maxStockCount = 0
    this.stockType = -1
    this.starActRequiredCount = 0
    this.performanceDuplicateUp = [0,0,0,0,0]
    this.combinationSenseList = [[],[],[],[],[]]
    this.isDuringCombinationSense = false
    this.scoreIsInaccurate = false
  }
  runSimulation(node) {
    this.applyPendingActions()
    Array.from(root.senseBox.querySelectorAll('.sense-add-light,.staract-line')).forEach(i => i.remove())
    this.senseCt = this.calc.members.map(chara => chara ? chara.senseAll.map(i => i.ct) : 0)
    this.lastSenseTime = this.calc.members.map(chara => chara?.senseAll.map(() => -Infinity))
    for (let i=0; i<5; i++) {
      const startExtraLight = []
      this.newLightCurrentStep[i].forEach((amount, lightType) => {
        for (let j=0; j<amount; j++) {
          startExtraLight.push(SenseTypeInternalEnum[lightType])
        }
      })
      const container = root.senseBox.children[i].children[0].children[0]
      removeAllChilds(container)
      if (startExtraLight.length) {
        container.style.marginTop = `calc(50% - 3px - ${startExtraLight.length * 5}px)`
        startExtraLight.forEach(lightType => {
          container.appendChild(_('div', { className: 'sense-add-light', 'data-sense-type': lightType.toLowerCase(), style: { position: 'initial' } }))
        })
      }

      // combination sense
      const combinationSenseEffect = this.calc.members[i].sense.getCombinationSenseEffect(this)
      if (combinationSenseEffect) {
        const conditionMap = combinationSenseEffect.Conditions.reduce((acc, cur) => {
          acc[cur.Condition] = cur.Value
          return acc
        }, {})
        const distance = conditionMap.NeighborPosition
        const targetCharaId = conditionMap.CharacterBase
        if (i - distance >= 0 && targetCharaId === this.calc.members[i - distance].data.CharacterBaseMasterId) {
          this.combinationSenseList[i - distance].push(i)
        }
        if (i + distance < 5 && targetCharaId === this.calc.members[i + distance].data.CharacterBaseMasterId) {
          this.combinationSenseList[i + distance].push(i)
        }
      }
    }
    let lights = this.getHoldingLightsElement()
    if (this.tryStarAct()) {
      this.phase = ConstText.get('LIVE_PHASE_START_WITH_STARACT')
      this.resetCurrentLights()
    }
    node.appendChild(_('details', { className: 'live-log-phase odd-row' }, [
      _('summary', {}, [
        _('text', this.phase),
        _('br'),
        lights,
        this.getPGaugeProgressElement(),
        this.getLifeGaugeElement(),
      ]),
      _('text', this.phaseLog.join('\n')),
    ]))

    let oddRow = false
    this.senseTiming.forEach(timing => {
      this.currentTiming = timing.TimingSecond
      this.currentSenseType = 'none';
      this.purgeExpiredBuff(timing.TimingSecond)
      this.phase = ConstText.get('LIVE_PHASE_SENSE').replace('{time}', timing.TimingSecond)
      this.phaseLog = []
      const timelineNode = root.senseBox.children[timing.Position - 1].children[1].children[
        this.senseTiming.filter(i => i.Position === timing.Position).indexOf(timing)
      ]
      timelineNode.classList.remove('failed')
      timelineNode.dataset.senseType = ''
      if (!this.trySense(timing, timelineNode)) {
        this.phase = ConstText.get('LIVE_PHASE_SENSE_FAILED').replace('{time}', timing.TimingSecond)
        this.resetCurrentLights()

        timelineNode.classList.add('failed')
      }

      lights = this.getHoldingLightsElement()
      if (this.tryStarAct()) {
        this.phase = ConstText.get('LIVE_PHASE_SENSE_WITH_STARACT').replace('{time}', timing.TimingSecond)
        this.resetCurrentLights()
      }
      node.appendChild(_('details', { className: 'live-log-phase' + (oddRow ? ' odd-row' : '') }, [
        _('summary', { className: 'sense-star', 'data-sense-type': this.currentSenseType }, [
          _('text', this.phase),
          _('br'),
          lights,
          this.getPGaugeProgressElement(),
          this.getLifeGaugeElement(),
        ]),
        _('table', {}, [_('tr', { style: {verticalAlign: 'top'} }, [
          _('td', {}, [_('div', { className: 'spriteatlas-characters', 'data-id': this.calc.members[timing.Position - 1].cardIconId})]),
          _('td', {}, [
            _('text', this.phaseLog.join('\n')),
          ]),
        ])]),
      ]))

      oddRow = !oddRow
    })
  }
  getPGaugeProgressElement() {
    return _('span', {}, [
      _('progress', { value: this.pGauge, max: this.pGaugeLimit, style: { width: `${this.pGaugeLimit / 1000 * 50}px`} }),
      _('text', ` ${this.pGauge}/${this.pGaugeLimit}`),
    ])
  }
  getLifeGaugeElement() {
    return _('span', { style: { marginLeft: '1em' } }, [
      _('text', ` ♥${this.life}`),
      this.lifeGuardCount > 0 ? _('text', ` (+${this.lifeGuardCount})`) : new Comment('life guad conut'),
    ])
  }
  getHoldingLightsElement() {
    const container = _('span', { className: 'light-display' }, [
      _('span', {}, (new Array(this.starActRequiredCount)).fill(0).map((__, i) =>
        _('span', { className: 'sense-star', 'data-sense-type': (this.holdingLights[i]?.toLowerCase() ?? 'empty') })
      ))
    ])
    if (this.maxStockCount > 0) {
      container.appendChild(_('span', { className: 'stock-lights' }, (new Array(this.maxStockCount)).fill(0).map((__, i) =>
        _('span', { className: 'sense-star', 'data-sense-type': (this.holdingStockLights[i]?.toLowerCase() ?? 'empty') })
      )))
    }
    return container
  }
  setStarActRequirements(starActRequirements) {
    this.starActRequirements = starActRequirements
    this.starActRequiredCount = starActRequirements.reduce((a,b) => a+b, 0)
  }

  applyPendingActions() {
    let action
    while ((action = this.pendingActions.shift()) !== undefined) {
      action()
    }
  }
  addLife(amount, immediateAction = false) {
    if (!immediateAction) {
      this.pendingActions.push(() => this.addLife(amount, true))
      return
    }
    const before = this.life
    this.life += amount
    this.life = Math.max(this.life, 1)
    this.phaseLog.push(ConstText.get('LIVE_LOG_LIFE', [before, amount, this.life]))
  }
  addPGauge(amount, immediateAction = false) {
    if (!immediateAction) {
      this.pendingActions.push(() => this.addPGauge(amount, true))
      return
    }
    const before = this.pGauge
    this.pGauge += amount
    this.pGauge = Math.min(this.pGauge, this.pGaugeLimit)
    this.phaseLog.push(ConstText.get('LIVE_LOG_PGUAGE', [before, amount, this.pGauge, this.pGaugeLimit]))
  }
  addPGaugeLimit(amount, immediateAction = false) {
    if (!immediateAction) {
      this.pendingActions.push(() => this.addPGaugeLimit(amount, true))
      return
    }
    const before = this.pGaugeLimit
    this.pGaugeLimit += amount
    this.phaseLog.push(ConstText.get('LIVE_LOG_PGUAGE_LIMIT', [before, amount, this.pGauge, this.pGaugeLimit]))
  }
  addSenseLight(type, idx, amount = 1) {
    if (this.isDuringCombinationSense) return
    let lightType
    switch (type.toLowerCase()) {
      case 'support':       { lightType = 0; break }
      case 'control':       { lightType = 1; break }
      case 'amplification': { lightType = 2; break }
      case 'special':       { lightType = 3; break }
      case 'variable':      { lightType = 4; break }
      default: throw new Error('Unknown sense type: ' + type)
    }
    let freeLightUsed = 0;
    // 持有统计
    for (let i = 0; i < amount; i++) {
      // sp光
      if (lightType === 4) {
        if (this.holdingLights.length < this.starActRequiredCount) {
          this.holdingLights.push(type)
        } else {
          this.holdingStockLights.push(type)
        }
      } else {
        if (this.starActCurrent[lightType]+i < this.starActRequirements[lightType]) {
          this.holdingLights.push(type)
        } else if (this.stockType === 5 || this.stockType - 1 === lightType) {
          this.holdingStockLights.push(type)
        } else if (this.starActCurrent[5] < this.starActRequirements[4]) {
          this.holdingLights.push(type)
          this.starActCurrent[5]++
          freeLightUsed++
        }
      }
    }
    this.starActCurrent[lightType] += amount - freeLightUsed
    this.newLightCurrentStep[idx][lightType] += amount
  }
  processWrongLightToSp(idx, addedLights) {
    let wrongLightToSp = this.wrongLightToSpAmount[idx]
    for (let i = addedLights.length - 1; i >= 0; i--) {
      if (wrongLightToSp === 0) break
      let lightType
      switch (addedLights[i].toLowerCase()) {
        case 'support':       { lightType = 0; break }
        case 'control':       { lightType = 1; break }
        case 'amplification': { lightType = 2; break }
        case 'special':       { lightType = 3; break }
      }
      if (lightType === undefined) continue
      if (this.starActCurrent[lightType] > this.starActRequirements[lightType]) {
        this.starActCurrent[lightType]--
        this.addSenseLight('Variable', idx)
        wrongLightToSp--
        addedLights[i] = 'Variable'
      }
    }
  }
  resetCurrentLights() {
    for (let i=0; i<5; i++) {
      this.starActCurrent[i] = 0
      this.newLightCurrentStep[i].fill(0)
      this.holdingLights = []
      this.holdingStockLights = []
    }
    this.starActCurrent[5] = 0
    this.overflownLightCount = 0
  }
  trySense(timing, timelineNode) {
    let idx = timing.Position - 1
    // irh或电姬团报 跳过
    if (this.skipSense[idx]) {
      this.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_SKIP'))
      return true
    }
    let chara = this.calc.members[idx]
    if (chara.data.CharacterBaseMasterId === 102) {
      // 发动加分效果
      chara.sense.data.PreEffects.forEach(effect => {
        effect = Effect.get(effect.EffectMasterId, chara.senselv)
        effect.applyEffect(this.calc, idx, ScoreBonusType.Sense)
      })
      chara = this.calc.members.find(i => i && i.data.CharacterBaseMasterId === 101)
      if (!chara) {
        // szk发动但没有kkn时，始终失败
        this.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_FAILED'))
        return false
      }
      idx = this.calc.members.indexOf(chara)
      this.purgeExpiredBuff(timing.TimingSecond)
    }
    const ct = this.senseCt[idx]
    let activateSenseIndex = -1
    ct.some((ct, i) => {
      const timeSinceLast = timing.TimingSecond - this.lastSenseTime[idx][i]
      if (ct > timeSinceLast) {
        return false
      }
      activateSenseIndex = i
      return true
    })
    if (activateSenseIndex === -1) {
      this.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_FAILED'))
      return false
    }

    this.applySenseEffects(idx, timelineNode, activateSenseIndex)
    this.applyPendingActions()

    this.isDuringCombinationSense = true
    for (let otherSenseIdx of this.combinationSenseList[idx]) {
      // 相邻sense发动时，附加生效本轮的加成
      this.purgeExpiredBuff(timing.TimingSecond)
      this.applySenseEffects(otherSenseIdx, timelineNode, 0)
      this.applyPendingActions()
    }
    this.isDuringCombinationSense = false

    this.lastSenseTime[timing.Position - 1][activateSenseIndex] = timing.TimingSecond

    return true
  }

  applySenseEffects(idx, timelineNode, activateSenseIndex) {
    const chara = this.calc.members[idx]
    const sense = chara.senseAll[activateSenseIndex]
    sense.data.PreEffects.forEach(effect => {
      effect = Effect.get(effect.EffectMasterId, chara.senselv)
      effect.applyEffect(this.calc, idx, ScoreBonusType.Sense)
    })
    const senseEffectBranch = sense.getActiveBranch(this)
    if (senseEffectBranch) {
      senseEffectBranch.BranchEffects.forEach(effect => {
        effect = Effect.get(effect.EffectMasterId, chara.senselv)
        effect.isLifeGuardBranch = senseEffectBranch.isLifeGuardBranch
        effect.applyEffect(this.calc, idx, ScoreBonusType.Sense)
      })
    }
    if (!this.isDuringCombinationSense) {
      this.currentSenseType = sense.Type.toLowerCase();
      const senseTypesOrdered = [sense.Type, ...chara.senseAll.filter((s, i) => i !== activateSenseIndex).map(s => s.Type)]
      const senseAddCount = sense.data.LightCount + this.senseExtraAmount[idx]
      const addedLights = new Array(senseAddCount).fill(0).reduce((acc) => acc.concat(senseTypesOrdered), [])
      senseTypesOrdered.forEach(i => this.addSenseLight(i, idx, senseAddCount))
      for (let light of this.senseExtraLights[idx]) {
        let [addLightType, addLightAmount] = light
        this.addSenseLight(addLightType, idx, addLightAmount)
        while (addLightAmount--) {
          addedLights.push(addLightType)
        }
      }
      this.processWrongLightToSp(idx, addedLights)
      for (let i=0; i<addedLights.length - 1; i++) {
        timelineNode.appendChild(_('div', { className: 'sense-add-light', 'data-sense-type': addedLights[i + 1].toLowerCase(), style: { top: `calc(100% + ${i*8}px)` } }))
      }
      timelineNode.dataset.senseType = addedLights[0].toLowerCase()
    }
    if (sense.scoreUp) {
      let multiplier = sense.scoreUp
      let scoreLine = multiplier
      if (this.pGauge > 0) {
        multiplier *= 1 + this.pGauge / 1000
        scoreLine = `${scoreLine} × ${(1 + this.pGauge / 1000).toFixed(3).replace(/0+$/, '')}`
      }
      let extraBuffMul = 0
      let extraBuffLine = '1'
      this.activeBuff.sense.forEach(buff => {
        if (buff.skipCurrent) return
        const targets = buff.targets
        if (targets && !targets.includes(idx)) return
        const effect = buff.effect
        if (!effect.conditionSatified(this.calc, idx)) return
        if (buff.isStandaloneMultiplier) {
          multiplier *= 1 + buff.bonus
          scoreLine = `${scoreLine} × ${(1 + buff.bonus).toFixed(2)}`
          return
        }
        extraBuffMul += buff.bonus
        extraBuffLine = `${extraBuffLine} + ${buff.bonus.toFixed(2)}`
      })
      if (extraBuffMul) {
        multiplier *= 1 + extraBuffMul
        scoreLine = `${scoreLine} × (${extraBuffLine})`
      }
      const stat = this.calc.stat.final[idx]
      const total = stat.total * (1 + this.performanceDuplicateUp[idx] / 100)
      const score = Math.floor(total * multiplier)
      scoreLine = `${total} × ${scoreLine} = ${score}`
      this.calc.result.senseScore.push(score)
      this.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_SCORE').replace('{0}', scoreLine))
    }

    const poster = this.calc.posters[idx]
    if (poster) {
      for (let ability of poster.abilities) {
        if (!ability.unlocked) continue
        if (ability.data.Type === 'Leader' && this.calc.members[idx] !== this.leader) continue
        const abilityEffectBranch = ability.getActiveBranch(this)
        if (!abilityEffectBranch) continue
        abilityEffectBranch.BranchEffects.forEach(effect => {
          effect = Effect.get(effect.EffectMasterId, ability.level + ability.release)
          if (effect.FireTimingType !== 'Sense') return
          if (!effect.canTrigger(this.calc, idx)) return
          effect.applyEffect(this.calc, idx, ScoreBonusType.Poster)
        })
      }
    }
    const accessory = this.calc.accessories[idx]
    if (accessory) {
      for (let effect of accessory.mainEffects) {
        effect = effect.effect
        if (effect.FireTimingType !== 'Sense') continue
        if (!effect.canTrigger(this.calc, idx)) continue
        effect.applyEffect(this.calc, idx, ScoreBonusType.Accessory)
      }
      if (accessory.randomEffect) {
        let effect = accessory.randomEffect.effect
        if (effect.FireTimingType === 'Sense' && effect.canTrigger(this.calc, idx)) {
          effect.applyEffect(this.calc, idx, ScoreBonusType.Accessory)
        }
      }
    }

    if (sense.gaugeUp) {
      let amount = sense.gaugeUp
      amount *= 1 + this.pGaugeBonus[idx] / 10000
      amount = Math.floor(amount)
      this.addPGauge(amount, true)
    }
  }
  tryStarAct() {
    if (this.holdingLights.length < this.starActRequiredCount) {
      return false
    }
    this.overflownLightCount = this.holdingStockLights.length
    const idx = this.calc.members.indexOf(this.leader)
    this.leader.staract.data.PreEffects.forEach(effect => {
      effect = Effect.get(effect.EffectMasterId, this.leader.bloom)
      effect.applyEffect(this.calc, idx, ScoreBonusType.StarAct)
    })
    const staractEffectBranch = this.leader.staract.getActiveBranch(this)
    if (staractEffectBranch) {
      staractEffectBranch.BranchEffects.forEach(effect => {
        effect = Effect.get(effect.EffectMasterId, this.leader.bloom + 1)
        if (effect.Type === 'PerformanceDuplicateUp') {
          effect.Range = 'All'
        }
        effect.isLifeGuardBranch = staractEffectBranch.isLifeGuardBranch
        effect.applyEffect(this.calc, idx, ScoreBonusType.StarAct)
      })
    }
    let multiplier = this.leader.staract.scoreUp
    let scoreLine = multiplier
    multiplier *= 1 + this.pGauge / 1000
    scoreLine = `${scoreLine} × ${(1 + this.pGauge / 1000).toFixed(3).replace(/0+$/, '')}`
    let extraBuffMul = 0
    let extraBuffLine = '1'
    this.activeBuff.starAct.forEach(buff => {
      if (buff.skipCurrent) return
      const targets = buff.targets
      if (targets && !targets.includes(idx)) return
      const effect = buff.effect
      if (!effect.conditionSatified(this.calc, idx)) return
      if (buff.isStandaloneMultiplier) {
        multiplier *= 1 + buff.bonus
        scoreLine = `${scoreLine} × ${(1 + buff.bonus).toFixed(2)}`
        return
      }
      extraBuffMul += buff.bonus
      extraBuffLine = `${extraBuffLine} + ${buff.bonus.toFixed(2)}`
    })
    if (extraBuffMul) {
      multiplier *= 1 + extraBuffMul
      scoreLine = `${scoreLine} × (${extraBuffLine})`
    }
    const stat = Math.floor(this.calc.stat.final.reduce((acc, memberStat, idx) => acc + memberStat.total * (1 + this.performanceDuplicateUp[idx] / 100), 0))
    const score = Math.floor(stat * multiplier)
    scoreLine = `${stat} × ${scoreLine} = ${score}`
    this.calc.result.starActScore.push(score)
    this.calc.result.starActCount++
    this.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_SCORE').replace('{0}', scoreLine))
    const leftStyle = this.currentTiming ? `calc(calc(calc(100% - 40px) * ${this.currentTiming/this.lastSenseTiming}) + 19px)` : '-8px'
    root.senseBox.children[0].children[1].appendChild(_('div', { className: 'staract-line', style: { left: leftStyle } }))

    this.applyPendingActions()
    return true
  }
  purgeExpiredBuff(time) {
    this.activeBuff.sense = this.activeBuff.sense.filter(i => (i.skipCurrent = false, i.lastUntil >= time))
    this.activeBuff.starAct = this.activeBuff.starAct.filter(i => (i.skipCurrent = false, i.lastUntil >= time))
  }
}

