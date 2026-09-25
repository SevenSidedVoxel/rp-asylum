export interface IView {
	enter(ctx: RootCtx): void;
	exit(ctx: RootCtx): void;
}

export class RootCtx {
	public root: HTMLElement;
	public currView: IView | null = null;

	constructor(root) {
		this.root = root;
	}

	public changeView(view: IView | null) {
		this.currView?.exit(this);
		this.currView = view;
		this.currView?.enter(this);
	}
}
