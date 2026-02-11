
export function setProjectResolution(width: number, height: number, modify_uv: boolean = false) {
	if (Project.texture_width / width != Project.texture_width / height) {
		modify_uv = false;
	}

	let textures = Format.per_texture_uv_size ? Texture.all : undefined;

	Undo.initEdit({uv_mode: true, elements: Cube.all, uv_only: true, textures});

	let old_res = {
		x: Project.texture_width,
		y: Project.texture_height
	}
	Project.texture_width = width;
	Project.texture_height = height;

	if (modify_uv) {
		if (old_res.x != Project.texture_width && Math.areMultiples(old_res.x, Project.texture_width)) {
			adjustElementUVToResolution([
				Project.texture_width/old_res.x,
				Project.texture_height/old_res.y
			]);
		}
	}
	textures && textures.forEach(tex => {
		tex.uv_width = Project.texture_width;
		tex.uv_height = Project.texture_height;
	});

	Undo.finishEdit('Changed project resolution')
	Canvas.updateAllUVs()
	if (selected.length) {
		UVEditor.loadData()
	}
}

export function adjustElementUVToResolution(multiplier: ArrayVector2, elements = Outliner.elements, texture?: Texture) {
	for (let element of elements) {
		if ('faces' in element == false) continue;
		if (element instanceof Mesh) {
			for (let key in element.faces) {
				let face = element.faces[key];
				if (texture && face.getTexture() != texture) continue;
				face.vertices.forEach(vertex_key => {
					if (face.uv[vertex_key]) {
						face.uv[vertex_key][0] *= multiplier[0];
						face.uv[vertex_key][1] *= multiplier[1];
					}
				})
			}

		} else if (element instanceof Cube && element.box_uv) {
			element.uv_offset[0] = Math.floor(element.uv_offset[0] * multiplier[0]);
			element.uv_offset[1] = Math.floor(element.uv_offset[1] * multiplier[1]);
		} else {
			for (let fkey in (element.faces as Record<string, Face>)) {
				let face = element.faces[fkey] as Face;
				if (texture && face.getTexture() != texture) continue;
				face.uv[0] *= multiplier[0];
				face.uv[1] *= multiplier[1];
				face.uv[2] *= multiplier[0];
				face.uv[3] *= multiplier[1];
			}
		}
	}
}

export function editUVSizeDialog(options: {target?: Texture}): void {
	let old_size: ArrayVector2 = [Project.getUVWidth(options.target), Project.getUVHeight(options.target)];
	let texture = options.target;
	let element_backups: Record<string, any> = {};
	const adjust_options = {
		adjust_uv: 'Adjust UV',
		keep: 'Keep UV Values',
		adjust_scale: 'Adjust Scale',
	}
	type Results = {
		target: any
		target_size: ArrayVector2
		adjust: keyof typeof adjust_options
		live_preview: boolean
	}
	const elements = Outliner.elements.filter(element => isElementAffected(element));

	function isElementAffected(element: OutlinerElement): boolean {
		if ('faces' in element == false) return false;
		if (Format.per_texture_uv_size == false) return true;
		for (let fkey in (element.faces as Record<string, Face>)) {
			let face = element.faces[fkey] as Face;
			if (face.getTexture() == options.target) return true;
		}
		return false;
	}
	function changeElementUVs(multiplier: ArrayVector2, update_scale: boolean = false) {
		for (let element of elements) {
			if (!element_backups[element.uuid]) {
				element_backups[element.uuid] = element.getUndoCopy();
			} else {
				element.extend(element_backups[element.uuid]);
			}
		}
		adjustElementUVToResolution(multiplier, elements, options.target);
		if (update_scale) {
			let groups = elements.length == Outliner.elements.length ? Group.all : [];
			ModelScaler.scaleElements(elements, groups, multiplier[0], [0, 0, 0]);
		}
		Canvas.updateView({elements, element_aspects: {uv: true, transform: true, geometry: true}});
	}
	function revertElementChanges() {
		for (let element of elements) {
			if (!element_backups[element.uuid]) continue;
			element.extend(element_backups[element.uuid]);
			delete element_backups[element.uuid];
		}
		Canvas.updateView({elements, element_aspects: {uv: true, transform: true, geometry: true}});
	}
	function setValue(size: ArrayVector2) {
		if (Format.per_texture_uv_size && options.target) {
			let texture = options.target;
			texture.uv_width = size[0];
			texture.uv_height = size[1];
		} else {
			Project.texture_width = size[0];
			Project.texture_height = size[1];
		}
	}
	function getOutputText() {
		let texture = options.target ?? Texture.getDefault();
		if (!texture) return '';
		let uv_size = texture.width / texture.getUVWidth();
		let x_value = uv_size * Format.block_size;
		let ratio = uv_size < 1 ? `1:${trimFloatNumber(1/uv_size)}` : `${trimFloatNumber(uv_size)}:1`;
		return `${trimFloatNumber(x_value, 2)}x - ${ratio}`;
	}

	Undo.initEdit({
		textures: texture ? [texture] : undefined,
		elements
	});

	let dialog = new Dialog({
		id: 'edit_uv_size',
		title: 'Edit UV Size',
		darken: false,
		form: {
			//target: {type: 'select', options: {}},
			adjust: {type: 'select', label: 'Adjust', options: adjust_options},
			target_size: {type: 'vector', label: 'Target UV Size', dimensions: 2, value: old_size, linked_ratio: true, min: 1, step: 1, force_step: true},
			preest: {type: 'buttons', label: ' ', buttons: ['Original', 'Match Texture', '2x', '0.5x'], click(button) {
				if (button == 0) {
					dialog.form.setValues({target_size: old_size}, true);
				} else if (button == 1) {
					dialog.form.setValues({target_size: [texture?.width ?? 16, texture?.height ?? 16]}, true);
				} else {
					let current = (dialog.form.getResult() as Results).target_size;
					let factor = button == 2 ? 2 : 0.5;
					dialog.form.setValues({target_size: [current[0]*factor, current[1]*factor]}, true);
				}
			}},
			output: {type: 'info', label: 'Result', text: getOutputText()},
			live_preview: {type: 'checkbox', label: 'Live Preview', value: true}
		},
		onOpen() {
			let pos = window.innerHeight-this.object.clientHeight-50;
			this.object.style.top = pos + 'px';
		},
		onFormChange(result: Results) {
			setValue(result.target_size);

			dialog.form.form_data.output.bar.childNodes[1].textContent = getOutputText();

			if (result.live_preview) {
				if (result.adjust == 'adjust_uv' || result.adjust == 'adjust_scale') {
					let multiplier: ArrayVector2 = [
						result.target_size[0] / old_size[0],
						result.target_size[1] / old_size[1],
					];
					changeElementUVs(multiplier, result.adjust == 'adjust_scale');
				} else {
					Canvas.updateView({elements: Outliner.elements, element_aspects: {uv: true, transform: true, geometry: true}});
				}
				UVEditor.loadData();
			} else {
				revertElementChanges();
				UVEditor.loadData();
			}
		},
		onConfirm(result: Results) {
			Undo.finishEdit('Change UV Size');
		},
		onCancel() {
			setValue(old_size);
			revertElementChanges();
			Undo.cancelEdit(false);
			updateSelection();
		}
	}).show();
}