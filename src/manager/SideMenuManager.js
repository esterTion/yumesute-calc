import _ from "../createElement"

export default class SideMenuManager {
  static init() {
    SideMenuManager.instance = new SideMenuManager()
  }
  constructor() {
    this.container = document.querySelector('#app').appendChild(_('div', { class: 'side-menu-container' }))
    this.anchorItems = [...document.querySelectorAll('[data-menu-anchor]')]
    this.anchorItems.forEach(anchor => {
      this.container.appendChild(_('div', { class: 'side-menu-item', 'data-text-key': anchor.dataset.menuAnchor, event: { click: e => this.scroll(e) } }))
    })
    window.addEventListener('scroll', () => {
      let activeIndex = 0
      this.anchorItems.forEach((anchor, index) => {
        if (window.scrollY >= anchor.offsetTop) activeIndex = index
      })
      for (let i = 0; i < this.anchorItems.length; i++) {
        this.container.children[i].classList.toggle('active', i === activeIndex)
      }
    })
  }

  scroll(e) {
    const anchor = this.anchorItems.find(anchor => anchor.dataset.menuAnchor === e.target.dataset.textKey)
    this.scrollTarget = anchor
    const start = performance.now()
    const distance = anchor.offsetTop - window.scrollY
    const startY = window.scrollY
    const tick = () => {
      const elapsed = performance.now() - start
      if (this.scrollTarget !== anchor) return
      if (elapsed < 300) {
        window.scrollTo(0, startY + distance * Math.sin(elapsed / 500 * Math.PI / 2))
        requestAnimationFrame(tick)
      } else {
        window.scrollTo(0, startY + distance)
      }
    }
    requestAnimationFrame(tick)
  }

}
