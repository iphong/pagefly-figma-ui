import { Container } from 'unstated'
import { figma, google } from './api'
import { emit, listen } from './events'
import debounce from 'lodash/debounce'
import { debug } from './debug'

const VERSION = 13

export class Store extends Container<AppData> {

	isLoading:boolean
	initialized:boolean

	state:AppData = {
		VERSION,
		view: 'HOME',
		page: { url: null, id: null, name: null, items: [] },
		files: [
			'3uYkKPR3FJBC5w9DCj6AqZ', // Universal
			// '6NJFtH7zbodiX5TVKJaI7s', // Pagefly
			// 'R6ER7QFSbl0X2dy5KCCDJa' // CTA
		]
	}

	constructor() {
		super()
		figma.onAuth(async auth => {
			debug('figma authorized')
			await this.setState({ figma: auth })
		})
		google.onAuth( async auth => {
			debug('google authorized')
			await this.setState({ google: auth })
		})
		listen('view', this.navigate)
		listen('page', this.setPage)
		listen('selection', this.setSelection)
		listen('debug', ({ args }) => debug(...args))
		emit('load', this.onLoad)
		debug('app init')

	}

	onUpdate = () => {
		this.delaySave()
	}

	navigate = async view => {
		await this.setState({ view })
	}

	setPage = async (page) => {
		await this.setState({ page })
	}
	setSelection = async (selection) => {
		await this.setState({ selection })
	}

	onLoad = async (state:AppData) => {
		if (state.VERSION !== this.state.VERSION) {
			debug('Different DATA version')
			const { google, figma, team, page, selection } = state
			await this.setState({ page, selection, google, figma, team })
		} else {
			await this.setState(state)
		}
		this.subscribe(this.onUpdate)
		debug('app state', this.state)
		if (this.state.figma) {
			figma.auth = this.state.figma
		}
		if (this.state.google) {
			google.auth = this.state.google
		}
		if (this.state.components) {
			this.loadComponents()
		} else {
			this.fetchComponents()
		}
	}
	save = () => emit('save', { ...this.state, VERSION })
	delaySave = debounce(this.save, 1000)

	fetchComponents = async () => {
		let loaded = []
		for (let i in store.state.files) {
			const res = await figma.fileComponents(this.state.files[i])
			const components = res.meta.components.map(({ name, key } ) => ({ name, key }))
			loaded = [...loaded, ...components]
			debug('loaded file', this.state.files[i])
		}
		await this.setState({ components: loaded })
		await this.loadComponents()
	}
	loadComponents = () => {
		emit('components', { components: this.state.components })
	}

	generate = async (url) => {
		const { id, gid } = google.parse(url)
		debug('draw from sheet url', id, gid, url)
		if (id) {
			debug('fetch sheet info')
			const info = await google.sheet(id, {})
			const sheet = info.sheets.find(item => {
				return gid && item.properties.sheetId === parseInt(gid) || item.properties.title === 'Element Parameters'
			})
			if (!sheet) {
				debug('no sheet found', info)
				return
			}
			debug('fetch sheet data')
			const data = await google.sheet(id, {
				ranges: sheet.properties.title,
				includeGridData: true
			})
			const rows = data.sheets[0].data[0].rowData
			const values = rows.map(row => {
				return row.values
			})
			debug('sending plugin event')
			emit('draw', {
				id,
				url,
				title: info.properties.title,
				data: values
			})
		}
	}
}


export const store:Store = new Store
window.app = store
