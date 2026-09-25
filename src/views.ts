export interface IView {
	enter(ctx: ViewCtx): void;
	exit(ctx: ViewCtx): void;
}

export class ViewCtx {
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
