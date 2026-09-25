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

class Tile {
  effects = [];
  Elem;
  constructor(elem) {
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
<section id="gameBoard" class="game-board">
	${gridHtml}
</section>
		`;
    this._boardElem = ctx.root.querySelector("#gameBoard");
    if (this._boardElem == null)
      return;
    for (let r = 0;r < this._gridSize; ++r) {
      for (let c = 0;c < this._gridSize; ++c) {
        const tileElem = this._boardElem.querySelector(`#tile_${c}_${r}`);
        if (!tileElem)
          continue;
        const tile = this.makeTile(c, r, tileElem);
        tile.Elem.addEventListener("pointerdown", () => this.pressTileStart(c, r));
        tile.Elem.addEventListener("pointerup", () => this.pressTileEnd(c, r));
        tile.Elem.addEventListener("pointercancel", this.cancelPressTile);
        tile.Elem.addEventListener("mouseenter", () => this.hoverTileStart(c, r));
        tile.Elem.addEventListener("mouseleave", () => this.hoverTileEnd(c, r));
        tile.Elem.addEventListener("dragstart", (e) => e.preventDefault());
      }
    }
  }
  exit(ctx) {}
  makeTile(c, r, elem) {
    const index = r * this._gridSize + c;
    this._tiles[index] = new Tile(elem);
    return this._tiles[index];
  }
  getTile(c, r) {
    return this._tiles[r * this._gridSize + c];
  }
  shortPressTile(c, r) {
    console.log(`Short tap ${coordToLetter(c)}${r + 1}`);
  }
  longPressTile(c, r) {
    console.log(`Long press ${coordToLetter(c)}${r + 1}`);
    this.getTile(c, r).addRecolorEffect(1000);
  }
  clickTile(c, r) {
    console.log(`clicked ${coordToLetter(c)}${r + 1}`);
  }
  hoverTileStart(c, r) {
    this._boardElem?.querySelectorAll(`.tile-row${r}`)?.forEach((tile) => tile.classList.add("highlight-row"));
    this._boardElem?.querySelectorAll(`.tile-col${c}`)?.forEach((tile) => tile.classList.add("highlight-col"));
    this._boardElem?.querySelector(`#tile_${c}_${r}`)?.classList.add("highlight");
  }
  hoverTileEnd(c, r) {
    this.cancelPressTile();
    this.clearHighlighting();
  }
  clearHighlighting() {
    this._boardElem?.querySelectorAll(`.tile`)?.forEach((tile) => tile.classList.remove("highlight", "highlight-row", "highlight-col"));
  }
  _pressTimer = null;
  pressTileStart(c, r) {
    const LONG_PRESS_DURATION = 500;
    this._pressTimer = window.setTimeout(() => {
      this._pressTimer = null;
      this.longPressTile(c, r);
    }, LONG_PRESS_DURATION);
  }
  pressTileEnd(c, r) {
    if (this._pressTimer !== null) {
      clearTimeout(this._pressTimer);
      this._pressTimer = null;
      this.shortPressTile(c, r);
    }
  }
  cancelPressTile() {
    if (this._pressTimer !== null) {
      clearTimeout(this._pressTimer);
      this._pressTimer = null;
    }
  }
}

// src/index.ts
var BuildTimestamp = "v20260925_162303";
var BuildID = "barycentric";
document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("version");
  footer.innerHTML = `${BuildID} - ${BuildTimestamp}`;
  const root = document.getElementById("content-root");
  var ctx = new AppCtx(root);
  ctx.changeView(new GameView(ctx));
});
