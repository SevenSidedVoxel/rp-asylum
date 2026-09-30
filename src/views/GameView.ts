import { BuildID, BuildTimestamp } from "..";
import { IView, AppCtx } from "../AppCtx";
import { P2 } from "../game/P2";
import { Frame } from "../game/Frame";
import { GameAnim } from "../game/GameAnims";
import { GameState, Tiles } from "../game/GameState";
import { GameRenderer } from "../game/GameRenderer";

export class GameView implements IView {
	private ctx: AppCtx;
	private boardElem: HTMLElement | null | undefined;
	private infoElem: HTMLElement | null | undefined;
	private scoreElem: HTMLElement | null | undefined;

	private game: GameState = new GameState();
	private renderer: GameRenderer = this.game.renderer;

	public constructor(ctx: AppCtx) {
		this.ctx = ctx;
	}

	enter(ctx: AppCtx): void {
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
		<p id="score">Score: <span>0</span></p>

		<div class="credits-landscape">
			${creditsHtml}
		</div>
	</section>
	<section id="gameBoard" class="game-board">
	</section>
	<section id="gameCredits" class="credits-portrait">
		${creditsHtml}
	</section>
</div>
		`;

		this.boardElem = ctx.root.querySelector("#gameBoard");
		if (this.boardElem == null) return;

		// Setup renderer
		this.renderer.setupAsync(this.boardElem, this.game);

		this.infoElem = ctx.root.querySelector("#gameInfo");
		if (this.infoElem == null) return;

		this.scoreElem = this.infoElem.querySelector("#score>span");
		if (this.scoreElem == null) return;

		window.addEventListener('pointermove', this.handlePointerMove);
		window.addEventListener('pointerdown', this.handlePointerDown);
		window.addEventListener('pointerup', this.handlePointerUp);
		window.addEventListener('pointercancel', this.handlePointerCancel);

		this.loop(0);
	}

	exit(ctx): void { }

	private prevTimestamp: DOMHighResTimeStamp = 0;
	loop(timestamp: DOMHighResTimeStamp) {
		const rawDelta = timestamp - this.prevTimestamp;
		const safeDelta = Math.min(rawDelta, 0.1);
		this.prevTimestamp = timestamp;
		let frame = new Frame(timestamp, safeDelta);

		this.updateAnims(safeDelta);
		this.renderer.draw(frame);

		requestAnimationFrame(timestamp => this.loop(timestamp));
	}

	clickTile(pos: P2) {
		// console.log(`clicked ${pos.name()}`);
		const tile = this.game.grid.getTile(pos);
		if (!this.game.canPlaceTile(tile, Tiles.House1)) {
			// Anims.showInvalidAct(tile.Elem);
			return;
		}

		this.game.placeTile(tile, Tiles.House1);
		this.updateVisuals();
	}
	dragTile(start: P2, end: P2) {
		// console.log(`drag ${start.name()} to ${end.name()}`);
	}

	private hoverPos: P2 | null = null;
	hoverTileStart(pos: P2) {
		this.hoverPos = pos;
		const tile = this.game.grid.getTile(this.hoverPos);
		this.renderer.hoverTile(tile);
	}
	hoverTileEnd() {
		this.hoverPos = null;
		this.renderer.hoverTile(null);
	}

	//#region Visual State

	private _applyingAnims = false;
	private _fastApplyAnims = false;
	updateVisuals() {
		this.updateScore();

		if (this._applyingAnims) {
			this._fastApplyAnims = true;
			return;
		}
		this._applyingAnims = true;
		this.applyNextAnim();
	}

	private anims: GameAnim[] = [];
	updateAnims(deltaTime: number) {
		if (!this._applyingAnims)
			return;

		if (this._fastApplyAnims)
			deltaTime *= 2;

		for (const anim of this.anims)
			anim.update(deltaTime);
		this.anims = this.anims.filter(anim => !anim.isDone());

		if (this.anims.length < 1)
			this.applyNextAnim();
	}
	private applyNextAnim() {
		if (this.game.anims.length < 1) {
			this._applyingAnims = false;
			this._fastApplyAnims = false;
			return;
		}

		const anim = this.game.anims.shift()!;
		this.anims.push(anim);
	}

	updateScore() {
		this.scoreElem!.innerHTML = `${this.game.score}`;
	}

	//#endregion Visual State

	//#region Pointer Handlers

	private uiPos: P2 | null = null;
	private worldPos: P2 | null = null;
	private gridPos: P2 | null = null;

	private startPressedTile: P2 | null = null;

	handlePointerMove = (e) => {
		this.uiPos = new P2(e.clientX, e.clientY);
		this.worldPos = this.renderer.uiToWorld(this.uiPos);
		this.gridPos = this.worldPos?.rounded() ?? null;

		if (this.hoverPos !== this.gridPos) {
			this.hoverTileEnd();
			if (this.gridPos)
				this.hoverTileStart(this.gridPos);
		}
	}

	handlePointerDown = (e) => {
		this.handlePointerMove(e);
		if (!this.gridPos) return;
		this.startPressTile(this.gridPos);
	}

	handlePointerUp = (e) => {
		if (this.gridPos)
			this.endPressTile(this.gridPos);
		else
			this.startPressedTile = null;
	}

	handlePointerCancel = (e) => {
		this.startPressedTile = null;
	}

	startPressTile(coord: P2) {
		this.startPressedTile = coord;
	}
	endPressTile(pos: P2) {
		if (this.startPressedTile === null)
			return; // press was cancelled or moved off tile

		if (this.startPressedTile.x !== pos.x
			|| this.startPressedTile.y !== pos.y) {
			// this is a drag
			this.dragTile(this.startPressedTile, pos);
		}
		else
			this.clickTile(pos);

		this.startPressedTile = null;
	}

	//#endregion Pointer Handlers
}