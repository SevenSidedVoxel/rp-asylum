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

// src/views/GameView.ts
function coordToLetter(n) {
  return String.fromCharCode(65 + n);
}
function getPosFromTileElem(tile) {
  if (!tile)
    return;
  const xData = tile.getAttribute("data-col");
  const yData = tile.getAttribute("data-row");
  if (!xData || !yData)
    return;
  return new P2(parseInt(xData, 10), parseInt(yData, 10));
}

class P2 {
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? x ?? 0;
  }
  name() {
    return `${coordToLetter(this.x)}${this.y + 1}`;
  }
}

class Tile {
  pos;
  effects = [];
  Elem;
  constructor(pos, elem) {
    this.pos = pos;
    this.Elem = elem;
  }
  addRecolorEffect(durationMS) {
    this.Elem.classList.add("linger");
    this.effects.push(window.setTimeout(() => {
      this.Elem.classList.remove("linger");
    }, durationMS));
  }
}

class GameView {
  _ctx;
  _boardElem;
  _infoElem;
  _gridSize = 8;
  _tiles;
  constructor(ctx) {
    this._ctx = ctx;
    this._tiles = Array(this._gridSize * this._gridSize).fill(undefined);
  }
  enter(ctx) {
    let gridHtml = ``;
    for (let r = 0;r < this._gridSize; ++r) {
      const row = this._gridSize - (r + 1);
      for (let c = 0;c < this._gridSize; ++c) {
        const tileAB = (row % 2 + c) % 2 ? "a" : "b";
        gridHtml += `<div
					id="tile_${c}_${row}"
					class="tile tile-${tileAB} tile-row${row} tile-col${c}"
					data-row=${row}
					data-col=${c}>
				</div>`;
      }
    }
    ctx.root.innerHTML = `
<div class="game">
	<section id="gameBoard" class="game-board">
		${gridHtml}
	</section>
	<section id="gameInfo" class="game-info">
		<h2>Info</h2>
	</section>
</div>
		`;
    this._boardElem = ctx.root.querySelector("#gameBoard");
    if (this._boardElem == null)
      return;
    this._infoElem = ctx.root.querySelector("#gameInfo");
    if (this._infoElem == null)
      return;
    for (let r = 0;r < this._gridSize; ++r) {
      for (let c = 0;c < this._gridSize; ++c) {
        const tileElem = this._boardElem.querySelector(`#tile_${c}_${r}`);
        if (!tileElem)
          continue;
        const tile = this.makeTile(c, r, tileElem);
        const pos = new P2(c, r);
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
  makeTile(c, r, elem) {
    const index = r * this._gridSize + c;
    this._tiles[index] = new Tile(new P2(c, r), elem);
    return this._tiles[index];
  }
  getTile(c, r) {
    return this._tiles[r * this._gridSize + c];
  }
  recentMessages = [];
  clickTile(pos) {
    console.log(`clicked ${pos.name()}`);
    this.recentMessages.push(`clicked ${pos.name()}`);
    while (this.recentMessages.length > 10)
      this.recentMessages.shift();
    this._infoElem.innerHTML = `<h2>Info</h2>`;
    this.recentMessages.forEach((msg) => {
      this._infoElem.innerHTML += `
				<p>${msg}</p>
			`;
    });
  }
  dragTile(start, end) {
    console.log(`drag ${start.name()} to ${end.name()}`);
    this.recentMessages.push(`drag ${start.name()} to ${end.name()}`);
    while (this.recentMessages.length > 10)
      this.recentMessages.shift();
    this._infoElem.innerHTML = `<h2>Info</h2>`;
    this.recentMessages.forEach((msg) => {
      this._infoElem.innerHTML += `
				<p>${msg}</p>
			`;
    });
  }
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
var BuildTimestamp = "v20260925_172004";
var BuildID = "banana";
document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("version");
  footer.innerHTML = `${BuildID} - ${BuildTimestamp}`;
  const root = document.getElementById("content-root");
  var ctx = new AppCtx(root);
  ctx.changeView(new GameView(ctx));
});
