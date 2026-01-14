
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

interface TransformerModuleOptions {
	priority: number
	condition: ConditionResolvable

	updateGizmo: (context: TransformContext) => void
	onPointerDown: (context: TransformContext) => void
	onStart: (context: TransformContext) => void
	onMove: (context: TransformContext) => void
	onEnd: (context: TransformContext) => void
	onCancel: (context: TransformContext) => void
}

export class TransformerModule {
	id: string
	priority: number
	condition: any

	updateGizmo: (context: TransformContext) => void
	onPointerDown: (context: TransformContext) => void
	onStart: (context: TransformContext) => void
	onMove: (context: TransformContext) => void
	onEnd: (context: TransformContext) => void
	onCancel: (context: TransformContext) => void

	constructor(id: string, options: TransformerModuleOptions) {
		this.id = id;
		this.priority = options.priority ?? 0;
		this.condition = options.condition;

		this.updateGizmo = options.updateGizmo;
		this.onPointerDown = options.onPointerDown;
		this.onStart = options.onStart;
		this.onMove = options.onMove;
		this.onEnd = options.onEnd;
		this.onCancel = options.onCancel;

		TransformerModule.modules[id] = this;
	}
	delete() {
		delete TransformerModule.modules[this.id];
	}
	
	static modules: Record<string, TransformerModule> = {};
	static get active(): TransformerModule | undefined {
		let match: TransformerModule | undefined;
		for (let id in TransformerModule.modules) {
			let module = TransformerModule.modules[id];
			if (!Condition(module.condition)) return;

			if (!match || module.priority > match.priority) {
				match = module;
			}
		}
		return match;
	}
}
interface TransformContext {
	event: Event
}
