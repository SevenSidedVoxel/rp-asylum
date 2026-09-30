import { P2 } from "./P2";
import { Colors } from '../styles/colors';
import { TileType } from './GameState';
import { Anims, GameAnim } from './GameAnims';
import { BatchedInstance } from './GameRenderer';
import { float3, color3 } from '../utils/threeUtils';

export class Tile {
	public shouldCheck: boolean = false;
	public draw: TileDraw | null = null;

	constructor(public pos: P2, public type: TileType) {
	}
}

export class TileDraw {
	public pos: float3;
	public baseColor: color3;

	public models: BatchedInstance[] = [];
	public visualIndex: number = -1;

	constructor(x: number, y: number, gridIndex: number) {
		this.pos = new float3(x + 1, y + 1, 0);
		this.baseColor = this.getBaseColor();
		this.visualIndex = gridIndex;
	}

	getBaseColor(): color3 {
		const isDark = (this.pos.x + (this.pos.y % 2)) % 2 == 0;
		return new color3(isDark ? Colors.tileDark : Colors.tileLight);
	}

	destroyAllModels(duration: number) {
		let anims: GameAnim[] = [];
		for (const model of this.models)
			anims.push(Anims.destroyModel(model, duration));

		this.models.length = 0; // Clear the array
		return Anims.combined(anims);
	}

	mergeModelsInto(targetPos: float3, duration: number): GameAnim {
		let anims: GameAnim[] = [];
		for (const model of this.models)
			anims.push(Anims.mergeModel(model, targetPos, duration));

		this.models.length = 0; // Clear the array
		return Anims.combined(anims);
	}
}
