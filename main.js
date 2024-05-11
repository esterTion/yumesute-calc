/**
 * 
 * @param {string} nodeName
 * @param {object} attributes
 * @param {HTMLElement[]} children
 * @returns HTMLElement
 */
function _(e,t,i){var a=null;if("text"===e)return document.createTextNode(t);a=document.createElement(e);for(var n in t)if("style"===n)for(var o in t.style)a.style[o]=t.style[o];else if("className"===n)a.className=t[n];else if("event"===n)for(var o in t.event)a.addEventListener(o,t.event[o]);else a.setAttribute(n,t[n]);if(i)if("string"==typeof i)a.innerHTML=i;else if(Array.isArray(i))for(var l=0;l<i.length;l++)null!=i[l]&&a.appendChild(i[l]);return a}

function removeAllChilds(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

const AttributeEnum = [
  "",
  "Cute",
  "Cool",
  "Colorful",
  "Cheerful"
]
const SenseTypeEnum = {
  "1": "Support",
  "2": "Control",
  "3": "Amplification",
  "4": "Special",
  "9": "None",
  "10": "Alternative"
}

class GameDb {
  static Character = {};
  static CharacterBase = {};
  static CharacterLevel = {};
  static CharacterBloomBonusGroup = {};
  static CharacterStarRank = {};
  static Sense = {};
  static StarAct = {};
  static StarActCondition = {};

  static AlbumEffect = {};
  static PhotoEffect = {};
  static Effect = {};

  static Poster = {};
  static PosterAbility = {};

  static Accessory = {};
  static AccessoryEffect = {};
  static RandomEffectGroup = {};

  static SenseNotation = {};

  static CircleTheaterLevel = {};
  static CircleSupportCompanyLevelDetail = {};

  static async load() {
    let loaded = -1
    const updateProgress = () => {
      loaded++
      document.getElementById('loading').textContent = `Loading ${loaded}/${total}`
    }
    const promises = [
      this.loadKeyedMasterTable('CharacterMaster').then(r => this.Character = r).then(updateProgress),
      this.loadKeyedMasterTable('CharacterBaseMaster').then(r => this.CharacterBase = r).then(updateProgress),
      this.loadKeyedMasterTable('CharacterLevelMaster', 'Level').then(r => this.CharacterLevel = r).then(updateProgress),
      this.loadKeyedMasterTable('CharacterBloomBonusGroupMaster').then(r => this.CharacterBloomBonusGroup = r).then(updateProgress),
      this.loadKeyedMasterTable('CharacterStarRankMaster', 'Rank').then(r => this.CharacterStarRank = r).then(updateProgress),
      this.loadKeyedMasterTable('SenseMaster').then(r => this.Sense = r).then(updateProgress),
      this.loadKeyedMasterTable('StarActMaster').then(r => this.StarAct = r).then(updateProgress),
      this.loadKeyedMasterTable('StarActConditionMaster').then(r => this.StarActCondition = r).then(updateProgress),

      this.loadKeyedMasterTable('AlbumEffectMaster').then(r => this.AlbumEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('PhotoEffectMaster').then(r => this.PhotoEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('EffectMaster').then(r => this.Effect = r).then(updateProgress),

      this.loadKeyedMasterTable('PosterMaster').then(r => this.Poster = r).then(updateProgress),
      this.loadKeyedMasterTable('PosterAbilityMaster').then(r => this.PosterAbility = r).then(updateProgress),

      this.loadKeyedMasterTable('AccessoryMaster').then(r => this.Accessory = r).then(updateProgress),
      this.loadKeyedMasterTable('AccessoryEffectMaster').then(r => this.AccessoryEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('RandomEffectGroupMaster').then(r => this.RandomEffectGroup = r).then(updateProgress),

      this.loadKeyedMasterTable('SenseNotationMaster').then(r => this.SenseNotation = r).then(updateProgress),

      this.loadKeyedMasterTable('CircleTheaterLevelMaster').then(r => this.CircleTheaterLevel = r).then(updateProgress),
      this.loadKeyedMasterTable('CircleSupportCompanyLevelDetailMaster').then(r => this.CircleSupportCompanyLevelDetail = r).then(updateProgress),
    ]
    const total = promises.length
    updateProgress()

    await Promise.all(promises)
  }
  static async loadKeyedMasterTable(tableName, idKey = 'Id') {
    const resp = await this.loadMasterTable(tableName)
    const map = {}
    for (const row of resp) {
      map[row[idKey]] = row
    }
    return map
  }
  static async loadMasterTable(tableName) {
    const resp = await fetch(`./master/${tableName}.json`).then(r => r.json())
    return resp
  }
}
class BeautyText {
  static convertGameTextToValidDom(text) {
    return text
    .replace(/\*/g, '✦')
    .replace(/<color=(#[0-9A-Fa-f]*)>(.*?)<\/color>/g, '<span style="color: $1">$2</span>')
  }
}
class Effect {
  // life guard分支下的效果需要单独处理。。
  isLifeGuardBranch;
  constructor(id, level) {
    if (!GameDb.Effect[id]) {
      throw new Error(`Effect ${id} not found`)
    }
    this.data = GameDb.Effect[id]
    this.level = level
    if (!this.activeEffect) {
      throw new Error(`Effect ${id} level ${level} not found`)
    }
    Object.assign(this, this.data)
    this.isLifeGuardBranch = false
  }
  static get(id, level) {
    return new Effect(id, level)
  }
  get level() {
    return this._level
  }
  set level(val) {
    this._level = val
    this.activeEffect = this.data.Details.filter(i => i.Level === val)[0]
  }

  get activeEffectValueStr() {
    switch (this.CalculationType) {
      case 'PercentageAddition':
      case 'Multiplication': { return this.activeEffect.Value / 100 }
      case 'FixedAddition': { return this.activeEffect.Value }
    }
    return ''
  }

  canTrigger(calc, index) {
    let result = true
    for (let trigger of this.Triggers) {
      switch (trigger.Trigger) {
        case 'CompanyCount': { result = result && calc.properties.companyCount == trigger.Value; break }
        case 'AttributeCount': { result = result && calc.properties.attributeCount == trigger.Value; break }
        case 'CharacterBase': { result = result && calc.members[index] && calc.members[index].data.CharacterBaseMasterId == trigger.Value; break }
        case "Company": { result = result && calc.members[index] && GameDb.CharacterBase[calc.members[index].data.CharacterBaseMasterId].CompanyMasterId == trigger.Value;  break }
        case "Attribute": { result = result && calc.members[index] && calc.members[index].data.Attribute == AttributeEnum[trigger.Value]; break }
        case "SenseType": { result = result && calc.members[index] && calc.members[index].sense.data.Type == SenseTypeEnum[trigger.Value]; break }
        case "OverLife":
        case "BelowLife":
        default: { root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED', {trigger:trigger.Trigger, range: this.Range, id: this.Id})); return false }
      }
    }
    return result
  }
  conditionSatified(calc, index) {
    const member = calc.members[index]
    if (!member) return false
    for (let condition of this.data.Conditions) {
      switch (condition.Condition) {
        case "CharacterBase": { if (member.data.CharacterBaseMasterId !== condition.Value) return false; break; }
        case "Company": { if (GameDb.CharacterBase[member.data.CharacterBaseMasterId].CompanyMasterId !== condition.Value) return false; break; }
        case "Attribute": { if (member.data.Attribute !== AttributeEnum[condition.Value]) return false; break; }
        case "SenseType": { if (GameDb.Sense[member.data.SenseMasterId].Type !== SenseTypeEnum[condition.Value]) return false; break; }
        case "Character": { if (member.data.CharacterMasterId !== condition.Value) return false; break; }
        // TODO: Implement after poster is implemented
        case "EquippedPoster": { return false }
        default: { return false }
      }
    }
    return true
  }
  applyEffect(calc, index, type) {
    const targets = this.Range === 'All' ? [0,1,2,3,4] : this.Range === 'Self' ? [index] : []
    switch (this.Type) {
      case 'BaseCorrection': { return }
      case 'VocalUp': { return VocalUpEffect.applyEffect(this, calc, targets, type) }
      case 'ExpressionUp': { return ExpressionUpEffect.applyEffect(this, calc, targets, type) }
      case 'ConcentrationUp': { return ConcentrationUpEffect.applyEffect(this, calc, targets, type) }
      case 'PerformanceUp': { return PerformanceUpEffect.applyEffect(this, calc, targets, type) }
      case 'BaseScoreUp': { return BaseScoreUpEffect.applyEffect(this, calc, targets, type) }
      case 'SenseRecastDown': { return SenseRecastDown.applyEffect(this, calc, targets, type) }
      case 'DecreaseRequireSupportLight': { return DecreaseRequireSupportLight.applyEffect(this, calc, targets, type) }
      case 'DecreaseRequireControlLight': { return DecreaseRequireControlLight.applyEffect(this, calc, targets, type) }
      case 'DecreaseRequireAmplificationLight': { return DecreaseRequireAmplificationLight.applyEffect(this, calc, targets, type) }
      case 'DecreaseRequireSpecialLight': { return DecreaseRequireSpecialLight.applyEffect(this, calc, targets, type) }
      case 'LifeHealing': { return LifeHealing.applyEffect(this, calc, targets, type) }
      case "PrincipalGaugeUp": { return PrincipalGaugeUp.applyEffect(this, calc, targets, type) }
      case 'PrincipalGaugeGain': { return PrincipalGaugeGain.applyEffect(this, calc, targets, type) }
      case 'PrincipalGaugeLimitUp': { return PrincipalGaugeLimitUp.applyEffect(this, calc, targets, type) }
      case 'FinalPerformanceUpCancelSense': { return FinalPerformanceUpCancelSense.applyEffect(this, calc, targets, type) }
      case "VocalLimitUp": { return VocalLimitUp.applyEffect(this, calc, targets, type) }
      case "ExpressionLimitUp": { return ExpressionLimitUp.applyEffect(this, calc, targets, type) }
      case "ConcentrationLimitUp": { return ConcentrationLimitUp.applyEffect(this, calc, targets, type) }
      case "PerformanceLimitUp": { return PerformanceLimitUp.applyEffect(this, calc, targets, type) }
      case "LifeGuard": { return LifeGuard.applyEffect(this, calc, targets, type) }

      case 'SenseAlternative': { return }
      case 'RewardUp': { return }
      case 'SenseScoreUp': { return SenseScoreUp.applyEffect(this, calc, targets, type) }
      case 'ScoreUpByHighLife': { return ScoreUpByHighLife.applyEffect(this, calc, targets, type) }
      case 'ScoreUpByLowLife': { return ScoreUpByLowLife.applyEffect(this, calc, targets, type) }
      case 'SenseCoolTimeRecastDown': { return SenseCoolTimeRecastDown.applyEffect(this, calc, targets, type) }
      case "AddSenseLightSelf": { return AddSenseLightSelf.applyEffect(this, calc, [index], type) }
      case "AddSenseLightVariable": { return AddSenseLightVariable.applyEffect(this, calc, [index], type) }
      case "AddSenseLightSupport": { return AddSenseLightSupport.applyEffect(this, calc, [index], type) }
      case "AddSenseLightControl": { return AddSenseLightControl.applyEffect(this, calc, [index], type) }
      case "AddSenseLightAmplification": { return AddSenseLightAmplification.applyEffect(this, calc, [index], type) }
      case "AddSenseLightSpecial": { return AddSenseLightSpecial.applyEffect(this, calc, [index], type) }

      case "ScoreGainOnScore": { return ScoreGainOnScore.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnVocal": { return ScoreGainOnVocal.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnExpression": { return ScoreGainOnExpression.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnConcentration": { return ScoreGainOnConcentration.applyEffect(this, calc, [index], type) }

      case "StarActScoreUp": { return StarActScoreUp.applyEffect(this, calc, targets, type) }

      case "BaseVocalUp":
      case "BaseExpressionUp":
      case "BaseConcentrationUp":

      case "ChangeWrongLightToSpLight":

      case "ScoreUpByBuff":
      case "BuffTimeExtend":

      case "LifeFixedValue":
      case "LightGuard":

      case "ScoreGainOnPerformance":
      default: { root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_NOT_IMPLEMENTED', {type: this.Type, id: this.Id})) }
    }
  }

}
class VocalUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][StatBonus.Vocal] += effect.activeEffect.Value
    })
  }
}
class ExpressionUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][StatBonus.Expression] += effect.activeEffect.Value
    })
  }
}
class ConcentrationUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][StatBonus.Concentration] += effect.activeEffect.Value
    })
  }
}
class PerformanceUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][StatBonus.Performance] += effect.activeEffect.Value
    })
  }
}
class BaseScoreUpEffect {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`BaseScoreUp calc type: ${effect.CalculationType}`)
    calc.passiveEffects.baseScoreUp += effect.activeEffect.Value
  }
}
class SenseRecastDown {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`SenseRecastDown calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].sense.recastDown.push(effect.activeEffect.Value)
    })
  }
}
class SenseCoolTimeRecastDown {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`SenseCoolTimeRecastDown calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.lastSenseTime[idx] -= effect.activeEffect.Value
    })
  }
}
class DecreaseRequireSupportLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireSupportLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[0] += effect.activeEffect.Value
    })
  }
}
class DecreaseRequireControlLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireControlLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[1] += effect.activeEffect.Value
    })
  }
}
class DecreaseRequireAmplificationLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireAmplificationLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[2] += effect.activeEffect.Value
    })
  }
}
class DecreaseRequireSpecialLight {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`DecreaseRequireSpecialLight calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.members[idx].staract.requireDecrease[3] += effect.activeEffect.Value
    })
  }
}
class LifeHealing {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`LifeHealing calc type: ${effect.CalculationType}`)
    calc.liveSim.addLife(effect.activeEffect.Value)
  }
}
class PrincipalGaugeUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PrincipalGaugeUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.pGaugeBonus[idx] += effect.activeEffect.Value
    })
  }
}
class PrincipalGaugeGain {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`PrincipalGaugeGain calc type: ${effect.CalculationType}`)
    calc.liveSim.addPGauge(effect.activeEffect.Value)
  }
}
class PrincipalGaugeLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`PrincipalGaugeLimitUp calc type: ${effect.CalculationType}`)
    calc.liveSim.addPGaugeLimit(effect.activeEffect.Value)
  }
}
class FinalPerformanceUpCancelSense {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`FinalPerformanceUpCancelSense calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffAfterCalc[idx][StatBonus.Performance] *= effect.activeEffect.Value / 100
      calc.liveSim.skipSense[idx] = true
    })
  }
}
class SenseScoreUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`SenseScoreUp calc type: ${effect.CalculationType}`)
    const lifeGuardFix = effect.isLifeGuardBranch ? 100 : 1
    const bonus = lifeGuardFix * 0.0001 * effect.activeEffect.Value
    calc.liveSim.activeBuff.sense.push({
      targets,
      effect,
      bonus,
      skipCurrent: effect.Range === 'All',
      isLifeGuardEffect: effect.isLifeGuardBranch,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonus * 100, effect.DurationSecond]))
  }
}
class ScoreUpByHighLife {
  static LifeCap = 3000
  static PowerValue = 1.25
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreUpByHighLife calc type: ${effect.CalculationType}`)
    const life = Math.min(calc.liveSim.life, ScoreUpByHighLife.LifeCap)
    const bonus = Math.floor(0.01 * effect.activeEffect.Value * Math.pow(life / ScoreUpByHighLife.LifeCap, ScoreUpByHighLife.PowerValue)) / 100
    calc.liveSim.activeBuff.sense.push({
      targets,
      effect,
      bonus,
      skipCurrent: false,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    const bonusLine = `${effect.activeEffect.Value / 100} × (${life} / ${ScoreUpByHighLife.LifeCap}) ^ ${ScoreUpByHighLife.PowerValue} = ${Math.round(bonus * 100)}`
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonusLine, effect.DurationSecond]))
  }
}
class ScoreUpByLowLife {
  static LifeCap = 1000
  static PowerValue = 2
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ScoreUpByLowLife calc type: ${effect.CalculationType}`)
    const life = Math.min(calc.liveSim.life, ScoreUpByLowLife.LifeCap)
    const bonus = Math.floor(0.01 * effect.activeEffect.Value * Math.pow((1001 - life) / ScoreUpByLowLife.LifeCap, ScoreUpByLowLife.PowerValue)) / 100
    calc.liveSim.activeBuff.sense.push({
      targets,
      effect,
      bonus,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    const bonusLine = `${effect.activeEffect.Value / 100} × ((1001 -${life}) / ${ScoreUpByLowLife.LifeCap}) ^ ${ScoreUpByLowLife.PowerValue} = ${Math.round(bonus * 100)}`
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_UP', [bonusLine, effect.DurationSecond]))
  }
}
class AddSenseLightSelf {
  static applyEffect(effect, calc, targets, type) {
    // 为什么有 PercentageAddition ？
    // 全部视为 FixedAddition
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.liveSim.senseExtraAmount[idx] += effect.activeEffect.Value
    })
  }
}
class AddSenseLightVariable {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Variable'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
class AddSenseLightSupport {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Support'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
class AddSenseLightControl {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Control'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
class AddSenseLightAmplification {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Amplification'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
class AddSenseLightSpecial {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const type = 'Special'
      calc.liveSim.addSenseLight(type, effect.activeEffect.Value)
    })
  }
}
class ScoreGainOnScore {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnScore calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const liveSim = calc.liveSim
      const scoreRightNow = liveSim.baseScore * liveSim.currentTiming / liveSim.lastSenseTiming
      + calc.result.senseScore.reduce((acc, cur) => acc + cur, 0)
      + calc.result.starActScore.reduce((acc, cur) => acc + cur, 0)
      const score = Math.floor(scoreRightNow * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [scoreRightNow, effect.activeEffect.Value / 100, score, 'score']))
      root.addWarningMessage(ConstText.get('LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE'))
    })
  }
}
class ScoreGainOnVocal {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnVocal calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = calc.stat.final[idx].vo
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'vo']))
    })
  }
}
class ScoreGainOnExpression {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnExpression calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = calc.stat.final[idx].ex
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'ex']))
    })
  }
}
class ScoreGainOnConcentration {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'Multiplication') throw new Error(`ScoreGainOnConcentration calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      const val = calc.stat.final[idx].co
      const score = Math.floor(val * effect.activeEffect.Value / 100)
      calc.result.senseScore.push(score)
      calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_POSTER_SCORE', [val, effect.activeEffect.Value / 100, score, 'co']))
    })
  }
}
class VocalLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`VocalLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Vocal] += effect.activeEffect.Value
    })
  }
}
class ExpressionLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ExpressionLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Expression] += effect.activeEffect.Value
    })
  }
}
class ConcentrationLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`ConcentrationLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Concentration] += effect.activeEffect.Value
    })
  }
}
class PerformanceLimitUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`PerformanceLimitUp calc type: ${effect.CalculationType}`)
    targets.forEach(idx => {
      if (!effect.conditionSatified(calc, idx)) return
      calc.stat.buffLimit[idx][0][StatBonus.Performance] += effect.activeEffect.Value
    })
  }
}
class LifeGuard {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'FixedAddition') throw new Error(`LifeGuard calc type: ${effect.CalculationType}`)
    calc.liveSim.lifeGuardCount += effect.activeEffect.Value
  }
}
class StarActScoreUp {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`SenseScoreUp calc type: ${effect.CalculationType}`)
    const lifeGuardFix = effect.isLifeGuardBranch ? 100 : 1
    const bonus = lifeGuardFix * 0.0001 * effect.activeEffect.Value
    calc.liveSim.activeBuff.starAct.push({
      targets,
      effect,
      bonus,
      skipCurrent: false,
      isLifeGuardEffect: effect.isLifeGuardBranch,
      lastUntil: calc.liveSim.currentTiming + effect.DurationSecond,
    })
    calc.liveSim.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_UP', [bonus * 100, effect.DurationSecond]))
  }
}

class EpisodeReadState {
  static None = 0;
  static One = 1;
  static Two = 2;
}

class SenseData {
  constructor(id, level) {
    this.id = id
    this.level = level
    this.data = GameDb.Sense[id]
    this.recastDown = []
    if (!this.data) throw new Error(`Sense ${id} not found`)
    Object.assign(this, this.data)
  }
  get desc() {
    return this.Description
      .replace('[:score]', this.scoreUp)
      .replace('[:gauge]', this.gaugeUp)
      .replace(/\[:pre(\d)\]/g, (_,i)=>Effect.get(this.PreEffects[0].EffectMasterId, this.level).activeEffectValueStr)
      .replace('[:sec]', ()=>Effect.get(this.Branches[0].BranchEffects[0].EffectMasterId, this.level).DurationSecond)
      .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level).activeEffectValueStr)
  }
  getType(members = null) {
    switch (this.Type) {
      case 'Support':
      case 'Control':
      case 'Amplification':
      case 'Special': return this.Type.toLowerCase()
      case 'None': return ''
      case 'Alternative': {
        if (!members) return ''
        // 应该读SenseAlternative的，但是130380没有
        // 反正只有szk是，直接查找kkn
        const kokona = members.find(i => i && i.data.CharacterBaseMasterId === 101)
        if (!kokona) return '?'
        return kokona.sense.getType()
      }
    }
  }
  resetRecastDown() {
    this.recastDown = []
  }
  get ct() {
    return Math.max(1, this.CoolTime - this.recastDown.reduce((acc, cur) => acc + cur, 0))
  }
  get scoreUp() {
    return (this.AcquirableScorePercent + (this.level- 1) * this.ScoreUpPerLevel) / 100
  }
  get gaugeUp() {
    return this.AcquirableGauge
  }

  getActiveBranch(liveSim) {
    const branches = this.data.Branches
    let result = null
    let isLifeGuardBranch = false
    for (let branch of branches) {
      let conditionMet = true
      if (this.data.BranchCondition1 !== 'None') {
        let judgeValue
        switch (this.data.BranchCondition1) {
          case 'LifeGuardCount': { judgeValue = liveSim.lifeGuardCount; isLifeGuardBranch = true; break }
          default: { console.log(`Sense branch condition ${this.data.BranchCondition1}`); return null }
        }
        switch (branch.JudgeType1) {
          case 'Equal': { conditionMet = judgeValue === branch.Parameter1; break }
          case 'MoreThan': { conditionMet = judgeValue >= branch.Parameter1; break }
          case 'LessThan': { conditionMet = judgeValue <= branch.Parameter1; break }
        }
      }
      if (this.data.BranchCondition2 !== 'None') {
        switch (this.data.BranchCondition2) {
          default: { console.log(`Sense branch condition ${this.data.BranchCondition2}`); return null }
        }
      }
      if (conditionMet) {
        result = branch
        result.isLifeGuardBranch = isLifeGuardBranch
        break
      }
    }
    return result
  }

  clone() {
    const sense = new SenseData(this.id, this.level)
    sense.recastDown = this.recastDown.slice()
    return sense
  }
}
class StarActData {
  constructor(id, level) {
    this.id = id
    this.level = level
    this.data = GameDb.StarAct[id]
    if (!this.data) throw new Error(`StarAct ${id} not found`)
    Object.assign(this, this.data)

    this.condition = GameDb.StarActCondition[this.StarActConditionMasterId]
    if (!this.condition) throw new Error(`StarActCondition ${this.StarActConditionMasterId} not found`)

    this.requirements = [
      this.condition.SupportLight,
      this.condition.ControlLight,
      this.condition.AmplificationLight,
      this.condition.SpecialLight
    ]
    this.requireDecrease = [0,0,0,0]
  }
  get desc() {
    return this.Description
      .replace('[:score]', this.scoreUp)
  }
  get scoreUp() {
    return (this.AcquirableScorePercent + this.level * this.ScoreUpPerLevel) / 100
  }
  resetRequireDecrease() {
    this.requireDecrease = [0,0,0,0]
  }
  get actualRequirements() {
    return this.requirements.map((req, i) => (req > 0 ? Math.max(1, req - this.requireDecrease[i]) : 0))
  }
  clone() {
    const staract = new StarActData(this.id, this.level)
    staract.requireDecrease = this.requireDecrease.slice()
    return staract
  }

  getActiveBranch(liveSim) {
    const branches = this.data.Branches
    let result = null
    let isLifeGuardBranch = false
    for (let branch of branches) {
      let conditionMet = true
      if (this.data.BranchCondition1 !== 'None') {
        let judgeValue
        switch (this.data.BranchCondition1) {
          case 'LifeGuardCount': { judgeValue = liveSim.lifeGuardCount; isLifeGuardBranch = true; break }
          default: { console.log(`StarAct branch condition ${this.data.BranchCondition1}`); return null }
        }
        switch (branch.JudgeType1) {
          case 'Equal': { conditionMet = judgeValue === branch.Parameter1; break }
          case 'MoreThan': { conditionMet = judgeValue >= branch.Parameter1; break }
          case 'LessThan': { conditionMet = judgeValue <= branch.Parameter1; break }
        }
      }
      if (this.data.BranchCondition2 !== 'None') {
        switch (this.data.BranchCondition2) {
          default: { console.log(`StarAct branch condition ${this.data.BranchCondition2}`); return null }
        }
      }
      if (conditionMet) {
        result = branch
        result.isLifeGuardBranch = isLifeGuardBranch
        break
      }
    }
    return result
  }
}
class CharacterStat {
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
class CharacterData {
  Id;
  lvl;
  awaken;
  episodeReadState;
  senselv;
  bloom;

  data;
  constructor(Id, parent) {
    this.Id = Id;
    this.lvl = 1;
    this.awaken = false;
    this.episodeReadState = EpisodeReadState.None;
    this.senselv = 1;
    this.bloom = 0;

    this.data = GameDb.Character[Id];
    if (this.data === undefined) {
      throw new Error(`Character ${Id} not found`)
    }

    this.sense = new SenseData(this.data.SenseMasterId, this.senselv)
    this.staract = new StarActData(this.data.StarActMasterId, this.bloom)

    if (!parent) return
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [
        _('td', {}, [_('span', {className: `card-attribute-${this.attributeName}`}), _('text', this.fullCardName)]),
        _('td', {}, [_('text', 'Vo:')]),
        this.voValNode = _('td', {className: 'stat'}),
        _('td', { rowspan: 4 }, [this.cardImg = _('img', { src: `https://redive.estertion.win/wds/card/${this.Id}_0.webp@w200`})])
      ]),
      _('tr', {}, [
        _('td', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })]),
        _('td', {}, [_('text', 'Ex:')]),
        this.exValNode = _('td', {className: 'stat'}),
      ]),
      _('tr', {}, [
        _('td', {}, [
          _('label', {}, [this.awakenInput = _('input', { type: 'checkbox', event: { change: e=>this.setAwaken(e) }}), _('text', '覚醒　')]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:0, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', 'なし　')]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:1, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', '前編読む　')]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:2, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', '後編読む　')]),
        ]),
        _('td', {}, [_('text', 'Co:')]),
        this.coValNode = _('td', {className: 'stat'}),
      ]),
      _('tr', {}, [
        _('td', {}, [
          _('text', 'Star Rank: '), this.starRankInput = _('select', { event: { change: e=>this.setStarRank(e) } }),
          _('text', '　Sense: '), this.senseInput = _('select', { event: { change: e=>this.setSense(e) } }),
          _('text', '　突破: '), this.bloomInput = _('select', { event: { change: e=>this.setBloom(e) } }),
        ]),
        _('td', {}, [_('text', 'Total:')]),
        this.totalValNode = _('td', {className: 'stat'}),
      ]),
      _('tr', {}, [
        _('td', {}, [this.senseDescNode = _('div', { className: 'sense-star', style: {maxWidth: '390px'} })]),
        _('td', {}, [_('text', 'CT: ')]),
        this.ctValNode = _('td'),
        _('td'),
      ]),
      _('tr', {}, [
        this.staractDescNode = _('td'),
        this.staractRequirementsNode = _('td', {colspan: 3}, [
          _('span', { className: 'sense-star', 'data-sense-type': 'support'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'control'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'amplification'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'special'}),
        ]),
      ]),
      _('tr', {}, [
        _('td'),
        _('td', { colspan: 2 }, [_('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }})]),
        _('td'),
      ]),
    ]))

    this.iconNode = root.characterIconList.appendChild(_('span', { className: 'list-icon-container', event: { click: e => this.toggleSelection() } }, [
      this.iconNodeIcon = _('span', { className: 'spriteatlas-characters', 'data-id': this.cardIconId }),
      _('br'),
      _('span', { className: `card-attribute-${this.attributeName}`}),
      _('span', { className: 'sense-star', 'data-sense-type': this.sense.getType() }),
      this.iconNodeCtLabel = _('span'),
      _('br'),
      this.iconNodeLevelLabel = _('span'),
      this.iconSelectionInput = _('input', { type: 'checkbox', className: 'icon-selection' }),
    ]))
    this.node.style.display = 'none'

    for (let lvl in GameDb.CharacterLevel) {
      this.levelSelect.appendChild(_('option', { value: lvl }, [_('text', lvl)]))
    }
    const maxStarRank = Object.values(GameDb.CharacterStarRank).slice(-1)[0].Rank
    for (let i = 0; i <= maxStarRank; i++) {
      this.starRankInput.appendChild(_('option', { value: i }, [_('text', i)]))
    }
    for (let i = 1; i < 6; i++) {
      this.senseInput.appendChild(_('option', { value: i }, [_('text', i)]))
    }
    for (let i = 0; i < 6; i++) {
      this.bloomInput.appendChild(_('option', { value: i }, [_('text', i)]))
    }
  }
  get rarityStr() {
    return ({
      'Rare1': '★',
      'Rare2': '★★',
      'Rare3': '★★★',
      'Rare4': '★★★★',
    })[this.data.Rarity]
  }
  get attributeName() {
    return this.data.Attribute.toLowerCase()
  }
  get cardIconId() {
    return `${this.Id}_${this.awaken&&this.data.Rarity==='Rare4'?1:0}`
  }
  get cardName() {
    return this.data.Name
  }
  get charaName() {
    return GameDb.CharacterBase[this.data.CharacterBaseMasterId].Name
  }
  get fullCardName() {
    return `${this.rarityStr}【${this.cardName}】${this.charaName}`
  }
  get coMin() {
    return this.data.MinLevelStatus.Concentration;
  }
  get exMin() {
    return this.data.MinLevelStatus.Expression;
  }
  get voMin() {
    return this.data.MinLevelStatus.Vocal;
  }
  get coFinal() {
    return this.calcStat(this.coMin);
  }
  get exFinal() {
    return this.calcStat(this.exMin);
  }
  get voFinal() {
    return this.calcStat(this.voMin);
  }
  get statFinal() {
    return new CharacterStat(Math.floor(this.voFinal), Math.floor(this.exFinal), Math.floor(this.coFinal))
  }
  get starRank() {
    return root.appState.characterStarRank.get(this.data.CharacterBaseMasterId);
  }
  set starRank(val) {
    root.appState.characterStarRank.set(this.data.CharacterBaseMasterId, val);
  }
  get bloomBonusEffects() {
    const bloomBonusGroup = GameDb.CharacterBloomBonusGroup[this.data.BloomBonusGroupMasterId].BloomBonuses;
    const bloomBonus = bloomBonusGroup.filter(i => i.Phase <= this.bloom);
    const bloomBonusEffects = bloomBonus.map(i => Effect.get(i.EffectMasterId, 1));
    return bloomBonusEffects;
  }
  get bloomStatBonus() {
    const bloomBonusEffects = this.bloomBonusEffects.filter(i => i.Type === 'BaseCorrection');
    const bloomStatBonus = bloomBonusEffects.reduce((acc, cur) => acc + cur.activeEffect.Value, 0);
    return bloomStatBonus;
  }
  calcStat(val) {
    const lvlBase = GameDb.CharacterLevel[this.lvl].CharacterStatusLevel;
    const episodeReadBonus = this.episodeReadState === EpisodeReadState.One ? 2 : this.episodeReadState === EpisodeReadState.Two ? 5 : 0;
    const bloomBonus = this.bloomStatBonus;
    const awakenNum = this.awaken ? 1 : 0;
    const starRankBonus = this.starRank / 2;
    return (val + episodeReadBonus) * lvlBase / 100 * (100 + bloomBonus / 100 + awakenNum * 10 + starRankBonus) / 100;
  }
  update() {
    if (this.data.Rarity === 'Rare1' || this.data.Rarity === 'Rare2') {
      this.awakenInput.setAttribute('disabled', '')
      this.awaken = false
    }
    this.levelSelect.value = this.lvl;
    this.awakenInput.checked = this.awaken;
    this.starRankInput.value = this.starRank;
    root.characterForm[`episodeReadState-${this.data.Id}`].value = this.episodeReadState;
    this.senseInput.value = this.senselv;
    this.bloomInput.value = this.bloom;

    this.cardImg.src = `https://redive.estertion.win/wds/card/${this.cardIconId}.webp@w200`
    this.iconNodeIcon.dataset.id = this.cardIconId

    const stat = this.statFinal
    this.voValNode.textContent = stat.vo
    this.exValNode.textContent = stat.ex
    this.coValNode.textContent = stat.co
    this.totalValNode.textContent = stat.total

    this.sense.resetRecastDown()
    this.staract.resetRequireDecrease()
    this.bloomBonusEffects.forEach(effect => {
      switch (effect.Type) {
        case 'SenseRecastDown': return this.sense.recastDown.push(effect.activeEffect.Value)
        case 'DecreaseRequireSupportLight': return this.staract.requireDecrease[0] += effect.activeEffect.Value
        case 'DecreaseRequireControlLight': return this.staract.requireDecrease[1] += effect.activeEffect.Value
        case 'DecreaseRequireAmplificationLight': return this.staract.requireDecrease[2] += effect.activeEffect.Value
        case 'DecreaseRequireSpecialLight': return this.staract.requireDecrease[3] += effect.activeEffect.Value
      }
    })

    this.sense.level = this.senselv
    try { this.senseDescNode.textContent = this.sense.desc } catch {
      this.senseDescNode.textContent = this.sense.data.Description
    }
    this.senseDescNode.dataset.senseType = this.sense.getType()
    this.ctValNode.textContent = this.sense.ct

    this.staract.level = this.bloom
    this.staractDescNode.textContent = this.staract.desc
    this.staract.actualRequirements.forEach((req, i) => {
      this.staractRequirementsNode.children[i].textContent = req
      this.staractRequirementsNode.children[i].style.display = req > 0 ? '' : 'none'
    })

    this.iconNodeCtLabel.textContent = this.sense.ct
    this.iconNodeLevelLabel.textContent = [this.lvl, this.senselv, this.bloom].join(' ')
  }
  appendNode(parent) {
    root.characterIconList.appendChild(this.iconNode)
    parent.appendChild(this.node)
  }
  removeNode() {
    this.node.remove()
    this.iconNode.remove()
  }
  remove() {
    this.removeNode()
    root.removeCharacter(this)
  }
  toggleSelection() {
    this.iconSelectionInput.checked = !this.iconSelectionInput.checked
    this.iconNode.classList[this.iconSelectionInput.checked ? 'add' : 'remove']('selected')
    if (this.iconSelectionInput.checked) {
      this.node.style.display = ''
    } else {
      this.node.style.display = 'none'
    }

    root.update({ selection: true })
  }

  setLevel(e) {
    this.lvl = e.target.value | 0;
    root.update({ chara: true })
  }
  setAwaken(e) {
    this.awaken = e.target.checked;
    root.update({ chara: true })
  }
  setEpisodeReadState(e) {
    this.episodeReadState = e.target.value | 0;
    root.update({ chara: true })
  }
  setStarRank(e) {
    this.starRank = e.target.value | 0;
    root.update({ chara: true })
  }
  setSense(e) {
    this.senselv = e.target.value | 0;
    root.update({ chara: true })
  }
  setBloom(e) {
    this.bloom = e.target.value | 0;
    root.update({ chara: true })
  }

  toJSON() {
    return [
      this.Id,
      this.lvl,
      this.awaken,
      this.episodeReadState,
      this.senselv,
      this.bloom,
    ]
  }
  static fromJSON(data, parent) {
    const chara = new CharacterData(data[0], parent)
    chara.lvl = data[1]
    chara.awaken = data[2]
    chara.episodeReadState = data[3]
    chara.senselv = data[4]
    chara.bloom = data[5]
    return chara
  }
}
class CharacterStarRankData {
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


class PosterData {
  constructor(id, parent) {
    this.id = id
    this.level = 1
    this.release = 0
    this.data = GameDb.Poster[id]
    if (!this.data) throw new Error(`Poster ${id} not found`)

    if (!parent) return
    this.node = parent.appendChild(_('tr', {}, [_('td', {}, [
      _('div', {}, [_('text', this.fullPosterName)]),
      _('div', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })]),
      _('div', {}, [_('text', '解放: '), this.releaseSelect = _('select', { event: { change: e=>this.setRelease(e) } })]),
      _('div', {}, [_('text', 'Leader: ')]),
      this.leaderAbilityBox = _('div'),
      _('div', {}, [_('text', 'Normal: ')]),
      this.normalAbilityBox = _('div'),
      _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
    ]), _('td', {}, [_('img', { src: this.imageUrl, style: { width: '200px' }})])]))

    this.iconNode = root.posterIconList.appendChild(_('span', { className: 'list-icon-container', event: { click: e => this.toggleSelection() } }, [
      this.iconNodeIcon = _('span', { className: 'spriteatlas-posters', 'data-id': this.id }),
      _('br'),
      this.iconNodeLevelLabel = _('span'),
      this.iconSelectionInput = _('input', { type: 'checkbox', className: 'icon-selection' }),
    ]))
    this.node.style.display = 'none'

    for (let i = 1; i <= this.maxLevel; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
    for (let i = 0; i < 5; i++) {
      this.releaseSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }

    this.abilitiesData = Object.values(GameDb.PosterAbility).filter(i => i.PosterMasterId === this.id)
    this.abilities = []
    this.abilitiesData.filter(i=>i.Type === 'Leader').forEach(i => this.abilities.push(new PosterAbilityData(i.Id, this.leaderAbilityBox)))
    this.abilitiesData.filter(i=>i.Type === 'Normal').forEach(i => this.abilities.push(new PosterAbilityData(i.Id, this.normalAbilityBox)))
  }

  get imageUrl() {
    return `https://redive.estertion.win/wds/poster/${this.id}_0.webp@w200`
  }
  get currentMaxLevel() {
    return this.maxLevel - (4 - this.release)
  }
  get maxLevel () {
    switch (this.data.Rarity) {
      case 'R': return 6
      case 'SR': return 8
      case 'SSR': return 10
    }
  }
  get fullPosterName() {
    return `${this.data.Rarity} ${this.data.Name}`
  }

  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ poster: true })
  }
  setRelease(e) {
    this.release = e.target.value | 0;
    root.update({ poster: true })
  }

  update() {
    this.level = Math.min(this.level, this.currentMaxLevel)
    this.levelSelect.value = this.level;
    for (let i = 0, currentMax = this.currentMaxLevel, max = this.maxLevel; i < max; i++) {
      if (i < currentMax) {
        this.levelSelect.children[i].removeAttribute('disabled')
      } else {
        this.levelSelect.children[i].setAttribute('disabled', '')
      }
    }
    this.releaseSelect.value = this.release;
    this.abilities.forEach(i => {
      i.level = this.level
      i.release = this.release
      i.update()
    })
    this.iconNodeLevelLabel.textContent = `Rl${this.release} Lv${this.level}`
  }
  remove() {
    this.node.remove()
    this.iconNode.remove()
    root.removePoster(this)
  }
  toggleSelection() {
    this.iconSelectionInput.checked = !this.iconSelectionInput.checked
    this.iconNode.classList[this.iconSelectionInput.checked ? 'add' : 'remove']('selected')
    if (this.iconSelectionInput.checked) {
      this.node.style.display = ''
    } else {
      this.node.style.display = 'none'
    }
    root.update({ selection: true })
  }

  static fromJSON(data, parent) {
    const poster = new PosterData(data[0], parent)
    poster.level = data[1]
    poster.release = data[2]
    return poster
  }
  toJSON() {
    return [this.id, this.level, this.release]
  }
}
class PosterAbilityData {
  constructor(id, parent) {
    this.id = id
    this.data = GameDb.PosterAbility[id]
    if (!this.data) throw new Error(`PosterAbility ${id} not found`)
    this.level = 1
    this.release = 0

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      _('div', {}, [_('text', this.data.Name + ': ' + (this.data.ReleaseLevelAt ? '(Lv'+this.data.ReleaseLevelAt+')' : ''))]),
      this.descNode = _('div', { style: { paddingLeft: '1em', maxWidth: '450px' }}),
    ]))
  }

  update() {
    this.descNode.innerHTML = this.desc
    this.node.style.opacity = this.unlocked ? 1 : 0.5
  }

  get unlocked() {
    return this.data.ReleaseLevelAt <= this.level
  }
  get desc() {
    return BeautyText.convertGameTextToValidDom(this.data.Description)
    .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.data.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level + this.release).activeEffectValueStr)
  }

  getActiveBranch(liveSim) {
    const branches = this.data.Branches
    let result = null
    for (let branch of branches) {
      let conditionMet = true
      if (this.data.BranchConditionType1 !== 'None') {
        let judgeValue
        switch (this.data.BranchConditionType1) {
          case 'AttributeCount': { judgeValue = liveSim.calc.properties.attributeCount; break }
          case 'CompanyMemberCount': { judgeValue = liveSim.calc.properties.companyCount; break }
          default: { console.log(`Sense branch condition ${this.data.BranchConditionType1}`); return null }
        }
        switch (branch.JudgeType1) {
          case 'Equal': { conditionMet = judgeValue === branch.Parameter1; break }
          case 'MoreThan': { conditionMet = judgeValue >= branch.Parameter1; break }
          case 'LessThan': { conditionMet = judgeValue <= branch.Parameter1; break }
        }
      }
      if (this.data.BranchConditionType2 !== 'None') {
        switch (this.data.BranchConditionType2) {
          default: { console.log(`Sense branch condition ${this.data.BranchConditionType2}`); return null }
        }
      }
      if (conditionMet) {
        result = branch
        break
      }
    }
    return result
  }
}

class AccessoryData {
  id;
  level;
  constructor(id, parent) {
    this.id = id
    this.level = 1
    this.data = GameDb.Accessory[id]
    if (!this.data) throw new Error(`Accessory ${id} not found`)

    if (!parent) return
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [_('td', { rowspan: 4, style: {textAlign: 'center', verticalAlign: 'top'} }, [_('span', {className: 'spriteatlas-accessories', 'data-id': this.id})]), _('td', {}, [_('text', this.fullAccessoryName)])]),
      _('tr', {}, [_('td', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })])]),
      this.effectBox = _('tr'),
      _('tr', {}, [
        this.randomEffectSelect = _('select', { event: { change: e=>this.setRandomEffect(e) } }),
        _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
      ]),
    ]))

    this.iconNode = root.accessoryIconList.appendChild(_('span', { className: 'list-icon-container small-text', event: { click: e => this.toggleSelection() } }, [
      this.iconNodeIcon = _('span', { className: 'spriteatlas-accessories', 'data-id': this.id }),
      _('br'),
      this.iconNodeLevelLabel = _('span', { style: { maxWidth: '64px' }}),
      this.iconSelectionInput = _('input', { type: 'checkbox', className: 'icon-selection' }),
    ]))
    this.node.style.display = 'none'

    this.mainEffects = this.data.FixedAccessoryEffects.map(i => new AccessoryEffectData(i, this.effectBox))
    this.data.RandomEffectGroups.forEach(i => {
      const group = GameDb.RandomEffectGroup[i]
      if (!group) throw new Error(`RandomEffectGroup ${i} not found`)
      group.AccessoryEffects.forEach(j => this.randomEffectSelect.appendChild(_('option', { value: j }, [_('text', GameDb.AccessoryEffect[j].Name)])))
    })
    if (this.data.RandomEffectGroups.length > 0) {
      this.randomEffectId = this.randomEffectSelect.value
      this.randomEffect = new AccessoryEffectData(this.randomEffectId, this.effectBox)
    } else {
      this.randomEffectSelect.setAttribute('disabled', '')
      this.randomEffectSelect.style.display = 'none'
    }

    for (let i = 1; i < 11; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
  }

  get fullAccessoryName() {
    return `${this.data.Rarity} ${this.data.Name}`
  }

  setRandomEffect(e, skipUpdate) {
    this.randomEffect.node.remove()
    this.randomEffectId = e.target.value
    this.randomEffect = new AccessoryEffectData(this.randomEffectId, this.effectBox)
    if (!skipUpdate) root.update({ accessory: true })
  }
  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ accessory: true })
  }

  update() {
    this.levelSelect.value = this.level;
    this.mainEffects.forEach(i => {
      i.level = this.level
      i.update()
    })
    this.iconNodeLevelLabel.textContent = this.level
    if (this.randomEffect) {
      this.randomEffect.level = this.level
      this.randomEffect.update()
      this.iconNodeLevelLabel.textContent = [this.level, this.randomEffect.data.Name].join(' | ')
    }
  }
  remove() {
    this.node.remove()
    this.iconNode.remove()
    root.removeAccessory(this)
  }
  toggleSelection() {
    this.iconSelectionInput.checked = !this.iconSelectionInput.checked
    this.iconNode.classList[this.iconSelectionInput.checked ? 'add' : 'remove']('selected')
    if (this.iconSelectionInput.checked) {
      this.node.style.display = ''
    } else {
      this.node.style.display = 'none'
    }

    root.update({ selection: true })
  }

  static fromJSON(data, parent) {
    const accessory = new AccessoryData(data[0], parent)
    accessory.level = data[1]
    if (data[2]) {
      accessory.randomEffectSelect.value = data[2]
      accessory.setRandomEffect({ target: accessory.randomEffectSelect }, true)
    }
    return accessory
  }
  toJSON() {
    return [this.id, this.level, this.randomEffectId]
  }
}
class AccessoryEffectData {
  constructor(id, parent) {
    this.id = id
    this.data = GameDb.AccessoryEffect[id]
    if (!this.data) throw new Error(`AccessoryEffect ${id} not found`)
    this.level = 1
    this.effect = Effect.get(this.data.EffectMasterId, this.level)

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      _('span', {}, [_('text', this.data.Name + ': ')]),
      _('br'),
      this.descNode = _('span', { style: { paddingLeft: '1em' }}),
    ]))
  }

  update() {
    this.effect.level = this.level
    this.descNode.innerHTML = this.desc
  }

  get desc() {
    return BeautyText.convertGameTextToValidDom(this.data.Description)
      .replace(/\[:param1\]/g, _=>this.effect.activeEffectValueStr)
  }
}

class PhotoEffectData {
  constructor(id, level, parent, enabled = false) {
    this.id = id
    this.level = level
    this.data = GameDb.PhotoEffect[id]
    this.enabled = enabled

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      this.enableToggle = _('input', { type: 'checkbox', event: { change: e=>this.setEnabled(e) }}),
      this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } }),
      this.desc = _('span'),
      _('input', { type: 'button', 'data-text-value': 'DELETE', event: { click: _=>this.remove() }}),
    ]))

    for (let i = 1; i < 26; i++) {
      this.levelSelect.appendChild(_('option', { value: i }, [_('text', i)]))
    }
  }
  get effectLevel() {
    if (this.level < 1 || this.level > 25) return 1
    return [0,
      1,1,1,1,2,
      3,3,3,3,4,
      5,5,5,5,6,
      7,7,7,7,8,
      9,9,9,9,10
    ][this.level]
  }
  get selectName() {
    return `【${this.targetCharcterName}】${this.data.Name}`
  }
  get targetCharcterName() {
    const charaId = Math.floor(this.id / 1000)
    if (charaId === 0) return '全体'
    return GameDb.CharacterBase[charaId].Name
  }
  get description() {
    return this.data.Description.replace('[:param1]', this.effect.activeEffectValueStr)
  }

  update() {
    this.levelSelect.value = this.level;
    this.effect = Effect.get(this.data.EffectMasterId, this.effectLevel)
    this.desc.textContent = `${this.data.Name}：${this.description}`;
    this.enableToggle.checked = this.enabled
  }
  remove() {
    this.node.remove()
    root.removePhotoEffect(this)
  }
  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ album: true })
  }
  setEnabled(e) {
    this.enabled = e.target.checked;
    root.update({ album: true })
  }

  static fromJSON(data, parent) {
    return new PhotoEffectData(data[0], data[1], parent, data[2])
  }
  toJSON() {
    return [this.id, this.level, this.enabled]
  }
}

class TheaterLevelData {
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

class StatBonusType {
  static Album = 0;
  static Poster = 1;
  static Accessory = 2;
  static Other = 3;
  static Theater = 4;
  static Total = 5;
}
class StatBonus {
  static Vocal = 0;
  static Expression = 1;
  static Concentration = 2;
  static Performance = 3;
}
class ScoreCalculationType {
  static Normal = 'Normal';
  static HighScoreChallenge = 'HighScoreChallenge';
  static Keiko = 'Keiko';
}
class ScoreCalculator {
  constructor(members, posters, accessories, extra) {
    this.members = members;
    this.posters = posters;
    this.accessories = accessories;
    this.extra = extra;
    this.passiveEffects = {
      album:[],
      poster:[],
      accessory:[],
      baseScoreUp: 0,
    }
    this.stat = new StatCalculator(this.members)

    this.properties = {
      company: [],
      attribute: [],
    };
    members.forEach(i => {
      this.properties.company.push(i ? GameDb.CharacterBase[i.data.CharacterBaseMasterId].CompanyMasterId : null);
      this.properties.attribute.push(i ? i.data.Attribute : null);
    })
    this.properties.companyCount = (new Set(this.properties.company.filter(i => i!==null))).size;
    this.properties.attributeCount = (new Set(this.properties.attribute.filter(i => i!==null))).size;

    this.liveSim = new LiveSimulator(this)
  }
  calc(node) {
    removeAllChilds(node)

    if (this.extra.type === ScoreCalculationType.Keiko) {
      this.extra.leader = this.members.find(i => i)
    }
    const leader = this.extra.leader;
    if (!leader) {
      // 没有队长
      return
    }
    this.liveSim.leader = leader
    this.liveSim.starActRequirements = leader.staract.actualRequirements

    this.members.forEach(i => i && (i.sense.resetRecastDown(), i.staract.resetRequireDecrease()))

    const passiveEffects = this.passiveEffects
    Object.values(GameDb.AlbumEffect).forEach(i => {
      if (this.extra.albumLevel < i.Level) return
      const effect = Effect.get(i.EffectMasterId, 1)
      if (!effect.canTrigger(this, -1)) return
      passiveEffects.album.push({effect, source:-1})
    })
    this.extra.albumExtra.forEach(i => {
      if (!i.enabled) return
      const effect = i.effect
      if (effect.Triggers.length === 0) {
        passiveEffects.album.push({effect, source:-1})
        return
      }
      this.members.forEach((chara, idx) => {
        if (!chara) return
        if (!effect.canTrigger(this, idx)) return
        passiveEffects.album.push({effect, source:idx})
      })
    })
    passiveEffects.album.forEach(i => i.effect.applyEffect(this, i.source, StatBonusType.Album))

    // chara
    this.members.forEach((chara, idx) => {
      if (!chara) return
      this.liveSim.skipSense[idx] = chara.data.CharacterBaseMasterId === 401
      chara.bloomBonusEffects.forEach(effect => effect.applyEffect(this, idx, StatBonusType.Album))
    })

    // poster
    this.posters.forEach((poster, idx) => {
      if (!poster) return
      poster.abilities.forEach(ability => {
        if (!ability.unlocked) return
        if (ability.data.Type === 'Leader' && this.members[idx] !== leader) return
        const abilityEffectBranch = ability.getActiveBranch(this.liveSim)
        if (!abilityEffectBranch) return
        abilityEffectBranch.BranchEffects.forEach(effect => {
          effect = Effect.get(effect.EffectMasterId, ability.level + ability.release)
          if (effect.FireTimingType !== 'Passive' && effect.FireTimingType !== 'StartLive') return
          if (!effect.canTrigger(this, idx)) return
          effect.applyEffect(this, idx, StatBonusType.Poster)
        })
      })
    })

    // accessory
    this.accessories.forEach((accessory, idx) => {
      if (!accessory) return
      for (let effect of accessory.mainEffects) {
        effect = effect.effect
        if (effect.FireTimingType !== 'Passive' && effect.FireTimingType !== 'StartLive') continue
        if (!effect.canTrigger(this, idx)) return
        effect.applyEffect(this, idx, StatBonusType.Accessory)
      }
      if (accessory.randomEffect) {
        let effect = accessory.randomEffect.effect
        if (effect.canTrigger(this, idx) && (effect.FireTimingType === 'Passive' || effect.FireTimingType === 'StartLive')) {
          effect.applyEffect(this, idx, StatBonusType.Accessory)
        }
      }
    })

    // theater effect
    const theaterEffects = root.appState.theaterLevel.getEffects()
    theaterEffects.forEach(effect => effect.applyEffect(this, -1, StatBonusType.Theater))

    let statExtra = 1
    if (this.extra.starRankScoreBonus) {
      statExtra = 1 + this.extra.starRankScoreBonus * 30 / 100
    }

    if (this.extra.type !== ScoreCalculationType.Keiko) {
      const notation = GameDb.SenseNotation[root.senseNoteSelect.value | 0]
      if (notation && notation.Buffs[0]) {
        const notationBuff = notation.Buffs[0]
        for (let i=0; i<5; i++) {
          if (!this.members[i]) continue
          let isBuffTarget = false
          switch (notationBuff.Type) {
            case "Attribute": { isBuffTarget = this.members[i].data.Attribute === AttributeEnum[notationBuff.TargetValue]; break;}
            case "Company":   { isBuffTarget = GameDb.CharacterBase[this.members[i].data.CharacterBaseMasterId].CompanyMasterId === notationBuff.TargetValue; break;}
            case "Character": { isBuffTarget = this.members[i].data.CharacterBaseMasterId === notationBuff.TargetValue; break;}
          }
          if (isBuffTarget) {
            this.stat.buffAfterCalc[i][StatBonus.Performance] *= 1 + notationBuff.BuffValue / 100
          }
        }
      }
    }

    this.stat.calc()

    const baseScore = [0.95, 0.97, 1, 1.05].map(coef => Math.floor(Math.floor(this.stat.finalTotal * statExtra) * 10 * (1 + passiveEffects.baseScoreUp/10000) * coef))
    const senseScore = []
    const starActScore = []

    this.result = {
      baseScore,
      senseScore,
      starActScore,
    }

    node.appendChild(_('div', {}, [
      this.createStatDetailsTable(),
      _('span', { 'data-text-key': 'CALC_TOTAL_STAT'}),
      _('text', this.stat.finalTotal),
      _('br'),
      _('span', { 'data-text-key': 'CALC_BASE_SCORE'}),
      _('text', `${baseScore[0]} / ${baseScore[1]} / ${baseScore[2]} / ${baseScore[3]}`)
    ]))

    if (this.extra.type === ScoreCalculationType.Keiko) {
      ConstText.fillText()
      return;
    }

    if (this.members.some(i => !i)) {
      return
    }

    const senseScoreNode = node.appendChild(_('div', {}, [_('span', { 'data-text-key': 'CALC_SENSE_SCORE'})]))
    const starActScoreNode = node.appendChild(_('div', {}, [_('span', { 'data-text-key': 'CALC_STARACT_SCORE'})]))
    const totalScoreNode = node.appendChild(_('div', {}, [_('span', { 'data-text-key': 'CALC_TOTAL_SCORE'})]))

    this.liveSim.baseScore = baseScore[3]

    node.appendChild(_('div', {}, [
      _('div', { className: 'spriteatlas-characters', 'data-id': leader.cardIconId, style: {float: 'left', margin: '0 5px 5px 0'}}),
      _('div', { 'data-text-key': 'CALC_STAR_ACT_REQUIREMENTS'}),
      ScoreCalculator.createStarActDisplay(this.liveSim.starActRequirements),
      _('div', { style: {clear: 'both'}}),
    ]))

    this.liveSim.runSimulation(node)

    let finalSenseScore = this.result.senseScore.reduce((acc, cur) => acc + cur, 0)
    let finalStarActScore = this.result.starActScore.reduce((acc, cur) => acc + cur, 0)
    senseScoreNode.appendChild(_('text', finalSenseScore))
    starActScoreNode.appendChild(_('text', ConstText.get('CALC_RESULT_STARACT').replace('{times}', this.result.starActScore.length).replace('{score}', finalStarActScore)))
    totalScoreNode.appendChild(_('text', this.result.baseScore.map(i => i + finalSenseScore + finalStarActScore).join(' / ')))

    ConstText.fillText()
  }
  createStatDetailsTable() {
    let rowNumber;
    return _('div', {}, this.members.map((chara, idx) => (rowNumber = 0, chara === null ? _('text', '') : _('details', {}, [
      _('summary', {}, [
        _('span', {className: `card-attribute-${chara.attributeName}`}),
        _('text', `${chara.fullCardName} CT: ${chara.sense.ct}`)
      ]),
      _('table', { className: 'stat-details'}, [
        _('thead', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('th'),
          _('th', { 'data-text-key': 'VOCAL'         }, [_('text', '歌唱力')]),
          _('th', { 'data-text-key': 'EXPRESSION'    }, [_('text', '表現力')]),
          _('th', { 'data-text-key': 'CONCENTRATION' }, [_('text', '集中力')]),
          _('th', { 'data-text-key': 'PERFORMANCE'   }, [_('text', '演技力')]),
        ])]),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', { 'data-text-key': 'CALC_TABLE_INITIAL' }, [_('text', '初期値')]),
          _('td', { className: 'stat-value' }, [_('text', this.stat.initial[idx].vo)]),
          _('td', { className: 'stat-value' }, [_('text', this.stat.initial[idx].ex)]),
          _('td', { className: 'stat-value' }, [_('text', this.stat.initial[idx].co)]),
          _('td', { className: 'stat-value' }, [_('text', this.stat.initial[idx].total)]),
        ])]),
        _('tbody', {}, ['CALC_TABLE_ALBUM', 'CALC_TABLE_POSTER', 'CALC_TABLE_ACCESSORY', 'CALC_TABLE_OTHER', 'CALC_TABLE_THEATER'].map((name, j) => _('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', { 'data-text-key': name }, [_('text', name)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][j][0][StatBonus.Vocal        ] / 100}%\n+${this.stat.buffFinal[idx][j][1][StatBonus.Vocal        ]}\n${this.stat.bonus[idx][j].vo}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][j][0][StatBonus.Expression   ] / 100}%\n+${this.stat.buffFinal[idx][j][1][StatBonus.Expression   ]}\n${this.stat.bonus[idx][j].ex}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][j][0][StatBonus.Concentration] / 100}%\n+${this.stat.buffFinal[idx][j][1][StatBonus.Concentration]}\n${this.stat.bonus[idx][j].co}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][j][0][StatBonus.Performance  ] / 100}%\n${this.stat.bonus[idx][j].total}`)]),
        ]))),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', { 'data-text-key': 'CALC_TABLE_TOTAL_BONUS'}, [_('text', '上昇合計')]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][StatBonusType.Total][0][StatBonus.Vocal        ] / 100}%/${this.stat.buffLimit[idx][0][StatBonus.Vocal        ] / 100}%\n+${this.stat.buffFinal[idx][StatBonusType.Total][1][StatBonus.Vocal        ]}\n${this.stat.bonus[idx][StatBonusType.Total].vo}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][StatBonusType.Total][0][StatBonus.Expression   ] / 100}%/${this.stat.buffLimit[idx][0][StatBonus.Expression   ] / 100}%\n+${this.stat.buffFinal[idx][StatBonusType.Total][1][StatBonus.Expression   ]}\n${this.stat.bonus[idx][StatBonusType.Total].ex}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][StatBonusType.Total][0][StatBonus.Concentration] / 100}%/${this.stat.buffLimit[idx][0][StatBonus.Concentration] / 100}%\n+${this.stat.buffFinal[idx][StatBonusType.Total][1][StatBonus.Concentration]}\n${this.stat.bonus[idx][StatBonusType.Total].co}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.buffFinal[idx][StatBonusType.Total][0][StatBonus.Performance  ] / 100}%/${this.stat.buffLimit[idx][0][StatBonus.Performance  ] / 100}%\n${this.stat.bonus[idx][StatBonusType.Total].total}`)]),
        ])]),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', { 'data-text-key': 'CALC_TABLE_FINAL_STAT' }, [_('text', '最終値')]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.final[idx].vo}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.final[idx].ex}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.final[idx].co}`)]),
          _('td', { className: 'stat-value' }, [_('text', `${this.stat.final[idx].total}`)]),
        ])]),
      ])
    ]))))
  }
  static createStarActDisplay(data, alwaysShow = false) {
    return _('span', {}, [
      _('span', { className: 'sense-star', style: { display: (data[0] > 0 || alwaysShow) ? '' : 'none' }, 'data-sense-type': 'support'}, [_('text', data[0])]),
      _('span', { className: 'sense-star', style: { display: (data[1] > 0 || alwaysShow) ? '' : 'none' }, 'data-sense-type': 'control'}, [_('text', data[1])]),
      _('span', { className: 'sense-star', style: { display: (data[2] > 0 || alwaysShow) ? '' : 'none' }, 'data-sense-type': 'amplification'}, [_('text', data[2])]),
      _('span', { className: 'sense-star', style: { display: (data[3] > 0 || alwaysShow) ? '' : 'none' }, 'data-sense-type': 'special'}, [_('text', data[3])]),
      _('span', { className: 'sense-star', style: { display: (data[4] > 0 || alwaysShow) ? '' : 'none' }, 'data-sense-type': 'variable'}, [_('text', data[4])]),
    ])
  }
}
class LiveSimulator {
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

  constructor(calc) {
    this.calc = calc
    this.senseTiming = GameDb.SenseNotation[root.senseNoteSelect.value | 0]
    if (!this.senseTiming) throw new Error('Sense timeline not found')
    this.senseTiming = this.senseTiming.Details.slice()
    this.senseTiming.sort((a,b) => a.TimingSecond - b.TimingSecond)
    this.lastSenseTime = new Array(5).fill(-100)
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
    this.starActCurrent = [0,0,0,0,0]
    this.senseExtraAmount = [0,0,0,0,0]
  }
  runSimulation(node) {
    this.applyPendingActions()
    Array.from(root.senseBox.querySelectorAll('.sense-add-light,.staract-line')).forEach(i => i.remove())
    this.senseCt = this.calc.members.map((chara, idx) => chara ? chara.sense.ct : 0)
    if (this.tryStarAct()) {
      this.phase = ConstText.get('LIVE_PHASE_START_WITH_STARACT')
      this.starActCurrent = [0,0,0,0,0]
    }
    node.appendChild(_('details', { className: 'live-log-phase odd-row' }, [
      _('summary', {}, [_('text', this.phase)]),
      _('text', this.phaseLog.join('\n')),
      _('br'),
      ScoreCalculator.createStarActDisplay(this.starActCurrent, true),
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
      if (!this.trySense(timing, timelineNode)) {
        this.phase = ConstText.get('LIVE_PHASE_SENSE_FAILED').replace('{time}', timing.TimingSecond)
        this.starActCurrent = [0,0,0,0,0]

        timelineNode.classList.add('failed')
      } else {
        this.lastSenseTime[timing.Position - 1] = timing.TimingSecond
      }

      if (this.tryStarAct()) {
        this.phase = ConstText.get('LIVE_PHASE_SENSE_WITH_STARACT').replace('{time}', timing.TimingSecond)
        this.starActCurrent = [0,0,0,0,0]
      }
      node.appendChild(_('details', { className: 'live-log-phase' + (oddRow ? ' odd-row' : ''), open: '' }, [
        _('summary', { className: 'sense-star', 'data-sense-type': this.currentSenseType }, [_('text', this.phase)]),
        _('table', {}, [_('tr', { style: {verticalAlign: 'top'} }, [
          _('td', {}, [_('div', { className: 'spriteatlas-characters', 'data-id': this.calc.members[timing.Position - 1].cardIconId})]),
          _('td', {}, [
            _('text', this.phaseLog.join('\n')),
            _('br'),
            ScoreCalculator.createStarActDisplay(this.starActCurrent, true),
          ]),
        ])]),
      ]))

      oddRow = !oddRow
    })
  }

  applyPendingActions() {
    let action
    while (action = this.pendingActions.shift()) {
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
  addSenseLight(type, amount = 1) {
    switch (type.toLowerCase()) {
      case 'support':       { this.starActCurrent[0] += amount; break }
      case 'control':       { this.starActCurrent[1] += amount; break }
      case 'amplification': { this.starActCurrent[2] += amount; break }
      case 'special':       { this.starActCurrent[3] += amount; break }
      case 'variable':      { this.starActCurrent[4] += amount; break }
    }
    for (let i=0; i<4; i++) {
      this.starActCurrent[i] = Math.min(this.starActCurrent[i], this.starActRequirements[i])
    }
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
        effect.applyEffect(this.calc, idx, null)
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
    const sense = chara.sense
    const ct = this.senseCt[idx]
    const timeSinceLast = timing.TimingSecond - this.lastSenseTime[idx]
    if (ct > timeSinceLast) {
      this.phaseLog.push(ConstText.get('LIVE_LOG_SENSE_FAILED'))
      return false
    }

    sense.data.PreEffects.forEach(effect => {
      effect = Effect.get(effect.EffectMasterId, chara.senselv)
      effect.applyEffect(this.calc, idx, null)
    })
    const senseEffectBranch = sense.getActiveBranch(this)
    if (senseEffectBranch) {
      senseEffectBranch.BranchEffects.forEach(effect => {
        effect = Effect.get(effect.EffectMasterId, chara.senselv)
        effect.isLifeGuardBranch = senseEffectBranch.isLifeGuardBranch
        effect.applyEffect(this.calc, idx, null)
      })
    }
    this.currentSenseType = sense.Type.toLowerCase();
    this.addSenseLight(sense.Type, sense.data.LightCount + this.senseExtraAmount[idx])
    for (let i=0; i<this.senseExtraAmount[idx]; i++) {
      timelineNode.appendChild(_('div', { className: 'sense-add-light', style: { top: `calc(100% + ${i*8}px)` } }))
    }
    if (sense.scoreUp) {
      let multiplier = sense.scoreUp
      let scoreLine = multiplier
      multiplier *= 1 + this.pGauge / 1000
      scoreLine = `${scoreLine} × ${(1 + this.pGauge / 1000).toFixed(3).replace(/0+$/, '')}`
      let extraBuffMul = 0
      let extraBuffLine = '1'
      this.activeBuff.sense.forEach(buff => {
        if (buff.skipCurrent) return
        const targets = buff.targets
        if (targets && !targets.includes(idx)) return
        const effect = buff.effect
        if (!effect.conditionSatified(this.calc, idx)) return
        if (buff.isLifeGuardEffect) {
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
      const score = Math.floor(stat.total * multiplier)
      scoreLine = `${stat.total} × ${scoreLine} = ${score}`
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
          effect.applyEffect(this.calc, idx, null)
        })
      }
    }
    const accessory = this.calc.accessories[idx]
    if (accessory) {
      for (let effect of accessory.mainEffects) {
        effect = effect.effect
        if (effect.FireTimingType !== 'Sense') continue
        if (!effect.canTrigger(this.calc, idx)) continue
        effect.applyEffect(this.calc, idx, null)
      }
      if (accessory.randomEffect) {
        let effect = accessory.randomEffect.effect
        if (effect.FireTimingType === 'Sense' && effect.canTrigger(this.calc, idx)) {
          effect.applyEffect(this.calc, idx, null)
        }
      }
    }

    if (sense.gaugeUp) {
      let amount = sense.gaugeUp
      amount *= 1 + this.pGaugeBonus[idx] / 10000
      amount = Math.floor(amount)
      this.addPGauge(amount, true)
    }
    this.applyPendingActions()

    // 海报效果

    return true
  }
  tryStarAct() {
    const requirement = this.starActRequirements.reduce((sum, i) => sum+i, 0)
    const current = this.starActCurrent.reduce((sum, i) => sum+i, 0)
    if (current < requirement) {
      return false
    }
    const stat = this.calc.stat.finalTotal
    const staractEffectBranch = this.leader.staract.getActiveBranch(this)
    const idx = this.calc.members.indexOf(this.leader)
    if (staractEffectBranch) {
      staractEffectBranch.BranchEffects.forEach(effect => {
        effect = Effect.get(effect.EffectMasterId, this.leader.bloom + 1)
        effect.isLifeGuardBranch = staractEffectBranch.isLifeGuardBranch
        effect.applyEffect(this.calc, idx, null)
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
      if (buff.isLifeGuardEffect) {
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
    const score = Math.floor(stat * multiplier)
    scoreLine = `${stat} × ${scoreLine} = ${score}`
    this.calc.result.starActScore.push(score)
    this.phaseLog.push(ConstText.get('LIVE_LOG_STARACT_SCORE').replace('{0}', scoreLine))
    const leftPixel = this.currentTiming ? 21 : 10
    root.senseBox.children[0].children[1].appendChild(_('div', { className: 'staract-line', style: { left: `calc(${this.currentTiming/this.lastSenseTiming*100}% - ${leftPixel}px)` } }))
    return true
  }
  purgeExpiredBuff(time) {
    this.activeBuff.sense = this.activeBuff.sense.filter(i => (i.skipCurrent = false, i.lastUntil >= time))
    this.activeBuff.starAct = this.activeBuff.starAct.filter(i => (i.skipCurrent = false, i.lastUntil >= time))
  }
}
class StatCalculator {
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
     * [4]: theater
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
    this.final = this.initial.map((i, idx) => i.add(this.bonus[idx][StatBonusType.Total]))
    // 时间轴效果 / 电姬海报（FinalPerformanceUpCancelSense）
    // 目前只有演技力加成
    this.final = this.final.map((i, idx) => i.mulPerformance(this.buffAfterCalc[idx]))
    this.finalTotal = this.final.reduce((s, i) => s+i.total, 0)
  }
}

class Party {
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
class PartyManager {
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

class ConstText {
  static language = null
  static init() {
    if (ConstText.language) return
    if (localStorage.getItem('wds-calc-language')) {
      ConstText.language = localStorage.getItem('wds-calc-language')
      return
    }
    ConstText.autoDetectLanguage()
  }
  static setLanguage(lang) {
    ConstText.language = lang
    localStorage.setItem('wds-calc-language', lang)
    ConstText.fillText()
  }
  static autoDetectLanguage() {
    for (let lang of navigator.languages) {
      if (lang.startsWith('zh')) {
        return ConstText.language = 'zh'
      }
      if (lang.startsWith('ja')) {
        return ConstText.language = 'ja'
      }
    }
    return ConstText.language = 'en'
  }

  static en = {
    SENSE_NOTATION_TAB_NORMAL: 'Normal (Audition/League）',
    SENSE_NOTATION_TAB_HIGHSCORE: 'Highscore Challenge',
    SENSE_NOTATION_TAB_KEIKO: 'Lesson (Keiko)',

    ALBUM_LEVEL_LABEL: 'Album level: ',
    PARTY_LABEL: 'Party edit',
    IMPORT_DATA_LABEL: 'Load exported',
    EXPORT_DATA_LABEL: 'Export',
    EXPORTER_LABEL: 'Export tool using password',

    THEATER_LEVEL_LABEL: 'Theatre level: ',
    SIRIUS: 'Sirius',
    EDEN: 'Eden',
    GINGAZA: 'Gingaza',
    DENKI: 'Gekidan Denki',

    ADD: 'Add',
    DELETE: 'Delete',
    NOT_SELECTED: 'Not selected',
    UPDATE_SELECTION: 'Update selected',
    DELETE_SELECTION: 'Delete selected',
    DELETE_SELECTION_CONFIRM: 'Delete selected items?',
    SELECTION_COUNT_LABEL: 'Selected {0} items: ',

    TAB_CHARA: 'Character',
    TAB_POSTER: 'Poster',
    TAB_ACCESSORY: 'Accessory',

    CARD_LABEL_STORY: 'Card story: ',
    CARD_LABEL_SENSE: 'Sense: ',
    CARD_LABEL_BLOOM: 'Bloom: ',
    CARD_SELECTION_EPISODE_READ_0: 'Not read',
    CARD_SELECTION_EPISODE_READ_1: 'Read Episode 1',
    CARD_SELECTION_EPISODE_READ_2: 'Read Episode 2',
    POSTER_LABEL_RELEASE: 'Release: ',

    VOCAL: 'Vocal',
    EXPRESSION: 'Expression',
    CONCENTRATION: 'Concentration',
    PERFORMANCE: 'Performance',
    CALC_TABLE_INITIAL: 'Initial',
    CALC_TABLE_ALBUM: 'Album',
    CALC_TABLE_POSTER: 'Poster',
    CALC_TABLE_ACCESSORY: 'Accessory',
    CALC_TABLE_OTHER: 'Other',
    CALC_TABLE_THEATER: 'Theatre',
    CALC_TABLE_TOTAL_BONUS: 'Total Bonus',
    CALC_TABLE_FINAL_STAT: 'Final Stat',
    CALC_TOTAL_STAT: 'Total stat: ',
    CALC_BASE_SCORE: 'Base score: ',
    CALC_SENSE_SCORE: 'Sense score: ',
    CALC_STARACT_SCORE: 'Star Act score: ',
    CALC_RESULT_STARACT: '{times} times / {score}',
    CALC_TOTAL_SCORE: 'Total score: ',
    CALC_STAR_ACT_REQUIREMENTS: 'StarAct requirements: ',

    LIVE_PHASE_START: 'Before start',
    LIVE_PHASE_START_WITH_STARACT: 'Before start | StarAct activated',
    LIVE_PHASE_SENSE: 'Sense activated: {time}',
    LIVE_PHASE_SENSE_FAILED: 'Sense failed: {time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'Sense activated: {time} | StarAct activated',
    LIVE_LOG_LIFE: 'Life changed: {0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P gauge changed: {0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P gauge limit changed: {0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'Sense failed',
    LIVE_LOG_SENSE_SKIP: 'Skipped',
    LIVE_LOG_SENSE_SCORE: 'Sense score: {0}',
    LIVE_LOG_STARACT_SCORE: 'Star Act activated, score: {0}',
    LIVE_LOG_POSTER_SCORE: 'Poster bonus ({3}): {0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'Sense bonus: {0}%, lasts {1} sec',
    LIVE_LOG_STARACT_UP: 'Star Act bonus: {0}%, lasts{1} sec',

    PARTY_DEFAULT_NAME: 'Party',
    PARTY_DELETE_CONFIRM: 'Delete this party?',
    PARTY_DELETE_LAST: 'Last party cannot be deleted',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: 'Effect type not implemented: {type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: 'Effect trigger not implemented: {trigger} @ {range} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: 'Bonus based on current score cannot be accurately calculated',
    UNDEFINED_STRING: 'Missing text template: {0}',
  }
  static ja = {
    SENSE_NOTATION_TAB_NORMAL: 'オーディション/リーグ',
    SENSE_NOTATION_TAB_HIGHSCORE: 'ハイスコア挑戦',
    SENSE_NOTATION_TAB_KEIKO: '稽古',

    ALBUM_LEVEL_LABEL: 'アルバムレベル：',
    PARTY_LABEL: '編成',
    IMPORT_DATA_LABEL: 'データを導入',
    EXPORT_DATA_LABEL: 'データを保存',
    EXPORTER_LABEL: '連携パスワードで導入するツール',

    THEATER_LEVEL_LABEL: '劇場レベル：',
    SIRIUS: 'シリウス',
    EDEN: 'Eden',
    GINGAZA: '銀河座',
    DENKI: '劇団電姫',

    ADD: '追加',
    DELETE: '消す',
    NOT_SELECTED: '未選択',
    UPDATE_SELECTION: '選択を更新',
    DELETE_SELECTION: '選択を消す',
    DELETE_SELECTION_CONFIRM: '選択した項目を消しますか？',
    SELECTION_COUNT_LABEL: '選択した {0} 個：',

    TAB_CHARA: 'キャラ',
    TAB_POSTER: 'ポスター',
    TAB_ACCESSORY: 'アクセサリー',

    CARD_LABEL_STORY: 'カードストーリー：',
    CARD_LABEL_SENSE: 'センス：',
    CARD_LABEL_BLOOM: '開花：',
    CARD_SELECTION_EPISODE_READ_0: '未読',
    CARD_SELECTION_EPISODE_READ_1: '前編読む',
    CARD_SELECTION_EPISODE_READ_2: '後編読む',
    POSTER_LABEL_RELEASE: '解放：',

    VOCAL: '歌唱力',
    EXPRESSION: '表現力',
    CONCENTRATION: '集中力',
    PERFORMANCE: '演技力',
    CALC_TABLE_INITIAL: '初期',
    CALC_TABLE_ALBUM: 'アルバム',
    CALC_TABLE_POSTER: 'ポスター',
    CALC_TABLE_ACCESSORY: 'アクセサリー',
    CALC_TABLE_OTHER: 'その他',
    CALC_TABLE_THEATER: '劇場',
    CALC_TABLE_TOTAL_BONUS: 'ボーナス合計',
    CALC_TABLE_FINAL_STAT: '最終',
    CALC_TOTAL_STAT: '合計演技力：',
    CALC_BASE_SCORE: '基礎スコア：',
    CALC_SENSE_SCORE: 'センススコア: ',
    CALC_STARACT_SCORE: 'スターアクトスコア: ',
    CALC_RESULT_STARACT: '{times}回発動 / {score}',
    CALC_TOTAL_SCORE: 'スコア：',
    CALC_STAR_ACT_REQUIREMENTS: 'スターアクト発動条件：',

    LIVE_PHASE_START: 'ライブ前',
    LIVE_PHASE_START_WITH_STARACT: 'ライブ前 | スターアクト発動',
    LIVE_PHASE_SENSE: 'センス発動：{time}',
    LIVE_PHASE_SENSE_FAILED: 'センス失敗：{time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'センス発動：{time} | スターアクト発動',
    LIVE_LOG_LIFE: 'ライフ：{0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P.ゲージ：{0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P.ゲージ上限：{0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'センス失敗',
    LIVE_LOG_SENSE_SKIP: '発動しない',
    LIVE_LOG_SENSE_SCORE: 'センススコア：{0}',
    LIVE_LOG_STARACT_SCORE: 'スターアクト発動、スコア：{0}',
    LIVE_LOG_POSTER_SCORE: 'ポスタースコア({3})：{0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'センスブースト：{0}%，{1}秒間持続',
    LIVE_LOG_STARACT_UP: 'スターアクトブースト：{0}%，{1}秒間持続',

    PARTY_DEFAULT_NAME: 'パーティー',
    PARTY_DELETE_CONFIRM: 'パーティーを消しますか？',
    PARTY_DELETE_LAST: '最後のパーティーは消せません',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: '効果支援していない：{type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: '効果の条件支援していない：{trigger} @ {range} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: '現在のスコアに基づくボーナスは正確に計算できません',
    UNDEFINED_STRING: '不足しているテキスト：{0}',
  }
  static zh = {
    SENSE_NOTATION_TAB_NORMAL: '通常（试音/排位）',
    SENSE_NOTATION_TAB_HIGHSCORE: '高分',
    SENSE_NOTATION_TAB_KEIKO: '稽古',

    ALBUM_LEVEL_LABEL: '相册等级：',
    PARTY_LABEL: '编队',
    IMPORT_DATA_LABEL: '导入数据',
    EXPORT_DATA_LABEL: '导出数据',
    EXPORTER_LABEL: '引继码导出工具',

    THEATER_LEVEL_LABEL: '剧场等级：',
    SIRIUS: 'Sirius',
    EDEN: 'Eden',
    GINGAZA: '银河座',
    DENKI: '剧团电姬',

    ADD: '添加',
    DELETE: '删除',
    NOT_SELECTED: '未选择',
    UPDATE_SELECTION: '更新选中',
    DELETE_SELECTION: '删除选中',
    DELETE_SELECTION_CONFIRM: '确定删除选中的项目吗？',
    SELECTION_COUNT_LABEL: '选中的 {0} 个：',

    TAB_CHARA: '角色',
    TAB_POSTER: '海报',
    TAB_ACCESSORY: '饰品',

    CARD_LABEL_STORY: '卡面故事：',
    CARD_LABEL_SENSE: 'Sense: ',
    CARD_LABEL_BLOOM: '突破：',
    CARD_SELECTION_EPISODE_READ_0: '未读',
    CARD_SELECTION_EPISODE_READ_1: '已读前篇',
    CARD_SELECTION_EPISODE_READ_2: '已读后篇',
    POSTER_LABEL_RELEASE: '解放：',

    VOCAL: '歌唱力',
    EXPRESSION: '表现力',
    CONCENTRATION: '集中力',
    PERFORMANCE: '演技力',
    CALC_TABLE_INITIAL: '初始值',
    CALC_TABLE_ALBUM: '相册',
    CALC_TABLE_POSTER: '海报',
    CALC_TABLE_ACCESSORY: '饰品',
    CALC_TABLE_OTHER: '其他',
    CALC_TABLE_THEATER: '剧场',
    CALC_TABLE_TOTAL_BONUS: '总加成',
    CALC_TABLE_FINAL_STAT: '最终值',
    CALC_TOTAL_STAT: '总演技力：',
    CALC_BASE_SCORE: '基础分: ',
    CALC_SENSE_SCORE: 'Sense分: ',
    CALC_STARACT_SCORE: 'StarAct分: ',
    CALC_RESULT_STARACT: '{times}次 / {score}',
    CALC_TOTAL_SCORE: '总分：',
    CALC_STAR_ACT_REQUIREMENTS: 'StarAct需求：',

    LIVE_PHASE_START: '开场前',
    LIVE_PHASE_START_WITH_STARACT: '开场前 | StarAct发动',
    LIVE_PHASE_SENSE: 'Sense发动：{time}',
    LIVE_PHASE_SENSE_FAILED: 'Sense发动失败：{time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'Sense发动：{time} | StarAct发动',
    LIVE_LOG_LIFE: '生命值变化：{0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P槽变化：{0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P槽上限变化：{0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'Sense发动失败',
    LIVE_LOG_SENSE_SKIP: '跳过发动',
    LIVE_LOG_SENSE_SCORE: 'Sense加分：{0}',
    LIVE_LOG_STARACT_SCORE: 'StarAct发动，加分：{0}',
    LIVE_LOG_POSTER_SCORE: '海报加分({3})：{0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'Sense加成：{0}%，持续{1}秒',
    LIVE_LOG_STARACT_UP: 'StarAct加成：{0}%，持续{1}秒',

    PARTY_DEFAULT_NAME: '队伍',
    PARTY_DELETE_CONFIRM: '确定删除队伍吗？',
    PARTY_DELETE_LAST: '最后一个队伍不能删除',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: '未支持的效果：{type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: '未支持的效果触发：{trigger} @ {range} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: '按当前得分加分的效果无法精确计算分数',
    UNDEFINED_STRING: '缺失的文本：{0}',
  }

  static get(key, replaces = {}) {
    return (ConstText[ConstText.language][key] || ConstText.get('UNDEFINED_STRING', [key]))
      .replace(/{([^{}}]+)}/g, (ori, name) => (replaces[name]!==undefined ? replaces[name] : ori))
  }

  static fillText() {
    document.querySelectorAll('[data-text-key]').forEach(i => {
      i.textContent = ConstText.get(i.dataset.textKey)
    })
    document.querySelectorAll('[data-text-value]').forEach(i => {
      i.value = ConstText.get(i.dataset.textValue)
    })
  }
}
ConstText.init()

class RootLogic {
  appState = {
    characters: [],
    characterStarRank: new CharacterStarRankData(),
    posters: [],
    accessories: [],
    albumLevel: 0,
    albumExtra: [],
    theaterLevel: new TheaterLevelData(),
    partyManager: new PartyManager(),
    version: 4,
  }
  nonPersistentState = {
    characterOptions: {},
    posterOptions: {},
  }

  async init() {
    console.log('init')

    await GameDb.load()
    this.loaded = true;

    // 追加常驻时间轴
    GameDb.SenseNotation[0] = {
      Id: 0,
      Details: [[10,1],[20,2],[30,3],[40,4],[50,5],[60,3],[70,2],[80,1]].map(i => ({
        Position: i[1],
        TimingSecond: i[0],
      })),
      Buffs: [],
    }

    document.getElementById('loading').remove()
    document.getElementById('app').appendChild(_('div', {}, [
      _('div', {className: 'margin-box'}),
      _('div', {}, [_('select', { event: { change: e => ConstText.setLanguage(e.target.value) }}, [
        _('option', { disabled: '', selected: '' }, [_('text', 'Language')]),
        _('option', { value: 'en' }, [_('text', 'English')]),
        _('option', { value: 'ja' }, [_('text', '日本語')]),
        _('option', { value: 'zh' }, [_('text', '中文')]),
      ])]),
      _('div', {}, [
        _('input', { type: 'button', 'data-text-value': 'IMPORT_DATA_LABEL', event: { click: e=>this.importState(e) }}),
        _('input', { type: 'button', 'data-text-value': 'EXPORT_DATA_LABEL', event: { click: e=>this.exportState(e) }}),
        _('a', { href: './YumesuteExporter.exe', download: 'YumesuteExporter.exe', 'data-text-key': 'EXPORTER_LABEL' }),
      ]),
      this.warningMessageBox = _('div', { id: 'warning_message_box'}),
      _('div', {className: 'margin-box'}),
      this.calcTypeSelectForm = _('form', { style: { display: 'flex' }, event: {change: _=>this.changeTab()}}, [
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'normal' }), _('span', {'data-text-key': 'SENSE_NOTATION_TAB_NORMAL'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'highscore' }), _('span', {'data-text-key': 'SENSE_NOTATION_TAB_HIGHSCORE'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'keiko' }), _('span', {'data-text-key': 'SENSE_NOTATION_TAB_KEIKO'})]),
      ]),
      this.normalCalcTabContent = _('div', {}, [
        this.senseNoteSelect = _('select', {event: {change: _=>this.renderSenseNote()}}),
        this.senseBox = _('div', { className: 'sense-render-box' }),
        this.highscoreCalcTabContent = _('div', {}, [
          _('text', 'スコアボーナス: '),
        ]),
        _('details', {}, [
          _('summary', {'data-text-key':'PARTY_LABEL'}),
          this.partyManagerContainer = _('div'),
          this.calcResult = _('div'),
        ]),
      ]),
      this.keikoCalcTabContent = _('div', {}, [
        _('div', {}, [
          this.keikoSelect = _('select', { event: { change: _=>this.keikoFillChara() }}),
          this.keikoBox = _('div', { style: { display: 'none' }}, [
            _('select', { event: { change: _=>this.keikoCalcResult() }}),
            _('select', { event: { change: _=>this.keikoCalcResult() }}),
            _('select', { event: { change: _=>this.keikoCalcResult() }}),
            _('select', { event: { change: _=>this.keikoCalcResult() }}),
            _('select', { event: { change: _=>this.keikoCalcResult() }}),
          ]),
          this.keikoResult = _('div'),
        ]),
      ]),

      _('div', {className: 'margin-box'}),

      _('div', {}, [
        _('span', {'data-text-key':'ALBUM_LEVEL_LABEL'}),
        this.albumLevelSelect = _('select', { event: { change: e=>this.setAlbumLevel(e) } }, [_('option', { value: 0 }, [_('text', '0')])]),
        this.albumExtraCountLabel = _('span', { style: { marginLeft: '0.5em' } }),
        _('text', ' / 25'),
      ]),
      this.photoEffectContainer = _('div'),
      _('div', {}, [
        this.addPhotoEffectSelect = _('select'),
        _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.addPhotoEffect() }}),
      ]),

      _('div', {className: 'margin-box'}),

      _('div', {}, [
        _('div', {'data-text-key':'THEATER_LEVEL_LABEL'}),
        this.theaterLevelForm = _('form', { event: { change: e=>this.setTheaterLevel(e) }}, [
          _('div', {}, [
            _('select', { name: 'Sirius' }, ([0,1,2,3,4,5]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'SIRIUS' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Eden' }, ([0,1,2,3,4,5]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'EDEN' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Gingaza' }, ([0,1,2,3,4,5]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'GINGAZA' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Denki' }, ([0,1,2,3,4,5]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'DENKI' }),
          ]),
        ])
      ]),

      _('div', {className: 'margin-box'}),

      this.tabSelectForm = _('form', { style: { display: 'flex', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', padding: '10px 0', zIndex: 5 }, event: {change: _=>this.changeTab()}}, [
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'character' }), _('span', {'data-text-key': 'TAB_CHARA'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'poster' }), _('span', {'data-text-key': 'TAB_POSTER'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'accessory' }), _('span', {'data-text-key': 'TAB_ACCESSORY'})]),
      ]),

      this.characterTabContent = _('div', {}, [
        _('div', {}, [
          this.charaSortSelect = _('select', { event: { change: _=>this.setCharaSort() }}, [
            _('option', { value: '' }, [_('text', 'Keep')]),
            _('option', { value: 'Id' }, [_('text', 'ID')]),
            _('option', { value: 'CharacterBaseMasterId' }, [_('text', 'Chara')]),
          ]),
          _('text', ''),
          _('label', {}, [
            this.charaSortDescInput = _('input', { type: 'checkbox', event: { change: _=>this.setCharaSort() }}),
            _('text', '降順')
          ])
        ]),
        this.characterIconList = _('div', {}, [
          this.characterMultiUpdateForm = _('form', { className: 'list-multi-update-container' }, [
            _('span'),
            _('br'),
            _('text', 'Level: '),
            _('select', { name: 'level' }),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdateChara('level') }}),
            _('span', {'data-text-key': 'CARD_LABEL_STORY'}),
            _('select', { style: {marginRight: '1em'}, name: 'episodeReadState' }, [
              _('option', { value: 0, 'data-text-key': 'CARD_SELECTION_EPISODE_READ_0' }),
              _('option', { value: 1, 'data-text-key': 'CARD_SELECTION_EPISODE_READ_1' }),
              _('option', { value: 2, 'data-text-key': 'CARD_SELECTION_EPISODE_READ_2' }),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdateChara('episodeReadState') }}),
            _('br'),
            _('span', {'data-text-key': 'CARD_LABEL_SENSE'}),
            _('select', { name: 'sense' }, [
              _('option', { value: 1 }, [_('text', 1)]),
              _('option', { value: 2 }, [_('text', 2)]),
              _('option', { value: 3 }, [_('text', 3)]),
              _('option', { value: 4 }, [_('text', 4)]),
              _('option', { value: 5 }, [_('text', 5)]),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdateChara('sense') }}),
            _('span', {'data-text-key': 'CARD_LABEL_BLOOM'}),
            _('select', { name: 'bloom' }, [
              _('option', { value: 0 }, [_('text', 0)]),
              _('option', { value: 1 }, [_('text', 1)]),
              _('option', { value: 2 }, [_('text', 2)]),
              _('option', { value: 3 }, [_('text', 3)]),
              _('option', { value: 4 }, [_('text', 4)]),
              _('option', { value: 5 }, [_('text', 5)]),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdateChara('bloom') }}),
            _('br'),
            _('input', { type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdateChara('delete') }}),
          ]),
        ]),
        this.characterForm = _('form', {}, [
          this.characterContainer = _('table', { className: 'characters' }),
        ]),
        _('div', {}, [
          this.addCharacterSelect = _('select'),
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.addCharacter() }}),
        ]),
      ]),

      this.posterTabContent = _('div', {}, [
        this.posterIconList = _('div', {}, [
          this.posterMultiUpdateForm = _('form', { className: 'list-multi-update-container' }, [
            _('span'),
            _('br'),
            _('text', 'Level: '),
            _('select', { name: 'level' }, [
              _('option', { value: 4 }, [_('text', 'MAX-4')]),
              _('option', { value: 3 }, [_('text', 'MAX-3')]),
              _('option', { value: 2 }, [_('text', 'MAX-2')]),
              _('option', { value: 1 }, [_('text', 'MAX-1')]),
              _('option', { value: 0 }, [_('text', 'MAX')]),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdatePoster('level') }}),
            _('span', {'data-text-key': 'POSTER_LABEL_RELEASE'}),
            _('select', { name: 'release' }, [
              _('option', { value: 0 }, [_('text', 0)]),
              _('option', { value: 1 }, [_('text', 1)]),
              _('option', { value: 2 }, [_('text', 2)]),
              _('option', { value: 3 }, [_('text', 3)]),
              _('option', { value: 4 }, [_('text', 4)]),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdatePoster('release') }}),
            _('br'),
            _('input', { type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdatePoster('delete') }}),
          ]),
        ]),
        this.posterContainer = _('table', { className: 'posters' }),
        _('div', {}, [
          this.addPosterSelect = _('select'),
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.addPoster() }}),
        ]),
      ]),

      this.accessoryTabContent = _('div', {}, [
        this.accessoryIconList = _('div', {}, [
          this.accessoryMultiUpdateForm = _('form', { className: 'list-multi-update-container' }, [
            _('span'),
            _('br'),
            _('text', 'Level: '),
            _('select', { name: 'level' }, [
              _('option', { value: 1 }, [_('text', '1')]),
              _('option', { value: 2 }, [_('text', '2')]),
              _('option', { value: 3 }, [_('text', '3')]),
              _('option', { value: 4 }, [_('text', '4')]),
              _('option', { value: 5 }, [_('text', '5')]),
              _('option', { value: 6 }, [_('text', '6')]),
              _('option', { value: 7 }, [_('text', '7')]),
              _('option', { value: 8 }, [_('text', '8')]),
              _('option', { value: 9 }, [_('text', '9')]),
              _('option', { value: 10 }, [_('text', '10')]),
            ]),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UPDATE_SELECTION', event: { click: e=>this.multiUpdateAccessory('level') }}),
            _('input', { type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdateAccessory('delete') }}),
          ]),
        ]),
        this.accessoryContainer = _('table', { className: 'accessories' }),
        _('div', {}, [
          this.addAccessorySelect = _('select'),
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.addAccessory() }}),
        ]),
      ]),
    ]))

    Object.values(GameDb.SenseNotation).forEach(i => {
      this.senseNoteSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Id)]))
    })
    this.keikoSelect.appendChild(_('option', { value: '', 'data-text-key': 'NOT_SELECTED' }, [_('text', '未選択')]))
    Object.values(GameDb.CharacterBase).forEach(i => {
      this.keikoSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Name)]))
    })
    Object.values(GameDb.AlbumEffect).forEach(i => {
      this.albumLevelSelect.appendChild(_('option', { value: i.Level }, [_('text', i.Level)]))
    })
    {
      // characters
      const addableCharactersByDate = Object.values(GameDb.Character)
      .reduce((acc, i) => {
        acc[i.DisplayStartAt] = acc[i.DisplayStartAt] || [i.DisplayStartAt, []]
        acc[i.DisplayStartAt][1].push(i.Id)
        return acc
      }, {})
      const addableCharacters = Object.values(addableCharactersByDate)
      addableCharacters.sort((a,b) => (a[0] > b[0] ? 1 : -1))
      addableCharacters.forEach((group) => {
        const groupEle = this.addCharacterSelect.appendChild(_('optgroup', { label: group[0] }))
        group[1].forEach(i => {
          this.nonPersistentState.characterOptions[i] = groupEle.appendChild(_('option', { value: i }, [_('text', (new CharacterData(i, null)).fullCardName)]))
        })
      })
    }
    {
      // posters
      const addablePostersByDate = Object.values(GameDb.Poster)
      .reduce((acc, i) => {
        acc[i.DisplayStartAt] = acc[i.DisplayStartAt] || [i.DisplayStartAt, []]
        acc[i.DisplayStartAt][1].push(i.Id)
        return acc
      }, {})
      const addablePosters = Object.values(addablePostersByDate)
      addablePosters.sort((a,b) => (a[0] > b[0] ? 1 : -1))
      addablePosters.forEach((group) => {
        const groupEle = this.addPosterSelect.appendChild(_('optgroup', { label: group[0] }))
        group[1].forEach(i => {
          this.nonPersistentState.posterOptions[i] = groupEle.appendChild(_('option', { value: i }, [_('text', (new PosterData(i, null)).fullPosterName)]))
        })
      })
    }
    Object.values(GameDb.Accessory).forEach(i => {
      this.addAccessorySelect.appendChild(_('option', { value: i.Id }, [_('text', (new AccessoryData(i.Id, null)).fullAccessoryName)]))
    })
    for (let lvl in GameDb.CharacterLevel) {
      this.characterMultiUpdateForm['level'].appendChild(_('option', { value: lvl }, [_('text', lvl)]))
    }

    if (localStorage.getItem('appState') !== null) {
      this.loadState(localStorage.getItem('appState'))
    } else {
      this.appState.partyManager.init()
    }

    this.albumLevelSelect.value = this.appState.albumLevel
    Object.values(GameDb.PhotoEffect).forEach(i => {
      const pe = new PhotoEffectData(i.Id, 1, null)
      this.addPhotoEffectSelect.appendChild(_('option', { value: i.Id }, [_('text', pe.selectName)]))
    })

    this.renderSenseNote(true)
    this.update({
      chara: true,
      poster: true,
      accessory: true,
      album: true,
      theaterLevel: true,
      selection: true
    })

    this.calcTypeSelectForm.tab.value = 'normal'
    this.tabSelectForm.tab.value = 'character'
    this.changeTab()

    window.addEventListener('blur', _=>this.saveState())
    window.addEventListener('unload', _=>this.saveState())

    ConstText.fillText()
  }
  saveState() {
    if (window.DEBUG_NO_SAVE) return;
    if (this.errorOccured) return;
    console.log('save')
    localStorage.setItem('appState', JSON.stringify(this.appState))
  }
  loadState(dataStr) {
    console.log('load')
    const data = JSON.parse(dataStr)
    this.addMissingFields(data)
    removeAllChilds(this.characterContainer)
    this.appState.characters = data.characters.map((i) => CharacterData.fromJSON(i, this.characterContainer))
    this.appState.characterStarRank = CharacterStarRankData.fromJSON(data.characterStarRank)
    removeAllChilds(this.posterContainer)
    this.appState.posters = data.posters.map(i => PosterData.fromJSON(i, this.posterContainer))
    removeAllChilds(this.accessoryContainer)
    this.appState.accessories = data.accessories.map(i => AccessoryData.fromJSON(i, this.accessoryContainer))
    this.appState.albumLevel = Math.floor(data.albumLevel / 5) * 5
    removeAllChilds(this.photoEffectContainer)
    this.appState.albumExtra = data.albumExtra.map(i => PhotoEffectData.fromJSON(i, this.photoEffectContainer))
    this.appState.theaterLevel = TheaterLevelData.fromJSON(data.theaterLevel)
    this.appState.partyManager = PartyManager.fromJSON(data.partyManager)
    this.appState.partyManager.init()
  }
  addMissingFields(data) {
    // ver 2：添加剧团等级加成
    if (data.version < 2) {
      data.version = 2
      data.theaterLevel = (new TheaterLevelData).toJSON()
    }
    // ver 3：添加编队
    if (data.version < 3) {
      data.version = 3
      data.partyManager = (new PartyManager).toJSON()
    }
    // ver 4：效果照片支持选择开启关闭
    if (data.version < 4) {
      data.version = 4
      data.albumExtra.forEach(i => i[2] = true)
    }
  }
  importState() {
    const fInput = _('input', { type: 'file', accept: '.json', event: { change: e => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = e => {
        this.loadState(e.target.result)

        this.albumLevelSelect.value = this.appState.albumLevel
        this.update({
          chara: true,
          poster: true,
          accessory: true,
          album: true,
          theaterLevel: true,
        })
      }
      reader.readAsText(file)
    }}})
    fInput.click()
  }
  exportState() {
    const data = JSON.stringify(this.appState)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = (new Date()).toISOString().replace(/:/g, '-').replace(/\..+/, '')
    a.download = `yumesute-calc-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  warningMessages = []
  addWarningMessage(msg) {
    this.warningMessages.push(msg)
  }
  printWarningMessages() {
    removeAllChilds(this.warningMessageBox)
    this.warningMessages.forEach(i => {
      this.warningMessageBox.appendChild(_('div', {}, [_('text', i)]))
    })
    this.warningMessages = []
  }

  changeTab() {
    const calcType = this.calcTypeSelectForm.tab.value
    this.normalCalcTabContent.style.display = calcType !== 'keiko' ? '' : 'none'
    this.highscoreCalcTabContent.style.display = calcType === 'highscore' ? '' : 'none'
    this.keikoCalcTabContent.style.display = calcType === 'keiko' ? '' : 'none'

    const tab = this.tabSelectForm.tab.value
    this.characterTabContent.style.display = tab === 'character' ? '' : 'none'
    this.posterTabContent.style.display = tab === 'poster' ? '' : 'none'
    this.accessoryTabContent.style.display = tab === 'accessory' ? '' : 'none'
  }

  addCharacter() {
    const charaId = this.addCharacterSelect.value | 0;
    this.appState.characters.push(new CharacterData(charaId, this.characterContainer))
    this.update({ chara: true })
  }
  removeCharacter(chara) {
    this.appState.characters.splice(this.appState.characters.indexOf(chara), 1)
    this.update({ chara: true })
  }
  setCharaSort() {
    const sortKey = this.charaSortSelect.value;
    const desc = this.charaSortDescInput.checked;
    if (!sortKey) {
      return
    }
    this.appState.characters.sort((a,b) => {
      if (a.data[sortKey] === b.data[sortKey]) {
        return 0
      }
      if (desc) {
        return b.data[sortKey] - a.data[sortKey]
      }
      return a.data[sortKey] - b.data[sortKey]
    })
    this.appState.characters.forEach(i => i.appendNode(this.characterContainer))
  }

  setAlbumLevel() {
    this.appState.albumLevel = this.albumLevelSelect.value | 0;
    this.update({ album: true })
  }
  addPhotoEffect() {
    const photoEffectId = this.addPhotoEffectSelect.value | 0;
    this.appState.albumExtra.push(new PhotoEffectData(photoEffectId, 1, this.photoEffectContainer))
    this.update({ album: true })
  }
  removePhotoEffect(pe) {
    this.appState.albumExtra.splice(this.appState.albumExtra.indexOf(pe), 1)
    this.update({ album: true })
  }

  addPoster() {
    const posterId = this.addPosterSelect.value | 0;
    this.appState.posters.push(new PosterData(posterId, this.posterContainer))
    this.update({ poster: true })
  }
  removePoster(poster) {
    this.appState.posters.splice(this.appState.posters.indexOf(poster), 1)
    this.update({ poster: true })
  }

  addAccessory() {
    const accessoryId = this.addAccessorySelect.value | 0;
    this.appState.accessories.push(new AccessoryData(accessoryId, this.accessoryContainer))
    this.update({ accessory: true })
  }
  removeAccessory(accessory) {
    this.appState.accessories.splice(this.appState.accessories.indexOf(accessory), 1)
    this.update({ accessory: true })
  }

  setTheaterLevel(e) {
    this.appState.theaterLevel.setLevel(e.target.name, e.target.value)
    this.update({ theaterLevel: true })
  }

  batchUpdating = false
  update(parts) {
    try {

    if (this.batchUpdating) return;

    this.errorOccured = false
    const displaySortValue = (tbl, key, a, b) => (
      tbl[a][key] === tbl[b][key] ? 0 : tbl[a][key] > tbl[b][key] ? 1 : -1
    )

    if (parts.chara) {
      Object.values(this.nonPersistentState.characterOptions).forEach(i => i.removeAttribute('disabled'))
      this.appState.characters.forEach(i => {
        i.update()
        if (this.nonPersistentState.characterOptions[i.Id]) {
          this.nonPersistentState.characterOptions[i.Id].setAttribute('disabled', '')
        }
      })

      this.keikoFillChara()
    }

    if (parts.poster) {
      Object.values(this.nonPersistentState.posterOptions).forEach(i => i.removeAttribute('disabled'))
      this.appState.posters.forEach(i => {
        i.update()
        if (this.nonPersistentState.posterOptions[i.id]) {
          this.nonPersistentState.posterOptions[i.id].setAttribute('disabled', '')
        }
      })
    }

    if (parts.accessory) {
      this.appState.accessories.forEach(i => i.update())
    }
    if (parts.album) {
      this.appState.albumExtra.forEach(i => i.update())
      const extraCount = this.appState.albumExtra.filter(i => i.enabled).length
      this.albumExtraCountLabel.textContent = extraCount
      this.albumExtraCountLabel.style.color = extraCount > 25 ? 'red' : ''
    }
    if (parts.theaterLevel) {
      (['Sirius', 'Eden', 'Gingaza', 'Denki']).forEach(i => {
        this.theaterLevelForm[i].value = this.appState.theaterLevel.getLevel(i)
      })
    }
    if (parts.chara || parts.poster || parts.album || parts.accessory || parts.party) {
      this.appState.partyManager.update()
    }

    if ('keiko' === this.calcTypeSelectForm.tab.value) {
      if (parts.chara || parts.album || parts.theaterLevel) {
        this.keikoCalcResult()
      }
    } else {
      if (parts.chara || parts.poster || parts.album || parts.theaterLevel || parts.party) {
        const party = this.appState.partyManager.currentParty
        const extra = {
          albumLevel: this.appState.albumLevel,
          albumExtra: this.appState.albumExtra,
          leader: party.leader,
          type: ScoreCalculationType.Normal,
        }

        if ('highscore' === this.calcTypeSelectForm.tab.value) {
          extra.type = ScoreCalculationType.Highscore
          // extra.highscoreBonus = ...
        }

        const calc = new ScoreCalculator(party.characters, party.posters, party.accessories, extra)
        calc.calc(this.calcResult)
      }
    }

    if (parts.selection) {
      const selectedCharacterCount = this.appState.characters.filter(i => i.iconSelectionInput.checked).length
      this.characterMultiUpdateForm.classList[selectedCharacterCount > 0 ? 'remove' : 'add']('empty')
      this.characterMultiUpdateForm.children[0].textContent = ConstText.get('SELECTION_COUNT_LABEL', [selectedCharacterCount])
    }

    this.printWarningMessages()
    ConstText.fillText()

    } catch (e) {
      window.error_message.textContent = [e.toString(), e.stack].join('\n')
      window.scrollTo(0, 0)
      this.errorOccured = true
      throw e
    }
  }

  multiUpdateChara(key) {
    this.batchUpdating = true
    switch (key) {
      case 'delete': {
        if (!confirm(ConstText.get('DELETE_SELECTION_CONFIRM'))) break
        this.appState.characters.slice().forEach(i => i.iconSelectionInput.checked && i.remove())
        break
      }
      case 'level': {
        this.appState.characters.forEach(i => i.iconSelectionInput.checked && (i.lvl = this.characterMultiUpdateForm[key].value | 0))
        break
      }
      case 'episodeReadState': {
        this.appState.characters.forEach(i => i.iconSelectionInput.checked && (i.episodeReadState = this.characterMultiUpdateForm[key].value | 0))
        break
      }
      case 'sense': {
        this.appState.characters.forEach(i => i.iconSelectionInput.checked && (i.senselv = this.characterMultiUpdateForm[key].value | 0))
        break
      }
      case 'bloom': {
        this.appState.characters.forEach(i => i.iconSelectionInput.checked && (i.bloom = this.characterMultiUpdateForm[key].value | 0))
        break
      }
    }
    this.batchUpdating = false
    this.update({ chara: true })
  }
  multiUpdatePoster(key) {
    this.batchUpdating = true
    switch (key) {
      case 'delete': {
        if (!confirm(ConstText.get('DELETE_SELECTION_CONFIRM'))) break
        this.appState.posters.slice().forEach(i => i.iconSelectionInput.checked && i.remove())
        break
      }
      case 'level': {
        this.appState.posters.forEach(i => i.iconSelectionInput.checked && (i.level = i.maxLevel - (this.posterMultiUpdateForm[key].value | 0)))
        break
      }
      case 'release': {
        this.appState.posters.forEach(i => i.iconSelectionInput.checked && (i.release = this.posterMultiUpdateForm[key].value | 0))
        break
      }
    }
    this.batchUpdating = false
    this.update({ poster: true })
  }
  multiUpdateAccessory(key) {
    this.batchUpdating = true
    switch (key) {
      case 'delete': {
        if (!confirm(ConstText.get('DELETE_SELECTION_CONFIRM'))) break
        this.appState.accessories.slice().forEach(i => i.iconSelectionInput.checked && i.remove())
        break
      }
      case 'level': {
        this.appState.accessories.forEach(i => i.iconSelectionInput.checked && (i.level = this.accessoryMultiUpdateForm[key].value | 0))
        break
      }
    }
    this.batchUpdating = false
    this.update({ accessory: true })
  }

  renderSenseNote(skipUpdate = false) {
    const id = this.senseNoteSelect.value | 0;
    const data = GameDb.SenseNotation[id];
    removeAllChilds(this.senseBox)
    for (let i = 0; i < 5; i++) {
      this.senseBox.appendChild(_('div', { className: 'sense-lane' }, [_('div', { className: 'sense-lane-ct' }), _('div', { className: 'sense-lane-box' })]))
    }
    const totalDuration = data.Details.reduce((acc, cur) => Math.max(acc, cur.TimingSecond), 0)
    data.Details.forEach(i => {
      const lane = this.senseBox.children[i.Position - 1].children[1]
      lane.appendChild(_('div', { className: 'sense-node', style: {left: `calc(${i.TimingSecond / totalDuration * 100}% - 40px)`, fontSize: i.TimingSecond > 99 ? '14px' : '' } }, [_('text', i.TimingSecond)]))
    })
    data.Details.reduce((acc, cur) => (acc[cur.Position-1].push(cur),acc), [[],[],[],[],[]])
      .map(lane => lane.sort((a,b) => a.TimingSecond - b.TimingSecond)
        .reduce((acc, cur) => ([Math.min(acc[0], cur.TimingSecond - acc[1]), cur.TimingSecond]), [Infinity, -Infinity])[0])
      .forEach((i, idx) => this.senseBox.children[idx].children[0].textContent = i === Infinity ? 'N/A' : i)

    if (!skipUpdate) {
      this.update({ party: true })
    }
  }

  keikoFillChara() {
    const keikoCharaId = this.keikoSelect.value | 0;
    if (!keikoCharaId) {
      this.keikoBox.style.display = 'none'
      return
    }
    this.keikoBox.style.display = ''
    for (let select of this.keikoBox.children) {
      removeAllChilds(select)
      select.appendChild(_('option', { value: '', 'data-text-key': 'NOT_SELECTED' }))
      for (let i=0; i<this.appState.characters.length; i++) {
        if (this.appState.characters[i].data.CharacterBaseMasterId !== keikoCharaId) continue;
        const chara = this.appState.characters[i]
        select.appendChild(_('option', { value: i }, [_('text', `${chara.fullCardName}@${chara.lvl} ${chara.bloom}`)]))
      }
    }

    for (let i=0; i<5; i++) {
      let idx = this.appState.characters.indexOf(this.keikoSelection[i])
      this.keikoBox.children[i].value = idx > -1 && this.keikoSelection[i].data.CharacterBaseMasterId == keikoCharaId ? idx : ''
    }
    ConstText.fillText()
  }
  keikoSelection = []
  keikoCalcResult() {
    this.keikoResult.textContent = ''
    const keikoCharaId = this.keikoSelect.value | 0;
    if (!keikoCharaId) return
    ([...this.keikoBox.querySelectorAll('option[disabled]')]).forEach(i => i.removeAttribute('disabled'))
    this.keikoSelection.splice(0, this.keikoSelection.length)
    for (let select of this.keikoBox.children) {
      if (select.selectedIndex <= 0) {
        this.keikoSelection.push(null)
        continue;
      }
      for (let otherSelect of this.keikoBox.children) {
        if (otherSelect === select) continue;
        otherSelect.options[select.selectedIndex].setAttribute('disabled', '')
      }
      this.keikoSelection.push(this.appState.characters[select.value])
    }

    const calc = new ScoreCalculator(this.keikoSelection, [], [], {
      albumLevel: this.appState.albumLevel,
      albumExtra: this.appState.albumExtra,
      starRankScoreBonus: this.appState.characterStarRank.get(keikoCharaId),
      type: ScoreCalculationType.Keiko,
    })
    calc.calc(this.keikoResult)
  }
}

window.root = new RootLogic()

window.addEventListener('load', () => root.init().catch(e => window.error_message.textContent = [e.toString(),e.stack].join('\n')))
