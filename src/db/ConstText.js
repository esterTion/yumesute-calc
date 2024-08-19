import ConstTextEn from "./ConstText.en"
import ConstTextJa from "./ConstText.ja"
import ConstTextZh from "./ConstText.zh"

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
