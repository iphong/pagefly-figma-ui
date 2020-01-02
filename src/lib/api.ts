import { store } from './store'

export class API<Params extends object|any> {
	protected _url:string
	protected _token:string
	protected _expired:number
	protected _provider:string
	protected _authCallback

	set auth(payload:OAuth2Status) {
		this._token = payload.access_token
		this._expired = Date.now() + payload.expires_in
		console.log('set oauth status for "' + this._provider + '"')
	}

	onAuth = (cb) => {
		this._authCallback = cb
	}

	login = async () => {
		const provider = this._provider
		const identifier = Math.round(Math.random() * 5000).toString().padStart(5, '0') + ':' + Date.now()
		window.open('https://phongvt.herokuapp.com/auth/' + provider + '?state=' + identifier)
		const req = await fetch('https://phongvt.herokuapp.com/auth/' + provider + '/gateway?state=' + identifier)
		let res:OAuth2Status = await req.json()
		if (typeof res !== 'object') {
			try {
				res = JSON.parse(res)
			} catch (e) {
				console.log('fail to parse oauth status')
			}
			if (res.access_token) {
				this.auth = res
				this._authCallback && this._authCallback(res)
			}
		}
	}

	query = async (path:string, params?:Params) => {
		if (!this._token) {
			console.log('asking for permission')
			await this.login()
		}
		const query = params ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : ''
		const request = await fetch(`${this._url}/${path}?${query}`, { headers: { Authorization: `Bearer ${this._token}` } })
		return await request.json()
	}
}

export class FigmaAPI extends API<any> {
	_url = `https://api.figma.com/v1`
	_provider = 'figma'

	teamProjects = async id => this.query(`teams/${id}/projects`)
	projectFiles = async id => this.query(`projects/${id}/files`)
	fileComponents = async id => this.query(`files/${id}/components`)
	fileStyles = async id => this.query(`files/${id}/styles`)

	component = async id => this.query(`components/${id}`)
	style = async id => this.query(`styles/${id}`)
	file = async id => this.query(`files/${id}`)
}

export class GoogleAPI extends API<{
	ranges?:string
	includeGridData?:boolean
}> {
	_url = `https://sheets.googleapis.com/v4`
	_provider = 'google'

	parse(url) {
		const regex = new RegExp('/spreadsheets/d/([a-zA-Z0-9-_]+)')
		const gidRegex = new RegExp('[#&]gid=([0-9]+)')
		const [, id] = url.match(regex) || []
		const [, gid] = url.match(gidRegex) || []
		return { id, gid }
	}

	sheet = async (id:string, params:object) => this.query(`spreadsheets/${id}`, params)
}

export const figma = new FigmaAPI
export const google = new GoogleAPI