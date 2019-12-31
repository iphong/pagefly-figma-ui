import './figma'

declare global {

	interface Window {
		[key:string]:any
	}

	interface AppData {
		view:'HOME'|'AUTH'

		page?:PageData

		selection?:FieldData[]

		figma?:OAuth2Response

		google?:OAuth2Response

		google_api_key?:string
		google_api_expired?:number

		figma_api_expired?:number
		figma_api_key?:string,
		figma_team_id?:string
	}

	interface PageData {
		url:string
		id:string
		name:string

		[key:string]:any
	}

	interface FieldData {
		element:string
		group:string
		category:string
		parameter:string
		component:string
		values:{
			text:string
			color:string
			bold:boolean
		}[]
		value:string
		tooltip:string
		placeholder:string
	}

	interface OAuth2Response {
		access_token:string,
		expires_in:number
	}

}

export {}