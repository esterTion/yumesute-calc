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
import FilterManager from '../manager/FilterManager'
import SideMenuManager from '../manager/SideMenuManager'
import GachaViewer, { GACHA_TYPE } from '../manager/GachaViewer'

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
    selectedNotation: 0,
    version: 5,
  }
  nonPersistentState = {
    swappable: null,
  }

  async init() {
    console.log('init')

    await GameDb.load()
    this.loaded = true;

    {
      // test scroll bar width
      const outer = _('div', { style: { overflow: 'scroll', width: '100px', height: '100px', position: 'absolute', top: '-9999px' }}, [
        _('div', { style: { width: '100%', height: '100%' }})
      ])
      document.body.appendChild(outer)
      const inner = outer.firstChild
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
      outer.remove()
      document.body.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
    }

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
      _('div', {className: 'margin-box', 'data-menu-anchor': 'MENU_ANCHOR_TIMELINE' }),
      this.calcTypeSelectForm = _('form', { style: { display: 'flex' }, event: {change: _=>this.changeTab()} }, [
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

      _('div', {className: 'margin-box', 'data-menu-anchor': 'MENU_ANCHOR_ALBUM' }),

      _('div', {}, [
        _('span', {'data-text-key':'ALBUM_LEVEL_LABEL'}),
        this.albumLevelSelect = _('select', { event: { change: e=>this.setAlbumLevel(e) } }, [_('option', { value: 0 }, [_('text', '0')])]),
        this.albumExtraCountLabel = _('span', { style: { marginLeft: '0.5em' } }),
        _('text', ' / 36'),
      ]),
      _('details', {}, [
        _('summary', {'data-text-key':'LABEL_SORT_AND_FILTER' }),
        this.photoEffectFilterContainer = _('div'),
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
            _('select', { name: 'Sirius' }, (new Array(11)).fill(0).map((__,i) => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'SIRIUS' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Eden' }, (new Array(11)).fill(0).map((__,i) => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'EDEN' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Gingaza' }, (new Array(11)).fill(0).map((__,i) => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'GINGAZA' }),
          ]),
          _('div', {}, [
            _('select', { name: 'Denki' }, (new Array(11)).fill(0).map((__,i) => _('option', { value: i }, [_('text', i)]))),
            _('span', { style: { paddingLeft: '1em' }, 'data-text-key': 'DENKI' }),
          ]),
        ])
      ]),

      _('div', {className: 'margin-box', 'data-menu-anchor': 'MENU_ANCHOR_INVENTORY'}),

      this.tabSelectForm = _('form', { style: { display: 'flex', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', padding: '10px 0', zIndex: 5 }, event: {change: _=>this.changeTab()} }, [
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'character' }), _('span', {'data-text-key': 'TAB_CHARA'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'poster' }), _('span', {'data-text-key': 'TAB_POSTER'})]),
        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'tab', value: 'accessory' }), _('span', {'data-text-key': 'TAB_ACCESSORY'})]),
      ]),

      this.characterTabContent = _('div', {}, [
        this.characterIconList = _('div', {}, [
          _('details', {}, [
            _('summary', {'data-text-key':'LABEL_SORT_AND_FILTER' }),
            this.characterFilterContainer = _('div'),
          ]),
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'SELECT_ALL', event: { click: e=>this.multiUpdateChara('select') }}),
          ]),
        ]),
        this.characterForm = _('form', {}, [
          this.characterContainer = _('table', { className: 'characters' }),
        ]),
        _('div', {}, [
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: e=>this.pickCharacterToAdd() }}),
          _('input', { type: 'button', 'data-text-value': 'VIEW_GACHA', style: {marginLeft:'1em'}, event: { click: e=>GachaViewer.show(GACHA_TYPE.ACTOR) }}),
        ]),
      ]),

      this.posterTabContent = _('div', {}, [
        this.posterIconList = _('div', {}, [
          _('details', {}, [
            _('summary', {'data-text-key':'LABEL_SORT_AND_FILTER' }),
            this.posterFilterContainer = _('div'),
          ]),
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'SELECT_ALL', event: { click: e=>this.multiUpdatePoster('select') }}),
          ]),
        ]),
        this.posterContainer = _('table', { className: 'posters' }),
        _('div', {}, [
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: _=>this.pickPosterToAdd() }}),
          _('input', { type: 'button', 'data-text-value': 'VIEW_GACHA', style: {marginLeft:'1em'}, event: { click: e=>GachaViewer.show(GACHA_TYPE.POSTER) }}),
        ]),
      ]),

      this.accessoryTabContent = _('div', {}, [
        this.accessoryIconList = _('div', {}, [
          _('details', {}, [
            _('summary', {'data-text-key':'LABEL_SORT_AND_FILTER' }),
            this.accessoryFilterContainer = _('div'),
          ]),
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
            _('input', { style: {marginRight: '1em'}, type: 'button', 'data-text-value': 'SELECT_ALL', event: { click: e=>this.multiUpdateAccessory('select') }}),
          ]),
        ]),
        this.accessoryContainer = _('table', { className: 'accessories' }),
        _('div', {}, [
          _('input', { type: 'button', 'data-text-value': 'ADD', event: { click: _=>this.pickAccessoryToAdd() }}),
        ]),
      ]),
    ]))

    const leagueNotationIdMap = Object.values(GameDb.League).reduce((acc, i) => {
      acc[i.SenseNotationMasterId] = i.Id
      return acc
    }, {})
    const tripleCastNotationIdMap = Object.values(GameDb.TripleCast).reduce((acc, i) => {
      acc[i.SenseNotationMasterId1] = [i.Id, '1 (マチネ)']
      acc[i.SenseNotationMasterId2] = [i.Id, '2 (ジュルネ)']
      acc[i.SenseNotationMasterId3] = [i.Id, '3 (ソワレ)']
      return acc
    }, {})
    Object.values(GameDb.SenseNotation).forEach(i => {
      let text = i.Id
      if (GameDb.StoryEvent[i.Id] !== undefined) {
        text += ` - ${GameDb.StoryEvent[i.Id].Title}`
      } else if (leagueNotationIdMap[i.Id] !== undefined) {
        text += ` - League @ ${GameDb.League[leagueNotationIdMap[i.Id]].DisplayStartAt}`
      } else if (tripleCastNotationIdMap[i.Id] !== undefined) {
        text += ` - Triple Cast @ ${GameDb.TripleCast[tripleCastNotationIdMap[i.Id][0]].DisplayStartAt} ${tripleCastNotationIdMap[i.Id][1]}`
      }
      this.senseNoteSelect.appendChild(_('option', { value: i.Id }, [_('text', text)]))
    })
    this.keikoSelect.appendChild(_('option', { value: '', 'data-text-key': 'NOT_SELECTED' }, [_('text', '未選択')]))
    Object.values(GameDb.CharacterBase).forEach(i => {
      if (i.CharacterBaseType !== 'Initial') return
      this.keikoSelect.appendChild(_('option', { value: i.Id }, [_('text', i.Name)]))
    })
    Object.values(GameDb.AlbumEffect).forEach(i => {
      this.albumLevelSelect.appendChild(_('option', { value: i.Level }, [_('text', i.Level)]))
    })
    {
      // characters
      this.characterFilterManager = new FilterManager(this.characterFilterContainer, FilterManager.getCharacterFilters(), FilterManager.getCharacterSorter())
      this.characterFilterManager.render()
      this.characterFilterContainer.appendChild(_('input', { type: 'button', 'data-text-value': 'FILTER_APPLY', event: { click: _=>this.characterFilterManager.filterAndSort(this.appState.characters) }}))
    }
    {
      // posters
      this.posterFilterManager = new FilterManager(this.posterFilterContainer, FilterManager.getPosterFilters(), FilterManager.getPosterSorter())
      this.posterFilterManager.render()
      this.posterFilterContainer.appendChild(_('input', { type: 'button', 'data-text-value': 'FILTER_APPLY', event: { click: _=>this.posterFilterManager.filterAndSort(this.appState.posters) }}))
    }
    this.accessoryFilterManager = new FilterManager(this.accessoryFilterContainer, FilterManager.getAccessoryFilters(), FilterManager.getAccessorySorter())
    this.accessoryFilterManager.render()
    this.accessoryFilterContainer.appendChild(_('input', { type: 'button', 'data-text-value': 'FILTER_APPLY', event: { click: _=>this.accessoryFilterManager.filterAndSort(this.appState.accessories) }}))
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
    this.photoEffectFilterManager = new FilterManager(this.photoEffectFilterContainer, FilterManager.getPhotoEffectFilters(), FilterManager.getPhotoEffectSorter())
    this.photoEffectFilterManager.render()
    this.photoEffectFilterContainer.appendChild(_('input', { type: 'button', 'data-text-value': 'FILTER_APPLY', event: { click: _=>this.photoEffectFilterManager.filterAndSort(this.appState.albumExtra) }}))

    this.senseNoteSelect.value = this.appState.selectedNotation

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

    SideMenuManager.init()

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
    this.appState.selectedNotation = data.selectedNotation | 0
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

  createPickingOverlay(confirmCallback) {
    document.body.classList.add('picking')
    const overlay = _('div', { className: 'picking-overlay', event: { click: e=>e.target === this.pickingOverlay && this.closePicking() }})
    const container = _('div', { className: 'picking-container', event: { click: confirmCallback }})
    overlay.appendChild(container)
    document.body.appendChild(overlay)
    this.pickingOverlay = overlay
    this.pickingContainer = container
    overlay.scrollTop = 0
  }
  closePicking() {
    document.body.classList.remove('picking')
    this.pickingOverlay.remove()
    delete this.pickingOverlay
    delete this.pickingContainer
  }
  pickCharacterToAdd() {
    const pickTarget = []
    this.createPickingOverlay(e => {
      let pick
      for (let el of pickTarget) {
        if (el.contains(e.target)) {
          pick = el
          break
        }
      }
      if (!pick) return
      const charaId = pick.dataset.pickId | 0
      this.addCharacter(charaId)
      this.closePicking()
    })
    this.pickingContainer.appendChild(_('p', {}, [
      _('input', { 'type': 'button', value: ConstText.get('ADD_ALL'), event: { click: _=>{
        this.batchUpdating = true
        pickTarget.forEach(i => this.addCharacter(i.dataset.pickId | 0))
        this.batchUpdating = false
        this.update({ chara: true })
        this.closePicking()
      } }}),
      _('input', { 'type': 'button', style: { marginLeft: '1em' }, value: ConstText.get('BACK'), event: { click: _=> this.closePicking() }}),
    ]))
    const currentInventory = this.appState.characters.map(i => i.Id)
    const addableCharactersByDate = Object.values(GameDb.Character)
      .reduce((acc, i) => {
        acc[i.DisplayStartAt] = acc[i.DisplayStartAt] || [i.DisplayStartAt, []]
        acc[i.DisplayStartAt][1].push(i.Id)
        return acc
      }, {})
    const addableCharacters = Object.values(addableCharactersByDate)
    addableCharacters.sort((a,b) => (a[0] < b[0] ? 1 : -1))
    addableCharacters.forEach((group) => {
      const groupEle = this.pickingContainer.appendChild(_('p', {}, [_('text', group[0]), _('br')]))
      group[1].forEach(i => {
        const chara = new CharacterData(i, null)
        const charaEle = groupEle.appendChild(_('span', { className: 'list-icon-container hoz-item-with-name', 'data-pick-id': i }, [
          _('span', { className: 'spriteatlas-characters', 'data-id': chara.cardIconId }),
          _('span', { className: `card-attribute-${chara.attributeName}`}),
          _('span', { className: 'sense-star gray-background', 'data-sense-type': chara.sense.getType() }, [_('text', `${chara.sense.data.LightCount} `)]),
          _('text', chara.sense.ct),
          _('text', chara.rarityStr),
          _('br'),
          _('span', { className: 'item-name' }, [_('text', `【${chara.cardName}】${chara.charaName}`)]),
        ]))
        if (currentInventory.includes(i)) {
          charaEle.classList.add('selected')
        } else {
          pickTarget.push(charaEle)
        }
      })
    })
  }
  pickPosterToAdd() {
    const pickTarget = []
    this.createPickingOverlay(e => {
      let pick
      for (let el of pickTarget) {
        if (el.contains(e.target)) {
          pick = el
          break
        }
      }
      if (!pick) return
      const posterId = pick.dataset.pickId | 0
      this.addPoster(posterId)
      this.closePicking()
    })
    this.pickingContainer.appendChild(_('p', {}, [
      _('input', { 'type': 'button', value: ConstText.get('ADD_ALL'), event: { click: _=>{
        this.batchUpdating = true
        pickTarget.forEach(i => this.addPoster(i.dataset.pickId | 0))
        this.batchUpdating = false
        this.update({ poster: true })
        this.closePicking()
      } }}),
      _('input', { 'type': 'button', style: { marginLeft: '1em' }, value: ConstText.get('BACK'), event: { click: _=> this.closePicking() }}),
    ]))
    const currentInventory = this.appState.posters.map(i => i.id)
    const addablePostersByDate = Object.values(GameDb.Poster)
      .reduce((acc, i) => {
        acc[i.DisplayStartAt] = acc[i.DisplayStartAt] || [i.DisplayStartAt, []]
        acc[i.DisplayStartAt][1].push(i.Id)
        return acc
      }, {})
    const addablePosters = Object.values(addablePostersByDate)
    addablePosters.sort((a,b) => (a[0] < b[0] ? 1 : -1))
    addablePosters.forEach((group) => {
      const groupEle = this.pickingContainer.appendChild(_('p', {}, [_('text', group[0]), _('br')]))
      group[1].forEach(i => {
        const poster = new PosterData(i, null)
        const posterEle = groupEle.appendChild(_('span', { className: 'list-icon-container hoz-item-with-name', 'data-pick-id': i }, [
          _('span', { className: 'spriteatlas-posters', 'data-id': poster.id }),
          _('span', { className: 'item-name' }, [_('text', poster.fullPosterName)]),
        ]))
        if (currentInventory.includes(i)) {
          posterEle.classList.add('selected')
        } else {
          pickTarget.push(posterEle)
        }
      })
    })
  }
  pickAccessoryToAdd() {
    const pickTarget = []
    this.createPickingOverlay(e => {
      let pick
      for (let el of pickTarget) {
        if (el.contains(e.target)) {
          pick = el
          break
        }
      }
      if (!pick) return
      const accessoryId = pick.dataset.pickId | 0
      this.addAccessory(accessoryId)
      this.closePicking()
    })
    this.pickingContainer.appendChild(_('p', {}, [
      _('input', { 'type': 'button', value: ConstText.get('ADD_ALL'), event: { click: _=>{
        this.batchUpdating = true
        pickTarget.forEach(i => this.addAccessory(i.dataset.pickId | 0))
        this.batchUpdating = false
        this.update({ accessory: true })
        this.closePicking()
      } }}),
      _('input', { 'type': 'button', style: { marginLeft: '1em' }, value: ConstText.get('BACK'), event: { click: _=> this.closePicking() }}),
    ]))
    Object.values(GameDb.Accessory).forEach(i => {
      const accessory = new AccessoryData(i.Id, null)
      const accessoryEle = this.pickingContainer.appendChild(_('span', { className: 'list-icon-container hoz-item-with-name', 'data-pick-id': i.Id }, [
        _('span', { className: 'spriteatlas-accessories', 'data-id': accessory.id }),
        _('span', { className: 'item-name' }, [_('text', accessory.fullAccessoryName)]),
      ]))
      pickTarget.push(accessoryEle)
    })
  }

  addCharacter(charaId) {
    if (this.appState.characters.find(i => i.Id === charaId)) return
    this.appState.characters.push(new CharacterData(charaId, this.characterContainer))
    this.appState.characters[this.appState.characters.length - 1].updateToMax()
    this.update({ chara: true })
  }
  removeCharacter(chara) {
    this.appState.characters.splice(this.appState.characters.indexOf(chara), 1)
    this.update({ chara: true })
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

  addPoster(posterId) {
    if (this.appState.posters.find(i => i.id === posterId)) return
    this.appState.posters.push(new PosterData(posterId, this.posterContainer))
    this.appState.posters[this.appState.posters.length - 1].updateToMax()
    this.update({ poster: true })
  }
  removePoster(poster) {
    this.appState.posters.splice(this.appState.posters.indexOf(poster), 1)
    this.update({ poster: true })
  }

  addAccessory(accessoryId) {
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
        this.appState.characters.forEach(i => i.update())
      }

      if (parts.poster) {
        this.appState.posters.forEach(i => i.update())
      }

      if (parts.accessory) {
        this.appState.accessories.forEach(i => i.update())
      }
      if (parts.album) {
        this.appState.albumExtra.forEach(i => i.update())
        const extraCount = this.appState.albumExtra.filter(i => i.enabled).length
        this.albumExtraCountLabel.textContent = extraCount
        this.albumExtraCountLabel.style.color = extraCount > 36 ? 'red' : ''
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
      case 'select': {
        this.appState.characters.forEach(i => !i.iconSelectionInput.checked && i.iconNode.style.display !== 'none' && i.toggleSelection())
        break
      }
    }
    this.batchUpdating = false
    this.update({ chara: true, selection: true })
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
      case 'select': {
        this.appState.posters.forEach(i => !i.iconSelectionInput.checked && i.iconNode.style.display !== 'none' && i.toggleSelection())
        break
      }
    }
    this.batchUpdating = false
    this.update({ poster: true, selection: true })
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
      case 'select': {
        this.appState.accessories.forEach(i => !i.iconSelectionInput.checked && i.iconNode.style.display !== 'none' && i.toggleSelection())
        break
      }
    }
    this.batchUpdating = false
    this.update({ accessory: true, selection: true })
  }

  renderSenseNote(skipUpdate = false) {
    const id = this.senseNoteSelect.value | 0;
    const data = GameDb.SenseNotation[id];
    this.appState.selectedNotation = id
    removeAllChilds(this.senseBox)
    for (let i = 0; i < 5; i++) {
      this.senseBox.appendChild(_('div', { className: 'sense-lane' }, [_('div', { className: 'sense-lane-ct' }), _('div', { className: 'sense-lane-box' })]))
    }
    const timings = data.Details.slice()
    timings.sort((a,b) => a.TimingSecond - b.TimingSecond)
    const totalDuration = timings.slice(-1)[0].TimingSecond
    timings.forEach(i => {
      const lane = this.senseBox.children[i.Position - 1].children[1]
      lane.appendChild(_('div', { className: 'sense-node', style: {left: `calc(calc(100% - 40px) * ${i.TimingSecond / totalDuration})`, fontSize: i.TimingSecond > 99 ? '14px' : '' } }, [_('text', i.TimingSecond)]))
    })
    timings.reduce((acc, cur) => (acc[cur.Position-1].push(cur),acc), [[],[],[],[],[]])
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
          /* 
          for (let i = 1; i < choice; i++) {
            [picked[0], picked[i]] = [picked[i], picked[0]]
            comb.push(picked.slice())
          }
          */
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
        if (i.length < 5) {
          i.splice(i.length, 0, ...(new Array(5 - i.length).fill(null)))
        }
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
    if (bestParty.length < 5) {
      bestParty = bestParty.concat(new Array(5 - bestParty.length).fill(null))
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

