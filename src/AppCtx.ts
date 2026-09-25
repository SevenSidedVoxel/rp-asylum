export interface IView {
	enter(ctx: AppCtx): void;
	exit(ctx: AppCtx): void;
}

export class AppCtx {
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

	public addClickHandler(id: string, handler: EventListenerOrEventListenerObject) {
		this.root.querySelector(`#${id}`)?.addEventListener('click', handler);
	}
}
