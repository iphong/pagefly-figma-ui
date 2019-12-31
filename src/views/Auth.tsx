import React from 'react'
import { figma, google } from '../lib/api'
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
					figma.auth = res
					await store.setState({ figma: res })
					break
				case 'google':
					google.auth = res
					await store.setState({ google: res })
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
		store.setState({ figma_team_id: teamID })
	}
	let stage
	if (!store.state.google) {
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
	} else if (!store.state.figma) {
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
				<button onClick={complete}>Next</button>
			</nav>
		</main>
	} else {
		stage = <main>
			<section>
				<h2>Done!</h2>
			</section>
			<nav>
				<button onClick={() => store.navigate('HOME')}>
					Start Now
				</button>
			</nav>
		</main>
	}
	return stage
}