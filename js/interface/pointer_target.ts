
export type PointerTargetType = {
	priority: number
}

/**
 * Tracks which function the pointer / pointer drag is currently targeting. E. g. painting, using gizmos etc.
 */
export class PointerTarget {
	static active: PointerTargetType | null = null;
	static types = {
		navigate: {
			priority: 0
		},
		paint: {
			priority: 1
		},
		gizmo_transform: {
			priority: 2
		},
		global_drag_slider: {
			priority: 3
		}
	};
	static requestTarget(target: PointerTargetType): boolean {
		if (PointerTarget.active && PointerTarget.active.priority > target.priority) {
			return false;
		} else {
			PointerTarget.active = target;
			return true;
		}
	}
	static endTarget(): void {
		PointerTarget.active = null;
	}
	static hasMinPriority(priority: number) {
		return PointerTarget.active && PointerTarget.active.priority >= priority;
	}
}
Object.assign(window, {
	PointerTarget
})
