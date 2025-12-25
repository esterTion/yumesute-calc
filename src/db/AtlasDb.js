import _ from "../createElement";

export default class AtlasDb {
  static versions = null;
  static loadPromise = null;
  static async addAtlasSheet(name) {
    if (!AtlasDb.loadPromise) {
      AtlasDb.loadPromise = fetch(`/wds/sprite/atlas-versions.json?t=${Date.now()}`)
        .then(r => r.json())
        .then(v => { AtlasDb.versions = v; })
        .catch(err => { AtlasDb.versions = {}; });
    }
    await AtlasDb.loadPromise;
    const version = AtlasDb.versions[name] ?? '0';
    document.head.appendChild(_('link', {
      rel: 'stylesheet',
      href: `https://redive.estertion.win/wds/sprite/${name}.css?v=${version}`
    }));
  }
}
