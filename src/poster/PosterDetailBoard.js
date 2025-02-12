import _ from "../createElement"
import ConstText from "../db/ConstText"
import GameDb from "../db/GameDb"
import removeAllChilds from "../removeAllChilds"

export default class PosterDetailBoard {
  static show(posterId) {
    return new PosterDetailBoard(posterId)
  }

  constructor(posterId) {
    this.id = posterId
    if (!GameDb.Poster[posterId]) throw new Error(`Poster ${posterId} not found`)
    this.data = GameDb.Poster[posterId]

    this.container = document.body.appendChild(_('div', { className: 'picking-overlay', event: { click: e => e.target === this.container && this.close() } }, [
      _('div', { className: 'picking-container' }, [
        _('input', { type: 'button', value: ConstText.get('BACK'), event: { click: () => this.close() } }),
        this.layerToggles = _('div', { className: 'poster-layer-toggles' }),
        this.loadingText = _('div'),
        _('div', { style: {position: 'relative'}}, [
          _('img', {
            src: `https://redive.estertion.win/wds/poster/${this.id}_0.webp`,
            crossorigin: 'anonymous',
            style: { width: '100%' },
            event: { load: _ => {this.loaded++, this.drawImg()}, error: _ => {this.failed++, this.drawImg()} }
          }),
          this.canvas = _('canvas', { style: { width: '100%', position: 'absolute', left: 0, top: 0 }, event: { click: _ => {
            const newWin = window.open('about:blank', '_blank')
            this.drawImg()
            this.canvas.toBlob(blob => {
              const url = URL.createObjectURL(blob)
              newWin.location.replace(url)
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            })
          } } }),
        ]),
        this.posterStoryContainer = _('div', { style: { whiteSpace: 'pre-wrap' } }, [_('text', 'Loading stories...')]),

        this.srcImageContainer = _('div', { style: { display: 'none' }}, []),
      ])
    ]))
    this.loaded = 0
    this.failed = 0
    this.total = 1
    this.renderPosition = [
      [this.canvas.previousSibling, 0, 0, true],
    ]
    for (let i = 1; i < 4; i++) {
      if (this.data[`SubTitlePositionX${i}`] === undefined) continue
      this.total++
      const partInfo = [
        this.srcImageContainer.appendChild(_('img', {
          src: `https://redive.estertion.win/wds/poster_parts/${this.id}_${i}.webp`,
          crossorigin: 'anonymous',
          event: { load: _ => {this.loaded++, this.drawImg()}, error: _ => {this.failed++, this.drawImg()} }
        })),
        this.data[`SubTitlePositionX${i}`],
        this.data[`SubTitlePositionY${i}`],
        true
      ]
      this.renderPosition.push(partInfo)
      this.layerToggles.appendChild(_('label', {}, [
        _('input', { type: 'checkbox', checked: true, event: { change: e => {partInfo[3] = e.target.checked, this.drawImg()} } }),
        _('text', `Part ${i}`)
      ]))
    }
    if (this.data.Orientation === 'Portrait') {
      this.canvas.width = 1357
      this.canvas.height = 1920
    } else {
      this.canvas.width = 1920
      this.canvas.height = 1357
    }

    GameDb.extraLoadPromise.PosterStory.then(_ => this.renderPosterStory())

    document.body.classList.add('picking')
    this.drawImg()
  }

  renderPosterStory() {
    removeAllChilds(this.posterStoryContainer)
    const stories = Object.values(GameDb.PosterStory).filter(i => i.PosterMasterId === this.id)
    const afterTalk = []
    for (const story of stories) {
      if (story.EpisodeType === 'AfterTalk') afterTalk.push(story)
      else {
        this.posterStoryContainer.appendChild(_('details', {}, [
          _('summary', {}, [_('text', story.EpisodeType)]),
          _('div', { translate: 'yes', style: { background: '#E0E0E0', padding: '5px 10px', borderRadius: '3px' } }, [_('text', story.Description.replace(/\/n/g, '\n'))])
        ]))
      }
    }
    if (afterTalk.length) {
      afterTalk.sort((a, b) => a.Order - b.Order)
      this.posterStoryContainer.appendChild(_('details', {}, [
        _('summary', {}, [_('text', 'AfterTalk')]),
        _('div', { style: { background: '#E0E0E0', padding: '5px 10px', borderRadius: '3px' } }, afterTalk.map(i => _('p', {}, [
          _('span', { className: 'spriteatlas-characterlog after-talk-icon', 'data-id': i.CharacterBaseMasterId }),
          _('text', `${GameDb.CharacterBase[i.CharacterBaseMasterId].Name}：\n`),
          _('span', { translate: 'yes' }, [_('text', i.Description.replace(/\/n/g, '\n'))]),
        ])))
      ]))
    }
  }

  drawImg() {
    this.loadingText.textContent = (this.loaded < this.total ? 'Loading' : 'Loaded') + ` ${this.loaded}/${this.total}`
    if (this.failed) this.loadingText.textContent += ` (${this.failed} failed)`
    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const [img, x, y, visible] of this.renderPosition) {
      if (!visible) continue
      ctx.drawImage(img, x, y)
    }
  }

  close() {
    this.container.remove()
    document.body.classList.remove('picking')
  }
}
