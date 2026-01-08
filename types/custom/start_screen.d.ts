declare interface ModelLoaderOptions {
	id?: string
	icon: string
	name?: string
	description?: string
	category?: string
	target?: string | string[]
	confidential?: boolean
	condition?: ConditionResolvable
	format_page?: FormatPage
	onFormatPage?(): void
	onStart?(): void
}
