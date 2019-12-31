import { Container } from 'unstated';
import { figma, google } from './api';
import { emit, listen } from './events';
export class Store extends Container {
    constructor() {
        super();
        this.state = {
            view: 'HOME',
            page: { url: null, id: null, name: null }
        };
        this.onUpdate = () => {
            emit('save', this.state);
        };
        this.navigate = async (view) => {
            await this.setState({ view });
        };
        this.setPage = async (page) => {
            await this.setState({ page });
        };
        this.setSelection = async (selection) => {
            await this.setState({ selection });
        };
        this.setLoading = async (state) => {
            if (this.isLoading != state) {
                this.isLoading = state;
                await this.setState({});
            }
        };
        this.onLoad = async (state) => {
            await this.setState(state);
            this.subscribe(this.onUpdate);
            if (!this.state.figma || !this.state.google || !this.state.figma_team_id) {
                await this.navigate('AUTH');
            }
            else {
                figma.auth = this.state.figma;
                google.auth = this.state.google;
                console.log(await figma.fileComponents("R6ER7QFSbl0X2dy5KCCDJa"));
                console.log(await figma.get("files/R6ER7QFSbl0X2dy5KCCDJa/"));
            }
        };
        this.save = () => emit('save', this.state);
        // fetch = async () => {
        // 	const components = {}
        // 	const styles = {}
        // 	await this.setLoading(true)
        // 	await Promise.all(this.state.figma_files.map(id => (
        // 		this.figma.file(id).components().then(file => {
        // 			Object.assign(components, file.components)
        // 		})
        // 	)))
        // 	await emit('cache', { components, styles })
        // 	await this.setLoading(false)
        // }
        this.generate = async (url) => {
            // await this.setLoading(true)
            // const payload:any = {}
            // const sheet = this.google.spreadsheet(url)
            // await sheet.get().then(async (info) => {
            // 	payload.id = sheet.id
            // 	payload.url = url
            // 	payload.title = info.properties.title
            // 	payload.sheets = info.sheets.map((item:{[key:string]:{[key:string]:any}}) => {
            // 		const id = item.properties.sheetId
            // 		const title = item.properties.title
            // 		if (parseInt(id) === parseInt(sheet.gid)) {
            // 			payload.sheet = title
            // 		}
            // 		return { id, title, selected: payload.sheet === title }
            // 	})
            // 	payload.time = Date.now()
            // 	payload.data = await sheet.values(payload.sheet + (sheet.range ? '!' + sheet.range : ''))
            // 	console.log(payload.data)
            // 	payload.grid = await sheet.get(`${payload.sheet}!A2:M${payload.data.length}`, true)
            // 	console.log(payload.grid)
            // 	await emit('draw', payload)
            // })
            // await this.setLoading(false)
        };
        this.logout = async () => {
            await this.setState({
                figma_team_id: null,
                figma: null,
                google: null
            });
            this.navigate('AUTH');
        };
        listen('view', this.navigate);
        listen('page', this.setPage);
        listen('selection', this.setSelection);
        emit('load', this.onLoad);
    }
}
export const store = new Store;
