import React, { useState } from 'react'
import { app } from '../store/app'

export const Create = () => {
	const [url, change] = useState(app.state.page.url)
	const goHome = () => app.navigate('HOME')
	const create = () => app.generate(url).then(goHome)
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