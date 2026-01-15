
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

interface TransformContext {
	event: Event
	value: number
}

interface TransformerModuleOptions {
	priority: number
	condition: ConditionResolvable
	use_condition: ConditionResolvable

	updateGizmo: (this: TransformerModule, context: TransformContext) => void
	onPointerDown: (this: TransformerModule, context: TransformContext) => void
	calculateOffset: (this: TransformerModule, context: TransformContext) => number
	onStart: (this: TransformerModule, context: TransformContext) => void
	onMove: (this: TransformerModule, context: TransformContext) => void
	onEnd: (this: TransformerModule, context: TransformContext) => void
	onCancel: (this: TransformerModule, context: TransformContext) => void
}
export interface TransformerModule extends TransformerModuleOptions {}

export class TransformerModule implements TransformerModuleOptions {
	id: string
	priority: number
	condition: any
	use_condition: any

	previous_value: number | null
	initial_value: number | null

	constructor(id: string, options: TransformerModuleOptions) {
		this.id = id;
		this.priority = options.priority ?? 0;
		this.condition = options.condition;
		this.use_condition = options.use_condition;

		this.previous_value = null;
		this.initial_value = null;

		this.updateGizmo = options.updateGizmo;
		this.onPointerDown = options.onPointerDown;
		this.calculateOffset = options.calculateOffset;
		this.onStart = options.onStart;
		this.onMove = options.onMove;
		this.onEnd = options.onEnd;
		this.onCancel = options.onCancel;

		TransformerModule.modules[id] = this;
	}

	dispatchPointerDown(context: TransformContext) {
		this.previous_value = null;
		this.initial_value = null;

		if (this.onPointerDown) this.onPointerDown(context);
	}
	dispatchMove(context: TransformContext) {
		if (!Condition(this.use_condition)) return;

		let value = this.calculateOffset(context);
		if (this.previous_value == null) this.previous_value = value;
		if (this.initial_value == null) this.initial_value = value;

		if (value != this.previous_value) {
			context.value = value;
			if (!Transformer.hasChanged && this.onStart) {
				this.onStart(context)
			}
			if (this.onMove) {
				this.onMove(context)
			}
			this.previous_value = value;
			Transformer.hasChanged = true;
		}
	}

	delete() {
		delete TransformerModule.modules[this.id];
	}
	
	static modules: Record<string, TransformerModule> = {};
	static get active(): TransformerModule | undefined {
		let match: TransformerModule | undefined;
		for (let id in TransformerModule.modules) {
			let module = TransformerModule.modules[id];
			if (!Condition(module.condition)) continue;

			if (!match || module.priority > match.priority) {
				match = module;
			}
		}
		return match;
	}
}

const globals = {
	TransformerModule
}
declare global {
	const TransformerModule: typeof globals.TransformerModule
}
Object.assign(window, globals);
