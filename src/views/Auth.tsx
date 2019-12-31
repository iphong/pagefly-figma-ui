import React from 'react'
import { store } from '../lib/store'

async function getToken(provider:'figma'|'google') {
	const identifier = Math.round(Math.random() * 5000).toString().padStart(5, '0') + ':' + Date.now()
	let req, res
	window.open('https://phongvt.herokuapp.com/auth/' + provider + '?state=' + identifier)
	req = await fetch('https://phongvt.herokuapp.com/auth/' + provider + '/gateway?state=' + identifier)
	res = await req.json()
	if (typeof res !== 'object') {
		try {
			res = JSON.parse(res)
			switch (provider) {
				case 'figma':
					await store.setState({
						figma_api_key: res.access_token,
						figma_api_expired: Date.now() + res.expires_in
					})
					break
				case 'google':
					await store.setState({
						google_api_key: res.access_token,
						google_api_expired: Date.now() + res.expires_in
					})
					break
			}
		} catch (e) {
			console.log('failed to parse response')
		}
	}
}

export const Auth = () => {
	const [teamID, setTeamID] = React.useState('713233029226794192')
	const complete = () => {
		store.setState({ figma_team_id: teamID, view: 'HOME' })
	}
	let stage
	if (!store.state.google_api_key) {
		stage = <main>
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
	} else if (!store.state.figma_api_key) {
		stage = <main>
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
	} else if (!store.state.figma_team_id) {
		stage = <main>
			<section>
				<h2>Step 3: Your Team</h2>
			</section>
			<section>
				<label>Enter Your Figma Team ID so we know where to look</label>
				<input value={teamID} onChange={e => setTeamID(e.target.value)} />
			</section>
			<nav>
				<button onClick={complete}>Let's Go</button>
			</nav>
		</main>
	} else {
		stage = <main>
			<section>Finished</section>
		</main>
	}
	return stage
}