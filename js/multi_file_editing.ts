interface MultiFileRules {
	scope_limited_animations: boolean
	collections_as_files: boolean
}
export interface MultiFileRuleset extends MultiFileRules {}
export class MultiFileRuleset {
	constructor(id: string, rules: MultiFileRules) {
		Object.assign(this, rules);
		MultiFileRuleset.rulesets[id] = this;
	}

	static rulesets: Record<string, MultiFileRuleset> = {};
}


new MultiFileRuleset('bedrock_attachable', {
	scope_limited_animations: true,
	collections_as_files: true,
})
