import './figma'

declare global {

	interface Window {
		[key:string]:any
	}

	interface OAuth2Status {
		access_token:string,
		expires_in:number
	}

	type View = 'HOME'|'AUTH'|'ASSETS'

	interface AppData {
		view:View
		page?:PageData
		selection?:FieldData[]

		figma?:OAuth2Status
		google?:OAuth2Status

		team?:string
		files?:string[]
	}

	interface PageData {
		id:string
		url:string
		name:string
	}

	interface FieldData {
		element:string
		group:string
		category:string
		parameter:string
		component:string
		values:ValueData[]
		value:string
		tooltip:string
		placeholder:string
	}

	interface ValueData {
		text:string
		color:string
		bold:boolean
	}
}

export {}