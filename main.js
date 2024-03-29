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
    for (let trigger of this.Triggers) {
      if (this.Range === 'All') {
        switch (trigger.Trigger) {
          case 'CompanyCount': { return calc.properties.companyCount == trigger.Value;}
          case 'AttributeCount': { return calc.properties.attributeCount == trigger.Value;}
          default: { console.log(`Trigger ${trigger.Trigger} for All`) }
        }
      }
      if (this.Range === 'Self') {
        switch (trigger.Trigger) {
          case 'CharacterBase': { return calc.members[index].data.CharacterBaseMasterId == trigger.Value;}
          default: { console.log(`Trigger ${trigger.Trigger} for Self`) }
        }
      }
      if (this.Range === 'None') {
        switch (trigger.Trigger) {
          default: { console.log(`Trigger ${trigger.Trigger} for None`) }
        }
      }
      return false;
    }
    return true
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
      default: {console.log(this.Type, index)}
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
    if (!effect.conditionSatified(calc, idx)) return
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`BaseScoreUp calc type: ${effect.CalculationType}`)
    calc.passiveEffects.baseScoreUp += effect.activeEffect.Value
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
        return '?'
      }
    }
  }
  resetRecastDown() {
    this.recastDown = []
  }
  get ct() {
    return this.CoolTime - this.recastDown.reduce((acc, cur) => acc + cur, 0)
  }
  get scoreUp() {
    return (this.AcquirableScorePercent + (this.level- 1) * this.ScoreUpPerLevel) / 100
  }
  get gaugeUp() {
    return this.AcquirableGauge
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
    return this.requirements.map((req, i) => req - this.requireDecrease[i])
  }
  clone() {
    const staract = new StarActData(this.id, this.level)
    staract.requireDecrease = this.requireDecrease.slice()
    return staract
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
        _('td', { colspan: 2 }, [_('input', { type: 'button', value: '削除', event: { click: _=>this.remove() }})]),
        _('td'),
      ]),
    ]))

    for (let lvl in GameDb.CharacterLevel) {
      this.levelSelect.appendChild(_('option', { value: lvl }, [_('text', lvl)]))
    }
    for (let i = 0; i < 51; i++) {
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

    this.cardImg.src = `https://redive.estertion.win/wds/card/${this.Id}_${this.awaken&&this.data.Rarity==='Rare4'?1:0}.webp@w200`

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
    this.senseDescNode.textContent = this.sense.desc
    this.senseDescNode.dataset.senseType = this.sense.getType()
    this.ctValNode.textContent = this.sense.ct

    this.staract.level = this.bloom
    this.staractDescNode.textContent = this.staract.desc
    this.staract.actualRequirements.forEach((req, i) => {
      this.staractRequirementsNode.children[i].textContent = req
      this.staractRequirementsNode.children[i].style.display = req > 0 ? '' : 'none'
    })
  }
  remove() {
    this.node.remove()
    root.removeCharacter(this)
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
      _('input', { type: 'button', value: '削除', event: { click: _=>this.remove() }}),
    ]), _('td', {}, [_('img', { src: this.imageUrl, style: { width: '200px' }})])]))

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
    this.level = Math.min(this.level, this.currentMaxLevel)
    root.update({ poster: true })
  }

  update() {
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
  }
  remove() {
    this.node.remove()
    root.removePoster(this)
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
    this.node.style.opacity = this.data.ReleaseLevelAt > this.level ? 0.5 : 1
  }

  get desc() {
    return BeautyText.convertGameTextToValidDom(this.data.Description)
    .replace(/\[:param(\d)(\d)\]/g, (_,i,j)=>Effect.get(this.data.Branches[i-1].BranchEffects[j-1].EffectMasterId, this.level + this.release).activeEffectValueStr)
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
    this.node = parent.appendChild(_('div', {}, [
      _('div', {}, [_('text', this.fullAccessoryName)]),
      _('div', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })]),
      this.effectBox = _('div'),
      this.randomEffectSelect = _('select', { event: { change: e=>this.setRandomEffect(e) } }),
      _('input', { type: 'button', value: '削除', event: { click: _=>this.remove() }}),
    ]))

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

  setRandomEffect(e) {
    this.randomEffect.node.remove()
    this.randomEffectId = e.target.value
    this.randomEffect = new AccessoryEffectData(this.randomEffectId, this.effectBox)
    root.update({ accessory: true })
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
    if (this.randomEffect) {
      this.randomEffect.level = this.level
      this.randomEffect.update()
    }
  }
  remove() {
    this.node.remove()
    root.removeAccessory(this)
  }

  static fromJSON(data, parent) {
    const accessory = new AccessoryData(data[0], parent)
    accessory.level = data[1]
    if (data[2]) {
      accessory.randomEffectSelect.value = data[2]
      accessory.setRandomEffect({ target: accessory.randomEffectSelect })
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
  constructor(id, level, parent) {
    this.id = id
    this.level = level
    this.data = GameDb.PhotoEffect[id]

    if (!parent) return
    this.node = parent.appendChild(_('div', {}, [
      this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } }),
      this.desc = _('span'),
      _('input', { type: 'button', value: '削除', event: { click: _=>this.remove() }}),
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
  }
  remove() {
    this.node.remove()
    root.removePhotoEffect(this)
  }
  setLevel(e) {
    this.level = e.target.value | 0;
    root.update({ album: true })
  }

  static fromJSON(data, parent) {
    return new PhotoEffectData(data[0], data[1], parent)
  }
  toJSON() {
    return [this.id, this.level]
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
  }
  calc(node) {
    removeAllChilds(node)

    const passiveEffects = this.passiveEffects
    Object.values(GameDb.AlbumEffect).forEach(i => {
      if (this.extra.albumLevel < i.Level) return
      const effect = Effect.get(i.EffectMasterId, 1)
      if (effect.FireTimingType !== 'Passive') return
      if (!effect.canTrigger(this, -1)) return
      passiveEffects.album.push({effect, source:-1})
    })
    this.extra.albumExtra.forEach(i => {
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

    // bloom effect
    this.members.filter(i => i !== null).forEach((chara, idx) => {
      chara.bloomBonusEffects.forEach(effect => effect.applyEffect(this, idx, StatBonusType.Album))
    })

    // theater effect
    const theaterEffects = root.appState.theaterLevel.getEffects()
    theaterEffects.forEach(effect => effect.applyEffect(this, -1, StatBonusType.Theater))

    let statExtra = 1
    if (this.extra.starRankScoreBonus) {
      statExtra = 1 + this.extra.starRankScoreBonus * 30 / 100
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

    ConstText.fillText()

    console.log(this)
  }
  createStatDetailsTable() {
    let rowNumber;
    return _('div', {}, this.members.map((chara, idx) => (rowNumber = 0, chara === null ? _('text', '') : _('details', {}, [
      _('summary', {}, [_('text', chara.fullCardName)]),
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
    this.finalTotal = this.final.reduce((s, i) => s+i.total, 0)
  }
}

class ConstText {
  static language = 'zh'

  static en = {}
  static ja = {}
  static zh = {
    SENSE_NOTATION_TAB_NORMAL: '通常（试音/排位）',
    SENSE_NOTATION_TAB_HIGHSCORE: '高分',
    SENSE_NOTATION_TAB_KEIKO: '稽古',

    ALBUM_LEVEL_LABEL: '相册等级：',

    THEATER_LEVEL_LABEL: '剧场等级：',
    SIRIUS: 'Sirius',
    EDEN: 'Eden',
    GINGAZA: '银河座',
    DENKI: '剧团电姬',

    ADD: '添加',
    DELETE: '删除',
    NOT_SELECTED: '未选择',

    TAB_CHARA: '角色',
    TAB_POSTER: '海报',
    TAB_ACCESSORY: '饰品',

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
  }

  static get(key) {
    return ConstText[ConstText.language][key]
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

class RootLogic {
  appState = {
    characters: [],
    characterStarRank: new CharacterStarRankData(),
    posters: [],
    accessories: [],
    albumLevel: 0,
    albumExtra: [],
    theaterLevel: new TheaterLevelData(),
    version: 2,
  }
  nonPersistentState = {
    characterOptions: {},
    posterOptions: {},
  }

  async init() {
    console.log('init')

    await GameDb.load()
    this.loaded = true;

    document.getElementById('loading').remove()
    document.getElementById('app').appendChild(_('div', {}, [
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
        this.calcResult = _('div'),
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

      _('div', {}, [_('span', {'data-text-key':'ALBUM_LEVEL_LABEL'}), this.albumLevelSelect = _('select', { event: { change: e=>this.setAlbumLevel(e) } }, [_('option', { value: 0 }, [_('text', '0')])])]),
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
            _('select', { name: 'Sirius' }, ([0,1,2,3,4]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'SIRIUS' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Eden' }, ([0,1,2,3,4]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'EDEN' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Gingaza' }, ([0,1,2,3,4]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'GINGAZA' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Denki' }, ([0,1,2,3,4]).map(i => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'DENKI' }),
          ]),
        ])
      ]),

      _('div', {className: 'margin-box'}),

      this.tabSelectForm = _('form', { style: { display: 'flex' }, event: {change: _=>this.changeTab()}}, [
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
        this.characterForm = _('form', {}, [
          this.characterContainer = _('table', { className: 'characters' }),
        ]),
        _('div', {}, [
          this.addCharacterSelect = _('select'),
          _('input', { type: 'button', value: '追加', event: { click: e=>this.addCharacter() }}),
        ]),
      ]),

      this.posterTabContent = _('div', {}, [
        this.posterContainer = _('table', { className: 'posters' }),
        _('div', {}, [
          this.addPosterSelect = _('select'),
          _('input', { type: 'button', value: '追加', event: { click: e=>this.addPoster() }}),
        ]),
      ]),

      this.accessoryTabContent = _('div', {}, [
        this.accessoryContainer = _('table', { className: 'accessories' }),
        _('div', {}, [
          this.addAccessorySelect = _('select'),
          _('input', { type: 'button', value: '追加', event: { click: e=>this.addAccessory() }}),
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

    this.loadState()

    this.albumLevelSelect.value = this.appState.albumLevel
    Object.values(GameDb.PhotoEffect).forEach(i => {
      const pe = new PhotoEffectData(i.Id, 1, null)
      this.addPhotoEffectSelect.appendChild(_('option', { value: i.Id }, [_('text', pe.selectName)]))
    })

    this.renderSenseNote()
    this.update({
      chara: true,
      poster: true,
      accessory: true,
      album: true,
    })

    this.calcTypeSelectForm.tab.value = 'normal'
    this.tabSelectForm.tab.value = 'character'
    this.changeTab()

    window.addEventListener('blur', _=>this.saveState())
    window.addEventListener('unload', _=>this.saveState())
    //window.addEventListener('focus', _=>this.loadState())

    ConstText.fillText()
  }
  saveState() {
    if (window.DEBUG_NO_SAVE) return;
    console.log('save')
    localStorage.setItem('appState', JSON.stringify(this.appState))
  }
  loadState() {
    console.log('load')
    if (localStorage.getItem('appState') !== null) {
      const data = JSON.parse(localStorage.getItem('appState'))
      this.addMissingFields(data)
      removeAllChilds(this.characterContainer)
      this.appState.characters = data.characters.map((i) => CharacterData.fromJSON(i, this.characterContainer))
      this.appState.characterStarRank = CharacterStarRankData.fromJSON(data.characterStarRank)
      removeAllChilds(this.posterContainer)
      this.appState.posters = data.posters.map(i => PosterData.fromJSON(i, this.posterContainer))
      removeAllChilds(this.accessoryContainer)
      this.appState.accessories = data.accessories.map(i => AccessoryData.fromJSON(i, this.accessoryContainer))
      this.appState.albumLevel = data.albumLevel
      removeAllChilds(this.photoEffectContainer)
      this.appState.albumExtra = data.albumExtra.map(i => PhotoEffectData.fromJSON(i, this.photoEffectContainer))
      this.appState.theaterLevel = TheaterLevelData.fromJSON(data.theaterLevel)
    }
    this.update({
      chara: true,
      poster: true,
      accessory: true,
      album: true,
      theaterLevel: true,
    })
  }
  addMissingFields(data) {
    if (data.version < 2) {
      data.version = 2
      data.theaterLevel = (new TheaterLevelData).toJSON()
    }
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
    this.appState.characters.forEach(i => this.characterContainer.appendChild(i.node))
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

  update(parts) {
    try {

    const displaySortValue = (tbl, key, a, b) => (
      tbl[a][key] === tbl[b][key] ? 0 : tbl[a][key] > tbl[b][key] ? 1 : -1
    )

    Object.values(this.nonPersistentState.characterOptions).forEach(i => i.removeAttribute('disabled'))
    if (parts.chara) {
      this.appState.characters.forEach(i => {
        i.update()
        if (this.nonPersistentState.characterOptions[i.Id]) {
          this.nonPersistentState.characterOptions[i.Id].setAttribute('disabled', '')
        }
      })
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
    }
    if (parts.theaterLevel) {
      (['Sirius', 'Eden', 'Gingaza', 'Denki']).forEach(i => {
        this.theaterLevelForm[i].value = this.appState.theaterLevel.getLevel(i)
      })
    }

    this.keikoFillChara()

    } catch (e) {
      window.error_message.textContent = [e.toString(), e.stack].join('\n')
      window.scrollTo(0, 0)
      throw e
    }
  }

  renderSenseNote() {
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
    //
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
      select.appendChild(_('option', { value: '', 'data-text-key': 'NOT_SELECTED' }, [_('text', '未選択')]))
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
    this.keikoCalcResult()
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
    })
    calc.calc(this.keikoResult)

    //this.keikoResult.textContent = calc.result.baseScore.join(' ')
  }
}

window.root = new RootLogic()

window.addEventListener('load', () => root.init().catch(e => window.error_message.textContent = [e.toString(),e.stack].join('\n')))
