import React from 'react';
import { store } from '../lib/store';
async function getToken(provider) {
    const identifier = Math.round(Math.random() * 5000).toString().padStart(5, '0') + ':' + Date.now();
    let req, res;
    window.open('https://phongvt.herokuapp.com/auth/' + provider + '?state=' + identifier);
    req = await fetch('https://phongvt.herokuapp.com/auth/' + provider + '/gateway?state=' + identifier);
    res = await req.json();
    if (typeof res !== 'object') {
        try {
            res = JSON.parse(res);
            switch (provider) {
                case 'figma':
                    await store.setState({
                        figma_api_key: res.access_token,
                        figma_api_expired: Date.now() + res.expires_in
                    });
                    break;
                case 'google':
                    await store.setState({
                        google_api_key: res.access_token,
                        google_api_expired: Date.now() + res.expires_in
                    });
                    break;
            }
        }
        catch (e) {
            console.log('failed to parse response');
        }
    }
}
export const Auth = () => {
    const [teamID, setTeamID] = React.useState('713233029226794192');
    const complete = () => {
        store.setState({ figma_team_id: teamID, view: 'HOME' });
    };
    let stage;
    if (!store.state.google_api_key) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 1: Google Sheets")),
            React.createElement("section", null,
                React.createElement("label", null, "We need permissions to read your Google spreadsheets")),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => getToken('google') }, "Authorize")));
    }
    else if (!store.state.figma_api_key) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 2: Figma")),
            React.createElement("section", null,
                React.createElement("label", null, "We need permission to access your Figma design assets")),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => getToken('figma') }, "Authorize")));
    }
    else if (!store.state.figma_team_id) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 3: Your Team")),
            React.createElement("section", null,
                React.createElement("label", null, "Enter Your Figma Team ID so we know where to look"),
                React.createElement("input", { value: teamID, onChange: e => setTeamID(e.target.value) })),
            React.createElement("nav", null,
                React.createElement("button", { onClick: complete }, "Let's Go")));
    }
    else {
        stage = React.createElement("main", null,
            React.createElement("section", null, "Finished"));
    }
    return stage;
};
