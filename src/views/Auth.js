import React from 'react';
import { figma, google } from '../lib/api';
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
                    figma.auth = res;
                    await store.setState({ figma: res });
                    break;
                case 'google':
                    google.auth = res;
                    await store.setState({ google: res });
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
        store.setState({ team: teamID });
    };
    let stage;
    if (!store.state.google) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 1: Google Sheets")),
            React.createElement("section", null,
                React.createElement("label", null, "We need permissions to read your Google spreadsheets")),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => getToken('google') }, "Authorize")));
    }
    else if (!store.state.figma) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 2: Figma")),
            React.createElement("section", null,
                React.createElement("label", null, "We need permission to access your Figma design assets")),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => getToken('figma') }, "Authorize")));
    }
    else if (!store.state.team) {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Step 3: Your Team")),
            React.createElement("section", null,
                React.createElement("label", null, "Enter Your Figma Team ID so we know where to look"),
                React.createElement("input", { value: teamID, onChange: e => setTeamID(e.target.value) })),
            React.createElement("nav", null,
                React.createElement("button", { onClick: complete }, "Next")));
    }
    else {
        stage = React.createElement("main", null,
            React.createElement("section", null,
                React.createElement("h2", null, "Done!")),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => store.navigate('HOME') }, "Start Now")));
    }
    return stage;
};
