import React, { ReactComponentElement, ReactElement } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Provider, Subscribe } from 'unstated'
import { store } from '../lib/store'
import { Home } from './Home'
import { Auth } from './Auth'
import { Assets } from './Assets'

function getView(view:View): any {
	switch (view) {
		case 'HOME':
			return Home
		case 'AUTH':
			return Auth
		case 'ASSETS':
			return Assets

		default:
			return Home
	}
}

export const Layout = () => {
	return (
		<>
			<GlobalStyled/>
			<Provider>
				<Subscribe to={[store]}>
					{() => (
						<WrapperStyled>
							{React.createElement(getView(store.state.view))}
						</WrapperStyled>
					)}
				</Subscribe>
			</Provider>
		</>
	)
}
const GlobalStyled = createGlobalStyle`
	body {
		padding: 0;
		margin: 0;
		background: #eee;
		font-size: 13px;
		font-family: "Helvetica Neue", serif;
	}
`
const WrapperStyled = styled.div`
	
	padding-bottom: 45px;
	
	&.loading {
		opacity: 0.5;
		pointer-events: none;
	}
	main {
		padding: 10px;
		margin: 0;
	}

	nav {
		padding: 10px;
		text-align: center;
		background: #ccc;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
	}

	label {
		display: inline-block;
		font-weight: bold;
		margin-bottom: 10px;
		margin-right: 10px;
	}

	output {
		display: block;
		line-height: 30px;
		height: 30px;
		text-align: center;
		flex: 0 0 30px;
		text-transform: uppercase;
	}

	section {
		margin: 0;
		border: none;
		padding: 10px 20px;
	}

	input, textarea {
		width: 100%;
		padding: 6px;
		border: 1px solid #ccc;
	}

	button {
		background: #444444;
		border: none;
		color: white;
		font-weight: bold;
	    padding: 5px 10px;
	    font-size: 13px;
	    line-height: 15px;

		&:active {
			color: #cccccc;
			background: #000;
		}
		&:disabled {
			opacity: 0.5;
		}
		& + button {
			margin-left: 5px;
		}
	}
`
