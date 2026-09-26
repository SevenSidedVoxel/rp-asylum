import { IView, AppCtx } from "../AppCtx";

function coordToLetter(n: number): string {
	return String.fromCharCode(65 + n);
}

function getPosFromTileElem(tile: Element | null | undefined) {
	if (!tile) return;
	const xData = tile.getAttribute('data-col');
	const yData = tile.getAttribute('data-row');
	if (!xData || !yData)
		return;
	return new P2(parseInt(xData, 10), parseInt(yData, 10));
}

class P2 {
	public x: number = 0;
	public y: number = 0;

	constructor(x?: number, y?: number) {
		this.x = x ?? 0;
		this.y = y ?? x ?? 0;
	}

	public name() { return `${coordToLetter(this.x)}${this.y + 1}`; }
}

class Tile {
	public pos: P2;
	public effects: number[] = [];
	public Elem: Element;

	constructor(pos: P2, elem: Element) {
		this.pos = pos;
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
	private _infoElem: HTMLElement | null | undefined;

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
		if (this._boardElem == null) return;

		this._infoElem = ctx.root.querySelector("#gameInfo");
		if (this._infoElem == null) return;

		for (let r = 0; r < this._gridSize; ++r) {
			for (let c = 0; c < this._gridSize; ++c) {
				const tileElem = this._boardElem.querySelector(`#tile_${c}_${r}`);
				if (!tileElem) continue;
				const tile = this.makeTile(c, r, tileElem);
				const pos = new P2(c, r);
				tile.Elem.addEventListener('mouseenter', () => this.hoverTileStart(pos));
				tile.Elem.addEventListener('mouseleave', () => this.hoverTileEnd(pos));
			}
		}

		this._boardElem.addEventListener('pointerdown', (e) => {
			const tile = (e.target as HTMLElement).closest('.tile');
			var pos = getPosFromTileElem(tile);
			if (pos !== undefined)
				this.pressTileStart(pos);
		});
		this._boardElem.addEventListener('pointerup', (e) => {
			const elem = document.elementFromPoint(e.clientX, e.clientY);
			const tile = elem?.closest('.tile');
			var pos = getPosFromTileElem(tile);
			if (pos !== undefined)
				this.pressTileEnd(pos);
		});
		this._boardElem.addEventListener('pointercancel', this.pressTileCancel);
	}

	exit(ctx): void { }

	makeTile(c: number, r: number, elem: Element): Tile {
		const index = r * this._gridSize + c;
		this._tiles[index] = new Tile(new P2(c, r), elem);
		return this._tiles[index]!;
	}
	getTile(c: number, r: number): Tile {
		return this._tiles[r * this._gridSize + c]!;
	}

	recentMessages: any = [];
	clickTile(pos: P2) {
		console.log(`clicked ${pos.name()}`);

		this.recentMessages.push(`clicked ${pos.name()}`);
		while (this.recentMessages.length > 10)
			this.recentMessages.shift();

		this._infoElem!.innerHTML = /*html*/`<h2>Info</h2>`;
		this.recentMessages.forEach(msg => {
			this._infoElem!.innerHTML += /*html*/`
				<p>${msg}</p>
			`;
		});

	}
	dragTile(start: P2, end: P2) {
		console.log(`drag ${start.name()} to ${end.name()}`);

		this.recentMessages.push(`drag ${start.name()} to ${end.name()}`);
		while (this.recentMessages.length > 10)
			this.recentMessages.shift();

		this._infoElem!.innerHTML = /*html*/`<h2>Info</h2>`;
		this.recentMessages.forEach(msg => {
			this._infoElem!.innerHTML += /*html*/`
				<p>${msg}</p>
			`;
		});
	}

	hoverTileStart(pos: P2) {
		this._boardElem?.
			querySelectorAll(`.tile-row${pos.y}`)?.
			forEach(tile => tile.classList.add('highlight-row'));
		this._boardElem?.
			querySelectorAll(`.tile-col${pos.x}`)?.
			forEach(tile => tile.classList.add('highlight-col'));
		this._boardElem?.
			querySelector(`#tile_${pos.x}_${pos.y}`)?.
			classList.add('highlight');
	}
	hoverTileEnd(pos: P2) {
		this.clearHighlighting();
	}

	clearHighlighting() {
		this._boardElem?.
			querySelectorAll(`.tile`)?.
			forEach(tile => tile.classList.remove('highlight', 'highlight-row', 'highlight-col'));
	}

	//#region Pointer Handlers

	private _pressTileData: P2 | null = null;
	pressTileStart(coord: P2) {
		this._pressTileData = coord;
	}
	pressTileEnd(pos: P2) {
		if (this._pressTileData === null)
			return; // press was cancelled or moved off tile

		if (this._pressTileData.x !== pos.x
			|| this._pressTileData.y !== pos.y) {
			// this is a drag
			this.dragTile(this._pressTileData, pos);
		}
		else
			this.clickTile(pos);

		this._pressTileData = null;
	}
	pressTileCancel() {
		this._pressTileData = null;
	}

	//#endregion
}