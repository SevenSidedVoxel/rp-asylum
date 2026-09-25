import { IView, AppCtx } from "../AppCtx";

function coordToLetter(n: number): string {
	return String.fromCharCode(65 + n);
}

class Tile {
	public effects: number[] = [];
	public Elem: Element;

	constructor(elem: Element) {
		this.Elem = elem;
	}

	public addRecolorEffect(durationMS: number) {
		this.Elem.classList.add('linger');
		this.effects.push(window.setTimeout(() => {
			this.Elem.classList.remove('linger');
		}, durationMS));
	}
}

export class GameView implements IView {
	private _ctx: AppCtx;
	private _boardElem: HTMLElement | null | undefined;

	private _gridSize = 8;
	private _tiles: Tile[];

	public constructor(ctx: AppCtx) {
		this._ctx = ctx;
		this._tiles = Array(this._gridSize * this._gridSize).fill(undefined);
	}

	enter(ctx: AppCtx): void {
		let gridHtml = ``;
		for (let r = 0; r < this._gridSize; ++r) {
			const row = this._gridSize - (r + 1);
			for (let c = 0; c < this._gridSize; ++c) {
				const tileAB = (row % 2 + c) % 2 ? 'a' : 'b';
				gridHtml += /*html*/`<div
					id="tile_${c}_${row}"
					class="tile tile-${tileAB} tile-row${row} tile-col${c}"
					data-row=${row}
					data-col=${c}>
				</div>`;
			}
		}

		ctx.root.innerHTML = /*html*/`
<section id="gameBoard" class="game-board">
	${gridHtml}
</section>
		`;

		this._boardElem = ctx.root.querySelector("#gameBoard");
		if (this._boardElem == null) return;

		for (let r = 0; r < this._gridSize; ++r) {
			for (let c = 0; c < this._gridSize; ++c) {
				const tileElem = this._boardElem.querySelector(`#tile_${c}_${r}`);
				if (!tileElem) continue;
				const tile = this.makeTile(c, r, tileElem);
				tile.Elem.addEventListener('pointerdown', () => this.pressTileStart(c, r));
				tile.Elem.addEventListener('pointerup', () => this.pressTileEnd(c, r));
				tile.Elem.addEventListener('pointercancel', this.cancelPressTile);
				tile.Elem.addEventListener('mouseenter', () => this.hoverTileStart(c, r));
				tile.Elem.addEventListener('mouseleave', () => this.hoverTileEnd(c, r));
				tile.Elem.addEventListener('dragstart', (e) => e.preventDefault());
			}
		}
	}

	exit(ctx): void {

	}

	makeTile(c: number, r: number, elem: Element): Tile {
		const index = r * this._gridSize + c;
		this._tiles[index] = new Tile(elem);
		return this._tiles[index]!;
	}
	getTile(c: number, r: number): Tile {
		return this._tiles[r * this._gridSize + c]!;
	}

	shortPressTile(c: number, r: number) {
		console.log(`Short tap ${coordToLetter(c)}${r + 1}`);
	}

	longPressTile(c: number, r: number) {
		console.log(`Long press ${coordToLetter(c)}${r + 1}`);
		this.getTile(c, r).addRecolorEffect(1000);
	}

	clickTile(c: number, r: number) {
		console.log(`clicked ${coordToLetter(c)}${r + 1}`);
	}

	hoverTileStart(c: number, r: number) {
		this._boardElem?.
			querySelectorAll(`.tile-row${r}`)?.
			forEach(tile => tile.classList.add('highlight-row'));
		this._boardElem?.
			querySelectorAll(`.tile-col${c}`)?.
			forEach(tile => tile.classList.add('highlight-col'));
		this._boardElem?.
			querySelector(`#tile_${c}_${r}`)?.
			classList.add('highlight');
	}
	hoverTileEnd(c: number, r: number) {
		this.cancelPressTile();
		this.clearHighlighting();
	}

	clearHighlighting() {
		this._boardElem?.
			querySelectorAll(`.tile`)?.
			forEach(tile => tile.classList.remove('highlight', 'highlight-row', 'highlight-col'));
	}

	//#region Pointer Handlers

	private _pressTimer: number | null = null;
	pressTileStart(c: number, r: number) {
		const LONG_PRESS_DURATION = 500; // ms
		this._pressTimer = window.setTimeout(() => {
			this._pressTimer = null;
			this.longPressTile(c, r);
		}, LONG_PRESS_DURATION);
	}
	pressTileEnd(c: number, r: number) {
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

	//#endregion
}