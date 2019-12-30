import React, { useState } from 'react'
import { store } from '../lib/store'

export const Create = () => {
	const [url, change] = useState(store.state.page.url)
	const goHome = () => store.navigate('HOME')
	const create = () => store.generate(url).then(goHome)
	return (
		<main>
			<section>
				<label>Sheets URL:</label>
				<textarea value={url} onChange={e => (change(e.target.value))} cols={40} rows={5}/>
			</section>
			<nav>
				<button onClick={goHome}>Cancel</button>
				<button onClick={create} disabled={!url}>Generate</button>
			</nav>
		</main>
	)
}