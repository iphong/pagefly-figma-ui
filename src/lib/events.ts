const isPlugin = typeof figma !== 'undefined'
const listeners = new Map
const callbacks = new Map

let transactionCounter = 0

export function emit(event, payload?, callback?) {
	const id = transactionCounter++
	if (typeof payload === 'function' && !callback) {
		callback = payload
		payload = {}
	}
	if (callback) listeners.set(id, callback)
	if (isPlugin) {
		figma.ui.postMessage({ id, event, payload })
	} else {
		parent.postMessage({ pluginMessage: { id, event, payload } }, '*')
	}
}
export function listen(event, callback) {
	if (callback) callbacks.set(event, callback)
}
async function messageHandler(e) {
	const { id, event, payload } = isPlugin ? e : e.data.pluginMessage
	if (!event) {
		const callback = listeners.get(id)
		if (callback) callback(payload, emit)
	} else {
		const callback = callbacks.get(event)
		if (callback) {
			let result
			if (isPlugin) {
				result = await callback(payload)
				figma.ui.postMessage({ id, payload: result || {} })
			} else {
				result = await callback(payload)
				parent.postMessage({ pluginMessage: { id, payload: result || {} } }, '*')
			}
		}
	}
}

const root = isPlugin ? figma.ui : window
root.onmessage = messageHandler