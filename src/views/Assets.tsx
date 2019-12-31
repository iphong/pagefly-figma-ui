import React from 'react'
import { figma, google } from '../lib/api'
import { store } from '../lib/store'

async function get() {
	const id = store.state.team
	const files = []
	const team = await figma.teamProjects(id)

	console.log(team)
}

export const Assets = () => {
	get()
	return (
		<main>
			<section>
				<h3>Assets</h3>
			</section>
			<nav>

			</nav>
		</main>
	)
}