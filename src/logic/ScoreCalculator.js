import GameDb from "../db/GameDb"
import { AttributeEnum } from "../db/Enum"
import StatCalculator from "./StatCalculator"
import ConstText from "../db/ConstText"
import StatBonus from "./StatBonus"
import StatBonusType from "./StatBonusType"
import ScoreCalculationType from "./ScoreCalculationType"
import LiveSimulator from "./LiveSimulator"
import Effect from "../effect/Effect"

import _ from "../createElement"
import removeAllChilds from "../removeAllChilds"

export default class ScoreCalculator {
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

    this.members.forEach(i => i && (i.sense.resetRecastDown(), i.staract.resetRequireDecrease()))

    // highscore buff
    root.appState.highScoreBuffManager.currentActiveEffects().forEach(effect => {
      // 全部都是被动和开局效果
      const range = effect.Range === 'All' ? 1 : 5
      for (let idx = 0; idx < range; idx++) {
        if (!effect.canTrigger(this, idx)) return
        effect.applyEffect(this, idx, StatBonusType.Other)
      }
    })

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
    this.liveSim.starActRequirements = leader.staract.actualRequirements

    // leader sense
    this.memberMatchingCategories = this.members.map(_ => ({}))
    leader.leaderSense.Details.forEach(detail => {
      const effect = Effect.get(detail.EffectMasterId, 1)
      this.members.forEach((chara, idx) => {
        const charaCategories = chara.categories
        const matchedCategories = []
        for (let i = 0; i < detail.Conditions.length; i++) {
          for (let j = 1; j < 6; j++) {
            const testCategory = detail.Conditions[i][`CategoryMasterId${j}`]
            if (testCategory === undefined) break
            if (charaCategories.indexOf(testCategory) === -1) {
              return
            }
            matchedCategories.push(testCategory)
          }
        }

        matchedCategories.forEach(category => this.memberMatchingCategories[idx][category] = true)
        effect.applyEffect(this, idx, StatBonusType.Actor)
      })
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
          if (notationBuff.TargetValue === undefined) {
            isBuffTarget = true
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
      starActCount: 0,
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
      _('div', { translate: 'yes' }, [_('text', leader.leaderSense.desc)]),
      _('div', { style: {clear: 'both'}}),
    ]))

    this.liveSim.runSimulation(node)

    let finalSenseScore = this.result.senseScore.reduce((acc, cur) => acc + cur, 0)
    let finalStarActScore = this.result.starActScore.reduce((acc, cur) => acc + cur, 0)
    senseScoreNode.appendChild(_('text', finalSenseScore))
    starActScoreNode.appendChild(_('text', ConstText.get('CALC_RESULT_STARACT').replace('{times}', this.result.starActCount).replace('{score}', finalStarActScore)))
    totalScoreNode.appendChild(_('text', this.result.baseScore.map(i => i + finalSenseScore + finalStarActScore).join(' / ')))

    ConstText.fillText()
  }
  createStatDetailsTable() {
    let rowNumber;
    return _('div', {}, this.members.map((chara, idx) => (rowNumber = 0, chara === null ? _('text', '') : _('details', {}, [
      _('summary', {}, [
        _('span', {className: `card-attribute-${chara.attributeName}`}),
        _('text', `${chara.fullCardName} CT: ${chara.sense.ct}`),
        _('span', {}, Object.keys(this.memberMatchingCategories[idx]).map(category => _('span', {className: 'character-category'}, [_('text', GameDb.Category[category].Name)]))),
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
        _('tbody', {}, ['CALC_TABLE_ALBUM', 'CALC_TABLE_POSTER', 'CALC_TABLE_ACCESSORY', 'CALC_TABLE_ACTOR', 'CALC_TABLE_OTHER'].map((name, j) => _('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
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
