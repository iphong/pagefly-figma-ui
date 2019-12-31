import React from 'react'
import { figma, google } from '../lib/api'
import { store } from '../lib/store'

async function getToken(provider:'figma'|'google') {
	const identifier = Math.round(Math.random() * 5000).toString().padStart(5, '0') + ':' + Date.now()
	window.open('https://phongvt.herokuapp.com/auth/' + provider + '?state=' + identifier)
	const req = await fetch('https://phongvt.herokuapp.com/auth/' + provider + '/gateway?state=' + identifier)
	let res = await req.json()
	if (typeof res !== 'object') {
		try {
			res = JSON.parse(res)
			switch (provider) {
				case 'figma':
					figma.auth = res
					await store.setState({ figma: res })
					break
				case 'google':
					google.auth = res
					await store.setState({ google: res })
					break
			}
		} catch (e) {
		}
	}
}

export const Auth = () => {
	let teamID = '713233029226794192'
	if (!store.state.google) return (
		<main>
			<section>
				<h2>Step 1: Google Sheets</h2>
			</section>
			<section>
				<label>We need permissions to read your Google spreadsheets</label>
			</section>
			<nav>
				<button onClick={() => getToken('google')}>Authorize</button>
			</nav>
		</main>
	)
	if (!store.state.figma) return (
		<main>
			<section>
				<h2>Step 2: Figma</h2>
			</section>
			<section>
				<label>We need permission to access your Figma design assets</label>
			</section>
			<nav>
				<button onClick={() => getToken('figma')}>Authorize</button>
			</nav>
		</main>
	)
	if (!store.state.team) return (
		<main>
			<section>
				<h2>Step 3: Your Team</h2>
			</section>
			<section>
				<label>Enter Your Figma Team ID so we know where to look</label>
				<input value={teamID} onChange={e => (teamID = e.target.value)}/>
			</section>
			<nav>
				<button onClick={() => store.setState({ team: teamID, view: 'ASSETS' })}>Next
				</button>
			</nav>
		</main>
	)
}