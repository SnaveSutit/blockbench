import { BoundingBox } from "../outliner/types/bounding_box"

let raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
function getAllParents(element: OutlinerElement): OutlinerNode[] {
	let list = [];
	let parent = element.parent;
	while (parent instanceof OutlinerNode) {
		list.push(parent);
		parent = parent.parent;
	}
	return list;
}

class VoxelMatrix<Type> {
	values: Record<number, Type>
	private size: number
	private fallback: Type
	constructor(size: number, fallback: Type) {
		this.values = {};
		this.size = size;
		this.fallback = fallback;
	}
	getKey(x: number, y: number, z: number): number {
		return x * this.size*this.size + y * this.size + z;
	}
	getVectorFromKey(key: number): ArrayVector3 {
		return [
			Math.floor(key / this.size**2),
			Math.floor((key % this.size**2) / this.size),
			key % this.size,
		]
	}
	set(x: number, y: number, z: number, value: Type): void {
		let key = this.getKey(x, y, z);
		this.values[key] = value;
	}
	get(x: number, y: number, z: number): Type {
		let key = this.getKey(x, y, z);
		return this.values[key] ?? this.fallback;
	}
	delete(x: number, y: number, z: number): void {
		delete this.values[this.getKey(x, y, z)];
	}
}

BARS.defineActions(() => {
	new Action('generate_voxel_shapes', {
		// TODO: Localize this
		name: 'Generate Voxel Shapes',
		category: 'edit',
		icon: 'fa-cubes',
		click() {

			interface GenerateOptions{
				visible_only: boolean
				complexity: number
			}
			let default_options: GenerateOptions = {
				visible_only: false,
				complexity: 40
			}
			function generate(amended: boolean, options: GenerateOptions) {
				let bounding_boxes: BoundingBox[] = [];
				Undo.initEdit({elements: bounding_boxes}, amended);
				
				let cubes: Cube[] = Cube.all.slice();
				let rotated_cubes: Cube[] = [];
				let aabbs: THREE.Box3[] = [];
				for (let cube of cubes) {
					if (options.visible_only && cube.visibility == false) continue;
					if (cube.size().some(v => v < 0.1)) continue;
					let no_rotation = cube.rotation.allEqual(0) &&
						getAllParents(cube).allAre(parent => {
							return !('rotation' in parent) || (parent.rotation as ArrayVector3).allEqual(0)
						});
					if (no_rotation) {
						aabbs.push(new THREE.Box3(
							new THREE.Vector3().fromArray(cube.from),
							new THREE.Vector3().fromArray(cube.to),
						));
					} else {
						rotated_cubes.push(cube);
					}
				}

				let matrix = new VoxelMatrix<boolean|null>(32, null);

				// Voxelize model
				let point = new THREE.Vector3();
				for (let x = 0; x < 16; x++) {
					for (let z = 0; z < 16; z++) {
						for (let y = 0; y < 24; y++) {
							point.set(x-7.5, y+0.5, z-7.5);
							let in_shape = aabbs.some(box => box.containsPoint(point));
							if (!in_shape && rotated_cubes.length) {
								raycaster.ray.origin.copy(point);
								in_shape = rotated_cubes.some(cube => {
									let intersects = raycaster.intersectObject(cube.mesh);
									return intersects.length % 2 == 1;
								})
							}
							matrix.set(x, y, z, !!in_shape);
						}
					}
				}

				// Simplify voxels to boxes
				type MBox = [number, number, number, number, number, number];
				let boxes: MBox[] = [];
				let miss_factor = (options.complexity/100)**2; // Square curve to distribute along slider more nicely
				let _i = 0;
				while (_i < 256) {
					_i++;
					let keys = Object.keys(matrix.values);
					let key = keys.findLast(key => matrix.values[key] == true);
					if (!key) break;
					let start_coords = matrix.getVectorFromKey(parseInt(key));
					let box: MBox = [...start_coords, ...start_coords];
					let directions = [true, true, true, true, true, true];
					function expand(axis: 0|1|2, direction: 1 | -1): boolean {
						let axisa = (axis+1)%3;
						let axisb = (axis+2)%3;
						let cursor = box.slice(0, 3);
						if (direction == 1) {
							cursor[axis] = box[axis+3] + 1;
						} else {
							cursor[axis] -= 1;
						}
						if (cursor[axis] >= (axis == 1 ? 24 : 16) || cursor[axis] < 0) return false;
						let surface_size = (box[axisa+3]-box[axisa]+1) * (box[axisb+3]-box[axisb]+1);

						let max_misses = surface_size * (1-miss_factor);
						let misses = 0;
						for (let a = box[axisa]; a <= box[axisa+3]; a++) {
							cursor[axisa] = a;
							for (let b = box[axisb]; b <= box[axisb+3]; b++) {
								cursor[axisb] = b;
								let value = matrix.get(cursor[0], cursor[1], cursor[2]);
								if (value == null) return false; // Already occupied by box
								if (!value) {
									misses++;
									if (misses > max_misses) {
										return false;
									}
								}
							}
						}
						if (direction == 1) {
							box[axis+3] += 1;
						} else {
							box[axis] -= 1;
						}
						return true;
					}

					for (let i = 0; i < 16; i++) {
						if (directions[0]) directions[0] = expand(0, 1);
						if (directions[1]) directions[1] = expand(0, -1);
						if (directions[2]) directions[2] = expand(2, 1);
						if (directions[3]) directions[3] = expand(2, -1);
					}
					for (let i = 0; i < 24; i++) {
						if (directions[4]) directions[4] = expand(1, 1);
						if (directions[5]) directions[5] = expand(1, -1);
					}
					boxes.push(box);
					for (let x = box[0]; x <= box[3]; x++) {
						for (let y = box[1]; y <= box[4]; y++) {
							for (let z = box[2]; z <= box[5]; z++) {
								matrix.delete(x, y, z);
							}
						}
					}
				}
				let i = 0;
				for (let box of boxes) {
					i++
					let bb = new BoundingBox({
						from: [box[0]-8, box[1], box[2]-8],
						to: [box[3]-7, box[4]+1, box[5]-7],
						color: i
					}).addTo().init();
					bounding_boxes.push(bb);
				}

				Undo.finishEdit('Generate voxel shapes');
			}
			generate(false, default_options);

			Undo.amendEdit({
				visible_only: {label: 'Visible Elements Only', type: 'checkbox', value: default_options.visible_only},
				complexity: {label: 'Complexity', type: 'range', min: 0, max: 100, value: default_options.complexity},
			}, result => {
				generate(true, result);
			})

		}
	})
})