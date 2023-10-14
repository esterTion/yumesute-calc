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
  static AlbumEffect = {};
  static Effect = {};
  static SenseNotation = {};

  static async load() {
    this.Character = await this.loadKeyedMasterTable('CharacterMaster')
    this.CharacterBase = await this.loadKeyedMasterTable('CharacterBaseMaster')
    this.CharacterLevel = await this.loadKeyedMasterTable('CharacterLevelMaster', 'Level')
    this.CharacterBloomBonusGroup = await this.loadKeyedMasterTable('CharacterBloomBonusGroupMaster')

    this.AlbumEffect = await this.loadKeyedMasterTable('AlbumEffectMaster')
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

  canTrigger(calc, index) {
    for (let trigger of this.Triggers) {
      if (this.Range === 'All') {
        switch (trigger.Trigger) {
          case 'CompanyCount': { return calc.properties.companyCount == trigger.Value;}
          case 'AttributeCount': { return calc.properties.attributeCount == trigger.Value;}
        }
      }
      return false;
    }
    return true
  }
  applyEffect(calc, index, type) {
    const targets = this.Range === 'All' ? [0,1,2,3,4] : this.Range === 'Self' ? [index] : []
    switch (this.Type) {
      case 'BaseCorrection': { return }
      case 'PerformanceUp': { return PerformanceUpEffect.applyEffect(this, calc, targets, type) }
      case 'BaseScoreUp': { return BaseScoreUpEffect.applyEffect(this, calc, targets, type) }
      default: {console.log(this.Type, index)}
    }
  }

}
class PerformanceUpEffect {
  static applyEffect(effect, calc, targets, type) {
    targets.forEach(idx => {
      calc.stat.buff[idx][type][['PercentageAddition', 'FixedAddition'].indexOf(effect.CalculationType)][3] += effect.activeEffect.Value
    })
  }
}
class BaseScoreUpEffect {
  static applyEffect(effect, calc, targets, type) {
    if (effect.CalculationType !== 'PercentageAddition') throw new Error(`BaseScoreUp calc type: ${effect.CalculationType}`)
    calc.passiveEffects.baseScoreUp += effect.activeEffect.Value
  }
}

class EpisodeReadState {
  static None = 0;
  static One = 1;
  static Two = 2;
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
      Math.floor(this.vo * (percentage[0] + percentage[3]) / 10000),
      Math.floor(this.ex * (percentage[1] + percentage[3]) / 10000),
      Math.floor(this.co * (percentage[2] + percentage[3]) / 10000)
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
    if (!parent) return
    this.node = parent.appendChild(_('tbody', {}, [
      _('tr', {}, [
        _('td', {}, [_('text', this.fullCardName)]),
        _('td', {}, [_('text', 'Vo:')]),
        this.voValNode = _('td', {className: 'stat'}),
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
  get rarityStr() {
    return ({
      'Rare1': '★',
      'Rare2': '★★',
      'Rare3': '★★★',
      'Rare4': '★★★★',
    })[this.data.Rarity]
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
    this.levelInput.value = this.lvl;
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

class StatBonusType {
  static Album = 0;
  static Poster = 1;
  static Accessory = 2;
  static Other = 3;
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
    passiveEffects.album.forEach(i => i.effect.applyEffect(this, i.source, StatBonusType.Album))

    // bloom effect
    this.members.filter(i => i !== null).forEach((chara, idx) => {
      chara.bloomBonusEffects.forEach(effect => effect.applyEffect(this, idx, StatBonusType.Album))
    })

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
      _('text', `合計演技力：${this.stat.finalTotal}`),
      _('br'),
      _('text', `基础分: ${baseScore[0]} / ${baseScore[1]} / ${baseScore[2]} / ${baseScore[3]}`)
    ]))
  }
  createStatDetailsTable() {
    let rowNumber;
    return _('div', {}, this.members.map((chara, idx) => (rowNumber = 0, chara === null ? _('text', '') : _('details', {}, [
      _('summary', {}, [_('text', chara.fullCardName)]),
      _('table', { className: 'stat-details'}, [
        _('thead', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('th'),
          _('th', {}, [_('text', '歌唱力')]),
          _('th', {}, [_('text', '表現力')]),
          _('th', {}, [_('text', '集中力')]),
          _('th', {}, [_('text', '演技力')]),
        ])]),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', {}, [_('text', '初期値')]),
          _('td', {}, [_('text', this.stat.initial[idx].vo)]),
          _('td', {}, [_('text', this.stat.initial[idx].ex)]),
          _('td', {}, [_('text', this.stat.initial[idx].co)]),
          _('td', {}, [_('text', this.stat.initial[idx].total)]),
        ])]),
        _('tbody', {}, ['アルバム', 'ポスター', 'アクセサリー'].map((name, j) => _('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', {}, [_('text', name)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][j][0][0] / 100}%\n+${this.stat.buffFinal[idx][j][1][0]}\n${this.stat.bonus[idx][j].vo}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][j][0][1] / 100}%\n+${this.stat.buffFinal[idx][j][1][1]}\n${this.stat.bonus[idx][j].ex}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][j][0][2] / 100}%\n+${this.stat.buffFinal[idx][j][1][2]}\n${this.stat.bonus[idx][j].co}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][j][0][3] / 100}%\n${this.stat.bonus[idx][j].total}`)]),
        ]))),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', {}, [_('text', '上昇合計')]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][4][0][0] / 100}%/${this.stat.buffLimit[idx][0][0] / 100}%\n+${this.stat.buffFinal[idx][4][1][0]}\n${this.stat.bonus[idx][4].vo}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][4][0][1] / 100}%/${this.stat.buffLimit[idx][0][1] / 100}%\n+${this.stat.buffFinal[idx][4][1][1]}\n${this.stat.bonus[idx][4].ex}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][4][0][2] / 100}%/${this.stat.buffLimit[idx][0][2] / 100}%\n+${this.stat.buffFinal[idx][4][1][2]}\n${this.stat.bonus[idx][4].co}`)]),
          _('td', {}, [_('text', `${this.stat.buffFinal[idx][4][0][3] / 100}%/${this.stat.buffLimit[idx][0][3] / 100}%\n${this.stat.bonus[idx][4].total}`)]),
        ])]),
        _('tbody', {}, [_('tr', { className: rowNumber++%2 ? 'odd-row' : '' }, [
          _('td', {}, [_('text', '最終値')]),
          _('td', {}, [_('text', `${this.stat.final[idx].vo}`)]),
          _('td', {}, [_('text', `${this.stat.final[idx].ex}`)]),
          _('td', {}, [_('text', `${this.stat.final[idx].co}`)]),
          _('td', {}, [_('text', `${this.stat.final[idx].total}`)]),
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
     */
    this.buff = members.map(_ => ([0,0,0,0].map(_ => ([[0,0,0,0], [0,0,0,0]]))))
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
      const bonus = charaBuf.map(i => CharacterStat.fromArray(i[1].slice(0, 3)))
      const bonusAddition = bonus.reduce((sum, category) => sum.add(category), CharacterStat.Zero())
      bonus.push(bonusAddition)
      const statWithAddition = this.initial[charaIdx].add(bonusAddition)
      const bonusPercentage = charaBuf.map(i => statWithAddition.mul(i[0]))
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
    this.final = this.initial.map((i, idx) => i.add(this.bonus[idx][4]))
    this.finalTotal = this.final.reduce((s, i) => s+i.total, 0)
  }
}

class RootLogic {
  appState = {
    characters: [],
    characterStarRank: new CharacterStarRankData(),
    albumLevel: 0,
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

      _('div', {}, [_('text', 'Album Level: '), this.albumLevelSelect = _('select', { event: { change: e=>this.setAlbumLevel(e) } }, [_('option', { value: 0 }, [_('text', '0')])])]),

      _('div', {className: 'margin-box'}),

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
      ])
    ]))

    Object.values(GameDb.SenseNotation).forEach(i => {
      this.senseNoteSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Id)]))
    })
    this.keikoSelect.appendChild(_('option', { value: '' }, [_('text', '未選択')]))
    Object.values(GameDb.CharacterBase).forEach(i => {
      this.keikoSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Name)]))
    })
    Object.values(GameDb.AlbumEffect).forEach(i => {
      this.albumLevelSelect.appendChild(_('option', { value: i.Level }, [_('text', i.Level)]))
    })

    this.loadState()

    this.albumLevelSelect.value = this.appState.albumLevel

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
      this.appState.albumLevel = data.albumLevel
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
  setAlbumLevel() {
    this.appState.albumLevel = this.albumLevelSelect.value | 0;
    this.update()
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
  update() {
    const addableCharacters = Object.values(GameDb.Character).map(i=>i.Id)
    .filter(i=>this.appState.characters.map(i=>i.Id).indexOf(i) === -1)
    removeAllChilds(this.addCharacterSelect)
    addableCharacters.forEach((i) => {
      this.addCharacterSelect.appendChild(_('option', { value: i }, [_('text', (new CharacterData(i, null)).fullCardName)]))
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

    const calc = new ScoreCalculator(this.keikoSelection, [], [], { albumLevel: this.appState.albumLevel, starRankScoreBonus: this.appState.characterStarRank.get(keikoCharaId) })
    calc.calc(this.keikoResult)

    //this.keikoResult.textContent = calc.result.baseScore.join(' ')
  }
}

window.root = new RootLogic()

window.addEventListener('load', () => root.init())
