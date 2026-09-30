import { Colors } from "../styles/colors";
import { P2 } from "./P2";
import { Anims, GameAnim } from "./GameAnims";
import { Tile } from "./Tile";
import { GameRenderer } from "./GameRenderer";
import { color3 } from "../utils/threeUtils";

export class GameState {
	public score: number = 0;
	public population: number = 0;
	public nature: number = 0;

	public grid: Grid = new Grid();
	public rules: Rule[] = GameState.makeRules();
	public items: Item[] = [];
	public anims: GameAnim[] = [];
	public isCreative = true;

	public renderer: GameRenderer = new GameRenderer();

	public canPlaceTile(tile: Tile, type: TileType) {
		// Ensure the tile is available
		if (!this.isCreative && !this.hasItem(type))
			return false; // no item

		if (tile.type !== Tiles.Empty)
			return false; // not empty

		return true;
	}

	public placeTile(tile: Tile, type: TileType) {
		if (!this.canPlaceTile(tile, type)) {
			return;
		}

		this.consumeItem(type);

		switch (type) {
			case Tiles.House1:
				this.createTile(tile, type);
				this.addScore(tile, 1);
				this.addPop(tile, 1);
				break;

			case Tiles.Grass:
				this.createTile(tile, type);
				this.addScore(tile, 1);
				this.addNat(tile, 1);
				break;

			case Tiles.Road:
				this.createTile(tile, type);
				this.addScore(tile, 1);
				break;

			default:
				console.warn(`Not Implemented: Placing tile ${type.name} on ${tile.pos.name()}`);
				return;
		}

		this.applyRules();
	}

	static makeRules(): Rule[] {
		let rules: Rule[] = [];

		rules.push(new Rule("Make Cull-de-sac",
			{
				cc: Tiles.Road,
				tc: Tiles.House1,
				cl: Tiles.House1,
				bc: Tiles.House1,
			},
			(game, area) => {
				game.mergeTilesInto(area.cc,
					[area.tc, area.bc, area.cl],
					Tiles.House2);
				game.addScore(area.cc, 3);
			},
			MatchFlags.Rotate4));

		rules.push(new Rule("Add Road between Houses",
			{
				cc: Tiles.Empty,
				tc: Tiles.House1,
				bc: Tiles.House1,
			},
			(game, area) => {
				game.createTile(area.cc, Tiles.Road);
				game.addScore(area.cc, 1);
			},
			MatchFlags.Rotate1));

		rules.push(new Rule("Make Building",
			{
				cc: Tiles.House2,
				tc: Tiles.House1,
				bc: Tiles.House1,
				cl: Tiles.House1,
				cr: Tiles.House1,
			},
			(game, area) => {
				game.mergeTilesInto(area.cc,
					[area.tc, area.bc, area.cl, area.cr],
					Tiles.House3);
				game.addScore(area.cc, 4);
				game.addPop(area.cc, 4);
			},
			MatchFlags.None));

		rules.push(new Rule("Make Intersection",
			{
				cc: Tiles.Road,
				tc: Tiles.Road,
				bc: Tiles.Road,
				cl: Tiles.Road,
				cr: Tiles.Road,
			},
			(game, area) => {
				game.createTile(area.cc, Tiles.Intersection);
				game.addScore(area.cc, 4);
			},
			MatchFlags.Rotate1));

		rules.push(new Rule("Make Tree",
			{
				cc: Tiles.Grass,
				tc: Tiles.Grass,
				tl: Tiles.Grass,
				cl: Tiles.Grass,
			},
			(game, area) => {
				game.createTile(area.cc, Tiles.Tree);
				game.createTile(area.tc, Tiles.Empty);
				game.createTile(area.tl, Tiles.Empty);
				game.createTile(area.cl, Tiles.Empty);
				game.addScore(area.cc, 4);
				game.addNat(area.cc, 2);
			},
			MatchFlags.None));

		rules.push(new Rule("Make Pond",
			{
				cc: Tiles.Empty,
				tc: Tiles.Grass,
				tl: Tiles.Grass,
				cl: Tiles.Grass,
				cr: Tiles.Grass,
			},
			(game, area) => {
				game.createTile(area.cc, Tiles.Water);
				game.createTile(area.tc, Tiles.Empty);
				game.createTile(area.tl, Tiles.Empty);
				game.createTile(area.cl, Tiles.Empty);
				game.createTile(area.cr, Tiles.Empty);
				game.addScore(area.cc, 2);
			},
			MatchFlags.None));

		return rules;
	}

	public addAnim(anim: GameAnim | undefined) {
		if (!anim) return;
		this.anims.push(anim);
		return anim;
	}

	//#region State Modification

	private addScore(tile: Tile, s: number) {
		this.score += s;
	}

	private addPop(tile: Tile, p: number) {
		this.population += p;
	}

	private addNat(tile: Tile, n: number) {
		this.nature += n;
	}

	private setTileType(tile: Tile, type: TileType) {
		if (tile.type === type)
			return;

		console.log(`Setting ${tile.pos.name()} to '${type.name}'`);
		tile.type = type;

		this.markForCheck(tile.pos.x, tile.pos.y);
		this.markAdjForCheck(tile.pos);
	}

	private createTile(tile: Tile, type: TileType) {
		this.setTileType(tile, type);
		if (tile.type.animCreate)
			this.addAnim(tile.type.animCreate(this, tile));
	}


	private mergeTilesInto(
		targetTile: Tile,
		tiles: Tile[],
		type: TileType) {
		// Update Data
		for (const tile of tiles)
			this.setTileType(tile, Tiles.Empty);
		this.setTileType(targetTile, type);

		// Update Visuals
		if (!targetTile.draw) return;

		// Merge adjacent tiles
		const targetPos = targetTile.draw.pos;
		let anims: GameAnim[] = [];
		for (const tile of tiles) {
			if (!tile.draw) continue;
			anims.push(tile.draw
				.mergeModelsInto(targetPos, Anims.BaseDur));
		}

		const delay = 0.25 * Anims.BaseDur;

		// Destroy center tile
		anims.push(targetTile.draw
			.destroyAllModels(Anims.BaseDur)
			.delayed(delay));

		// Create center tile
		const createAnim = type.animCreate?.(this, targetTile);
		if (createAnim)
			anims.push(createAnim.delayed(delay));

		this.addAnim(Anims.combined(anims));
	}

	//#endregion State Modification

	//#region Items

	public addItem(type: TileType, count?: number) {
		count ??= 1;
		for (const item of this.items) {
			if (item.type === type) {
				item.count += count;
				return;
			}
		}

		this.items.push(new Item(type, count));
	}

	private hasItem(type: TileType) {
		for (const item of this.items) {
			if (item.type === type
				&& item.count > 0)
				return true;
		}

		return false;
	}

	private consumeItem(type: TileType) {
		if (this.isCreative)
			return;

		for (const [index, item] of this.items.entries()) {
			if (item.type !== type)
				continue;

			item.count--;
			if (item.count < 1)
				this.items.splice(index, 1);

			return;
		}
	}

	//#endregion Items

	//#region Rule Application

	private tilesToCheck: number = 0;

	public markForCheck(x: number, y: number) {
		if (x <= 0 || x >= this.grid.size - 1
			|| y <= 0 || y >= this.grid.size - 1)
			return; // Out of bounds or on edge

		const tile = this.grid.getTile(x, y);
		if (!tile.shouldCheck) {
			// console.log(`To Check ${tile.pos.name()}`);

			tile.shouldCheck = true;
			this.tilesToCheck++;
		}
	}
	public markAdjForCheck(pos: P2) {
		this.markForCheck(pos.x - 1, pos.y - 1);
		this.markForCheck(pos.x + 0, pos.y - 1);
		this.markForCheck(pos.x + 1, pos.y - 1);
		this.markForCheck(pos.x - 1, pos.y + 0);
		// this.markForCheck(pos.x + 0, pos.y + 0);
		this.markForCheck(pos.x + 1, pos.y + 0);
		this.markForCheck(pos.x - 1, pos.y + 1);
		this.markForCheck(pos.x + 0, pos.y + 1);
		this.markForCheck(pos.x + 1, pos.y + 1);
	}
	private markTileChecked(tile: Tile) {
		if (!tile.shouldCheck) return;

		// console.log(`Checked ${tile.pos.name()}`);

		tile.shouldCheck = false;
		this.tilesToCheck--;
	}

	public applyRules() {
		while (this.tilesToCheck > 0)
			this.applyRulesOnce();
	}

	public applyRulesOnce() {
		let ruleIndex = Number.MAX_SAFE_INTEGER;
		let ruleToApply: Rule | null = null;
		let areaToApply: Area3x3 | null = null;

		// Check all tiles that require checking
		for (const cc of this.grid.tiles) {
			if (!cc.shouldCheck) continue;

			let examinedAllRules = true;

			const pos = cc.pos;
			const tl = this.grid.getTile(pos.x - 1, pos.y + 1);
			const tc = this.grid.getTile(pos.x + 0, pos.y + 1);
			const tr = this.grid.getTile(pos.x + 1, pos.y + 1);
			const cl = this.grid.getTile(pos.x - 1, pos.y + 0);
			const cr = this.grid.getTile(pos.x + 1, pos.y + 0);
			const bl = this.grid.getTile(pos.x - 1, pos.y - 1);
			const bc = this.grid.getTile(pos.x + 0, pos.y - 1);
			const br = this.grid.getTile(pos.x + 1, pos.y - 1);

			let rot000 = new Area3x3(tl, tc, tr, cl, cc, cr, bl, bc, br);
			let rot090 = new Area3x3(tr, cr, br, tc, cc, bc, tl, cl, bl);
			let rot180 = new Area3x3(br, bc, bl, cr, cc, cl, tr, tc, tl);
			let rot270 = new Area3x3(bl, cl, tl, bc, cc, tc, br, cr, tr);

			// Search through rules
			for (const [index, rule] of this.rules.entries()) {
				if (index >= ruleIndex) {
					examinedAllRules = false;
					continue; // A matched rule is better
				}

				if (!isTile(rule.match.cc, cc.type))
					continue; // Center does not match

				// Try matching the rule
				if (rule.match.isMatch(rot000)) {
					ruleToApply = rule;
					areaToApply = rot000;
					ruleIndex = index;
					break;
				}

				// Try matching rotations of the rule
				if (rule.matchFlags & MatchFlags.Rotate1) {
					if (rule.match.isMatch(rot090)) {
						ruleToApply = rule;
						areaToApply = rot090;
						ruleIndex = index;
						break;
					}
				}

				if (rule.matchFlags & MatchFlags.Rotate4) {
					if (rule.match.isMatch(rot180)) {
						ruleToApply = rule;
						areaToApply = rot180;
						ruleIndex = index;
						break;
					}

					if (rule.match.isMatch(rot270)) {
						ruleToApply = rule;
						areaToApply = rot270;
						ruleIndex = index;
						break;
					}
				}
			}

			// Only mark the tile checked if every rule was examined
			if (examinedAllRules)
				this.markTileChecked(cc);
		}

		// If we found a rule, apply it
		if (ruleToApply !== null) {
			console.log(`Applying rule '${ruleToApply.name}' at ${areaToApply!.cc.pos.name()}`);
			ruleToApply.apply(this, areaToApply!);
		}
		// else console.log(`No rule to apply`);
	}

	//#endregion Rule Application
}

export type TileType = {
	name: string,
	color?: number;
	animCreate?: (game: GameState, tile: Tile) => GameAnim | undefined;
};
export const Tiles = {
	Any: { name: "any" },
	Empty: {
		name: "empty",
		animCreate(game, tile) {
			if (!tile.draw) return;
			return tile.draw.destroyAllModels(game);
		}
	},

	House1: {
		name: "house1",
		color: Colors.tileHouse1,
		animCreate(game, tile) {
			if (!tile.draw) return;
			const pos = tile.pos;
			const model = game.renderer.addMeshToTile(
				tile,
				game.renderer.assets.model_House1,
				pos,
				new color3(this.color)
			);
			return Anims.createModel(model, 1, 1);
		}
	},
	House2: {
		name: "house2",
		color: Colors.tileHouse2,
		animCreate(game, tile) {
			if (!tile.draw) return;
			const pos = tile.pos;
			const model = game.renderer.addMeshToTile(
				tile,
				game.renderer.assets.model_House2,
				pos,
				new color3(this.color)
			);
			return Anims.createModel(model, 1, 1);
		}
	},
	House3: {
		name: "house3",
		color: Colors.tileHouse3,
		animCreate(game, tile) {
			if (!tile.draw) return;
			const pos = tile.pos;
			const model = game.renderer.addMeshToTile(
				tile,
				game.renderer.assets.model_House3,
				pos,
				new color3(this.color)
			);
			return Anims.createModel(model, 1, 1);
		}
	},

	Road: {
		name: "road1",
		color: Colors.tileRoad1,
		animCreate(game, tile) {
			if (!tile.draw) return;
			const pos = tile.pos;
			const model = game.renderer.addMeshToTile(
				tile,
				game.renderer.assets.model_Intersection1,
				pos,
				new color3(this.color)
			);
			return Anims.createModel(model, 1, 1);
		}
	},
	Intersection: { name: "road2", color: Colors.tileRoad2 },
	Bridge: { name: "bridge", color: Colors.tileBridge },

	Grass: { name: "grass", color: Colors.tileGrass },
	Tree: { name: "tree", color: Colors.tileTree1 },
	Water: { name: "water", color: Colors.tileWater },
} as const satisfies Record<string, TileType>;

function isTile(pattern: TileType, type: TileType): boolean {
	return pattern === Tiles.Any || pattern === type;
}

export class Item {
	constructor(public type: TileType, public count: number) { }
}

class Grid {
	public size: number = 10;
	public tiles: Tile[];

	constructor() {
		this.tiles = Array(this.size * this.size);
		for (let y = 0; y < this.size; ++y) {
			for (let x = 0; x < this.size; ++x) {
				this.tiles[y * this.size + x] = new Tile(
					new P2(x, y), Tiles.Empty);
			}
		}
	}

	public getTile(x: number, y: number): Tile;
	public getTile(pos: P2): Tile;
	public getTile(xOrPos: number | P2, y?: number): Tile {
		if (typeof xOrPos === 'object') {
			return this.tiles[xOrPos.y * this.size + xOrPos.x]!;
		}
		return this.tiles[y! * this.size + xOrPos]!;
	}

	public getTileType(x: number, y: number): TileType;
	public getTileType(pos: P2): TileType;
	public getTileType(xOrPos: number | P2, y?: number): TileType {
		const x = typeof xOrPos === 'object' ? xOrPos.x : xOrPos;
		const py = typeof xOrPos === 'object' ? xOrPos.y : y!;

		if (x < 0 || x >= this.size || py < 0 || py >= this.size)
			return Tiles.Empty;
		return this.tiles[py * this.size + x]!.type;
	}

	public isTileEmpty(pos: P2) {
		return this.getTileType(pos) === Tiles.Empty;
	}
}

export class Match3x3 {
	public tl: TileType = Tiles.Any;
	public tc: TileType = Tiles.Any;
	public tr: TileType = Tiles.Any;
	public cl: TileType = Tiles.Any;
	public cc: TileType = Tiles.Empty;
	public cr: TileType = Tiles.Any;
	public bl: TileType = Tiles.Any;
	public bc: TileType = Tiles.Any;
	public br: TileType = Tiles.Any;

	constructor(init?: Partial<Match3x3>) {
		Object.assign(this, init);
	}

	public isMatch(area: Area3x3): boolean {
		// The center should be checked already
		return isTile(this.tc, area.tc.type)
			&& isTile(this.cr, area.cr.type)
			&& isTile(this.bc, area.bc.type)
			&& isTile(this.cl, area.cl.type)
			&& isTile(this.tl, area.tl.type)
			&& isTile(this.tr, area.tr.type)
			&& isTile(this.br, area.br.type)
			&& isTile(this.bl, area.bl.type);
	}
}

type TileArray3x3 = [Tile, Tile, Tile, Tile, Tile, Tile, Tile, Tile, Tile];

export class Area3x3 {
	constructor(
		public tl: Tile, public tc: Tile, public tr: Tile,
		public cl: Tile, public cc: Tile, public cr: Tile,
		public bl: Tile, public bc: Tile, public br: Tile
	) { }

	public static create(tiles: TileArray3x3) {
		return new Area3x3(...tiles);
	}
}

enum MatchFlags {
	None = 0x0,

	/** Check against the 0° and 90° rotations */
	Rotate1 = 0x1,

	/** Check against the 0°, 90°, 180° and 270° rotations */
	Rotate4 = 0x2 | Rotate1,
}

export class Rule {
	public name: string;
	public match: Match3x3;
	public matchFlags: MatchFlags;
	public apply: (game: GameState, area: Area3x3) => void;

	constructor(
		name: string,
		match: Partial<Match3x3>,
		apply: (game: GameState, area: Area3x3) => void,
		matchFlags?: MatchFlags
	) {
		this.name = name;
		this.match = new Match3x3(match);
		this.matchFlags = matchFlags ?? MatchFlags.Rotate1;
		this.apply = apply;
	}
}
