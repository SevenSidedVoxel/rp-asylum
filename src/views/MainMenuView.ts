import { IView, AppCtx } from "../AppCtx";
import { GameView } from "./GameView";

export class MainMenuView implements IView {
	private ctx: AppCtx;

	constructor(ctx: AppCtx) {
		this.ctx = ctx;
	}

	enter(ctx: AppCtx): void {
		ctx.root.innerHTML = /*html*/`
<section class="menu-ctr">
	<h2>Main Menu</h2>

	<div class="menu-actions">
		<button id="btnPlay" class="btn">Play</button>
		<button id="btnOptions" class="btn">Options</button>
	</div>
</section>
		`;

		ctx.addClickHandler("btnPlay", this.clickPlay);
		ctx.addClickHandler("btnOptions", this.clickOptions);
	}

	exit(ctx): void {

	}

	clickPlay = () => {
		this.ctx.changeView(new GameView(this.ctx));
	}

	clickOptions = () => {

	}
}