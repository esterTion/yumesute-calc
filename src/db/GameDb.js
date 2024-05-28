export default class GameDb {
  static Character = {};
  static CharacterBase = {};
  static CharacterLevel = {};
  static CharacterBloomBonusGroup = {};
  static CharacterStarRank = {};
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

  static StoryEventHighScoreBuffSetting = {};

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
      this.loadKeyedMasterTable('CharacterStarRankMaster', 'Rank').then(r => this.CharacterStarRank = r).then(updateProgress),
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

      this.loadKeyedMasterTable('StoryEventHighScoreBuffSettingMaster').then(r => this.StoryEventHighScoreBuffSetting = r).then(updateProgress),
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
