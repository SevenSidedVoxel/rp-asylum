import { P2 } from "./coords";
import { GameAnim } from "./gameAnims";

export class GameState {
	public score: number = 0;
	public population: number = 0;
	public nature: number = 0;

	public grid: Grid = new Grid();
	public rules: Rule[] = GameState.makeRules();
	public anims: GameAnim[] = [];


	public placeTile(pos: P2, type: TileTypes) {
		const tile = this.grid.getTile(pos);
		switch (type) {
			case TileTypes.House1:
				if (tile.type !== TileTypes.Empty)
					return; // not empty
				this.setTileType(tile, type);
				this.addScore(tile, 1);
				this.addPop(tile, 1);
				break;

			default:
				console.warn(`Not Implemented: Placing tile ${TileTypes[type]} on ${pos.name()}`);
				break;
		}
	}

	static makeRules(): Rule[] {
		let rules: Rule[] = [];

		rules.push(new Rule("Make Cull-de-sac",
			{
				cc: TileTypes.Road,
				tc: TileTypes.House1,
				cl: TileTypes.House1,
				bc: TileTypes.House1,
			},
			(game, area) => {
				game.setTileType(area.cc, TileTypes.House2);
				game.setTileType(area.tc, TileTypes.Empty);
				game.setTileType(area.cl, TileTypes.Empty);
				game.setTileType(area.bc, TileTypes.Empty);
				game.addScore(area.cc, 3);
			},
			MatchFlags.Rotate4));

		rules.push(new Rule("Add Road between Houses",
			{
				cc: TileTypes.Empty,
				tc: TileTypes.House1,
				bc: TileTypes.House1,
			},
			(game, area) => {
				game.setTileType(area.cc, TileTypes.Road);
				game.addScore(area.cc, 1);
			},
			MatchFlags.Rotate1));

		rules.push(new Rule("Make Apartment I",
			{
				cc: TileTypes.House2,
				tc: TileTypes.House1,
				bc: TileTypes.House1,
			},
			(game, area) => {
				game.setTileType(area.cc, TileTypes.House3);
				game.setTileType(area.tc, TileTypes.Empty);
				game.setTileType(area.bc, TileTypes.Empty);
				game.addScore(area.cc, 4);
				game.addPop(area.cc, 4);
			},
			MatchFlags.Rotate1));

		rules.push(new Rule("Make Apartment L",
			{
				cc: TileTypes.House2,
				tc: TileTypes.House1,
				cl: TileTypes.House1,
			},
			(game, area) => {
				game.setTileType(area.cc, TileTypes.House3);
				game.setTileType(area.tc, TileTypes.Empty);
				game.setTileType(area.cl, TileTypes.Empty);
				game.addScore(area.cc, 4);
				game.addPop(area.cc, 4);
			},
			MatchFlags.Rotate4));

		rules.push(new Rule("Make Intersection",
			{
				cc: TileTypes.Road,
				tc: TileTypes.Road,
				bc: TileTypes.Road,
				cl: TileTypes.Road,
				cr: TileTypes.Road,
			},
			(game, area) => {
				game.setTileType(area.cc, TileTypes.Intersection);
				game.addScore(area.cc, 4);
			},
			MatchFlags.Rotate1));

		return rules;
	}

	//#region State Modification

	private addScore(tile: Tile, s: number) {
		this.score += s;
	}

	private addPop(tile: Tile, p: number) {
		this.population += p;
	}

	private setTileType(tile: Tile, type: TileTypes) {
		if (tile.type === type)
			return;

		console.log(`Setting ${tile.pos.name()} to '${TileTypes[type]}'`);
		tile.type = type;

		this.markForCheck(tile.pos.x, tile.pos.y);
		this.markAdjForCheck(tile.pos);

		if (tile.Elem) {
			this.anims.push(new GameAnim(() => {
				tile.Elem!.setAttribute('data-tile', TileTypes[type]);
			}));
		}
	}

	//#endregion State Modification

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
			tile.Elem?.setAttribute('data-check', '');
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
		tile.Elem?.removeAttribute('data-check');
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

export enum TileTypes {
	Any,
	Empty,

	House1,
	House2,
	House3,

	Road,
	Intersection,
	Bridge,

	Grass,
	Tree,
	Water,
}
function isTile(pattern: TileTypes, type: TileTypes): boolean {
	return pattern === TileTypes.Any || pattern === type;
}

export class Tile {
	public type: TileTypes = TileTypes.Empty;
	public pos: P2;
	public shouldCheck: boolean = false;

	public Elem: Element | null = null;

	public constructor(pos: P2, type: TileTypes) {
		this.pos = pos;
		this.type = type;
	}
}

class Grid {
	public size: number = 10;
	public tiles: Tile[];

	public constructor() {
		this.tiles = Array(this.size * this.size);
		for (let y = 0; y < this.size; ++y) {
			for (let x = 0; x < this.size; ++x) {
				this.tiles[y * this.size + x] = new Tile(
					new P2(x, y), TileTypes.Empty);
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

	public getTileType(x: number, y: number): TileTypes;
	public getTileType(pos: P2): TileTypes;
	public getTileType(xOrPos: number | P2, y?: number): TileTypes {
		const x = typeof xOrPos === 'object' ? xOrPos.x : xOrPos;
		const py = typeof xOrPos === 'object' ? xOrPos.y : y!;

		if (x < 0 || x >= this.size || py < 0 || py >= this.size)
			return TileTypes.Empty;
		return this.tiles[py * this.size + x]!.type;
	}

	public isTileEmpty(pos: P2) {
		return this.getTileType(pos) === TileTypes.Empty;
	}
}

export class Match3x3 {
	public tl: TileTypes = TileTypes.Any;
	public tc: TileTypes = TileTypes.Any;
	public tr: TileTypes = TileTypes.Any;
	public cl: TileTypes = TileTypes.Any;
	public cc: TileTypes = TileTypes.Empty;
	public cr: TileTypes = TileTypes.Any;
	public bl: TileTypes = TileTypes.Any;
	public bc: TileTypes = TileTypes.Any;
	public br: TileTypes = TileTypes.Any;

	public constructor(init?: Partial<Match3x3>) {
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
	public constructor(
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

	public constructor(
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
