
/*
Dimensions:
- Mode
	- Tool


Control
- Gizmo visibility
- Gizmo position / rotation (transform space)
- extend line
- mouse down
- start move
- move
- finish
- cancel
*/

interface TransformControllerOptions {
}
class TransformController {
	id: string
	constructor(id: string, options: TransformControllerOptions) {
		this.id = id;
		TransformController.controllers[id] = this;
	}
	delete() {
		delete TransformController.controllers[this.id];
	}
	static controllers: Record<string, TransformController> = {};
}


new TransformController('edit', {
	condition: () => Modes.edit || (Modes.animate && Toolbox.selected.id == 'pivot_tool') || Modes.pose,
	updateGizmo() {

	},
	onPointerDown() {
		
	},
	onStart() {
		
	},
	onMove() {
		
	},
	onEnd() {
		
	},
	onCancel() {
		
	},
});