function coordToLetter(n: number): string {
	return String.fromCharCode(64 + n);
}

export class P2 {
	public x: number = 0;
	public y: number = 0;

	constructor(x?: number, y?: number) {
		this.x = x ?? 0;
		this.y = y ?? x ?? 0;
	}

	public name() { return `${coordToLetter(this.x)}${this.y}`; }
}