export default class ConstText {
  static language = null
  static init() {
    if (ConstText.language) return
    if (localStorage.getItem('wds-calc-language')) {
      ConstText.language = localStorage.getItem('wds-calc-language')
      return
    }
    ConstText.autoDetectLanguage()
  }
  static setLanguage(lang) {
    ConstText.language = lang
    localStorage.setItem('wds-calc-language', lang)
    ConstText.fillText()
  }
  static autoDetectLanguage() {
    for (let lang of navigator.languages) {
      if (lang.startsWith('zh')) {
        return ConstText.language = 'zh'
      }
      if (lang.startsWith('ja')) {
        return ConstText.language = 'ja'
      }
    }
    return ConstText.language = 'en'
  }

  static en = {
    SENSE_NOTATION_TAB_NORMAL: 'Normal (Audition/League）',
    SENSE_NOTATION_TAB_HIGHSCORE: 'Highscore Challenge',
    SENSE_NOTATION_TAB_KEIKO: 'Lesson (Keiko)',

    ALBUM_LEVEL_LABEL: 'Album level: ',
    PARTY_LABEL: 'Party edit',
    IMPORT_DATA_LABEL: 'Load exported',
    EXPORT_DATA_LABEL: 'Export',
    EXPORTER_LABEL: 'Export tool using password',
    HIGHSCORE_BUFF_LABEL: 'Stage Boost: ',

    THEATER_LEVEL_LABEL: 'Theatre level: ',
    SIRIUS: 'Sirius',
    EDEN: 'Eden',
    GINGAZA: 'Gingaza',
    DENKI: 'Gekidan Denki',

    ADD: 'Add',
    DELETE: 'Delete',
    NOT_SELECTED: 'Not selected',
    UPDATE_SELECTION: 'Update selected',
    DELETE_SELECTION: 'Delete selected',
    DELETE_SELECTION_CONFIRM: 'Delete selected items?',
    SELECTION_COUNT_LABEL: 'Selected {0} items: ',
    UNSELECT_ALL: 'Unselect all',
    SELECTION_EMPTY: 'Empty',

    TAB_CHARA: 'Character',
    TAB_POSTER: 'Poster',
    TAB_ACCESSORY: 'Accessory',

    CARD_LABEL_STORY: 'Card story: ',
    CARD_LABEL_SENSE: 'Sense: ',
    CARD_LABEL_BLOOM: 'Bloom: ',
    CARD_SELECTION_EPISODE_READ_0: 'Not read',
    CARD_SELECTION_EPISODE_READ_1: 'Read Episode 1',
    CARD_SELECTION_EPISODE_READ_2: 'Read Episode 2',
    POSTER_LABEL_RELEASE: 'Release: ',

    VOCAL: 'Vocal',
    EXPRESSION: 'Expression',
    CONCENTRATION: 'Concentration',
    PERFORMANCE: 'Performance',
    CALC_TABLE_INITIAL: 'Initial',
    CALC_TABLE_ALBUM: 'Album',
    CALC_TABLE_POSTER: 'Poster',
    CALC_TABLE_ACCESSORY: 'Accessory',
    CALC_TABLE_OTHER: 'Other',
    CALC_TABLE_THEATER: 'Theatre',
    CALC_TABLE_TOTAL_BONUS: 'Total Bonus',
    CALC_TABLE_FINAL_STAT: 'Final Stat',
    CALC_TOTAL_STAT: 'Total stat: ',
    CALC_BASE_SCORE: 'Base score: ',
    CALC_SENSE_SCORE: 'Sense score: ',
    CALC_STARACT_SCORE: 'Star Act score: ',
    CALC_RESULT_STARACT: '{times} times / {score}',
    CALC_TOTAL_SCORE: 'Total score: ',
    CALC_STAR_ACT_REQUIREMENTS: 'StarAct requirements: ',

    LIVE_PHASE_START: 'Before start',
    LIVE_PHASE_START_WITH_STARACT: 'Before start | StarAct activated',
    LIVE_PHASE_SENSE: 'Sense activated: {time}',
    LIVE_PHASE_SENSE_FAILED: 'Sense failed: {time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'Sense activated: {time} | StarAct activated',
    LIVE_LOG_LIFE: 'Life changed: {0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P gauge changed: {0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P gauge limit changed: {0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'Sense failed',
    LIVE_LOG_SENSE_SKIP: 'Skipped',
    LIVE_LOG_SENSE_SCORE: 'Sense score: {0}',
    LIVE_LOG_STARACT_SCORE: 'Star Act activated, score: {0}',
    LIVE_LOG_POSTER_SCORE: 'Poster bonus ({3}): {0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'Sense bonus: {0}%, lasts {1} sec',
    LIVE_LOG_STARACT_UP: 'Star Act bonus: {0}%, lasts{1} sec',
    LIVE_LOG_SENSE_SCORE_EXTRA: 'Sense bonus ({3}): {0} × {1} = {2}',
    LIVE_LOG_STARACT_SCORE_EXTRA: 'Star Act bonus ({3}): {0} × {1} = {2}',

    PARTY_DEFAULT_NAME: 'Party',
    PARTY_DELETE_CONFIRM: 'Delete this party?',
    PARTY_DELETE_LAST: 'Last party cannot be deleted',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: 'Effect type not implemented: {type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: 'Effect trigger not implemented: {trigger} @ {range} ({id})',
    LOG_WARNING_EFFECT_BRANCH_NOT_IMPLEMENTED: 'Branch condition not implemented: {condition} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: 'Bonus based on current score cannot be accurately calculated',
    LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED: 'Score gain type not implemented: {type} ({id})',
    UNDEFINED_STRING: 'Missing text template: {0}',
  }
  static ja = {
    SENSE_NOTATION_TAB_NORMAL: 'オーディション/リーグ',
    SENSE_NOTATION_TAB_HIGHSCORE: 'ハイスコア挑戦',
    SENSE_NOTATION_TAB_KEIKO: '稽古',

    ALBUM_LEVEL_LABEL: 'アルバムレベル：',
    PARTY_LABEL: '編成',
    IMPORT_DATA_LABEL: 'データを導入',
    EXPORT_DATA_LABEL: 'データを保存',
    EXPORTER_LABEL: '連携パスワードで導入するツール',
    HIGHSCORE_BUFF_LABEL: '舞台装置：',

    THEATER_LEVEL_LABEL: '劇場レベル：',
    SIRIUS: 'シリウス',
    EDEN: 'Eden',
    GINGAZA: '銀河座',
    DENKI: '劇団電姫',

    ADD: '追加',
    DELETE: '消す',
    NOT_SELECTED: '未選択',
    UPDATE_SELECTION: '選択を更新',
    DELETE_SELECTION: '選択を消す',
    DELETE_SELECTION_CONFIRM: '選択した項目を消しますか？',
    SELECTION_COUNT_LABEL: '選択した {0} 個：',
    UNSELECT_ALL: '全て選択解除',
    SELECTION_EMPTY: 'はずす',

    TAB_CHARA: 'キャラ',
    TAB_POSTER: 'ポスター',
    TAB_ACCESSORY: 'アクセサリー',

    CARD_LABEL_STORY: 'カードストーリー：',
    CARD_LABEL_SENSE: 'センス：',
    CARD_LABEL_BLOOM: '開花：',
    CARD_SELECTION_EPISODE_READ_0: '未読',
    CARD_SELECTION_EPISODE_READ_1: '前編読む',
    CARD_SELECTION_EPISODE_READ_2: '後編読む',
    POSTER_LABEL_RELEASE: '解放：',

    VOCAL: '歌唱力',
    EXPRESSION: '表現力',
    CONCENTRATION: '集中力',
    PERFORMANCE: '演技力',
    CALC_TABLE_INITIAL: '初期',
    CALC_TABLE_ALBUM: 'アルバム',
    CALC_TABLE_POSTER: 'ポスター',
    CALC_TABLE_ACCESSORY: 'アクセサリー',
    CALC_TABLE_OTHER: 'その他',
    CALC_TABLE_THEATER: '劇場',
    CALC_TABLE_TOTAL_BONUS: 'ボーナス合計',
    CALC_TABLE_FINAL_STAT: '最終',
    CALC_TOTAL_STAT: '合計演技力：',
    CALC_BASE_SCORE: '基礎スコア：',
    CALC_SENSE_SCORE: 'センススコア: ',
    CALC_STARACT_SCORE: 'スターアクトスコア: ',
    CALC_RESULT_STARACT: '{times}回発動 / {score}',
    CALC_TOTAL_SCORE: 'スコア：',
    CALC_STAR_ACT_REQUIREMENTS: 'スターアクト発動条件：',

    LIVE_PHASE_START: 'ライブ前',
    LIVE_PHASE_START_WITH_STARACT: 'ライブ前 | スターアクト発動',
    LIVE_PHASE_SENSE: 'センス発動：{time}',
    LIVE_PHASE_SENSE_FAILED: 'センス失敗：{time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'センス発動：{time} | スターアクト発動',
    LIVE_LOG_LIFE: 'ライフ：{0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P.ゲージ：{0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P.ゲージ上限：{0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'センス失敗',
    LIVE_LOG_SENSE_SKIP: '発動しない',
    LIVE_LOG_SENSE_SCORE: 'センススコア：{0}',
    LIVE_LOG_STARACT_SCORE: 'スターアクト発動、スコア：{0}',
    LIVE_LOG_POSTER_SCORE: 'ポスタースコア({3})：{0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'センスブースト：{0}%，{1}秒間持続',
    LIVE_LOG_STARACT_UP: 'スターアクトブースト：{0}%，{1}秒間持続',
    LIVE_LOG_SENSE_SCORE_EXTRA: 'センスボーナススコア({3})：{0} × {1} = {2}',
    LIVE_LOG_STARACT_SCORE_EXTRA: 'スターアクトボーナススコア({3})：{0} × {1} = {2}',

    PARTY_DEFAULT_NAME: 'パーティー',
    PARTY_DELETE_CONFIRM: 'パーティーを消しますか？',
    PARTY_DELETE_LAST: '最後のパーティーは消せません',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: '効果支援していない：{type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: '効果の条件支援していない：{trigger} @ {range} ({id})',
    LOG_WARNING_EFFECT_BRANCH_NOT_IMPLEMENTED: '分岐条件支援していない：{condition} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: '現在のスコアに基づくボーナスは正確に計算できません',
    LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED: 'スコアボーナスの種類支援していない：{type} ({id})',
    UNDEFINED_STRING: '不足しているテキスト：{0}',
  }
  static zh = {
    SENSE_NOTATION_TAB_NORMAL: '通常（试音/排位）',
    SENSE_NOTATION_TAB_HIGHSCORE: '高分',
    SENSE_NOTATION_TAB_KEIKO: '稽古',

    ALBUM_LEVEL_LABEL: '相册等级：',
    PARTY_LABEL: '编队',
    IMPORT_DATA_LABEL: '导入数据',
    EXPORT_DATA_LABEL: '导出数据',
    EXPORTER_LABEL: '引继码导出工具',
    HIGHSCORE_BUFF_LABEL: '舞台装置：',

    THEATER_LEVEL_LABEL: '剧场等级：',
    SIRIUS: 'Sirius',
    EDEN: 'Eden',
    GINGAZA: '银河座',
    DENKI: '剧团电姬',

    ADD: '添加',
    DELETE: '删除',
    NOT_SELECTED: '未选择',
    UPDATE_SELECTION: '更新选中',
    DELETE_SELECTION: '删除选中',
    DELETE_SELECTION_CONFIRM: '确定删除选中的项目吗？',
    SELECTION_COUNT_LABEL: '选中的 {0} 个：',
    UNSELECT_ALL: '取消所有选中',
    SELECTION_EMPTY: '清空',

    TAB_CHARA: '角色',
    TAB_POSTER: '海报',
    TAB_ACCESSORY: '饰品',

    CARD_LABEL_STORY: '卡面故事：',
    CARD_LABEL_SENSE: 'Sense: ',
    CARD_LABEL_BLOOM: '突破：',
    CARD_SELECTION_EPISODE_READ_0: '未读',
    CARD_SELECTION_EPISODE_READ_1: '已读前篇',
    CARD_SELECTION_EPISODE_READ_2: '已读后篇',
    POSTER_LABEL_RELEASE: '解放：',

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
    CALC_SENSE_SCORE: 'Sense分: ',
    CALC_STARACT_SCORE: 'StarAct分: ',
    CALC_RESULT_STARACT: '{times}次 / {score}',
    CALC_TOTAL_SCORE: '总分：',
    CALC_STAR_ACT_REQUIREMENTS: 'StarAct需求：',

    LIVE_PHASE_START: '开场前',
    LIVE_PHASE_START_WITH_STARACT: '开场前 | StarAct发动',
    LIVE_PHASE_SENSE: 'Sense发动：{time}',
    LIVE_PHASE_SENSE_FAILED: 'Sense发动失败：{time}',
    LIVE_PHASE_SENSE_WITH_STARACT: 'Sense发动：{time} | StarAct发动',
    LIVE_LOG_LIFE: '生命值变化：{0} + {1} = {2}/1000',
    LIVE_LOG_PGUAGE: 'P槽变化：{0} + {1} = {2}/{3}',
    LIVE_LOG_PGUAGE_LIMIT: 'P槽上限变化：{0} + {1} = {2}/{3}',
    LIVE_LOG_SENSE_FAILED: 'Sense发动失败',
    LIVE_LOG_SENSE_SKIP: '跳过发动',
    LIVE_LOG_SENSE_SCORE: 'Sense加分：{0}',
    LIVE_LOG_STARACT_SCORE: 'StarAct发动，加分：{0}',
    LIVE_LOG_POSTER_SCORE: '海报加分({3})：{0} × {1} = {2}',
    LIVE_LOG_SENSE_UP: 'Sense加成：{0}%，持续{1}秒',
    LIVE_LOG_STARACT_UP: 'StarAct加成：{0}%，持续{1}秒',
    LIVE_LOG_SENSE_SCORE_EXTRA: 'Sense额外加分({3})：{0} × {1} = {2}',
    LIVE_LOG_STARACT_SCORE_EXTRA: 'StarAct额外加分({3})：{0} × {1} = {2}',

    PARTY_DEFAULT_NAME: '队伍',
    PARTY_DELETE_CONFIRM: '确定删除队伍吗？',
    PARTY_DELETE_LAST: '最后一个队伍不能删除',

    LOG_WARNING_EFFECT_NOT_IMPLEMENTED: '未支持的效果：{type} ({id})',
    LOG_WARNING_EFFECT_TRIGGER_NOT_IMPLEMENTED: '未支持的效果触发：{trigger} @ {range} ({id})',
    LOG_WARNING_EFFECT_BRANCH_NOT_IMPLEMENTED: '未支持的分支条件：{condition} ({id})',
    LOG_WARNING_INACCURATE_SCORE_GAIN_ON_SCORE: '按当前得分加分的效果无法精确计算分数',
    LOG_WARNING_EFFECT_SCORE_GAIN_TYPE_NOT_IMPLEMENTED: '未支持的加分类型：{type} ({id})',
    UNDEFINED_STRING: '缺失的文本：{0}',
  }

  static get(key, replaces = {}) {
    return (ConstText[ConstText.language][key] || ConstText.get('UNDEFINED_STRING', [key]))
      .replace(/{([^{}}]+)}/g, (ori, name) => (replaces[name]!==undefined ? replaces[name] : ori))
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

ConstText.init();
