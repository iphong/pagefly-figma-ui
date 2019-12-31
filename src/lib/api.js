function loadHandler(resolve, reject) {
    return ({ target: req }) => {
        if (req.status === 200) {
            if (req.getResponseHeader('Content-Type').startsWith('application/json')) {
                const payload = JSON.parse(req.responseText);
                return resolve(payload);
            }
        }
        reject({ error: true, status: req.status, message: req.responseText });
    };
}
export class FigmaAPI {
    constructor(token, team) {
        this.query = (path) => {
            return new Promise((resolve, reject) => {
                const req = new XMLHttpRequest;
                req.open('GET', `https://api.figma.com/v1/` + path, true);
                // req.setRequestHeader('X-FIGMA-TOKEN', this._token)
                req.setRequestHeader('Authorization', 'Bearer ' + this._token);
                req.addEventListener('load', loadHandler(resolve, reject));
                req.send();
            });
        };
        this.projects = async () => await this.query(`teams/${this._team}/projects`);
        this.project = id => async () => await this.query(`projects/${id}/files`);
        this.file = id => ({
            get: async () => await this.query(`files/${id}`),
            styles: async () => (await this.query(`files/${id}/styles`)).meta,
            components: async () => (await this.query(`files/${id}/components`)).meta
        });
        this.component = id => ({
            get: async () => await this.query(`components/${id}`)
        });
        this.style = id => ({
            get: async () => await this.query(`styles/${id}`)
        });
        this._token = token;
        this._team = team;
    }
}
export class GoogleAPI {
    constructor(token) {
        this.query = (path, ranges, includeGridData = false) => {
            return new Promise((resolve, reject) => {
                const req = new XMLHttpRequest;
                const url = GoogleAPI.API_URL_ROOT + path + '?' + (includeGridData ? 'includeGridData=true&' : '') + (ranges ? 'ranges=' + ranges + '&' : '');
                req.open('GET', url, true);
                req.setRequestHeader('Authorization', 'Bearer ' + this._token);
                req.addEventListener('load', loadHandler(resolve, reject));
                req.send();
            });
        };
        this.spreadsheet = url => {
            let id = url.replace(GoogleAPI.URL_REGEX_ID, '$1');
            const [, gid] = url.match(/gid=([^&]+)/) || [];
            const [, range] = url.match(/range=([^&]+)/) || [];
            if (!id)
                id = url;
            return {
                id,
                gid,
                range,
                isValid: !!id,
                get: async (range, includeGridData = false) => await this.query(`spreadsheets/${id}`, range, includeGridData),
                props: async () => (await this.query(`spreadsheets/${id}`)).properties,
                sheets: async () => (await this.query(`spreadsheets/${id}`)).sheets,
                values: async (range) => (await this.query(`spreadsheets/${id}/values/${range}`)).values
            };
        };
        this._token = token;
    }
}
GoogleAPI.API_URL_ROOT = 'https://sheets.googleapis.com/v4/';
GoogleAPI.URL_REGEX_ID = /^https:\/\/docs.google.com\/spreadsheets\/d\/([^\\]+)\/edit.*$/;
