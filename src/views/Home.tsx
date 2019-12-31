import React, { useState } from 'react'
import styled from 'styled-components'
import { store } from '../lib/store'
import { emit } from '../lib/events'

export const Home = () => {
	const page = store.state.page
	const selection = store.state.selection || []

	let url:string = ''
	const handleUpdate = () => store.generate(url)

	const Field = ({ field }) => {
		const [val, setVal] = useState(field.value)
		return (
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
							<option key={value.text}>{value.text}</option>
						))}
					</select>
				</td>
			</tr>
		)
	}

	const PageVariations = () => (
		<table>
			<tbody>
			{page.items.map(field => (
				field.values.some(i => (i.color !== '#000000')) && field.values.length > 1 &&
				<Field key={'f/' + field.element + '/' + field.parameter} field={field}/>
			))}
			</tbody>
		</table>
	)

	const PageDetail = () => (
		<>
			{
				page.url ? (
					<PageVariations/>
				) : (
					<section>
						<label>Enter Sheet URL</label>
						<textarea onChange={e => (url = e.target.value)} cols={40} rows={5}/>
					</section>
				)
			}
		</>
	)

	const SelectionDetail = () => (
		<>
			{selection.map(node => (
				<section key={node.parameter}>
					<dl>
						<dt>{node.parameter}</dt>
						{node.values.map(value => {
							return <dd key={value.text}>{value.text}</dd>
						})}
					</dl>
				</section>
			))}
		</>
	)

	return (
		<Main>
			{!selection.length ? <PageDetail/> : <SelectionDetail/>}
			<nav>
				<button onClick={handleUpdate}>
					{page.url ? 'Update' : 'Create'}
				</button>
				<button onClick={store.logout}>
					Logout
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
