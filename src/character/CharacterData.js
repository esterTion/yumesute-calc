import EpisodeReadState from "./EpisodeReadState"
import GameDb from "../db/GameDb"
import SenseData from "./SenseData"
import StarActData from "./StarActData"
import CharacterStat from "./CharacterStat"
import LeaderSenseData from "./LeaderSenseData"
import Effect from "../effect/Effect"

import _, { CREATE_FRAGMENT } from "../createElement";
import removeAllChilds from "../removeAllChilds"
import imgErrorHandler from "../logic/imgErrorHandler"

export default class CharacterData {
  Id;
  lvl;
  awaken;
  episodeReadState;
  senselv;
  bloom;

  #senseStarNode;
  #senseDescNode;
  #ctValNode;
  #staractDescNode;
  #staractRequirementsNode;

  data;
  constructor(Id, parent) {
    this.Id = Id;
    this.lvl = 1;
    this.awaken = false;
    this.episodeReadState = EpisodeReadState.None;
    this.senselv = 1;
    this.bloom = 0;
    this.baseAddition = [0,0,0];
    this.baseCorrection = 0;

    this.data = GameDb.Character[Id];
    if (this.data === undefined) {
      throw new Error(`Character ${Id} not found`)
    }

    this.sense = new SenseData(this.data.SenseMasterId, this.senselv)
    this.staract = new StarActData(this.data.StarActMasterId, this.bloom)
    this.leaderSense = new LeaderSenseData(this.data.LeaderSenseMasterId)
    this.senseAll = [this.sense]
    if (this.data.SecondarySenseMasterId) {
      this.senseAll.push(new SenseData(this.data.SecondarySenseMasterId, this.senselv))
    }
    this.#senseStarNode = []
    this.#senseDescNode = []
    this.#ctValNode = []

    if (!parent) return
    const attributeNodes = [_('span', {className: `card-attribute-${this.attributeName}`})]
    if (this.data.SecondaryAttribute) {
      attributeNodes.push(_('text', '|'))
      attributeNodes.push(_('span', {className: `card-attribute-${this.secondaryAttributeName}`}))
    }
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [
        _('td', {}, [_(CREATE_FRAGMENT, {}, attributeNodes), _('text', this.fullCardName), _('span', { className: 'obtain-type' }, [_('text', /フェス/.test(this.data.UnlockText) ? 'フェス' : /限定/.test(this.data.UnlockText) ? '限定' : /イベント/.test(this.data.UnlockText) ? 'イベント' : '')])]),
        _('td', {}, [_('text', 'Vo:')]),
        this.voValNode = _('td', {className: 'stat'}),
        _('td', { rowspan: 4 }, [this.cardImg = imgErrorHandler(_('img', { src: 'about:blank' }))])
      ]),
      _('tr', {}, [
        _('td', {}, [_('text', 'Level: '), this.levelSelect = _('select', { event: { change: e=>this.setLevel(e) } })]),
        _('td', {}, [_('text', 'Ex:')]),
        this.exValNode = _('td', {className: 'stat'}),
      ]),
      _('tr', {}, [
        _('td', {}, [
          _('label', {}, [this.awakenInput = _('input', { type: 'checkbox', event: { change: e=>this.setAwaken(e) }}), _('span', { 'data-text-key': 'CARD_LABEL_AWAKEN', style: {marginRight: '1em'} })]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:0, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', 'なし　')]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:1, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', '前編読む　')]),
          _('label', {}, [_('input', { type: 'radio', name: `episodeReadState-${this.data.Id}`, value:2, event: { change: e=>this.setEpisodeReadState(e) }}), _('text', '後編読む　')]),
        ]),
        _('td', {}, [_('text', 'Co:')]),
        this.coValNode = _('td', {className: 'stat'}),
      ]),
      _('tr', {}, [
        _('td', {}, [
          this.getStarRankSelects(),
          _('text', '　Sense: '), this.senseInput = _('select', { event: { change: e=>this.setSense(e) } }),
          _('text', '　突破: '), this.bloomInput = _('select', { event: { change: e=>this.setBloom(e) } }),
        ]),
        _('td', {}, [_('text', 'Total:')]),
        this.totalValNode = _('td', {className: 'stat'}),
      ]),
      _(CREATE_FRAGMENT, {}, new Array(this.senseAll.length).fill(0).map((__, idx) => _('tr', {}, [
        _('td', { style: {maxWidth: '390px'}, className: 'black-border-bottom text-pre-wrap' }, [
          this.#senseStarNode[idx] = _('span', { className: 'sense-star gray-background pad-size' }),
          this.#senseDescNode[idx] = _('span', { translate: 'yes', style: {marginLeft: '0.5em'} })
        ]),
        _('td', {}, [_('text', 'CT: ')]),
        this.#ctValNode[idx] = _('td'),
        _('td'),
      ]))),
      _('tr', {}, [
        this.#staractDescNode = _('td', { translate: 'yes', className: 'black-border-bottom text-pre-wrap' }),
        this.#staractRequirementsNode = _('td', {colspan: 3}, [
          _('span', { className: 'sense-star', 'data-sense-type': 'support'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'control'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'amplification'}),
          _('span', { className: 'sense-star', 'data-sense-type': 'special'}),
          _('span', { className: 'sense-star', 'data-sense-type': ''}),
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
      this.secondaryAttributeName ? _('span', { className: 'card-attribute-rotate' }, [
        _('span', { className: `card-attribute-${this.attributeName}`}),
        _('span', { className: `card-attribute-${this.secondaryAttributeName}`}),
      ]) : _('span', { className: `card-attribute-${this.attributeName}`}),
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
  get secondaryAttributeName() {
    return this.data.SecondaryAttribute ? this.data.SecondaryAttribute.toLowerCase() : null
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
  get companyIdList() {
    const list = [GameDb.CharacterBase[this.data.CharacterBaseMasterId].CompanyMasterId]
    if (this.data.SecondaryCharacterBaseMasterId) {
      list.push(GameDb.CharacterBase[this.data.SecondaryCharacterBaseMasterId].CompanyMasterId)
    }
    return list
  }
  get coMin() {
    return this.data.MinLevelStatus.Concentration + this.baseAddition[2];
  }
  get exMin() {
    return this.data.MinLevelStatus.Expression + this.baseAddition[1];
  }
  get voMin() {
    return this.data.MinLevelStatus.Vocal + this.baseAddition[0];
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
  get starRanks() {
    const arr = [root.appState.characterStarRank.get(this.data.CharacterBaseMasterId)];
    if (this.data.SecondaryCharacterBaseMasterId) {
      arr.push(root.appState.characterStarRank.get(this.data.SecondaryCharacterBaseMasterId));
    }
    return arr;
  }
  get bloomBonusEffects() {
    const bloomBonusGroup = GameDb.CharacterBloomBonusGroup[this.data.BloomBonusGroupMasterId].BloomBonuses;
    const bloomBonus = bloomBonusGroup.filter(i => i.Phase <= this.bloom);
    const bloomBonusEffects = bloomBonus.map(i => Effect.get(i.EffectMasterId, 1));
    return bloomBonusEffects;
  }
  get categories() {
    return this.data.Categories.filter(i => !i.IsAwaken || this.awaken).map(i => i.CategoryMasterId)
  }
  calcStat(val) {
    const lvlBase = GameDb.CharacterLevel[this.lvl].CharacterStatusLevel;
    const episodeReadBonus = this.episodeReadState === EpisodeReadState.One ? 2 : this.episodeReadState === EpisodeReadState.Two ? 5 : 0;
    const bloomBonus = this.baseCorrection;
    const awakenNum = this.awaken ? 1 : 0;
    let starRank = this.starRanks.reduce((a, b) => Math.max(a, b), 0);
    const starRankBonus = GameDb.CharacterStarRank[starRank].StatusBonus;
    return (val + episodeReadBonus) * lvlBase / 100 * (100 + bloomBonus / 100 + awakenNum * 10 + starRankBonus) / 100;
  }
  updateBloomBonus() {
    this.baseAddition = [0,0,0]
    this.baseCorrection = 0
    this.bloomBonusEffects.forEach(e => {
      switch (e.Type) {
        case 'BaseCorrection': { this.baseCorrection += e.activeEffect.Value; return }
        case 'BaseVocalUp': { this.baseAddition[0] += e.activeEffect.Value; return }
        case 'BaseExpressionUp': { this.baseAddition[1] += e.activeEffect.Value; return }
        case 'BaseConcentrationUp': { this.baseAddition[2] += e.activeEffect.Value; return }
      }
    })
  }
  update() {
    if (this.data.Rarity === 'Rare1' || this.data.Rarity === 'Rare2') {
      this.awakenInput.setAttribute('disabled', '')
      this.awaken = false
    }
    this.levelSelect.value = this.lvl;
    this.awakenInput.checked = this.awaken;
    const starRanks = this.starRanks;
    this.starRankInputs[0].value = starRanks[0];
    if (this.data.SecondaryCharacterBaseMasterId) {
      this.starRankInputs[1].value = starRanks[1];
    }
    root.characterForm[`episodeReadState-${this.data.Id}`].value = this.episodeReadState;
    this.senseInput.value = this.senselv;
    this.bloomInput.value = this.bloom;

    if (this.iconSelectionInput.checked) {
      this.cardImg.src = `https://redive.estertion.win/wds/card/${this.cardIconId}.webp@w400`
    }
    this.iconNodeIcon.dataset.id = this.cardIconId

    this.updateBloomBonus()

    const stat = this.statFinal
    this.voValNode.textContent = stat.vo
    this.exValNode.textContent = stat.ex
    this.coValNode.textContent = stat.co
    this.totalValNode.textContent = stat.total

    const staractId = this.awaken ? this.data.AwakenStarActMasterId : this.data.StarActMasterId
    if (staractId !== this.staract.data.Id) {
      this.staract = new StarActData(staractId, this.bloom)
    }

    this.resetEffects()
    this.bloomBonusEffects.forEach(effect => {
      switch (effect.Type) {
        case 'SenseRecastDown': return this.senseAll.forEach(i => i.recastDown.push(effect.activeEffect.Value))
        case 'DecreaseRequireSupportLight': return this.staract.requireDecrease[0] += effect.activeEffect.Value
        case 'DecreaseRequireControlLight': return this.staract.requireDecrease[1] += effect.activeEffect.Value
        case 'DecreaseRequireAmplificationLight': return this.staract.requireDecrease[2] += effect.activeEffect.Value
        case 'DecreaseRequireSpecialLight': return this.staract.requireDecrease[3] += effect.activeEffect.Value
      }
    })

    this.senseAll.forEach((sense, i) => {
      sense.level = this.senselv
      try {
        this.#senseDescNode[i].innerHTML = sense.desc
      } catch {
        // 缺条件时放弃替换
        this.#senseDescNode[i].textContent = sense.data.Description
      }
      this.#senseStarNode[i].textContent = sense.data.LightCount
      this.#senseStarNode[i].dataset.senseType = sense.getType()
      this.#ctValNode[i].textContent = sense.ct
    })
    this.leaderSenseDescNode.textContent = this.leaderSense.desc

    removeAllChilds(this.categoryNode)
    this.data.Categories.forEach(i => {
      if (i.IsAwaken && !this.awaken) return
      this.categoryNode.appendChild(_('span', { className: 'character-category' }, [_('text', GameDb.Category[i.CategoryMasterId].Name)]))
    })

    this.staract.level = this.bloom
    try {
      this.#staractDescNode.innerHTML = this.staract.desc
    } catch {
      // 缺条件时放弃替换
      this.#staractDescNode.textContent = this.staract.data.Description
    }
    this.staract.actualRequirements.forEach((req, i) => {
      this.#staractRequirementsNode.children[i].textContent = req
      this.#staractRequirementsNode.children[i].style.display = req > 0 ? '' : 'none'
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
      this.cardImg.classList.add('preview-loading')
    } else {
      this.node.style.display = 'none'
    }

    root.update({ selection: true })
  }
  getStarRankSelects() {
    this.starRankInputs = []
    const id = this.data.CharacterBaseMasterId
    const container = _('span', {}, [
      _('span', { style: { verticalAlign: 'middle' }, className: 'spriteatlas-characterlog after-talk-icon', 'data-id': id }),
      this.starRankInputs[0] = _('select', { 'data-id': id, event: { change: e=>this.setStarRank(e) } }),
    ])
    if (this.data.SecondaryCharacterBaseMasterId) {
      const id = this.data.SecondaryCharacterBaseMasterId
      container.appendChild(_(CREATE_FRAGMENT, {}, [
        _('br'),
        _('span', { style: { verticalAlign: 'middle' }, className: 'spriteatlas-characterlog after-talk-icon', 'data-id': id }),
        this.starRankInputs[this.starRankInputs.length] = _('select', { 'data-id': id, event: { change: e=>this.setStarRank(e) } }),
      ]))
    }
    const maxStarRank = Object.values(GameDb.CharacterStarRank).slice(-1)[0].Rank
    for (let i = 0; i <= maxStarRank; i++) {
      for (let j = 0; j < this.starRankInputs.length; j++) {
        this.starRankInputs[j].appendChild(_('option', { value: i }, [_('text', i)]))
      }
    }
    return container
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
    const starRank = e.target.value | 0;
    const id = e.target.dataset.id | 0;
    root.appState.characterStarRank.set(id, starRank);
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
  resetEffects() {
    this.senseAll.forEach(i => i.resetRecastDown())
    this.staract.resetRequireDecrease()
  }

  isCharacterBaseId(baseId) {
    if (this.data.CharacterBaseMasterId === baseId) return true
    if (this.data.SecondaryCharacterBaseMasterId === baseId) return true
    return false
  }
  isCharacterBaseIdInList(baseIds) {
    return baseIds.some(baseId => this.isCharacterBaseId(baseId))
  }
  isCharacterInCompany(companyId) {
    if (GameDb.CharacterBase[this.data.CharacterBaseMasterId].CompanyMasterId === companyId) return true
    if (this.data.SecondaryCharacterBaseMasterId && GameDb.CharacterBase[this.data.SecondaryCharacterBaseMasterId].CompanyMasterId === companyId) return true
    return false
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

