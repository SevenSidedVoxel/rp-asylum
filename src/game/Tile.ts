import { P2 } from "./P2";
import { Colors } from '../styles/colors';
import { Anims, GameAnim } from './GameAnims';
import { BatchedInstance } from './GameRenderer';
import { float3, color3, quat4, ZAxis } from '../utils/threeUtils';
import { RandomSlice } from "./SeededRandom";
import { GameState } from "./GameState";
import { Rule, MatchFlags } from "./Rule";

export class Tile {
	public pos: P2;
	public type: TileType;
	public draw: TileDraw | null = null;
	public shouldRegen: boolean = false;
	public shouldCheck: boolean = false;

	constructor(pos: P2, type: TileType) {
		this.pos = pos;
		this.type = type;
	}

	getCenterPos() {
		if (this.draw && (this.type.centerOffset ?? 0 > 0))
			return this.draw.getCenterPos(this.type.centerOffset!);
		return new float3(this.pos.x, this.pos.y, 0);
	}
}

export class TileDraw {
	public pos: float3;
	public baseColor: color3;

	public rng: RandomSlice;
	public models: BatchedInstance[] = [];
	public visualIndex: number = -1;

	public drawCache = {};

	constructor(x: number, y: number, gridIndex: number, rng: RandomSlice) {
		this.rng = rng;
		this.pos = new float3(x + 1, y + 1, 0);
		this.baseColor = this.getBaseColor();
		this.visualIndex = gridIndex;
	}

	getBaseColor(): color3 {
		const isDark = (this.pos.x + (this.pos.y % 2)) % 2 == 0;
		return new color3(isDark ? Colors.tileDark : Colors.tileLight);
	}

	getCenterPos(offset: number): float3 {
		const centerX = this.pos.x + this.rng.nextF(-offset, offset);
		const centerY = this.pos.y + this.rng.nextF(-offset, offset);
		return new float3(centerX, centerY, 0);
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


export type TileType = {
	name: string,
	color?: number;
	centerOffset?: number;
	animCreate?: (game: GameState, tile: Tile) => GameAnim | undefined;
	animRegen?: (game: GameState, tile: Tile) => GameAnim | undefined;
};
export const Tiles = {
	Any: { name: "any" },
	Empty: {
		name: "empty",
		animCreate(game, tile) {
			if (!tile.draw) return;
			return tile.draw.destroyAllModels(Anims.BaseDur);
		}
	},

	House1: {
		name: "house1",
		color: Colors.tileHouse1,
		animCreate(game, tile) {
			if (!tile.draw) return;
			tile.draw.rng.reset();
			const pos = tile.getCenterPos();
			const model = game.renderer.addMeshToTile(
				game.assets.model_House1,
				tile,
				pos,
				new color3(this.color)
			);
			return Anims.growModel(model, 1, 1);
		}
	},
	House2: {
		name: "house2",
		color: Colors.tileHouse2,
		animCreate(game, tile) {
			if (!tile.draw) return;
			tile.draw.rng.reset();
			const pos = tile.getCenterPos();
			const model = game.renderer.addMeshToTile(
				game.assets.model_House2,
				tile,
				pos,
				new color3(this.color)
			);
			return Anims.growModel(model, 1, 1);
		}
	},
	House3: {
		name: "house3",
		color: Colors.tileHouse3,
		animCreate(game, tile) {
			if (!tile.draw) return;
			tile.draw.rng.reset();
			const pos = tile.getCenterPos();
			const model = game.renderer.addMeshToTile(
				game.assets.model_House3,
				tile,
				pos,
				new color3(this.color)
			);
			return Anims.growModel(model, 1, 1);
		}
	},

	Road: {
		name: "road1",
		color: Colors.tileRoad1,
		animCreate(game, tile) {
			return this.animRegen!(game, tile);
		},
		animRegen(game, tile) {
			if (!tile.draw) return;

			const rng = tile.draw.rng;
			rng.reset();
			let anims: GameAnim[] = [];

			// Destroy all the old models (after creating the new models)
			if (tile.draw.models.length > 0) {
				anims.push(
					tile.draw.destroyAllModels(0.01)
						.delayed(Anims.BaseDur * 0.5)
				);
			}

			// Add center join
			const centerPos = tile.getCenterPos();
			const size = rng.nextF(0.8, 1);

			const [model, anim] = game.renderer.growMeshOnTile(
				game.assets.model_RoadJoin,
				tile,
				new color3(this.color),
				centerPos,
				size
			);
			model.setName(`${tile.pos.name()}_${tile.type.name}`);
			anims.push(anim);

			const lc = connectTo.call(this, -1, +0);
			const cd = connectTo.call(this, +0, -1);
			const cu = connectTo.call(this, +0, +1);
			const rc = connectTo.call(this, +1, +0);

			// Only connect to diagonals if the connections to the cardinals failed
			if (!(lc || cu)) connectTo.call(this, -1, +1);
			if (!(lc || cd)) connectTo.call(this, -1, -1);
			if (!(rc || cu)) connectTo.call(this, +1, +1);
			if (!(rc || cd)) connectTo.call(this, +1, -1);

			function connectTo(this, x: number, y: number) {
				const otherTile = game.grid.getTileOffset(tile.pos, x, y);
				const shouldConnect = shouldConnectToRoad(otherTile.type);
				if (shouldConnect) {
					const targetTile = otherTile;
					targetTile.draw?.rng.reset();
					const targetPos = targetTile.getCenterPos();

					const [_, anim] = growPath(game, tile, centerPos, targetPos, new color3(this.color));
					anims.push(anim);
					return true;
				}

				return false;
			}

			return Anims.combined(anims);
		}
	},
	Intersection: {
		name: "road2",
		color: Colors.tileRoad2,
		animCreate(game, tile) {
			return this.animRegen!(game, tile);
		},
		animRegen(game, tile) {
			if (!tile.draw) return;

			const rng = tile.draw.rng;
			rng.reset();
			let anims: GameAnim[] = [];

			// Destroy all the old models (after creating the new models)
			if (tile.draw.models.length > 0) {
				anims.push(
					tile.draw.destroyAllModels(0.01)
						.delayed(Anims.BaseDur * 0.5)
				);
			}

			// Add center join
			const centerPos = tile.getCenterPos();
			const size = rng.nextF(0.8, 1);

			const [model, anim] = game.renderer.growMeshOnTile(
				game.assets.model_Intersection1,
				tile,
				new color3(this.color),
				centerPos,
				size
			);
			model.setName(`${tile.pos.name()}_${tile.type.name}`);
			anims.push(anim);

			const lc = connectTo.call(this, -1, +0);
			const cd = connectTo.call(this, +0, -1);
			const cu = connectTo.call(this, +0, +1);
			const rc = connectTo.call(this, +1, +0);

			// Only connect to diagonals if the connections to the cardinals failed
			if (!(lc || cu)) connectTo.call(this, -1, +1);
			if (!(lc || cd)) connectTo.call(this, -1, -1);
			if (!(rc || cu)) connectTo.call(this, +1, +1);
			if (!(rc || cd)) connectTo.call(this, +1, -1);

			function connectTo(this, x: number, y: number) {
				const otherTile = game.grid.getTileOffset(tile.pos, x, y);
				const shouldConnect = shouldConnectToRoad(otherTile.type);
				if (shouldConnect) {
					const targetTile = otherTile;
					targetTile.draw?.rng.reset();
					const targetPos = targetTile.getCenterPos();

					const [_, anim] = growPath(game, tile, centerPos, targetPos, new color3(this.color));
					anims.push(anim);
					return true;
				}

				return false;
			}

			return Anims.combined(anims);
		}
	},
	Bridge: { name: "bridge", color: Colors.tileBridge },

	Grass: { name: "grass", color: Colors.tileGrass },
	Tree: { name: "tree", color: Colors.tileTree1 },
	Water: { name: "water", color: Colors.tileWater },
} as const satisfies Record<string, TileType>;


export function makeRules(): Rule[] {
	let rules: Rule[] = [];

	rules.push(new Rule("Make Building",
		{
			cc: Tiles.House2,
			uc: Tiles.House1,
			dc: Tiles.House1,
			cl: Tiles.House1,
			cr: Tiles.House1,
		},
		(game, area) => {
			game.mergeTilesInto(area.cc,
				[area.uc, area.dc, area.cl, area.cr],
				Tiles.House3);
			game.addScore(area.cc, 4);
			game.addPop(area.cc, 4);
		},
		MatchFlags.None));
	rules.push(new Rule("Make Cull-de-sac",
		{
			cc: Tiles.Road,
			uc: Tiles.House1,
			cl: Tiles.House1,
			dc: Tiles.House1,
		},
		(game, area) => {
			game.mergeTilesInto(area.cc,
				[area.uc, area.dc, area.cl],
				Tiles.House2);
			game.addScore(area.cc, 3);
		},
		MatchFlags.Rotate4));

	rules.push(new Rule("Add Road between Houses",
		{
			cc: Tiles.Empty,
			uc: Tiles.House1,
			dc: Tiles.House1,
		},
		(game, area) => {
			game.replaceTile(area.cc, Tiles.Road);
			game.addScore(area.cc, 1);
		},
		MatchFlags.Rotate1));

	rules.push(new Rule("Make Intersection",
		{
			cc: Tiles.Empty,
			uc: Tiles.Road,
			dc: Tiles.Road,
			cl: Tiles.Road,
		},
		(game, area) => {
			game.replaceTile(area.cc, Tiles.Intersection);
			game.addScore(area.cc, 4);
		},
		MatchFlags.Rotate4));
	rules.push(new Rule("Upgrade Intersection",
		{
			cc: Tiles.Road,
			uc: Tiles.Road,
			dc: Tiles.Road,
			cl: Tiles.Road,
		},
		(game, area) => {
			game.replaceTile(area.cc, Tiles.Intersection);
			game.addScore(area.cc, 4);
		},
		MatchFlags.Rotate4));

	rules.push(new Rule("Make Tree",
		{
			cc: Tiles.Grass,
			uc: Tiles.Grass,
			ul: Tiles.Grass,
			cl: Tiles.Grass,
		},
		(game, area) => {
			game.replaceTile(area.cc, Tiles.Tree);
			game.replaceTile(area.uc, Tiles.Empty);
			game.replaceTile(area.ul, Tiles.Empty);
			game.replaceTile(area.cl, Tiles.Empty);
			game.addScore(area.cc, 4);
			game.addNat(area.cc, 2);
		},
		MatchFlags.None));

	rules.push(new Rule("Make Pond",
		{
			cc: Tiles.Empty,
			uc: Tiles.Grass,
			ul: Tiles.Grass,
			cl: Tiles.Grass,
			cr: Tiles.Grass,
		},
		(game, area) => {
			game.replaceTile(area.cc, Tiles.Water);
			game.replaceTile(area.uc, Tiles.Empty);
			game.replaceTile(area.ul, Tiles.Empty);
			game.replaceTile(area.cl, Tiles.Empty);
			game.replaceTile(area.cr, Tiles.Empty);
			game.addScore(area.cc, 2);
		},
		MatchFlags.None));

	return rules;
}

export function shouldConnectToRoad(type: TileType) {
	return type == Tiles.Road
		|| type == Tiles.Intersection;
}

export function growPath(
	game: GameState,
	tile: Tile,
	start: float3,
	end: float3,
	color: color3) {
	const dir = new float3().subVectors(end, start);
	const dirLen = dir.length();
	const dirNorm = dir.clone().divideScalar(dirLen);
	const dirAngle = Math.atan2(dirNorm.y, dirNorm.x) - Math.PI / 2;

	return game.renderer.growMeshOnTile(
		game.assets.model_RoadSegment,
		tile,
		new color3(color),
		start,
		new float3(1, dirLen * 0.6, 1),
		new quat4().setFromAxisAngle(ZAxis, dirAngle)
	);
}