export class API {
    set auth(payload) {
        this._token = payload.access_token;
        this._expired = Date.now() + payload.expires_in;
    }
    async get(path, params) {
        const headers = { Authorization: `Bearer ${this._token}` };
        const query = params ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&') : '';
        const request = await fetch(`${this._baseURL}/${path}?${query}`, { headers });
        return await request.json();
    }
}
export class FigmaAPI extends API {
    constructor() {
        super(...arguments);
        this._baseURL = `https://api.figma.com/v1`;
        this.teamProjects = id => this.get(`teams/${id}/projects`);
        this.projectFiles = id => this.get(`projects/${id}/files`);
        this.fileComponents = id => this.get(`files/${id}/components`);
        this.fileStyles = id => this.get(`files/${id}/styles`);
        this.component = id => this.get(`components/${id}`);
        this.style = id => this.get(`styles/${id}`);
        this.file = id => this.get(`files/${id}`);
    }
}
export class GoogleAPI extends API {
    constructor() {
        super(...arguments);
        this._baseURL = `https://sheets.googleapis.com/v4`;
        this.sheet = (id, params) => this.get(`spreadsheets/${id}`);
    }
}
export const figma = new FigmaAPI;
export const google = new GoogleAPI;
