import { readFileSync } from 'fs';

import RootLogic from '../src/logic/RootLogic';
import GameDb from '../src/db/GameDb';
import CharacterData from '../src/character/CharacterData';
import AccessoryData from '../src/accessory/AccessoryData';
import ScoreCalculator from '../src/logic/ScoreCalculator';
import ScoreCalculationType from '../src/logic/ScoreCalculationType';
import StatBonusType from '../src/logic/StatBonusType';
import StatBonus from '../src/logic/StatBonus';

/* global global jest describe test expect beforeAll */
global.window = global

beforeAll(async () => {
  // 模拟本地fetch
  global.fetch = jest.fn(async url => {
    const path = url.split('?')[0].replace('./', process.cwd() + '/');
    const data = readFileSync(path, 'utf-8');
    return {
      ok: true,
      text: async () => data,
      json: async () => JSON.parse(data),
    }
  })

  // 全局初始化GameDb，root.init() 内较复杂，不使用
  window.root = new RootLogic();
  await GameDb.load();
  root.senseNoteSelect = { value: 1 }
})

describe('Logic tests', () => {
  test('db is loaded', () => {
    expect(GameDb.CharacterBase[101]?.Id).toBe(101);
  })

  // 430200 T恤 1000120 含 Trigger，范围 None
  test('accessory trigger with range none', () => {
    const chara1 = CharacterData.fromJSON([110010, 195, 0,0,5,0])
    const chara2 = CharacterData.fromJSON([140520, 195, 1,2,5,0])
    chara1.starRank = 1
    chara2.starRank = 1
    const characters = [chara1,chara1,chara1,chara1,chara2]
    const posters = [null, null, null, null, null]
    const accessory = AccessoryData.fromJSON([430200, 10, null])
    accessory.update()
    const accessories = [null, null, null, null, accessory]
    const calc = new ScoreCalculator(characters, posters, accessories, {
      albumLevel: 0,
      albumExtra: [],
      leader: chara1,
      type: ScoreCalculationType.Normal,
    })
    calc.calc(null)

    expect(calc.stat.buff[4][StatBonusType.Accessory][0][StatBonus.Vocal]).toBe(5500)

    const chara3 = CharacterData.fromJSON([110020, 195, 0,0,5,0])
    chara3.starRank = 1
    characters[4] = chara3
    const calc2 = new ScoreCalculator(characters, posters, accessories, {
      albumLevel: 0,
      albumExtra: [],
      leader: chara1,
      type: ScoreCalculationType.Normal,
    })
    calc2.calc(null)
    expect(calc2.stat.buff[4][StatBonusType.Accessory][0][StatBonus.Vocal]).toBe(0)
  })
})

