import { SenseTypeTextEnum } from './Enum'

export default class BeautyText {
  static convertGameTextToValidDom(text) {
    return text
      .replace(/\*/g, '✦')
      .replace(/<color=(#[0-9A-Fa-f]*)>(.*?)<\/color>/g, '<span style="color: $1">$2</span>')
      .replace(/(支援|支配|増幅|特殊)系の光/g, (text, type) => `<span class="sense-star" data-sense-type="${SenseTypeTextEnum[type]}">${text}</span>`)
  }
}
