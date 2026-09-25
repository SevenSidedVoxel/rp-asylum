import { IView, ViewCtx } from "../views";

export class HomeView implements IView {
	enter(ctx: ViewCtx): void {
		ctx.root.innerHTML = /*html*/ `
		<section class="content-box">
			<h2>Inmate Intake</h2>

			<p>Enter Asylum Code:</p>
			<div class="input-group">
				<input id="player-input-box" class="input" placeholder="Enter Asylum ID here..."></input>
			</div>

			<div class="content-box-footer">
				<button class="btn" style="margin-top: 20px;">Enter the Asylum</button>
			</div>
		</section>

		<section class="content-box">
			<h2>Warden System</h2>
			<p>
				One computer is required to run the Asylum Warden System.
			</p>

			<div class="content-box-footer">
				<button class="btn" style="margin-top: 20px;">Initialize New Warden</button>
			</div>
		</section>
		`;
	}

	exit(ctx): void {

	}
}