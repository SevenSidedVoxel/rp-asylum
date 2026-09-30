import { P2 } from "../game/P2";

declare global {
	interface DOMRect {
		containsP2(pos: P2): boolean;
	}
}

DOMRect.prototype.containsP2 = function (pos: P2): boolean {
	return pos.x >= this.left
		&& pos.x <= this.right
		&& pos.y >= this.top
		&& pos.y <= this.bottom;
}