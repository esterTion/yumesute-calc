import EpisodeReadState from "./EpisodeReadState"
import GameDb from "../db/GameDb"
import SenseData from "./SenseData"
import StarActData from "./StarActData"
import CharacterStat from "./CharacterStat"
import LeaderSenseData from "./LeaderSenseData"
import Effect from "../effect/Effect"

import _ from "../createElement";
import removeAllChilds from "../removeAllChilds"
import imgErrorHandler from "../logic/imgErrorHandler"

export default class CharacterData {
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
    this.leaderSense = new LeaderSenseData(this.data.LeaderSenseMasterId)

    if (!parent) return
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [
        _('td', {}, [_('span', {className: `card-attribute-${this.attributeName}`}), _('text', this.fullCardName), _('span', { className: 'obtain-type' }, [_('text', /フェス/.test(this.data.UnlockText) ? 'フェス' : /限定/.test(this.data.UnlockText) ? '限定' : /イベント/.test(this.data.UnlockText) ? 'イベント' : '')])]),
        _('td', {}, [_('text', 'Vo:')]),
        this.voValNode = _('td', {className: 'stat'}),
        _('td', { rowspan: 4 }, [this.cardImg = imgErrorHandler(_('img', { src: 'about:blank', loading: 'lazy' }))])
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
        _('td', { style: {maxWidth: '390px'} }, [
          this.senseStarNode = _('span', { className: 'sense-star gray-background pad-size' }),
          this.senseDescNode = _('span', { translate: 'yes', style: {marginLeft: '0.5em'} })
        ]),
        _('td', {}, [_('text', 'CT: ')]),
        this.ctValNode = _('td'),
        _('td'),
      ]),
      _('tr', {}, [
        this.staractDescNode = _('td', { translate: 'yes' }),
        this.staractRequirementsNode = _('td', {colspan: 3}, [
          _('span', { className: 'sense-star', 'data-sense-type': 'support'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'control'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'amplification'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'special'}),
        ]),
      ]),
      _('tr', {}, [
        this.leaderSenseDescNode = _('td', { translate: 'yes' }),
        this.categoryNode = _('td', { colspan: 3, style: {maxWidth: '290px'} }),
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
      _('span', { className: 'sense-star gray-background', 'data-sense-type': this.sense.getType() }, [_('text', `${this.sense.data.LightCount} `)]),
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
    for (let i = 0; i <= this.data.MaxTalentStage; i++) {
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
  get categories() {
    return this.data.Categories.filter(i => !i.IsAwaken || this.awaken).map(i => i.CategoryMasterId)
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

    if (this.iconSelectionInput.checked) {
      this.cardImg.src = `https://redive.estertion.win/wds/card/${this.cardIconId}.webp@w400`
    }
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
    try {
      this.senseDescNode.textContent = this.sense.desc
    } catch {
      // 缺条件时放弃替换
      this.senseDescNode.textContent = this.sense.data.Description
    }
    this.senseStarNode.textContent = this.sense.data.LightCount
    this.senseStarNode.dataset.senseType = this.sense.getType()
    this.ctValNode.textContent = this.sense.ct
    this.leaderSenseDescNode.textContent = this.leaderSense.desc

    removeAllChilds(this.categoryNode)
    this.data.Categories.forEach(i => {
      if (i.IsAwaken && !this.awaken) return
      this.categoryNode.appendChild(_('span', { className: 'character-category' }, [_('text', GameDb.Category[i.CategoryMasterId].Name)]))
    })

    this.staract.level = this.bloom
    try {
      this.staractDescNode.innerHTML = this.staract.desc
    } catch {
      // 缺条件时放弃替换
      this.staractDescNode.textContent = this.staract.data.Description
    }
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
      this.cardImg.src = `https://redive.estertion.win/wds/card/${this.cardIconId}.webp@w400`
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
  updateToMax() {
    const maxLevel = Object.values(GameDb.CharacterLevel).reverse().find(i => (new Date(`${i.StartDate.replace(/-/g, '/')} +0900`)).getTime() < Date.now()).Level
    this.lvl = maxLevel
    this.awaken = true
    this.episodeReadState = EpisodeReadState.Two
    this.senselv = 5
    this.bloom = 5
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

