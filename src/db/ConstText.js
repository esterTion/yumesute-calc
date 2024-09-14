import ConstTextEn from "./ConstText_en"
import ConstTextJa from "./ConstText_ja"
import ConstTextZh from "./ConstText_zh"

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

  static en = ConstTextEn
  static ja = ConstTextJa
  static zh = ConstTextZh

  static htmlKey = {
    FILTER_EFFECT_SENSE_LIGHT_SUPPORT: true,
    FILTER_EFFECT_SENSE_LIGHT_CONTROL: true,
    FILTER_EFFECT_SENSE_LIGHT_AMPLIFICATION: true,
    FILTER_EFFECT_SENSE_LIGHT_SPECIAL: true,
    FILTER_EFFECT_SENSE_LIGHT_VARIABLE: true,
  }

  static get(key, replaces = {}) {
    return (ConstText[ConstText.language][key] || ConstText.get('UNDEFINED_STRING', [key]))
      .replace(/{([^{}}]+)}/g, (ori, name) => (replaces[name]!==undefined ? replaces[name] : ori))
  }

  static fillText() {
    document.querySelectorAll('[data-text-key]').forEach(i => {
      if (ConstText.htmlKey[i.dataset.textKey]) {
        i.innerHTML = ConstText.get(i.dataset.textKey)
      } else {
        i.textContent = ConstText.get(i.dataset.textKey)
      }
    })
    document.querySelectorAll('[data-text-value]').forEach(i => {
      i.value = ConstText.get(i.dataset.textValue)
    })
  }
}

ConstText.init();
