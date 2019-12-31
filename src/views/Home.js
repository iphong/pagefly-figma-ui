import React, { useState } from 'react';
import styled from 'styled-components';
import { store } from '../lib/store';
import { emit } from '../lib/events';
export const Home = () => {
    const page = store.state.page;
    const selection = store.state.selection;
    let changedURL = page.url;
    const handleUpdate = () => store.generate(changedURL);
    const Field = ({ field, header }) => {
        const [val, setVal] = useState(field.value);
        return (React.createElement(React.Fragment, null,
            header ? React.createElement("tr", null,
                React.createElement("td", { colSpan: 2 }, field.element)) : null,
            React.createElement("tr", null,
                React.createElement("th", null, field.parameter),
                React.createElement("td", null,
                    React.createElement("select", { value: val, onChange: async (e) => {
                            field.value = e.target.value;
                            await setVal(field.value);
                            await emit('update-param', field);
                        } }, field.valueColors.map(value => (React.createElement("option", { key: value.text }, value.text))))))));
    };
    const PageVariations = () => {
        let lastElement;
        return (React.createElement("table", null,
            React.createElement("tbody", null, page.items.map(field => {
                const header = lastElement !== field.element;
                lastElement = field.element;
                return (field.valueColors.some(i => (i.color !== '#000000')) && field.valueColors.length > 1 &&
                    React.createElement(Field, { key: 'f/' + field.element + '/' + field.parameter, field: field, header: header }));
            }))));
    };
    const PageDetail = () => {
        return (React.createElement(React.Fragment, null, page.url ? (React.createElement(PageVariations, null)) : (React.createElement("section", null,
            React.createElement("label", null, "Enter Sheet URL"),
            React.createElement("textarea", { onChange: e => (changedURL = e.target.value), cols: 40, rows: 5 })))));
    };
    const SelectionDetail = () => {
        return (React.createElement(React.Fragment, null, selection.map(node => {
            return React.createElement("section", { key: node.parameter },
                React.createElement("dl", null,
                    React.createElement("dt", null, node.parameter),
                    node.valueColors.map(value => {
                        return React.createElement("dd", { key: value.text, style: { color: value.color } },
                            value.text,
                            " ",
                            value.bold ? ' (default)' : '');
                    })));
        })));
    };
    return (React.createElement(Main, null,
        !selection.length ? React.createElement(PageDetail, null) : React.createElement(SelectionDetail, null),
        React.createElement("nav", null,
            React.createElement("button", { onClick: handleUpdate }, page.url ? 'Update' : 'Create'))));
};
const Main = styled.main `
	sub {
		display: block;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	table {
		width: 100%;
		border-collapse: separate;
		font-size: 12px;
		margin: 10px 0;
		th, td {
			select {
				width: 100%;
			}
		}
		tbody th {
			text-align: left;
		}
		td {
			width: 110px;
		}
	}
	dl {
		dt {
		    font-weight: bold;
            line-height: 1.5em;
		}
		dd, li {
			line-height: 1.5em;
		}
		dd + dt {
			margin-top: 10px;
		}
	}
`;
