import React, { useState } from 'react'
import styled from 'styled-components'
import { store } from '../lib/store'
import { emit } from '../lib/events'

export const Home = () => {
	const page = store.state.page
	const selection = store.state.selection

	let changedURL = page.url

	const handleUpdate = () => store.generate(changedURL)

	const Field = ({ field, header }) => {
		const [val, setVal] = useState(field.value)
		return (
			<>
				{header ? <tr>
					<td colSpan={2}>{field.element}</td>
				</tr> : null}
				<tr>
					<th>{field.parameter}</th>
					<td>
						<select
							value={val}
							onChange={async e => {
								field.value = e.target.value
								await setVal(field.value)
								await emit('update-param', field)
							}}>
							{field.values.map(value => (
								<option key={value}>{value}</option>
							))}
						</select>
					</td>
				</tr>
			</>
		)
	}

	const PageVariations = () => {
		let lastElement
		return (
			<table>
				<tbody>
				{page.items.map(field => {
					const header = lastElement !== field.element
					lastElement = field.element
					return (
						field.valueColors.some(i => (i.color !== '#000000')) && field.values.length > 1 &&
						<Field key={'f/' + field.element + '/' + field.parameter} field={field} header={header}/>
					)
				})}
				</tbody>
			</table>
		)
	}

	const PageDetail = () => {
		return (
			<>
				{
					page.url ? (
						<PageVariations/>
					) : (
						<section>
							<label>Enter Sheet URL</label>
							<textarea onChange={e => (changedURL = e.target.value)} cols={40} rows={5}/>
						</section>
					)
				}
			</>
		)
	}
	const SelectionDetail = () => {
		return (
			<>
				{selection.map(node => {
					return <section key={node.parameter}>
						<dl>

							<dt>{node.parameter}</dt>
							{node.valueColors.map(value => {
								return <dd key={value.text}
								           style={{ color: value.color }}>{value.text} {value.bold ? ' (default)' : ''}</dd>
							})}
						</dl>
					</section>
				})}
			</>
		)
	}

	return (
		<Main>
			{!selection.length ? <PageDetail/> : <SelectionDetail/>}
			<nav>
				<button onClick={handleUpdate}>
					{page.url ? 'Update' : 'Create'}
				</button>
			</nav>
		</Main>
	)
}

const Main = styled.main`
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
`
