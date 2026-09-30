import { float3 } from "../utils/threeUtils";
import { BatchedInstance } from "./GameRenderer";
import { GameState } from "./GameState";
import { lerp } from "./P2";

export class GameAnim {
	private static _nextID = 0;

	public id = GameAnim._nextID++;
	public delay: number = 0;
	public time: number = 0;
	public constructor(public act: (this: GameAnim, deltaTime: number) => void, public duration: number) { }

	public isDone() { return this.time >= this.duration; }
	public t01() { return Math.max(0, Math.min(1, this.time / this.duration)); }
	public lil(): [l: number, il: number] { const l = this.t01(); return [l, 1 - l]; }

	public delayed(delay: number) {
		this.delay = Math.max(0, this.delay + delay);
		return this;
	}

	public update(deltaTime: number) {
		if (this.delay > 0) {
			const used = Math.min(this.delay, deltaTime);
			this.delay -= used;
			deltaTime -= used;
			if (this.delay > 0 || deltaTime == 0)
				return;
		}

		this.time += deltaTime;
		this.act.call(this, deltaTime);
	}
}


export namespace Anims {
	export const BaseDur = 1;

	export function combined(anims: GameAnim[]) {
		// Get the maximum duration
		let duration = 0;
		for (const anim of anims)
			duration = Math.max(anim.delay + anim.duration);

		return new GameAnim(function (dt) {
			for (let i = 0; i < anims.length; ++i) {
				const anim = anims[i];
				if (!anim) continue;

				anim.update(dt)

				if (anim.isDone()) {
					anims[i] = null!;
				}
			}
		}, duration);
	}

	export function createModel(model: BatchedInstance, targetSize: number, duration: number): GameAnim {
		const initialSize = 0;
		return new GameAnim(function () {
			const [t, s] = this.lil();
			model.setScale(lerp(initialSize, targetSize, t));
		}, duration);
	}
	export function destroyModel(model: BatchedInstance, duration: number): GameAnim {
		const initialSize = model.scale.x;
		return new GameAnim(function () {
			const [t, s] = this.lil();
			model.setScale(lerp(initialSize, 0, t));
			if (this.isDone()) {
				model.destroy();
			}
		}, duration);
	}
	export function mergeModel(model: BatchedInstance, targetPos: float3, duration: number): GameAnim {
		const initScale = model.scale.clone();
		const initPos = model.position.clone();
		const targetScale = new float3(0);

		let isDone = false;

		return new GameAnim(function () {
			if (isDone) {
				console.log("call after done", this);
			}

			const [t, s] = this.lil();

			// First 75% of animation merges
			const p = Math.min(1, t * 4.0 / 3.0);
			model.position.copy(initPos);
			model.position.lerp(targetPos, p);

			// Decrease size to zero over duration
			model.scale.copy(initScale);
			model.scale.lerp(targetScale, t);

			// Flush changes
			model.updateMatrix();

			// Destroy the model after merging
			if (this.isDone()) {
				model.destroy();
				isDone = true;
			}
		}, duration);
	}
}