export default class GameDb {
  static Character = {};
  static CharacterBase = {};
  static CharacterLevel = {};
  static CharacterBloomBonusGroup = {};
  static CharacterStarRank = {};
  static Sense = {};
  static StarAct = {};
  static StarActCondition = {};
  static LeaderSense = {};
  static Category = {};

  static AlbumEffect = {};
  static PhotoEffect = {};
  static Effect = {};
  static EffectTriggerCharacterBaseGroup = {};

  static Poster = {};
  static PosterAbility = {};
  static PosterStory = {};

  static Accessory = {};
  static AccessoryEffect = {};
  static RandomEffectGroup = {};

  static SenseNotation = {};
  static League = {};
  static TripleCast = {};

  static CircleTheaterLevel = {};
  static CircleSupportCompanyLevelDetail = {};

  static StoryEvent = {};
  static StoryEventHighScoreBuffSetting = {};

  static Gacha = {};

  static extraLoadPromise = {};

  static async load() {
    GameDb.DB_VERSION = await fetch(`./master/!version.txt?t=${Date.now()}`).then(r => r.text())
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
      this.loadKeyedMasterTable('LeaderSenseMaster').then(r => this.LeaderSense = r).then(updateProgress),
      this.loadKeyedMasterTable('CategoryMaster').then(r => this.Category = r).then(updateProgress),

      this.loadKeyedMasterTable('AlbumEffectMaster').then(r => this.AlbumEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('PhotoEffectMaster').then(r => this.PhotoEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('EffectMaster').then(r => this.Effect = r).then(updateProgress),
      this.loadKeyedMasterTable('EffectTriggerCharacterBaseGroupMaster').then(r => this.EffectTriggerCharacterBaseGroup = r).then(updateProgress),

      this.loadKeyedMasterTable('PosterMaster').then(r => this.Poster = r).then(updateProgress),
      this.loadKeyedMasterTable('PosterAbilityMaster').then(r => this.PosterAbility = r).then(updateProgress),

      this.loadKeyedMasterTable('AccessoryMaster').then(r => this.Accessory = r).then(updateProgress),
      this.loadKeyedMasterTable('AccessoryEffectMaster').then(r => this.AccessoryEffect = r).then(updateProgress),
      this.loadKeyedMasterTable('RandomEffectGroupMaster').then(r => this.RandomEffectGroup = r).then(updateProgress),

      this.loadKeyedMasterTable('SenseNotationMaster').then(r => this.SenseNotation = r).then(updateProgress),
      this.loadKeyedMasterTable('LeagueMaster').then(r => this.League = r).then(updateProgress),
      this.loadKeyedMasterTable('TripleCastMaster').then(r => this.TripleCast = r).then(updateProgress),

      this.loadKeyedMasterTable('CircleTheaterLevelMaster').then(r => this.CircleTheaterLevel = r).then(updateProgress),
      this.loadKeyedMasterTable('CircleSupportCompanyLevelDetailMaster').then(r => this.CircleSupportCompanyLevelDetail = r).then(updateProgress),

      this.loadKeyedMasterTable('StoryEventMaster').then(r => this.StoryEvent = r).then(updateProgress),
      this.loadKeyedMasterTable('StoryEventHighScoreBuffSettingMaster').then(r => this.StoryEventHighScoreBuffSetting = r).then(updateProgress),
    ]
    const total = promises.length
    updateProgress()

    await Promise.all(promises)

    this.extraLoadPromise.PosterStory = this.loadKeyedMasterTable('PosterStoryMaster').then(r => this.PosterStory = r)
    this.extraLoadPromise.Gacha = this.loadKeyedMasterTable('GachaMaster').then(r => this.Gacha = r)

    document.getElementById('loading').textContent = 'Preparing'
    await new Promise(res => {
      setTimeout(res, 0)
    })
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
    const resp = await fetch(`./master/${tableName}.json?v=${GameDb.DB_VERSION}`).then(r => r.json())
    return resp
  }
}
