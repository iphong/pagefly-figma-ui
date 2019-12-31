export class API<Params extends object> {
	protected _baseURL:string
	protected _token:string
	protected _expired:number

	set auth(payload:OAuth2Status) {
		this._token = payload.access_token
		this._expired = Date.now() + payload.expires_in
	}

	async get(path:string, params?:Params) {
		const headers = { Authorization: `Bearer ${this._token}` }
		const query = params ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''
		const url = `${this._baseURL}/${path}?${query}`
		const request = await fetch(url, { headers })
		return await request.json()
	}
}

export class FigmaAPI extends API<object> {
	protected _baseURL:string = `https://api.figma.com/v1`

	teamProjects = async id => await this.get(`teams/${id}/projects`)
	projectFiles = async id => await this.get(`projects/${id}/files`)
	fileComponents = async id => await this.get(`files/${id}/components`)
	fileStyles = async id => await this.get(`files/${id}/styles`)

	component = async id => await this.get(`components/${id}`)
	style = async id => await this.get(`styles/${id}`)
	file = async id => await this.get(`files/${id}`)
}

export interface GoogleAPIParams {
	ranges?:string
	includeGridData?:boolean
}

export class GoogleAPI extends API<GoogleAPIParams> {
	protected _baseURL:string = `https://sheets.googleapis.com/v4`

	sheet = (id:string, params:object) => this.get(`spreadsheets/${id}`)
}

export const figma = new FigmaAPI
export const google = new GoogleAPI