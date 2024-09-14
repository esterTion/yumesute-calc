import _ from "../createElement"
import removeAllChilds from "../removeAllChilds"

import CharacterRarityFilter from "./filters/character/RarityFilter"
import CharacterSenseTypeFilter from "./filters/character/SenseTypeFilter"
import CharacterAttributeFilter from "./filters/character/AttributeFilter"
import CharacterFilter from "./filters/character/CharacterFilter"
import CharacterObtainMethodFilter from "./filters/character/ObtainMethod"
import CharacterMaxTalentFilter from "./filters/character/MaxTalentFilter"
import CharacterSenseEffectFilter from "./filters/character/SenseEffectFilter"

import PosterRarityFilter from "./filters/poster/RarityFilter"
import PosterEffectFilter from "./filters/poster/EffectFilter"

import AccessoryRarityFilter from "./filters/accessory/RarityFilter"
import AccessoryEffectFilter from "./filters/accessory/EffectFilter"

import CharacterSorter from "./sorters/CharacterSorter"
import PosterSorter from "./sorters/PosterSorter"
import AccessorySorter from "./sorters/AccessorySorter"

export default class FilterManager {
  constructor(parent, conditions, sorter) {
    this.container = parent.appendChild(_('div'))
    this.conditions = conditions
    this.sorter = sorter
  }

  remove() {
    this.container.remove()
  }
  render() {
    removeAllChilds(this.container)
    this.container.appendChild(this.sorter.render())
    this.conditions.forEach(condition => {
      this.container.appendChild(condition.render())
    })
    this.container.appendChild(_('hr'))
  }
  filterAndSort(data) {
    data.sort((a,b) => this.sorter.compare(a,b))
    data.forEach(item => {
      item.appendNode(item.node.parentNode)
      if (this.conditions.every(condition => condition.check(item))) {
        item.iconNode.style.display = ''
      } else {
        if (item.iconSelectionInput.checked) item.toggleSelection()
        item.iconNode.style.display = 'none'
      }
    })
  }

  static getCharacterFilters() {
    return [
      new CharacterRarityFilter,
      new CharacterSenseTypeFilter,
      new CharacterAttributeFilter,
      new CharacterFilter,
      new CharacterObtainMethodFilter,
      new CharacterMaxTalentFilter,
      new CharacterSenseEffectFilter,
    ]
  }
  static getPosterFilters() {
    return [
      new PosterRarityFilter,
      new PosterEffectFilter,
    ]
  }
  static getAccessoryFilters() {
    return [
      new AccessoryRarityFilter,
      new AccessoryEffectFilter,
    ]
  }
  static getCharacterSorter() {
    return new CharacterSorter
  }
  static getPosterSorter() {
    return new PosterSorter
  }
  static getAccessorySorter() {
    return new AccessorySorter
  }
}
