import { IView, RootCtx } from "../views";

export class HomeView implements IView {
	enter(ctx: RootCtx): void {
		ctx.root.innerHTML = /*html*/ `
<div class="sections-ctr">
	<section class="sections-item">
		<h2>Join</h2>

		<p>Enter Join Code:</p>
		<div class="input-group">
			<input id="input-join-code" class="input" placeholder="Enter code here..." />
		</div>

		<div class="content-box-footer">
			<button class="btn" style="margin-top: 20px;">Join</button>
		</div>
	</section>

	<section class="sections-item">
		<h2>Host</h2>
		<p>
			Only one player needs to host the game
		</p>

		<div class="content-box-footer">
			<button class="btn" style="margin-top: 20px;">Host</button>
		</div>
	</section>
</div>
		`;
	}

	exit(ctx): void {

	}
}