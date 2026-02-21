/// <reference types="./blockbench"/>

declare class Deletable {
	/**
	 * The ID of the plugin that created the object
	 */
	plugin?: string
	delete(): void
}
type UUID = string

declare global {
	const settings: typeof settings
}

/**
 * True if Blockbench runs as a native app
 */
declare const isApp: boolean

declare const VuePrismEditor: Vue.Component

interface BlockbenchEventMap {
	remove_animation: any
	display_animation_frame: any
	display_default_pose: any
	interpolate_keyframes: any
	before_closing: any
	create_session: any
	join_session: any
	quit_session: any
	send_session_data: any
	receive_session_data: any
	user_joins_session: any
	user_leaves_session: any
	process_chat_message: any
	loaded_plugin: { plugin: BBPlugin }
	unloaded_plugin: { plugin: BBPlugin }
	installed_plugin: { plugin: BBPlugin }
	uninstalled_plugin: { plugin: BBPlugin }
	update_settings: any
	update_project_settings: Record<string, any>
	save_project: any
	load_project: any
	new_project: any
	reset_project: any
	close_project: any
	saved_state_changed: any
	save_model_action: any
	add_cube: any
	add_mesh: any
	add_group: any
	add_texture_mesh: any
	add_armature: any
	add_armature_bone: any
	add_bounding_box: any
	group_elements: any
	update_selection: any
	compile_bedrock_animations: any
	load_animation: any
	load_animation_controller: any
	update_keyframe_selection: any
	select_all: any
	added_to_selection: any
	invert_selection: any
	canvas_select: any
	canvas_click: any
	change_texture_path: any
	add_texture: any
	generate_texture_template: any
	update_texture_selection: any
	init_edit: any
	finish_edit: any
	finished_edit: any
	undo: { entry: UndoEntry }
	redo: { entry: UndoEntry }
	load_undo_save: any
	create_undo_save: any
	drop_text: { text: string }
	paste_text: { text: string }
	change_color: any
	select_mode: { mode: Mode }
	unselect_mode: { mode: Mode }
	change_active_panel: any
	resize_window: any
	press_key: any
	select_format: any
	convert_format: any
	construct_format: any
	delete_format: any
	select_project: { project: Project }
	unselect_project: { project: Project }
	setup_project: any
	update_project_resolution: any
	merge_project: any
	display_model_stats: any
	update_view: any
	update_camera_position: any
	render_frame: any
	construct_model_loader: any
	delete_model_loader: any
	update_recent_project_data: any
	update_recent_project_thumbnail: any
	load_from_recent_project_data: any
	edit_animation_properties: any
	select_preview_scene: any
	unselect_preview_scene: any
	compile_bedrock_animation_controller_state: any
	select_animation_controller_state: any
	add_animation_controller_animation: any
	add_animation_controller_transition: any
	add_animation_controller_particle: any
	add_animation_controller_sound: any
	compile_bedrock_animation_controller: any
	add_animation_controller: any
	edit_animation_controller_properties: any
	timeline_play: any
	timeline_pause: any
	unselect_interface: any
	reset_layout: any
	update_pressed_modifier_keys: any
	open_bar_menu: any
	unselect_all: any
	quick_save_model: any
	save_editor_state: any
	load_editor_state: any
	select_no_project: any
	flip_node_name: any
	update_scene_shading: any
	edit_layer_properties: any
	select_texture: any
	compile_texture_mcmeta: any
	register_element_type: any
	edit_collection_properties: any
}

type BlockbenchEventName = keyof BlockbenchEventMap

type IconString = string

declare const osfs: '\\' | '/'

declare function updateSelection(): void

declare var LZUTF8: any

declare function unselectAllElements(exceptions?: OutlinerNode[]): void
declare function updateCubeHighlights(hover_cube: Cube, force_off: boolean): void
declare function getRescalingFactor(angle: number): number
/**
 * Get the world-space center of the selection
 * @param all If true, calculate the center of all elements instead of just selected
 */
declare function getSelectionCenter(all: boolean = false): ArrayVector3

declare const Pressing: {
	shift: boolean
	ctrl: boolean
	alt: boolean
	overrides: {
		shift: boolean
		ctrl: boolean
		alt: boolean
	}
}

type RecentProjectData = {
	name: string
	path: string
	icon: string
	day: number
	favorite: boolean
	textures?: string[]
	animation_files?: string[]
}
declare const recent_projects: RecentProjectData[]

declare const Prop = {
	active_panel: string
}
declare const Project: ModelProject

declare function updateCubeHighlights(hover_cube: Cube, force_off: boolean): void
declare function getRescalingFactor(angle: number): number

declare function isStringNumber(value: any): boolean

declare function marked(text: string): string
declare function pureMarked(text: string): string
