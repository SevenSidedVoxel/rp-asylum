// src/views.ts
class RootCtx {
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
  exit(ctx) {}
}

// src/script.ts
var BuildTimestamp = "v20260925_005924";
var BuildID = "beaver";
document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("version");
  footer.innerHTML = `${BuildID} - ${BuildTimestamp}`;
  const root = document.getElementById("content-root");
  var rootCtx = new RootCtx(root);
  rootCtx.changeView(new HomeView);
});
