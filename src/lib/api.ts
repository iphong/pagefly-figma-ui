export class API<Params extends object, OAuth2Status extends OAuth2Response> {
	protected _baseURL:string
	protected _token:string
	protected _expired:number

	set auth(payload: OAuth2Status) {
		this._token = payload.access_token
		this._expired = Date.now() + payload.expires_in
	}

	async get(path:string, params?:Params) {
		const headers = { Authorization: `Bearer ${this._token}` }
		const query = params ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''
		const request = await fetch(`${this._baseURL}/${path}?${query}`, { headers })
		return await request.json()
	}
}

export class FigmaAPI extends API<object, OAuth2Response> {
	protected _baseURL:string = `https://api.figma.com/v1`

	teamProjects = id => this.get(`teams/${id}/projects`)
	projectFiles = id => this.get(`projects/${id}/files`)
	fileComponents = id => this.get(`files/${id}/components`)
	fileStyles = id => this.get(`files/${id}/styles`)

	component = id => this.get(`components/${id}`)
	style = id => this.get(`styles/${id}`)
	file = id => this.get(`files/${id}`)
}

export interface GoogleAPIParams {
	ranges?: string
	includeGridData?: boolean
}
export class GoogleAPI extends API<GoogleAPIParams, OAuth2Response> {
	protected _baseURL:string = `https://sheets.googleapis.com/v4`

	sheet = (id:string, params:object) =>this.get(`spreadsheets/${id}`)
}

export const figma = new FigmaAPI
export const google = new GoogleAPI

// type resolve_t = (...args:any[]) => null
// type reject_t = ({ error: boolean, status: number, message: string }) => null
// type promise_t = Promise<{[key:string]:any}>
//
// function loadHandler(resolve:resolve_t, reject:reject_t):(Event) => null {
// 	return ({ target: req }) => {
// 		if (req.status === 200) {
// 			if (req.getResponseHeader('Content-Type').startsWith('application/json')) {
// 				const payload = JSON.parse(req.responseText)
// 				return resolve(payload)
// 			}
// 		}
// 		reject({ error: true, status: req.status, message: req.responseText })
// 	}
// }
// export class FigmaAPI2 {
// 	static _baseURL:string = `https://api.figma.com/v1/`
//
// 	protected _token:string
// 	protected _team:string
//
// 	constructor(token:string, team?:string) {
// 		this._token = token
// 		this._team = team
// 	}
//
// 	query = (path:string):promise_t => {
// 		return new Promise((resolve:resolve_t, reject:reject_t) => {
// 			const req = new XMLHttpRequest
// 			req.open('GET', FigmaAPI._baseURL + path, true)
// 			// req.setRequestHeader('X-FIGMA-TOKEN', this._token)
// 			req.setRequestHeader('Authorization', 'Bearer ' + this._token)
// 			req.addEventListener('load', loadHandler(resolve, reject))
// 			req.send()
// 		})
// 	}
//
// 	projects = async () => await this.query(`teams/${this._team}/projects`)
//
// 	project = id => async () => await this.query(`projects/${id}/files`)
//
// 	file = id => ({
// 		get: async () => await this.query(`files/${id}`),
// 		styles: async () => (await this.query(`files/${id}/styles`)).meta,
// 		components: async () => (await this.query(`files/${id}/components`)).meta
// 	})
//
// 	component = id => ({
// 		get: async () => await this.query(`components/${id}`)
// 	})
//
// 	style = id => ({
// 		get: async () => await this.query(`styles/${id}`)
// 	})
// }
//
// type api_scope_t = string
//
// export class GoogleAPI2 {
//
// 	static API_URL_ROOT = 'https://sheets.googleapis.com/v4/'
// 	static URL_REGEX_ID = /^https:\/\/docs.google.com\/spreadsheets\/d\/([^\\]+)\/edit.*$/
//
// 	_token:string
//
// 	constructor(token:string) {
// 		this._token = token
// 	}
//
// 	query = (path:api_scope_t, ranges?:string, includeGridData:boolean = false):promise_t => {
// 		return new Promise((resolve:resolve_t, reject:reject_t) => {
// 			const req = new XMLHttpRequest
// 			const url = GoogleAPI.API_URL_ROOT + path + '?' + (includeGridData ? 'includeGridData=true&' : '') + (ranges ? 'ranges=' + ranges + '&' : '')
// 			req.open('GET', url, true)
// 			req.setRequestHeader('Authorization', 'Bearer ' + this._token)
// 			req.addEventListener('load', loadHandler(resolve, reject))
// 			req.send()
// 		})
// 	}
//
// 	spreadsheet = url => {
// 		let id = url.replace(GoogleAPI.URL_REGEX_ID, '$1')
// 		const [, gid] = url.match(/gid=([^&]+)/) || []
// 		const [, range] = url.match(/range=([^&]+)/) || []
// 		if (!id) id = url
// 		return {
// 			id,
// 			gid,
// 			range,
// 			isValid: !!id,
// 			get: async (range?, includeGridData:boolean = false) => await this.query(`spreadsheets/${id}`, range, includeGridData),
// 			props: async () => (await this.query(`spreadsheets/${id}`)).properties,
// 			sheets: async () => (await this.query(`spreadsheets/${id}`)).sheets,
// 			values: async range => (await this.query(`spreadsheets/${id}/values/${range}`)).values
// 		}
// 	}
// }