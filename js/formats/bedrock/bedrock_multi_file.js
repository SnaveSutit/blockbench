import { MultiFileRuleset } from "../../multi_file_editing"
import { parseGeometry } from "./bedrock"
import { ModelLoader } from "./../../io/model_loader";
import PlayerTexture from './../../../assets/player_skin.png'

const PLAYER_GEO = {
	"description": {
		"identifier": "geometry.default_player",
		"texture_width": 64,
		"texture_height": 64,
		"visible_bounds_width": 5,
		"visible_bounds_height": 4.5,
		"visible_bounds_offset": [0, 1.75, 0]
	},
	"bones": [
		{
			"name": "root",
			"pivot": [0, 0, 0]
		},
		{
			"name": "waist",
			"parent": "root",
			"pivot": [0, 12, 0]
		},
		{
			"name": "body",
			"parent": "waist",
			"pivot": [0, 24, 0],
			"cubes": [
				{"origin": [-4, 12, -2], "size": [8, 12, 4], "uv": [16, 16]}
			]
		},
		{
			"name": "cape",
			"parent": "body",
			"pivot": [0, 24, 2],
			"cubes": [
				{"origin": [-4, 10, 2], "size": [8, 14, 1], "uv": [-5, 1]}
			]
		},
		{
			"name": "head",
			"parent": "body",
			"pivot": [0, 24, 0],
			"cubes": [
				{"origin": [-4, 24, -4], "size": [8, 8, 8], "uv": [0, 0]}
			]
		},
		{
			"name": "helmet",
			"parent": "head",
			"pivot": [0, 0, 0]
		},
		{
			"name": "rightArm",
			"parent": "body",
			"pivot": [-5, 22, 0],
			"cubes": [
				{"origin": [-8, 12, -2], "size": [4, 12, 4], "uv": [40, 16]}
			]
		},
		{
			"name": "rightItem",
			"parent": "rightArm",
			"pivot": [-6, 15, 1],
		},
		{
			"name": "leftArm",
			"parent": "body",
			"pivot": [5, 22, 0],
			"cubes": [
				{"origin": [4, 12, -2], "size": [4, 12, 4], "uv": [32, 48]}
			]
		},
		{
			"name": "leftItem",
			"parent": "leftArm",
			"pivot": [6, 15, 1],
			"cubes": [
			]
		},
		{
			"name": "rightLeg",
			"parent": "root",
			"pivot": [-1.9, 12, 0],
			"cubes": [
				{"origin": [-3.9, 0, -2], "size": [4, 12, 4], "uv": [0, 16]}
			]
		},
		{
			"name": "leftLeg",
			"parent": "root",
			"pivot": [1.9, 12, 0],
			"cubes": [
				{"origin": [-0.1, 0, -2], "size": [4, 12, 4], "uv": [16, 48]}
			]
		}
	]
}


let attachable_ruleset = new MultiFileRuleset('bedrock_attachable', {
	scope_limited_animations: true,
	collections_as_files: true,
})

BARS.defineActions(function() {
	
	const player_loader = new ModelLoader('bedrock_player_model', {
		name: 'Bedrock Player Model',
		description: 'Default bedrock player model for making attachables and player animations',
		show_on_start_screen: false,
		icon: 'icon-player',
		target: 'Minecraft: Bedrock Edition',
		onStart: async function() {
			
			let form_config = await new Promise((resolve, reject) => {
				new Dialog({
					title: 'Bedrock Player Model',
					form: {
						import_as_attachable: {label: 'Import current model as attachable', value: true, type: 'checkbox'},
					},
					onConfirm(result) {
						resolve(result)
					},
					onCancel() {
						reject();
					}
				}).show();
			});

			let import_bbmodel = form_config.import_as_attachable ? Codecs.project.compile() : null;

			setupProject(Formats.bedrock);
			parseGeometry({object: PLAYER_GEO}, {});

			Project.multi_file_ruleset = attachable_ruleset.id;

			let player_texture = new Texture({name: 'player.png', scope: 1}).fromDataURL(PlayerTexture).add(true, true);
			let elements_before = Outliner.elements.slice();
			let groups_before = Group.all.slice();
			let animations_before = Animation.all.slice();
			Outliner.nodes.forEach(node => {
				node.scope = 1;
			})

			if (form_config.import_as_attachable) {
				Codecs.project.merge(JSON.parse(import_bbmodel));
				Outliner.nodes.forEach(node => {
					if (!elements_before.includes(node) && !groups_before.includes(node)) {
						node.scope = 2;
					}
				});
				for (let texture of Texture.all) {
					if (texture != player_texture) texture.scope = 2;
				}
				for (let animation of Animation.all) {
					animation.setScopeFromAnimators();
				}
				Canvas.updateAllBones();
			}
		}
	})

	new Action('load_on_bedrock_player', {
		name: 'Load with Bedrock Player',
		condition: () => Format.id == 'bedrock' && !Project.multi_file_ruleset,
		icon: 'icon-player',
		click() {
			player_loader.onStart(Project);
			return;
		}
	})
})

const DEFAULT_POSE_FIRST = {
	rightarm: {
		rotation: [-95, 45, 115].map(Math.degToRad),
		position: [-13.5, -10, 12]
	},
	rightitem: {
		position: [0, -7, 0]
	},
	leftitem: {
		position: [0, -7, 0]
	},
	body: {hide_cubes: true},
	head: {hide_cubes: true},
	cape: {hide_cubes: true},
	rightleg: {hide_cubes: true},
	leftleg: {hide_cubes: true},
}
const DEFAULT_POSE_THIRD = {
	rightarm: {
		rotation: [18, 0, 0].map(Math.degToRad),
	}
}

function applyDefaultPose(data) {
	for (let bone_name in data) {
		let bone_data = data[bone_name];
		let bone = Group.all.find(g => g.name.toLowerCase() == bone_name);
		if (!bone) continue;
		if (bone_data.rotation) bone.mesh.rotation.fromArray(bone_data.rotation);
		if (bone_data.position) bone.mesh.position.add(Reusable.vec1.fromArray(bone_data.position));
		if (bone_data.scale) bone.mesh.scale.fromArray(bone_data.scale);
		if (bone_data.hide_cubes) {
			for (let child of bone.mesh.children) {
				if (child.type == 'cube') child.visible = false;
			}
		}
	}
}
Blockbench.on('display_default_pose', () => {
	if (Project.multi_file_ruleset == attachable_ruleset.id) {
		if (Project.bedrock_animation_mode == 'attachable_first') {
			applyDefaultPose(DEFAULT_POSE_FIRST);
		} else {
			applyDefaultPose(DEFAULT_POSE_THIRD);
		}
	}
})
Blockbench.on('get_face_texture', (arg) => {
	if (Project.multi_file_ruleset == attachable_ruleset.id && arg.element?.scope) {
		let texture_match = Texture.all.find(t => t.scope == arg.element.scope);
		if (texture_match) return texture_match;
	}
})