import React, { useState } from 'react';
import { store } from '../lib/store';
export const Create = () => {
    const [url, change] = useState(store.state.page.url);
    const goHome = () => store.navigate('HOME');
    const create = () => store.generate(url).then(goHome);
    return (React.createElement("main", null,
        React.createElement("section", null,
            React.createElement("label", null, "Sheets URL:"),
            React.createElement("textarea", { value: url, onChange: e => (change(e.target.value)), cols: 40, rows: 5 })),
        React.createElement("nav", null,
            React.createElement("button", { onClick: goHome }, "Cancel"),
            React.createElement("button", { onClick: create, disabled: !url }, "Generate"))));
};
