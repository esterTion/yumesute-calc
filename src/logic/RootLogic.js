import GameDb from '../db/GameDb'
import ConstText from '../db/ConstText'

import _ from '../createElement'
import removeAllChilds from '../removeAllChilds'

import CharacterData from '../character/CharacterData'
import CharacterStarRankData from '../character/CharacterStarRankData'
import PosterData from '../poster/PosterData'
import AccessoryData from '../accessory/AccessoryData'
import TheaterLevelData from '../manager/TheaterLevelData'
import PartyManager from '../manager/PartyManager'
import HighScoreBuffManager from '../manager/HighScoreBuffManager'
import PhotoEffectData from '../manager/PhotoEffectData'

import ScoreCalculationType from './ScoreCalculationType'
import ScoreCalculator from './ScoreCalculator'

export default class RootLogic {
  appState = {
    characters: [],
    characterStarRank: new CharacterStarRankData(),
    posters: [],
    accessories: [],
    albumLevel: 0,
    albumExtra: [],
    theaterLevel: new TheaterLevelData(),
    partyManager: new PartyManager(),
    highScoreBuffManager: new HighScoreBuffManager(),
    version: 5,
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
          _('span', { 'data-text-key': 'HIGHSCORE_BUFF_LABEL' }),
          this.highScoreBuffContainer = _('div'),
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
          this.keikoBox = _('form', { style: { display: 'none' }, event: { change: _=>this.keikoCalcResult() }}, [
            _('span', {'data-text-key':'KEIKO_MEMBER_COUNT_LABEL', style: { marginRight: '1em' }}),
            _('label', {}, [_('input', { type: 'radio', name: 'keiko_member_count', value: 5}), _('text', 5)]),
            _('label', {}, [_('input', { type: 'radio', name: 'keiko_member_count', value: 4}), _('text', 4)]),
            _('label', {}, [_('input', { type: 'radio', name: 'keiko_member_count', value: 3}), _('text', 3)]),
            _('label', {}, [_('input', { type: 'radio', name: 'keiko_member_count', value: 2}), _('text', 2)]),
            _('label', {}, [_('input', { type: 'radio', name: 'keiko_member_count', value: 1}), _('text', 1)]),
          ]),
          this.keikoResult = _('div'),
        ]),
      ]),

      _('div', {className: 'margin-box'}),

      _('div', {}, [
        _('span', {'data-text-key':'ALBUM_LEVEL_LABEL'}),
        this.albumLevelSelect = _('select', { event: { change: e=>this.setAlbumLevel(e) } }, [_('option', { value: 0 }, [_('text', '0')])]),
        this.albumExtraCountLabel = _('span', { style: { marginLeft: '0.5em' } }),
        _('text', ' / 30'),
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
            _('select', { name: 'episodeReadState' }, [
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdateChara('delete') }}),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UNSELECT_ALL', event: { click: e=>this.multiUpdateChara('unselect') }}),
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdatePoster('delete') }}),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UNSELECT_ALL', event: { click: e=>this.multiUpdatePoster('unselect') }}),
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'DELETE_SELECTION', event: { click: e=>this.multiUpdateAccessory('delete') }}),
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'UNSELECT_ALL', event: { click: e=>this.multiUpdateAccessory('unselect') }}),
          ]),
        ]),
        this.accessoryContainer = _('table', { className: 'accessories' }),
        _('div', {}, [
          this.addAccessorySelect = _('select'),
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.addAccessory() }}),
        ]),
      ]),
    ]))

    const leagueNotationIdMap = Object.values(GameDb.League).reduce((acc, i) => {
      acc[i.SenseNotationMasterId] = i.Id
      return acc
    }, {})
    Object.values(GameDb.SenseNotation).forEach(i => {
      let text = i.Id
      if (GameDb.StoryEvent[i.Id] !== undefined) {
        text += ` - ${GameDb.StoryEvent[i.Id].Title}`
      } else if (leagueNotationIdMap[i.Id] !== undefined) {
        text += ` - League @ ${GameDb.League[leagueNotationIdMap[i.Id]].DisplayStartAt}`
      }
      this.senseNoteSelect.appendChild(_('option', { value: i.Id }, [_('text', text)]))
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
      this.appState.highScoreBuffManager.init()
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
    this.batchUpdating = true
    const data = JSON.parse(dataStr)
    this.addMissingFields(data)
    this.appState.characters.slice().forEach(i => i.remove())
    this.appState.characters = data.characters.map((i) => CharacterData.fromJSON(i, this.characterContainer))
    this.appState.characterStarRank = CharacterStarRankData.fromJSON(data.characterStarRank)
    this.appState.posters.slice().forEach(i => i.remove())
    this.appState.posters = data.posters.map(i => PosterData.fromJSON(i, this.posterContainer))
    this.appState.accessories.slice().forEach(i => i.remove())
    this.appState.accessories = data.accessories.map(i => AccessoryData.fromJSON(i, this.accessoryContainer))
    this.appState.albumLevel = Math.floor(data.albumLevel / 5) * 5
    this.appState.albumExtra.slice().forEach(i => i.remove())
    this.appState.albumExtra = data.albumExtra.map(i => PhotoEffectData.fromJSON(i, this.photoEffectContainer))
    this.appState.theaterLevel = TheaterLevelData.fromJSON(data.theaterLevel)
    this.appState.partyManager = PartyManager.fromJSON(data.partyManager)
    this.appState.partyManager.init()
    this.appState.highScoreBuffManager = HighScoreBuffManager.fromJSON(data.highScoreBuffManager)
    this.appState.highScoreBuffManager.init()
    this.batchUpdating = false
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
    // ver 5：添加舞台装置
    if (data.version < 5) {
      data.version = 5
      data.highScoreBuffManager = (new HighScoreBuffManager).toJSON()
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

  get calcType() { return this._calcType }
  set calcType(val) {
    if (this._calcType !== val) {
      this._calcType = val
      this.normalCalcTabContent.style.display = val !== 'keiko' ? '' : 'none'
      this.highscoreCalcTabContent.style.display = val === 'highscore' ? '' : 'none'
      this.keikoCalcTabContent.style.display = val === 'keiko' ? '' : 'none'
      this.update({ party: true })
    }
  }
  changeTab() {
    this.calcType = this.calcTypeSelectForm.tab.value

    const tab = this.tabSelectForm.tab.value
    this.characterTabContent.style.display = tab === 'character' ? '' : 'none'
    this.posterTabContent.style.display = tab === 'poster' ? '' : 'none'
    this.accessoryTabContent.style.display = tab === 'accessory' ? '' : 'none'


  }

  addCharacter() {
    const charaId = this.addCharacterSelect.value | 0;
    if (this.appState.characters.find(i => i.Id === charaId)) return
    this.appState.characters.push(new CharacterData(charaId, this.characterContainer))
    this.appState.characters[this.appState.characters.length - 1].updateToMax()
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
    if (this.appState.posters.find(i => i.id === posterId)) return
    this.appState.posters.push(new PosterData(posterId, this.posterContainer))
    this.appState.posters[this.appState.posters.length - 1].updateToMax()
    this.update({ poster: true })
  }
  removePoster(poster) {
    this.appState.posters.splice(this.appState.posters.indexOf(poster), 1)
    this.update({ poster: true })
  }

  addAccessory() {
    const accessoryId = this.addAccessorySelect.value | 0;
    this.appState.accessories.push(new AccessoryData(accessoryId, this.accessoryContainer))
    this.appState.accessories[this.appState.accessories.length - 1].updateToMax()
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
      /*
      const displaySortValue = (tbl, key, a, b) => (
        tbl[a][key] === tbl[b][key] ? 0 : tbl[a][key] > tbl[b][key] ? 1 : -1
      )
      */

      if (parts.chara) {
        Object.values(this.nonPersistentState.characterOptions).forEach(i => i.removeAttribute('disabled'))
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
        const extraCount = this.appState.albumExtra.filter(i => i.enabled).length
        this.albumExtraCountLabel.textContent = extraCount
        this.albumExtraCountLabel.style.color = extraCount > 30 ? 'red' : ''
      }
      if (parts.theaterLevel) {
        (['Sirius', 'Eden', 'Gingaza', 'Denki']).forEach(i => {
          this.theaterLevelForm[i].value = this.appState.theaterLevel.getLevel(i)
        })
      }
      if (parts.chara || parts.poster || parts.album || parts.accessory || parts.party) {
        this.appState.partyManager.update()
        this.appState.highScoreBuffManager.changeNotation(this.senseNoteSelect.value | 0)
      }

      if ('keiko' === this.calcTypeSelectForm.tab.value) {
        if (parts.chara || parts.album || parts.theaterLevel) {
          this.keikoFillChara()
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

        const selectedPosterCount = this.appState.posters.filter(i => i.iconSelectionInput.checked).length
        this.posterMultiUpdateForm.classList[selectedPosterCount > 0 ? 'remove' : 'add']('empty')
        this.posterMultiUpdateForm.children[0].textContent = ConstText.get('SELECTION_COUNT_LABEL', [selectedPosterCount])

        const selectedAccessoryCount = this.appState.accessories.filter(i => i.iconSelectionInput.checked).length
        this.accessoryMultiUpdateForm.classList[selectedAccessoryCount > 0 ? 'remove' : 'add']('empty')
        this.accessoryMultiUpdateForm.children[0].textContent = ConstText.get('SELECTION_COUNT_LABEL', [selectedAccessoryCount])
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
      case 'unselect': {
        this.appState.characters.forEach(i => i.iconSelectionInput.checked && i.toggleSelection())
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
      case 'unselect': {
        this.appState.posters.forEach(i => i.iconSelectionInput.checked && i.toggleSelection())
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
      case 'unselect': {
        this.appState.accessories.forEach(i => i.iconSelectionInput.checked && i.toggleSelection())
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

    for (let i = 0; i < 5; i++) {
      this.senseBox.children[i].children[0].appendChild(_('div', { className: 'start-live-extra-lights' }))
    }

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

    let choice = this.keikoBox['keiko_member_count'].value | 0
    if (choice < 1) choice = 5
    const inventoryCharaCount = this.appState.characters.filter(i => i.data.CharacterBaseMasterId === keikoCharaId).length
    this.keikoBox['keiko_member_count'][0][inventoryCharaCount >= 5 ? 'removeAttribute' : 'setAttribute']('disabled', '')
    this.keikoBox['keiko_member_count'][1][inventoryCharaCount >= 4 ? 'removeAttribute' : 'setAttribute']('disabled', '')
    this.keikoBox['keiko_member_count'][2][inventoryCharaCount >= 3 ? 'removeAttribute' : 'setAttribute']('disabled', '')
    this.keikoBox['keiko_member_count'][3][inventoryCharaCount >= 2 ? 'removeAttribute' : 'setAttribute']('disabled', '')
    this.keikoBox['keiko_member_count'][4][inventoryCharaCount >= 1 ? 'removeAttribute' : 'setAttribute']('disabled', '')
    choice = Math.min(choice, inventoryCharaCount)
    this.keikoBox['keiko_member_count'].value = choice

    this.keikoCalcResult()
  }
  keikoSelection = []
  async keikoCalcResult() {
    removeAllChilds(this.keikoResult)
    const keikoCharaId = this.keikoSelect.value | 0;
    if (!keikoCharaId) return
    const inventoryChara = this.appState.characters.filter(i => i.data.CharacterBaseMasterId === keikoCharaId)
    if (inventoryChara.length === 0) return

    const choice = this.keikoBox['keiko_member_count'].value | 0
    let bestParty
    if (choice < inventoryChara.length) {
      const comb = []
      const pick = (idx, picked) => {
        if (picked.length === choice) {
          comb.push(picked.slice())
          for (let i = 1; i < choice; i++) {
            [picked[0], picked[i]] = [picked[i], picked[0]]
            comb.push(picked.slice())
          }
          return
        }
        if (idx === inventoryChara.length) return
        pick(idx + 1, picked)
        pick(idx + 1, picked.concat(inventoryChara[idx]))
      }
      pick(0, [])
      this.keikoResult.textContent = ConstText.get('KEIKO_CALCULATING', [comb.length])
      await new Promise(r => setTimeout(r, 50))
      const testResult = comb.map(i => {
        const testCalc = new ScoreCalculator(i, [], [], {
          albumLevel: this.appState.albumLevel,
          albumExtra: this.appState.albumExtra,
          starRankScoreBonus: this.appState.characterStarRank.get(keikoCharaId),
          type: ScoreCalculationType.Keiko,
        })
        testCalc.calc(null)
        return [i, testCalc.result.baseScore[3]]
      })
      testResult.sort((a,b) => b[1] - a[1])
      bestParty = testResult[0][0]
    } else {
      bestParty = inventoryChara
    }

    const calc = new ScoreCalculator(bestParty, [], [], {
      albumLevel: this.appState.albumLevel,
      albumExtra: this.appState.albumExtra,
      starRankScoreBonus: this.appState.characterStarRank.get(keikoCharaId),
      type: ScoreCalculationType.Keiko,
    })
    calc.calc(this.keikoResult)
  }
}

