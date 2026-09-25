// src/views.ts
class ViewCtx {
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
}

// src/views/home.ts
class HomeView {
  enter(ctx) {
    ctx.root.innerHTML = `
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
  exit(ctx) {}
}

// src/script.ts
var BuildTimestamp = "v20260924_230116";
var BuildID = "chipmunk";
document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("version");
  footer.innerHTML = `${BuildID} - ${BuildTimestamp}`;
  const root = document.getElementById("content-root");
  var rootCtx = new ViewCtx(root);
  rootCtx.changeView(new HomeView);
});
