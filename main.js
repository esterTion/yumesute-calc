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

class GameDb {
  static Character = {};
  static CharacterBase = {};
  static CharacterLevel = {};
  static CharacterBloomBonusGroup = {};
  static Effect = {};
  static SenseNotation = {};

  static GetCharacterName(Id) {
    if (this.Character[Id]) {
      const chara = this.Character[Id]
      return ({
        'Rare1': '★',
        'Rare2': '★★',
        'Rare3': '★★★',
        'Rare4': '★★★★',
      })[chara.Rarity] + `【${chara.Name}】`+ this.CharacterBase[chara.CharacterBaseMasterId].Name
    }
    return ''
  }

  static async load() {
    this.Character = await this.loadKeyedMasterTable('CharacterMaster')
    this.CharacterBase = await this.loadKeyedMasterTable('CharacterBaseMaster')
    this.CharacterLevel = await this.loadKeyedMasterTable('CharacterLevelMaster', 'Level')
    this.CharacterBloomBonusGroup = await this.loadKeyedMasterTable('CharacterBloomBonusGroupMaster')

    this.Effect = await this.loadKeyedMasterTable('EffectMaster')

    this.SenseNotation = await this.loadKeyedMasterTable('SenseNotationMaster')
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
class Effect {
  constructor(id, level) {
    if (!GameDb.Effect[id]) {
      throw new Error(`Effect ${id} not found`)
    }
    this.data = GameDb.Effect[id]
    this.level = level
    this.activeEffect = this.data.Details.filter(i => i.Level === level)[0]
    if (!this.activeEffect) {
      throw new Error(`Effect ${id} level ${level} not found`)
    }
    Object.assign(this, this.data)
  }
  static get(id, level) {
    return new Effect(id, level)
  }
}

class EpisodeReadState {
  static None = 0;
  static One = 1;
  static Two = 2;
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
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [
        _('td', {}, [_('text', GameDb.GetCharacterName(Id))]),
        _('td', {}, [_('text', 'Co:')]),
        this.coValNode = _('td', {className: 'stat'}),
        _('td', { rowspan: 4 }, [this.cardImg = _('img', { src: `https://redive.estertion.win/wds/card/${this.Id}_0.webp@w200`})])
      ]),
      _('tr', {}, [
        _('td', {}, [_('text', 'Level: '), this.levelInput = _('select', { event: { change: e=>this.setLevel(e) } })]),
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
        _('td', {}, [_('text', 'Vo:')]),
        this.voValNode = _('td', {className: 'stat'}),
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
        _('td'),
        _('td', { colspan: 2 }, [_('input', { type: 'button', value: '削除', event: { click: _=>this.remove() }})])
      ]),
    ]))

    for (let lvl in GameDb.CharacterLevel) {
      this.levelInput.appendChild(_('option', { value: lvl }, [_('text', lvl)]))
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
    this.levelInput.value = this.lvl;
    this.awakenInput.checked = this.awaken;
    this.starRankInput.value = this.starRank;
    root.characterForm[`episodeReadState-${this.data.Id}`].value = this.episodeReadState;
    this.senseInput.value = this.senselv;
    this.bloomInput.value = this.bloom;

    this.cardImg.src = `https://redive.estertion.win/wds/card/${this.Id}_${this.awaken&&this.data.Rarity==='Rare4'?1:0}.webp@w200`

    const co = Math.floor(this.coFinal);
    const ex = Math.floor(this.exFinal);
    const vo = Math.floor(this.voFinal);
    this.coValNode.textContent = co
    this.exValNode.textContent = ex
    this.voValNode.textContent = vo
    this.totalValNode.textContent = co + ex + vo
  }
  remove() {
    this.node.remove()
    root.removeCharacter(this)
  }

  setLevel(e) {
    this.lvl = e.target.value | 0;
    root.update()
  }
  setAwaken(e) {
    this.awaken = e.target.checked;
    root.update()
  }
  setEpisodeReadState(e) {
    this.episodeReadState = e.target.value | 0;
    root.update()
  }
  setStarRank(e) {
    this.starRank = e.target.value | 0;
    root.update()
  }
  setSense(e) {
    this.senselv = e.target.value | 0;
    root.update()
  }
  setBloom(e) {
    this.bloom = e.target.value | 0;
    root.update()
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

class RootLogic {
  appState = {
    characters: [],
    characterStarRank: new CharacterStarRankData(),
  }

  async init() {
    console.log('init')

    await GameDb.load()

    window.addEventListener('blur', _=>this.saveState())
    window.addEventListener('unload', _=>this.saveState())
    //window.addEventListener('focus', _=>this.loadState())
    this.loaded = true;

    document.getElementById('loading').remove()
    document.getElementById('app').appendChild(_('div', {}, [
      this.senseNoteSelect = _('select', {event: {change: _=>this.renderSenseNote()}}),
      this.senseBox = _('div', { className: 'sense-render-box' }),

      _('div', {className: 'margin-box'}),

      _('div', {}, [_('text', '稽古算分')]),
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

      _('div', {className: 'margin-box'}),

      this.characterForm = _('form', {}, [
        this.characterContainer = _('table', { className: 'characters' }),
      ]),
      _('div', {}, [
        this.addCharacterSelect = _('select'),
        _('input', { type: 'button', value: '追加', event: { click: e=>this.addCharacter() }}),
      ])
    ]))

    Object.values(GameDb.SenseNotation).forEach(i => {
      this.senseNoteSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Id)]))
    })
    this.keikoSelect.appendChild(_('option', { value: '' }, [_('text', '未選択')]))
    Object.values(GameDb.CharacterBase).forEach(i => {
      this.keikoSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Name)]))
    })

    this.loadState()

    this.renderSenseNote()
    this.update()
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
      removeAllChilds(this.characterContainer)
      this.appState.characters = data.characters.map((i) => CharacterData.fromJSON(i, this.characterContainer))
      this.appState.characterStarRank = CharacterStarRankData.fromJSON(data.characterStarRank)
    }
    this.update()
  }
  addCharacter() {
    const charaId = this.addCharacterSelect.value | 0;
    this.appState.characters.push(new CharacterData(charaId, this.characterContainer))
    this.update()
  }
  removeCharacter(chara) {
    this.appState.characters.splice(this.appState.characters.indexOf(chara), 1)
    this.update()
  }
  update() {
    const addableCharacters = Object.values(GameDb.Character).map(i=>i.Id)
    .filter(i=>this.appState.characters.map(i=>i.Id).indexOf(i) === -1)
    removeAllChilds(this.addCharacterSelect)
    addableCharacters.forEach((i) => {
      this.addCharacterSelect.appendChild(_('option', { value: i }, [_('text', GameDb.GetCharacterName(i))]))
    })

    this.appState.characters.forEach(i => i.update())

    this.keikoFillChara()
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
      lane.appendChild(_('div', { className: 'sense-node', style: {left: `calc(${i.TimingSecond / totalDuration * 100}% - 40px)`} }, [_('text', i.TimingSecond)]))
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
      select.appendChild(_('option', { value: '' }, [_('text', '未選択')]))
      for (let i=0; i<this.appState.characters.length; i++) {
        if (this.appState.characters[i].data.CharacterBaseMasterId !== keikoCharaId) continue;
        select.appendChild(_('option', { value: i }, [_('text', GameDb.GetCharacterName(this.appState.characters[i].Id))]))
      }
    }
  }
  keikoCalcResult() {
    this.keikoResult.textContent = ''
    const keikoCharaId = this.keikoSelect.value | 0;
    if (!keikoCharaId) return
    ([...this.keikoBox.querySelectorAll('option[disabled]')]).forEach(i => i.removeAttribute('disabled'))
    const memberChoice = []
    for (let select of this.keikoBox.children) {
      if (select.selectedIndex === 0) continue;
      for (let otherSelect of this.keikoBox.children) {
        if (otherSelect === select) continue;
        otherSelect.options[select.selectedIndex].setAttribute('disabled', '')
      }
      memberChoice.push(select.value)
    }
    let totalBaseScoreUp = 0;
    let totalStat = memberChoice.map(idx => {
      const chara = this.appState.characters[idx]
      const val = [chara.voFinal, chara.exFinal, chara.coFinal].map(Math.floor).reduce((s,i) => s+i, 0)
      const scoreUpEffect = chara.bloomBonusEffects.filter(i => i.Type === 'BaseScoreUp').map(i => i.activeEffect.Value).reduce((acc, cur) => acc + cur, 0)
      totalBaseScoreUp += scoreUpEffect
      return val;
    }).reduce((acc, cur) => acc + cur, 0)
    totalStat = totalStat * (100 + this.appState.characterStarRank.get(keikoCharaId) * 30) / 100
    totalStat = Math.floor(totalStat)
    const score = [0.95, 0.97, 1, 1.05].map(i => Math.floor(totalStat * 10 * (1 + totalBaseScoreUp/10000) * i))
    this.keikoResult.textContent = score.join(' ')
  }
}

window.root = new RootLogic()

window.addEventListener('load', () => root.init())
