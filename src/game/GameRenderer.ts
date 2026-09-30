import * as THREE from 'three';
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { P2 } from "./P2";

import glbModelsUrl from '../data/models.glb';
import { Frame as Frame } from './Frame';
import { GameState } from './GameState';

import '../utils/domUtils';
import '../utils/threeUtils';
import { Tile, TileDraw } from './Tile';
import { BatchedMesh } from 'three';
import { Colors } from '../styles/colors';
import { color3, float2, float3, float4, mat4x4, quat4 } from "../utils/threeUtils";

class RenderAssets {
	public matDefault: THREE.Material | undefined;

	public model_Missing!: number;
	public model_TileBG!: number;
	public model_Hover!: number;
	public model_House1!: number;
	public model_House2!: number;
	public model_House3!: number;
	public model_Intersection1!: number;

	loadModels(gltf: GLTF, batch: BatchedMesh) {
		this.model_Missing = batch.addGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.5));
		this.model_TileBG = batch.addGeometry(new THREE.PlaneGeometry(1, 1));
		this.model_Hover = addGeom(this, 'hover');
		this.model_House1 = addGeom(this, 'house_001');
		this.model_House2 = addGeom(this, 'house_002');
		this.model_House3 = addGeom(this, 'house_003');
		this.model_Intersection1 = addGeom(this, 'road_001');

		function addGeom(self: RenderAssets, name: string) {
			let geom = gltf.scene.getGeometryByName(name);
			if (!geom) return self.model_Missing;
			return batch.addGeometry(geom);
		}
	}
}

export class GameRenderer {
	public isReady: boolean = false;

	private scene = new THREE.Scene();
	private camera = new THREE.PerspectiveCamera(
		10, 1 / 1, 0.1, 1000);
	private camRaycaster = new THREE.Raycaster();
	private renderer = new THREE.WebGLRenderer({
		antialias: true
	});

	private resizeObserver: ResizeObserver | null = null

	public async setupAsync(ctr: HTMLElement, game: GameState) {
		// Set initial size
		const style = window.getComputedStyle(ctr);
		const width = ctr.clientWidth
			- parseFloat(style.paddingLeft)
			- parseFloat(style.paddingRight);
		const height = ctr.clientHeight
			- parseFloat(style.paddingTop)
			- parseFloat(style.paddingBottom);
		this.resize(width, height);

		// Attach resizer and canvas
		this.resizeObserver = new ResizeObserver(entries => {
			const { width, height } = entries[0]!.contentRect;
			this.resize(width, height);
		});
		this.resizeObserver.observe(ctr);
		ctr.appendChild(this.renderer.domElement);

		// Load Resources
		await this.loadResourcesAsync();

		// Setup game
		await this.setupForGame(game);

		this.isReady = true;
	}

	public cleanup() {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}

	public resize(width: number, height: number) {
		this.renderer.setSize(width, height);
		this.camera.aspect = width / height;
	}

	public assets: RenderAssets = new RenderAssets();
	public drawBatch!: BatchedMesh;

	private async loadResourcesAsync() {
		this.assets.matDefault = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0.1,
		});

		const loader = new GLTFLoader();
		const glbFetch = await fetch(glbModelsUrl);
		const glbBuffer = await glbFetch.arrayBuffer();
		const gltf = await loader.parseAsync(glbBuffer, '');

		const maxInstances = 128;
		const maxVertexCount = 10000;
		const maxIndexCount = 20000;

		this.drawBatch = new BatchedMesh(
			maxInstances, maxVertexCount, maxIndexCount,
			this.assets.matDefault);
		this.drawBatch.castShadow = true;
		this.drawBatch.receiveShadow = true;
		this.drawBatch.matrixWorldAutoUpdate = true;

		this.assets.loadModels(gltf, this.drawBatch);
	}

	private game: GameState | undefined;

	private gridSize: number = 0;
	private hoverMesh!: BatchedInstance;

	public async setupForGame(game: GameState) {
		this.game = game;

		this.gridSize = game.grid.size - 2;

		// Background
		this.scene.background = new color3('#151618');

		// Camera
		{
			const viewCenterX = this.gridSize / 2 + 0.5;
			const viewCenterY = this.gridSize / 2 + 0.5;
			this.camera.position.set(viewCenterX, viewCenterY - this.gridSize, 47);
			this.camera.lookAt(viewCenterX, viewCenterY, 0);
		}

		// Lighting
		{
			this.scene.add(new THREE.AmbientLight(0xFFFFFF, 0.8));

			const sun = new THREE.DirectionalLight(0xFFFFFF, 0.8);
			sun.castShadow = true;
			sun.position.set(10, 20, 20);
			sun.shadow.mapSize.width = 2048;
			sun.shadow.mapSize.height = 2048;
			sun.shadow.camera.near = 0.1;
			sun.shadow.camera.far = 100;
			sun.shadow.camera.left = -10;
			sun.shadow.camera.right = 10;
			sun.shadow.camera.top = 10;
			sun.shadow.camera.bottom = -10;

			// enable shadows
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFShadowMap;

			this.scene.add(sun);
		}

		// Grid
		const mat = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0.1,
		});
		{
			const matrix = new mat4x4();
			for (let y = 0; y < this.gridSize; ++y) {
				for (let x = 0; x < this.gridSize; ++x) {
					// Initialize the tile
					const tile = game.grid.getTile(x + 1, y + 1);
					const tileInst = this.drawBatch.addInstance(this.assets.model_TileBG);

					tile.draw = new TileDraw(x, y, tileInst);
					matrix.makeTranslation(tile.draw.pos);

					this.drawBatch.setMatrixAt(tileInst, matrix);
					this.drawBatch.setColorAt(tileInst, tile.draw.baseColor);

				}
			}
		}

		// Hover Model
		{
			this.hoverMesh = this.addModel(
				this.assets.model_Hover,
				new float3(0, 0, 0),
				1,
				new color3(Colors.white));
		}

		this.scene.add(this.drawBatch);
	}

	public hoverTile(tile: Tile | null) {
		if (!this.hoverMesh)
			return;

		if (!tile?.draw) {
			this.hoverMesh.setVisible(false);
			return;
		}

		const pos = tile.draw.pos;
		this.hoverMesh.setPosition(pos.x, pos.y, pos.z);
		this.hoverMesh.setVisible(true);
	}

	public draw(frame: Frame) {
		if (!this.isReady) return;

		// Trigger ThreeJS rendering
		this.renderer.render(this.scene, this.camera);
	}

	public uiToWorld(uiPos: P2 | null): P2 | null {
		if (uiPos === null)
			return null;

		const canvasRect = this.renderer.domElement.getBoundingClientRect();
		if (!canvasRect.containsP2(uiPos))
			return null;

		this.camRaycaster.setFromCamera(
			new THREE.Vector2(
				((uiPos.x - canvasRect.left) / canvasRect.width) * 2 - 1,
				-((uiPos.y - canvasRect.bottom) / canvasRect.height) * 2 - 1),
			this.camera);

		const p0 = this.camRaycaster.ray.origin;
		const d0 = this.camRaycaster.ray.direction;

		// Solve for t where the ray intersects the XY plane (z == 0)
		//   p0.z + t * d0.z = 0
		const t = -p0.z / d0.z;

		// Calculate the intersection point on the XY plane
		const x = p0.x + t * d0.x;
		const y = p0.y + t * d0.y;
		return new P2(x, y);
	}

	public addModel(
		modelID: number,
		pos: float3,
		size: number,
		color: color3) {
		const inst = this.drawBatch.addInstance(modelID);
		const rotation = new quat4();
		const scale = new float3(size);
		const matrix = new mat4x4().compose(
			pos, rotation, scale
		);
		this.drawBatch.setMatrixAt(inst, matrix);
		this.drawBatch.setColorAt(inst, color);

		return new BatchedInstance(this.drawBatch, inst, pos, rotation, scale);
	}

	public addMeshToTile(
		tile: Tile,
		modelID: number,
		pos: P2,
		color: color3,
	) {
		const position = new float3(pos.x, pos.y, 0);
		const scale = 1;
		const model = this.addModel(modelID,
			position,
			scale,
			color);

		tile.draw?.models.push(model);
		return model;
	}
}

export class BatchedInstance {
	private static _nextID = 0;
	public id: number = BatchedInstance._nextID++;
	private static _matrix = new mat4x4();

	constructor(
		public batch: BatchedMesh,
		public instId: number,
		public position = new float3(),
		public rotation = new quat4(),
		public scale = new float3(1, 1, 1)) {
	}

	setMatrix(matrix: mat4x4) {
		this.batch.setMatrixAt(this.instId, matrix);
		return this;
	}

	setPosition(x: number, y: number);
	setPosition(x: number, y: number, z: number);
	setPosition(x: number, y: number, z?: number) {
		this.position.set(x, y, z ?? 0);
		BatchedInstance._matrix.compose(this.position, this.rotation, this.scale);
		this.batch.setMatrixAt(this.instId, BatchedInstance._matrix);
		return this;
	}

	setScale(x: number);
	setScale(x: number, y: number, z: number);
	setScale(x: number, y?: number, z?: number) {
		this.scale.set(x, y ?? x, z ?? x);
		BatchedInstance._matrix.compose(this.position, this.rotation, this.scale);
		this.batch.setMatrixAt(this.instId, BatchedInstance._matrix);
		return this;
	}

	updateMatrix() {
		BatchedInstance._matrix.compose(this.position, this.rotation, this.scale);
		this.batch.setMatrixAt(this.instId, BatchedInstance._matrix);
		return this;
	}

	setColor(color: color3) {
		this.batch.setColorAt(this.instId, color);
		return this;
	}

	getMatrix(target = new mat4x4()) {
		return this.batch.getMatrixAt(this.instId, target);
	}

	setVisible(visible: boolean) {
		this.batch.setVisibleAt(this.instId, visible);
		return this;
	}

	destroy() {
		this.batch.deleteInstance(this.instId);
		this.instId = -1;
	}
}