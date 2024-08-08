import GameDb from '../db/GameDb'
import { AttributeEnum, SenseTypeEnum } from '../db/Enum'
import ConstText from '../db/ConstText'

import VocalUpEffect from './types/VocalUp'
import ExpressionUpEffect from './types/ExpressionUp'
import ConcentrationUpEffect from './types/ConcentrationUp'
import PerformanceUpEffect from './types/PerformanceUp'
import BaseScoreUpEffect from './types/BaseScoreUp'
import SenseRecastDown from './types/SenseRecastDown'
import DecreaseRequireSupportLight from './types/DecreaseRequireSupportLight'
import DecreaseRequireControlLight from './types/DecreaseRequireControlLight'
import DecreaseRequireAmplificationLight from './types/DecreaseRequireAmplificationLight'
import DecreaseRequireSpecialLight from './types/DecreaseRequireSpecialLight'
import LifeHealing from './types/LifeHealing'
import PrincipalGaugeUp from './types/PrincipalGaugeUp'
import PrincipalGaugeGain from './types/PrincipalGaugeGain'
import PrincipalGaugeLimitUp from './types/PrincipalGaugeLimitUp'
import FinalPerformanceUpCancelSense from './types/FinalPerformanceUpCancelSense'
import VocalLimitUp from './types/VocalLimitUp'
import ExpressionLimitUp from './types/ExpressionLimitUp'
import ConcentrationLimitUp from './types/ConcentrationLimitUp'
import PerformanceLimitUp from './types/PerformanceLimitUp'
import LifeGuard from './types/LifeGuard'
import SenseScoreUp from './types/SenseScoreUp'
import ScoreUpByHighLife from './types/ScoreUpByHighLife'
import ScoreUpByLowLife from './types/ScoreUpByLowLife'
import SenseCoolTimeRecastDown from './types/SenseCoolTimeRecastDown'
import AddSenseLightSelf from './types/AddSenseLightSelf'
import AddSenseLightVariable from './types/AddSenseLightVariable'
import AddSenseLightSupport from './types/AddSenseLightSupport'
import AddSenseLightControl from './types/AddSenseLightControl'
import AddSenseLightAmplification from './types/AddSenseLightAmplification'
import AddSenseLightSpecial from './types/AddSenseLightSpecial'
import ScoreGainOnScore from './types/ScoreGainOnScore'
import ScoreGainOnVocal from './types/ScoreGainOnVocal'
import ScoreGainOnExpression from './types/ScoreGainOnExpression'
import ScoreGainOnConcentration from './types/ScoreGainOnConcentration'
import ScoreGainOnPerformance from './types/ScoreGainOnPerformance'
import StarActScoreUp from './types/StarActScoreUp'
import ChangeWrongLightToSpLight from './types/ChangeWrongLightToSpLight'

export default class Effect {
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
        case "CharacterBaseGroup": { result = result && calc.members[index] && GameDb.EffectTriggerCharacterBaseGroup[trigger.Value].CharacterBaseMasterIds.indexOf(calc.members[index].data.CharacterBaseMasterId) !== -1; break }
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
      case 'PrincipalGaugeGain': { return PrincipalGaugeGain.applyEffect(this, calc, [index], type) }
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
      case "ChangeWrongLightToSpLight": { return ChangeWrongLightToSpLight.applyEffect(this, calc, [index], type) }

      case "ScoreGainOnScore": { return ScoreGainOnScore.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnVocal": { return ScoreGainOnVocal.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnExpression": { return ScoreGainOnExpression.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnConcentration": { return ScoreGainOnConcentration.applyEffect(this, calc, [index], type) }
      case "ScoreGainOnPerformance": { return ScoreGainOnPerformance.applyEffect(this, calc, [index], type) }

      case "StarActScoreUp": { return StarActScoreUp.applyEffect(this, calc, targets, type) }

      // case "BaseVocalUp":
      // case "BaseExpressionUp":
      // case "BaseConcentrationUp":

      // case "ScoreUpByBuff":
      // case "BuffTimeExtend":

      // case "LifeFixedValue":
      // case "LightGuard":

      // case "ScoreGainOnPerformance":
      default: { root.addWarningMessage(ConstText.get('LOG_WARNING_EFFECT_NOT_IMPLEMENTED', {type: this.Type, id: this.Id})) }
    }
  }

}

