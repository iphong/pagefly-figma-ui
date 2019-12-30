import { Container } from 'unstated'
import { emit, listen } from '../lib/events'
import { FigmaAPI, GoogleAPI } from '../lib/api'

window.emit = emit

export interface IAppStore {
	view:string
	page:{url?:string, items:any[]}
	selection:Array<{[key:string]:any}>
	google_api_key:string
	figma_api_key:string,
	figma_files:string[]
	figma_components?:{[key:string]:{key:string, name:string, description:string}},
	figma_styles?:{[key:string]:{key:string, name:string, description:string, fillType:string}},
}

export class AppStore extends Container<IAppStore> {
	state = {
		view: 'HOME',
		page: { url: '', title: '', items: [] },
		selection: [],
		google_api_key: 'AIzaSyDiGd0_Em7NgMbefuKeBehAMTrYHlG2nX8',
		figma_api_key: '29587-0a62fa8c-c444-4460-a702-d49d8841d3c3',
		figma_team_id: '713233029226794192',
		figma_files: ['3uYkKPR3FJBC5w9DCj6AqZ', '6NJFtH7zbodiX5TVKJaI7s', 'R6ER7QFSbl0X2dy5KCCDJa'],
		figma_components: null,
		figma_styles: null
	}
	figma:FigmaAPI
	google:GoogleAPI

	isLoading:boolean

	constructor() {
		super()
		this.figma = new FigmaAPI(this.state.figma_api_key, this.state.figma_team_id)
		this.google = new GoogleAPI(this.state.google_api_key)
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
		this.fetch()
	}
	onUpdate = () => {
		this.figma._team = this.state.figma_team_id
		this.figma._token = this.state.figma_api_key
		this.google._apiKey = this.state.google_api_key
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
			payload.grid = await sheet.get(`${payload.sheet}!A2:M${payload.data.length}`, true)
			await emit('draw', payload)
		})
		await this.setLoading(false)
	}
}


export const app:AppStore = new AppStore

window.app = app