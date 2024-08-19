import _ from "../../createElement"

class PosterSortType {
	static NONE       = 'SORT_KEY_NONE'
	static RARITY     = 'SORT_KEY_RARITY'
	static LEVEL      = 'SORT_KEY_LEVEL'
	static RELEASE    = 'SORT_KEY_RELEASE'

	static getKeys() {
		return [
			this.LEVEL,
			this.RARITY,
			this.RELEASE,
		]
	}
}

export default class {
	constructor() {
		this.node = _('form', { event: { change: _ => this.updateSort() }}, [
			_('div', { 'data-text-key': 'LABEL_SORT_BY' }),
			_('div', {}, PosterSortType.getKeys().map(key => _('label', {}, [
				_('input', { type: 'radio', name: 'sort', value: key }),
				_('span', { 'data-text-key': key }),
			]))),
			_('div', {}, [
				_('span', { 'data-text-key': 'LABEL_SORT_DIRECTION' }),
				_('label', {}, [
					_('input', { type: 'radio', name: 'order', value: 'asc' }),
					_('span', { 'data-text-key': 'LABEL_SORT_ASC' }),
				]),
				_('label', {}, [
					_('input', { type: 'radio', name: 'order', value: 'desc' }),
					_('span', { 'data-text-key': 'LABEL_SORT_DESC' }),
				]),
			])
		])

		this.sortType = PosterSortType.NONE
		this.node.sort.value = PosterSortType.NONE
		this.node.order.value = 'asc'
	}
	render() {
		return this.node
	}
	updateSort() {
		this.sortType = this.node.sort.value
		this.sortOrder = this.node.order.value
	}

	compare(a, b) {
		if (this.sortType === PosterSortType.NONE) return 0
		let result = 0
		let order = this.sortOrder === 'asc' ? 1 : -1
		switch (this.sortType) {
			case PosterSortType.RARITY:  { result = a.data.Rarity.length - b.data.Rarity.length; break }
			case PosterSortType.LEVEL:   { result = a.level - b.level; break }
			case PosterSortType.RELEASE: { result = a.release - b.release; break }
		}
		if (result === 0) {
			result = a.id - b.id
		}
		return result * order
	}
}