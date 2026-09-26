// src/AppCtx.ts
class AppCtx {
  root;
  currView = null;
  constructor(root) {
    this.root = root;
  }
  changeView(view) {
    this.currView?.exit(this);
    this.currView = view;
    this.currView?.enter(this);
  }
  addClickHandler(id, handler) {
    this.root.querySelector(`#${id}`)?.addEventListener("click", handler);
  }
}

// src/game/coords.ts
function coordToLetter(n) {
  return String.fromCharCode(64 + n);
}

class P2 {
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? x ?? 0;
  }
  name() {
    return `${coordToLetter(this.x)}${this.y}`;
  }
}

// src/game/gameAnims.ts
class GameAnim {
  act;
  constructor(act) {
    this.act = act;
  }
}

// src/game/gameState.ts
class GameState {
  score = 0;
  population = 0;
  nature = 0;
  grid = new Grid;
  rules = GameState.makeRules();
  items = [];
  anims = [];
  placeTile(pos, type) {
    const tile = this.grid.getTile(pos);
    switch (type) {
      case 2 /* House1 */:
        if (tile.type !== 1 /* Empty */)
          return;
        this.setTileType(tile, type);
        this.addScore(tile, 1);
        this.addPop(tile, 1);
        break;
      case 8 /* Grass */:
        if (tile.type !== 1 /* Empty */)
          return;
        this.setTileType(tile, type);
        this.addScore(tile, 1);
        this.addNat(tile, 1);
        break;
      case 5 /* Road */:
        if (tile.type !== 1 /* Empty */)
          return;
        this.setTileType(tile, type);
        this.addScore(tile, 1);
        break;
      default:
        console.warn(`Not Implemented: Placing tile ${TileTypes[type]} on ${pos.name()}`);
        return;
    }
    this.applyRules();
  }
  static makeRules() {
    let rules = [];
    rules.push(new Rule("Make Cull-de-sac", {
      cc: 5 /* Road */,
      tc: 2 /* House1 */,
      cl: 2 /* House1 */,
      bc: 2 /* House1 */
    }, (game, area) => {
      game.setTileType(area.cc, 3 /* House2 */);
      game.setTileType(area.tc, 1 /* Empty */);
      game.setTileType(area.cl, 1 /* Empty */);
      game.setTileType(area.bc, 1 /* Empty */);
      game.addScore(area.cc, 3);
    }, 3 /* Rotate4 */));
    rules.push(new Rule("Add Road between Houses", {
      cc: 1 /* Empty */,
      tc: 2 /* House1 */,
      bc: 2 /* House1 */
    }, (game, area) => {
      game.setTileType(area.cc, 5 /* Road */);
      game.addScore(area.cc, 1);
    }, 1 /* Rotate1 */));
    rules.push(new Rule("Make Apartment I", {
      cc: 3 /* House2 */,
      tc: 2 /* House1 */,
      bc: 2 /* House1 */
    }, (game, area) => {
      game.setTileType(area.cc, 4 /* House3 */);
      game.setTileType(area.tc, 1 /* Empty */);
      game.setTileType(area.bc, 1 /* Empty */);
      game.addScore(area.cc, 4);
      game.addPop(area.cc, 4);
    }, 1 /* Rotate1 */));
    rules.push(new Rule("Make Apartment L", {
      cc: 3 /* House2 */,
      tc: 2 /* House1 */,
      cl: 2 /* House1 */
    }, (game, area) => {
      game.setTileType(area.cc, 4 /* House3 */);
      game.setTileType(area.tc, 1 /* Empty */);
      game.setTileType(area.cl, 1 /* Empty */);
      game.addScore(area.cc, 4);
      game.addPop(area.cc, 4);
    }, 3 /* Rotate4 */));
    rules.push(new Rule("Make Intersection", {
      cc: 5 /* Road */,
      tc: 5 /* Road */,
      bc: 5 /* Road */,
      cl: 5 /* Road */,
      cr: 5 /* Road */
    }, (game, area) => {
      game.setTileType(area.cc, 6 /* Intersection */);
      game.addScore(area.cc, 4);
    }, 1 /* Rotate1 */));
    rules.push(new Rule("Make Tree", {
      cc: 8 /* Grass */,
      tc: 8 /* Grass */,
      tl: 8 /* Grass */,
      cl: 8 /* Grass */
    }, (game, area) => {
      game.setTileType(area.cc, 9 /* Tree */);
      game.setTileType(area.tc, 1 /* Empty */);
      game.setTileType(area.tl, 1 /* Empty */);
      game.setTileType(area.cl, 1 /* Empty */);
      game.addScore(area.cc, 4);
      game.addNat(area.cc, 2);
    }, 0 /* None */));
    rules.push(new Rule("Make Pond", {
      cc: 1 /* Empty */,
      tc: 8 /* Grass */,
      tl: 8 /* Grass */,
      cl: 8 /* Grass */,
      cr: 8 /* Grass */
    }, (game, area) => {
      game.setTileType(area.cc, 10 /* Water */);
      game.setTileType(area.tc, 1 /* Empty */);
      game.setTileType(area.tl, 1 /* Empty */);
      game.setTileType(area.cl, 1 /* Empty */);
      game.setTileType(area.cr, 1 /* Empty */);
      game.addScore(area.cc, 2);
    }, 0 /* None */));
    return rules;
  }
  addScore(tile, s) {
    this.score += s;
  }
  addPop(tile, p) {
    this.population += p;
  }
  addNat(tile, n) {
    this.nature += n;
  }
  setTileType(tile, type) {
    if (tile.type === type)
      return;
    console.log(`Setting ${tile.pos.name()} to '${TileTypes[type]}'`);
    tile.type = type;
    this.markForCheck(tile.pos.x, tile.pos.y);
    this.markAdjForCheck(tile.pos);
    if (tile.Elem) {
      this.anims.push(new GameAnim(() => {
        tile.Elem.setAttribute("data-tile", TileTypes[type]);
      }));
    }
  }
  addItem(type, count) {
    count ??= 1;
    for (const item of this.items) {
      if (item.type === type) {
        item.count += count;
        return;
      }
    }
    this.items.push(new Item(type, count));
  }
  tilesToCheck = 0;
  markForCheck(x, y) {
    if (x <= 0 || x >= this.grid.size - 1 || y <= 0 || y >= this.grid.size - 1)
      return;
    const tile = this.grid.getTile(x, y);
    if (!tile.shouldCheck) {
      tile.shouldCheck = true;
      tile.Elem?.setAttribute("data-check", "");
      this.tilesToCheck++;
    }
  }
  markAdjForCheck(pos) {
    this.markForCheck(pos.x - 1, pos.y - 1);
    this.markForCheck(pos.x + 0, pos.y - 1);
    this.markForCheck(pos.x + 1, pos.y - 1);
    this.markForCheck(pos.x - 1, pos.y + 0);
    this.markForCheck(pos.x + 1, pos.y + 0);
    this.markForCheck(pos.x - 1, pos.y + 1);
    this.markForCheck(pos.x + 0, pos.y + 1);
    this.markForCheck(pos.x + 1, pos.y + 1);
  }
  markTileChecked(tile) {
    if (!tile.shouldCheck)
      return;
    tile.shouldCheck = false;
    tile.Elem?.removeAttribute("data-check");
    this.tilesToCheck--;
  }
  applyRules() {
    while (this.tilesToCheck > 0)
      this.applyRulesOnce();
  }
  applyRulesOnce() {
    let ruleIndex = Number.MAX_SAFE_INTEGER;
    let ruleToApply = null;
    let areaToApply = null;
    for (const cc of this.grid.tiles) {
      if (!cc.shouldCheck)
        continue;
      let examinedAllRules = true;
      const pos = cc.pos;
      const tl = this.grid.getTile(pos.x - 1, pos.y + 1);
      const tc = this.grid.getTile(pos.x + 0, pos.y + 1);
      const tr = this.grid.getTile(pos.x + 1, pos.y + 1);
      const cl = this.grid.getTile(pos.x - 1, pos.y + 0);
      const cr = this.grid.getTile(pos.x + 1, pos.y + 0);
      const bl = this.grid.getTile(pos.x - 1, pos.y - 1);
      const bc = this.grid.getTile(pos.x + 0, pos.y - 1);
      const br = this.grid.getTile(pos.x + 1, pos.y - 1);
      let rot000 = new Area3x3(tl, tc, tr, cl, cc, cr, bl, bc, br);
      let rot090 = new Area3x3(tr, cr, br, tc, cc, bc, tl, cl, bl);
      let rot180 = new Area3x3(br, bc, bl, cr, cc, cl, tr, tc, tl);
      let rot270 = new Area3x3(bl, cl, tl, bc, cc, tc, br, cr, tr);
      for (const [index, rule] of this.rules.entries()) {
        if (index >= ruleIndex) {
          examinedAllRules = false;
          continue;
        }
        if (!isTile(rule.match.cc, cc.type))
          continue;
        if (rule.match.isMatch(rot000)) {
          ruleToApply = rule;
          areaToApply = rot000;
          ruleIndex = index;
          break;
        }
        if (rule.matchFlags & 1 /* Rotate1 */) {
          if (rule.match.isMatch(rot090)) {
            ruleToApply = rule;
            areaToApply = rot090;
            ruleIndex = index;
            break;
          }
        }
        if (rule.matchFlags & 3 /* Rotate4 */) {
          if (rule.match.isMatch(rot180)) {
            ruleToApply = rule;
            areaToApply = rot180;
            ruleIndex = index;
            break;
          }
          if (rule.match.isMatch(rot270)) {
            ruleToApply = rule;
            areaToApply = rot270;
            ruleIndex = index;
            break;
          }
        }
      }
      if (examinedAllRules)
        this.markTileChecked(cc);
    }
    if (ruleToApply !== null) {
      console.log(`Applying rule '${ruleToApply.name}' at ${areaToApply.cc.pos.name()}`);
      ruleToApply.apply(this, areaToApply);
    }
  }
}
var TileTypes;
((TileTypes2) => {
  TileTypes2[TileTypes2["Any"] = 0] = "Any";
  TileTypes2[TileTypes2["Empty"] = 1] = "Empty";
  TileTypes2[TileTypes2["House1"] = 2] = "House1";
  TileTypes2[TileTypes2["House2"] = 3] = "House2";
  TileTypes2[TileTypes2["House3"] = 4] = "House3";
  TileTypes2[TileTypes2["Road"] = 5] = "Road";
  TileTypes2[TileTypes2["Intersection"] = 6] = "Intersection";
  TileTypes2[TileTypes2["Bridge"] = 7] = "Bridge";
  TileTypes2[TileTypes2["Grass"] = 8] = "Grass";
  TileTypes2[TileTypes2["Tree"] = 9] = "Tree";
  TileTypes2[TileTypes2["Water"] = 10] = "Water";
})(TileTypes ||= {});
function isTile(pattern, type) {
  return pattern === 0 /* Any */ || pattern === type;
}

class Item {
  type;
  count;
  constructor(type, count) {
    this.type = type;
    this.count = count;
  }
}

class Tile {
  pos;
  type;
  shouldCheck = false;
  Elem = null;
  constructor(pos, type) {
    this.pos = pos;
    this.type = type;
  }
}

class Grid {
  size = 10;
  tiles;
  constructor() {
    this.tiles = Array(this.size * this.size);
    for (let y = 0;y < this.size; ++y) {
      for (let x = 0;x < this.size; ++x) {
        this.tiles[y * this.size + x] = new Tile(new P2(x, y), 1 /* Empty */);
      }
    }
  }
  getTile(xOrPos, y) {
    if (typeof xOrPos === "object") {
      return this.tiles[xOrPos.y * this.size + xOrPos.x];
    }
    return this.tiles[y * this.size + xOrPos];
  }
  getTileType(xOrPos, y) {
    const x = typeof xOrPos === "object" ? xOrPos.x : xOrPos;
    const py = typeof xOrPos === "object" ? xOrPos.y : y;
    if (x < 0 || x >= this.size || py < 0 || py >= this.size)
      return 1 /* Empty */;
    return this.tiles[py * this.size + x].type;
  }
  isTileEmpty(pos) {
    return this.getTileType(pos) === 1 /* Empty */;
  }
}

class Match3x3 {
  tl = 0 /* Any */;
  tc = 0 /* Any */;
  tr = 0 /* Any */;
  cl = 0 /* Any */;
  cc = 1 /* Empty */;
  cr = 0 /* Any */;
  bl = 0 /* Any */;
  bc = 0 /* Any */;
  br = 0 /* Any */;
  constructor(init) {
    Object.assign(this, init);
  }
  isMatch(area) {
    return isTile(this.tc, area.tc.type) && isTile(this.cr, area.cr.type) && isTile(this.bc, area.bc.type) && isTile(this.cl, area.cl.type) && isTile(this.tl, area.tl.type) && isTile(this.tr, area.tr.type) && isTile(this.br, area.br.type) && isTile(this.bl, area.bl.type);
  }
}

class Area3x3 {
  tl;
  tc;
  tr;
  cl;
  cc;
  cr;
  bl;
  bc;
  br;
  constructor(tl, tc, tr, cl, cc, cr, bl, bc, br) {
    this.tl = tl;
    this.tc = tc;
    this.tr = tr;
    this.cl = cl;
    this.cc = cc;
    this.cr = cr;
    this.bl = bl;
    this.bc = bc;
    this.br = br;
  }
  static create(tiles) {
    return new Area3x3(...tiles);
  }
}
class Rule {
  name;
  match;
  matchFlags;
  apply;
  constructor(name, match, apply, matchFlags) {
    this.name = name;
    this.match = new Match3x3(match);
    this.matchFlags = matchFlags ?? 1 /* Rotate1 */;
    this.apply = apply;
  }
}

// src/views/GameView.ts
function getPosFromTileElem(tile) {
  if (!tile)
    return;
  const xData = tile.getAttribute("data-col");
  const yData = tile.getAttribute("data-row");
  if (!xData || !yData)
    return;
  return new P2(parseInt(xData, 10), parseInt(yData, 10));
}

class GameView {
  _ctx;
  _boardElem;
  _infoElem;
  state = new GameState;
  constructor(ctx) {
    this._ctx = ctx;
  }
  enter(ctx) {
    let gridHtml = ``;
    const size = this.state.grid.size - 2;
    for (let r = 0;r < size; ++r) {
      const row = size - (r + 1);
      const y = row + 1;
      for (let c = 0;c < size; ++c) {
        const tileAB = (row % 2 + c) % 2 ? "a" : "b";
        const x = c + 1;
        gridHtml += `<div
					id="tile_${x}_${y}"
					class="tile tile-${tileAB} tile-row${y} tile-col${x}"
					data-row=${y}
					data-col=${x}>
				</div>`;
      }
    }
    const creditsHtml = `
<p class="credit">Developed by SevenSidedVoxel</p>
<a class="kofi-link" href='https://ko-fi.com/C5L027OU2F' target='_blank'>
	<img style='height:2em;'
		src='https://storage.ko-fi.com/cdn/kofi3.png?v=6'
		alt='Buy Me a Coffee at ko-fi.com' />
</a>
<p class="version">${BuildID} - ${BuildTimestamp}</p>
		`;
    ctx.root.innerHTML = `
<div class="game">
	<section id="gameInfo" class="game-info">
		<h2>Tum Town</h2>

		<div class="credits-landscape">
			${creditsHtml}
		</div>
	</section>
	<section id="gameBoard" class="game-board">
		${gridHtml}
	</section>
	<section id="gameCredits" class="credits-portrait">
		${creditsHtml}
	</section>
</div>
		`;
    this._boardElem = ctx.root.querySelector("#gameBoard");
    if (this._boardElem == null)
      return;
    this._infoElem = ctx.root.querySelector("#gameInfo");
    if (this._infoElem == null)
      return;
    for (let y = 1;y < size + 1; ++y) {
      for (let x = 1;x < size + 1; ++x) {
        const tileElem = this._boardElem.querySelector(`#tile_${x}_${y}`);
        if (!tileElem)
          continue;
        const pos = new P2(x, y);
        const tile = this.state.grid.getTile(pos);
        tile.Elem = tileElem;
        tile.Elem.addEventListener("mouseenter", () => this.hoverTileStart(pos));
        tile.Elem.addEventListener("mouseleave", () => this.hoverTileEnd(pos));
      }
    }
    this._boardElem.addEventListener("pointerdown", (e) => {
      const tile = e.target.closest(".tile");
      var pos = getPosFromTileElem(tile);
      if (pos !== undefined)
        this.pressTileStart(pos);
    });
    this._boardElem.addEventListener("pointerup", (e) => {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const tile = elem?.closest(".tile");
      var pos = getPosFromTileElem(tile);
      if (pos !== undefined)
        this.pressTileEnd(pos);
    });
    this._boardElem.addEventListener("pointercancel", this.pressTileCancel);
  }
  exit(ctx) {}
  clickTile(pos) {
    this.state.placeTile(pos, 2 /* House1 */);
    this.applyAnims();
  }
  dragTile(start, end) {}
  hoverTileStart(pos) {
    this._boardElem?.querySelectorAll(`.tile-row${pos.y}`)?.forEach((tile) => tile.classList.add("highlight-row"));
    this._boardElem?.querySelectorAll(`.tile-col${pos.x}`)?.forEach((tile) => tile.classList.add("highlight-col"));
    this._boardElem?.querySelector(`#tile_${pos.x}_${pos.y}`)?.classList.add("highlight");
  }
  hoverTileEnd(pos) {
    this.clearHighlighting();
  }
  clearHighlighting() {
    this._boardElem?.querySelectorAll(`.tile`)?.forEach((tile) => tile.classList.remove("highlight", "highlight-row", "highlight-col"));
  }
  _applyingAnims = false;
  _fastApplyAnims = false;
  applyAnims() {
    if (this._applyingAnims) {
      this._fastApplyAnims = true;
      return;
    }
    this._applyingAnims = true;
    this.applyNextAnim();
  }
  applyNextAnim() {
    if (this.state.anims.length < 1) {
      this._applyingAnims = false;
      this._fastApplyAnims = false;
      return;
    }
    const anim = this.state.anims.shift();
    anim?.act();
    const delayMS = this._fastApplyAnims ? 65 : 150;
    setTimeout(() => {
      this.applyNextAnim();
    }, delayMS);
  }
  _pressTileData = null;
  pressTileStart(coord) {
    this._pressTileData = coord;
  }
  pressTileEnd(pos) {
    if (this._pressTileData === null)
      return;
    if (this._pressTileData.x !== pos.x || this._pressTileData.y !== pos.y) {
      this.dragTile(this._pressTileData, pos);
    } else
      this.clickTile(pos);
    this._pressTileData = null;
  }
  pressTileCancel() {
    this._pressTileData = null;
  }
}

// src/index.ts
var BuildTimestamp = "v20260926_142122";
var BuildID = "bannock";
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("content-root");
  var ctx = new AppCtx(root);
  ctx.changeView(new GameView(ctx));
});
