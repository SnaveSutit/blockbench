


export function setProjectResolution(width, height, modify_uv) {
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
				face.uv[0] *= multiplier[0];
				face.uv[1] *= multiplier[1];
				face.uv[2] *= multiplier[0];
				face.uv[3] *= multiplier[1];
			}
		}
	}
}

export function editUVSizeDialog(options: {target?: Texture}): void {
	new Dialog({
		id: 'edit_uv_size',
		title: 'Edit UV Size',
		darken: false,
		form: {
			target: {type: 'select', options: {

			}},
			current_size: {type: 'vector', dimensions: 2, value: [16, 16], readonly: true},
			target_size: {type: 'vector', dimensions: 2, value: [16, 16]},
		},
		onOpen() {
			let pos = window.innerHeight-this.object.clientHeight-50;
			this.object.style.top = pos + 'px';
		},
		onFormChange() {

		},
		onConfirm(result) {

		}
	}).show();
}