import { Container } from 'unstated'
import { emit, listen } from './events'
import { FigmaAPI, GoogleAPI } from './api'

window.emit = emit

export interface IStore {
	view:string
	page:{url?:string, items:any[]}
	selection:Array<{[key:string]:any}>
	google_api_key:string
	google_api_expired?:number
	figma_api_expired?:number
	figma_api_key:string,
	figma_team_id: string

	figma_files:string[]
	figma_components?:{[key:string]:{key:string, name:string, description:string}},
	figma_styles?:{[key:string]:{key:string, name:string, description:string, fillType:string}},
}

export class Store extends Container<IStore> {
	state = {
		view: 'HOME',
		page: { url: '', title: '', items: [] },
		selection: [],

		google_api_key: '',

		figma_api_key: '',

		figma_team_id: '',

		figma_files: ['3uYkKPR3FJBC5w9DCj6AqZ', '6NJFtH7zbodiX5TVKJaI7s', 'R6ER7QFSbl0X2dy5KCCDJa'],
		figma_components: null,
		figma_styles: null
	}
	figma:FigmaAPI
	google:GoogleAPI

	isLoading:boolean

	constructor() {
		super()
		listen('view', this.navigate)
		listen('page', this.setPage)
		listen('selection', this.setSelection)
		emit('load', this.onLoad)
	}

	setLoading = async (state:boolean) => {
		if (this.isLoading != state) {
			this.isLoading = state
			await this.setState({})
		}
	}
	setPage = async (page) => {
		await this.setState({ page })
	}
	setSelection = async (selection) => {
		await this.setState({ selection })
	}

	onLoad = async (state) => {
		await this.setState(state)
		this.subscribe(this.onUpdate)
		if (!this.state.figma_api_key || !this.state.google_api_key || !this.state.figma_team_id) {
			await this.navigate('AUTH')
		} else {
			this.figma = new FigmaAPI(this.state.figma_api_key, this.state.figma_team_id)
			this.google = new GoogleAPI(this.state.google_api_key)
			await this.fetch()
		}
	}
	onUpdate = () => {
		emit('save', this.state)
	}

	navigate = async view => {
		await this.setState({ view })
	}

	save = () => emit('save', this.state)

	fetch = async () => {
		const components = {}
		const styles = {}
		await this.setLoading(true)
		await Promise.all(this.state.figma_files.map(id => (
			this.figma.file(id).components().then(file => {
				Object.assign(components, file.components)
			})
		)))
		await emit('cache', { components, styles })
		await this.setLoading(false)
	}

	generate = async (url) => {
		await this.setLoading(true)
		const payload:any = {}
		const sheet = this.google.spreadsheet(url)
		await sheet.get().then(async (info) => {
			payload.id = sheet.id
			payload.url = url
			payload.title = info.properties.title
			payload.sheets = info.sheets.map((item:{[key:string]:{[key:string]:any}}) => {
				const id = item.properties.sheetId
				const title = item.properties.title
				if (parseInt(id) === parseInt(sheet.gid)) {
					payload.sheet = title
				}
				return { id, title, selected: payload.sheet === title }
			})
			payload.time = Date.now()
			payload.data = await sheet.values(payload.sheet + (sheet.range ? '!' + sheet.range : ''))
			console.log(payload.data)
			payload.grid = await sheet.get(`${payload.sheet}!A2:M${payload.data.length}`, true)
			console.log(payload.grid)
			await emit('draw', payload)
		})
		await this.setLoading(false)
	}
}


export const store:Store = new Store
