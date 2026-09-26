import { BuildID, BuildTimestamp } from "..";
import { IView, AppCtx } from "../AppCtx";
import { P2 } from "../game/coords";
import { GameState, TileTypes } from "../game/gameState";

function getPosFromTileElem(tile: Element | null | undefined) {
	if (!tile) return;
	const xData = tile.getAttribute('data-col');
	const yData = tile.getAttribute('data-row');
	if (!xData || !yData)
		return;
	return new P2(parseInt(xData, 10), parseInt(yData, 10));
}

export class GameView implements IView {
	private _ctx: AppCtx;
	private _boardElem: HTMLElement | null | undefined;
	private _infoElem: HTMLElement | null | undefined;

	private state: GameState = new GameState();

	public constructor(ctx: AppCtx) {
		this._ctx = ctx;
	}

	enter(ctx: AppCtx): void {
		let gridHtml = ``;
		const size = this.state.grid.size - 2;
		for (let r = 0; r < size; ++r) {
			const row = size - (r + 1);
			const y = row + 1;

			for (let c = 0; c < size; ++c) {
				const tileAB = (row % 2 + c) % 2 ? 'a' : 'b';
				const x = c + 1;

				gridHtml += /*html*/`<div
					id="tile_${x}_${y}"
					class="tile tile-${tileAB} tile-row${y} tile-col${x}"
					data-row=${y}
					data-col=${x}>
				</div>`;
			}
		}

		const creditsHtml =/*html*/`
<p class="credit">Developed by SevenSidedVoxel</p>
<a class="kofi-link" href='https://ko-fi.com/C5L027OU2F' target='_blank'>
	<img style='height:2em;'
		src='https://storage.ko-fi.com/cdn/kofi3.png?v=6'
		alt='Buy Me a Coffee at ko-fi.com' />
</a>
<p class="version">${BuildID} - ${BuildTimestamp}</p>
		`;

		ctx.root.innerHTML = /*html*/`
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
		if (this._boardElem == null) return;

		this._infoElem = ctx.root.querySelector("#gameInfo");
		if (this._infoElem == null) return;

		for (let y = 1; y < size + 1; ++y) {
			for (let x = 1; x < size + 1; ++x) {
				const tileElem = this._boardElem.querySelector(`#tile_${x}_${y}`);
				if (!tileElem) continue;
				const pos = new P2(x, y);
				const tile = this.state.grid.getTile(pos);
				tile.Elem = tileElem;
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

	clickTile(pos: P2) {
		// console.log(`clicked ${pos.name()}`);
		this.state.placeTile(pos, TileTypes.House1);
		this.applyAnims();
	}
	dragTile(start: P2, end: P2) {
		// console.log(`drag ${start.name()} to ${end.name()}`);
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

	//#region Visual State

	private _applyingAnims = false;
	private _fastApplyAnims = false;
	applyAnims() {
		if (this._applyingAnims) {
			this._fastApplyAnims = true;
			return;
		}
		this._applyingAnims = true;
		this.applyNextAnim();
	}
	private applyNextAnim() {
		if (this.state.anims.length < 1) {
			this._applyingAnims = false;
			this._fastApplyAnims = false;
			return;
		}

		const anim = this.state.anims.shift();
		anim?.act();

		// Delay before the next anim
		const delayMS = this._fastApplyAnims ? 65 : 150;
		setTimeout(() => {
			this.applyNextAnim();
		}, delayMS);
	}

	//#endregion Visual State

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

	//#endregion Pointer Handlers
}