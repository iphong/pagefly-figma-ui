import { emit, listen } from './lib/events'
function debug(...args) {
	console.log('PLUGIN CORE :::', ...args)
	// emit('debug', { args })
}

listen('load', load)
listen('save', save)
listen('draw', draw)
listen('components', cache)
listen('set-param', setFieldValue)
listen('update-param', updateParam)

figma.on('currentpagechange', async () => {
	gatherComponentInfo()
	emit('page', readPage())
})
figma.on('selectionchange', async () => emit('selection', getSelection()))

figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
figma.loadFontAsync({ family: 'Roboto', style: 'Medium' })
figma.loadFontAsync({ family: 'Roboto', style: 'Bold' })
figma.loadFontAsync({ family: 'Roboto', style: 'Black' })

figma.showUI(__html__, { visible: true, width: 300, height: 300 })

const storageKey = 'PF-APP3'

type group_t = Map<string, Map<string, Set<FieldData>>>|Map<string, Set<FieldData>>

const FIELDS:{[key:string]:string} = {
	group: 'group',
	values: 'value(s)',
	element: 'element',
	subElement: 'sub-element',
	tooltip: 'tooltip',
	category: 'category',
	parameter: 'parameter',
	component: 'ui component',
	placeholder: 'placeholder'
}
const requiredComponentNames = ['section parameter group', 'heading body']
const componentsMap:Map<string, string> = new Map
const loadedComponents:Map<string, ComponentNode> = new Map

async function cache({ components }) {
	componentsMap.clear()
	components.forEach(component => {
		const key = slugify(component.name)
		if (!componentsMap.has(key)) {
			debug('-->', component.name, component.key)
			componentsMap.set(key, component.key)
		} else {
			debug('--> component exists', component.name, component.key, componentsMap.get(key))
		}
	})
	debug('component cached - total:', componentsMap.size)
}
async function importComponents(names:string[]) {
	let failed = 0
	let loaded = 0
	const nodes = {}
	const map = [...componentsMap.entries()]
	await Promise.all(names.map(async n => {
		const loadName = slugify(n)
		await Promise.all(map.map(async ([name, key]) => {
			if (!loadedComponents.has(name) && name.startsWith(loadName)) {
				const node = await figma.importComponentByKeyAsync(key)
				if (node) {
					debug('imported -->', name)
					loadedComponents.set(name, node)
					nodes[name] = node
					loaded++
				} else {
					failed++
				}
			}
		}))
	}))
	return { loaded, failed, nodes }
}

const allFields = new Map
const variableFields = new Map
const conditionalFields = new Map

async function load() {
	debug('loading stored data')
	gatherComponentInfo()
	updateVisibility()
	const data = await figma.clientStorage.getAsync(storageKey) || {}
	data.page = readPage(figma.currentPage)
	data.selection = getSelection()
	debug('sending stored data from plugin')
	return data
}

async function save(data) {
	delete data.page
	delete data.selection
	debug('Data saved', data)
	return await figma.clientStorage.setAsync(storageKey, data)
}

function gatherComponentInfo() {
	allFields.clear()
	variableFields.clear()
	conditionalFields.clear()
	figma.currentPage.findAll((node) => {
		const storedData = node && node.getPluginData('PF-DATA')
		if (storedData) {
			let data:FieldData
			try {
				data = JSON.parse(storedData)
			} catch (e) {
				debug('failed to parse json data', data)
			}

			allFields.set(node, data)
			if (data.values.length > 1) {
				data.values.forEach(item => {
					if (item.text === data.value) {
						variableFields.set(node, data)
					}
				})
			}
			data.params.forEach(item => {
				if (item.color !== '#000000') {
					conditionalFields.set(node, data)
				}
			})
		}
		return false
	})
}

async function updateParam(newData) {
	allFields.forEach((data, node) => {
		if (newData.element === data.element && newData.group === data.group && newData.parameter === data.parameter) {
			setFieldValue(newData.value, node)
		}
	})
	emit('page', readPage())
}
async function setFieldValue(value, node = figma.currentPage.selection[0]) {
	const data = allFields.get(node)
	data.value = value
	await updateControl(node, data)
	node.setPluginData('PF-DATA', JSON.stringify(data))
	updateVisibility()
}

async function updateControl(node, data) {
	let control:InstanceNode = node.children[node.children.length - 1]
	switch (data.component.toLowerCase()) {
		case 'switch': {
			await importComponents(['Switch/' + data.value])
			control.masterComponent = findComponent('Switch/' + data.value)
			setText(control, data.parameter)
			break
		}
		case 'basic select': {
			setText(control, data.value)
			break
		}
	}
}

function updateVisibility() {
	const elements = {}
	variableFields.forEach((data, node) => {
		const k = data.element + ':' + data.group
		if (!elements[k]) {
			elements[k] = new Map
		}
		data.values.forEach(item => {
			if (item.text === data.value) {
				elements[k].set(item.color, node)
			}
		})
	})
	conditionalFields.forEach((data, node) => {
		const colors = elements[data.element + ':' + data.group]
		const visible = data.params.some(item => {
			if (colors.has(item.color)) {
				const relatedNode = colors.get(item.color)
				return relatedNode.getPluginData('PF-VISIBLE') !== 'OFF'
			}
		})
		node.setPluginData('PF-VISIBLE', visible ? 'ON' : 'OFF')
		node.visible = true
		node.opacity = visible ? 1 : 0.3
	})
}

function slugify(text:string) {
	return text.replace(/[^\w]+/gi, '-').toLowerCase()
}

function findComponent(name:string):ComponentNode {
	name = slugify(name)

	let target:ComponentNode
	const similar = []
	loadedComponents.forEach((node, searchName) => {
		if (searchName.startsWith(name)) {
			similar.push(searchName)
			if (!target) target = node
		}
	})
	if (similar.length > 1) {
		const defaultIndex = similar.indexOf(`${name}-default`)
		const offIndex = similar.indexOf(`${name}-off`)
		if (defaultIndex >= 0) {
			target = loadedComponents.get(similar[defaultIndex])
		} else if (offIndex >= 0) {
			target = loadedComponents.get(similar[offIndex])
		}
	} else if (!similar.length) {

	}
	if (!target) debug('No Component Found', name)
	return target ? target : null
}

function createInstance(name:string):InstanceNode {
	const master = findComponent(name)
	return master ? master.createInstance() : null
}

const CRLF = /\n|\r|\r\n/g

let currentFrame
let currentField
let currentGroup
let currentLabel

function readPage(page = figma.currentPage) {
	let dataString = page.getPluginData('PF-DATA')
	let data = {
		items: [...allFields.values()]
	}
	if (dataString) {
		try {
			Object.assign(data, JSON.parse(dataString))
		} catch (e) {
			debug('failed to parse page json data', dataString)
		}
	}
	return data
}

function getSelection(nodes = figma.currentPage.selection) {
	return nodes
		.map(node => {
			const json = node.getPluginData('PF-DATA')
			if (json) {
				try {
					return JSON.parse(json)
				} catch (e) {
					debug('failed to parse node json data', json)
					return null
				}
			}
		})
		.filter(data => !!data)
}

function group(items:object[], key:string, sub?:string):group_t {
	const output = new Map
	items.forEach(item => {
		if (!output.has(item[key])) output.set(item[key], new Set)
		output.get(item[key]).add(item)
	})
	if (sub) {
		output.forEach((v, k) => {
			output.set(k, group(v, sub))
		})
	}
	return output
}

function merge(keys:string[], values:any[][]) {
	const items:FieldData[] = []
	const foundComponents = new Map

	values.forEach((data:any[]) => {
		const item:FieldData = {}
		Object.entries(FIELDS).forEach(([key, val]) => {
			const index = keys.indexOf(val)
			if (index > -1) {
				const obj = data[index]
				if (obj) {
					const value = obj.formattedValue || ''
					if (key === 'values') {
						item.values = getColorLines(data[index])
						const defaultValue = item.values.find(i => i.bold)
						item.value = defaultValue ? defaultValue.text : ''
					} else if (key === 'parameter') {
						item.params = getColorLines(data[index])
						item.parameter = value.split(CRLF)[0]
					} else item[key] = value
				}
			}
		})
		if (item.subElement) {
			debug(item.subElement)
			item.element = item.subElement
		}
		if (item.element && item.group && item.component) {
			items.push(item)
			foundComponents.set(item.component, true)
		}
	})


	return {
		components: [...foundComponents.keys()],
		items: group(items, 'element', 'group')
	}
}

async function draw({ id, title, url, data }) {

	debug('Draw sheet data')
	const keys = data.slice(0, 1)[0].map(item => (item.formattedValue || '').toLowerCase())
	const values = data.slice(1)
	const { components, items } = merge(keys, values)
	debug('Done merge items')

	await importComponents(requiredComponentNames)
	await importComponents(components)

	drawPage({ id, title, url })
	debug('Done draw page')

	items.forEach((groups, element) => {
		debug('draw frame:', element)
		drawFrame(element)
		groups.forEach((fields:Set<FieldData>, group:string) => {
			debug('draw group:', group)
			drawGroup(group)
			fields.forEach((field) => {
				debug('draw field:', field.parameter, '-->', field.component)
				drawField(field)
			})
		})
	})
	figma.currentPage.findAll(node => {
		if (node.getPluginData('PF-DATA')) {
			try {
				updateControl(node, JSON.parse(node.getPluginData('PF-DATA')))
			} catch (e) {
				console.log('failed to update control value')
			}
		}
		return false
	})
	figma.viewport.scrollAndZoomIntoView(figma.currentPage.children)

	gatherComponentInfo()
	updateVisibility()

	emit('page', readPage())
	emit('selection', getSelection())
}

function drawPage(payload):PageNode {

	let page = figma.currentPage
	// let page:PageNode = figma.root.children.find((node:PageNode) => {
	// 	return node.getPluginData('PF-ID') === payload.id
	// })
	if (!page) {
		page = figma.createPage()
	} else {
		page.children.forEach(node => node.remove())
	}
	page.name = payload.title
	currentFrame = null
	const { id, title, url } = payload
	debug('Set plugin data')
	page.setPluginData('PF-ID', payload.id)
	page.setPluginData('PF-DATA', JSON.stringify({ id, title, url }))
	return figma.currentPage = page
}

function drawFrame(name:string):BaseNode {
	const frame = figma.createFrame()

	frame.name = name
	frame.resize(270, 100)
	frame.backgrounds = []

	frame.layoutMode = 'VERTICAL'
	frame.counterAxisSizingMode = 'FIXED'
	frame.itemSpacing = 0

	// frame.locked = true

	if (currentFrame) {
		frame.x = currentFrame.x + currentFrame.width + 50
	}
	return currentFrame = frame
}

function drawGroup(name:string):InstanceNode {
	const frame = currentFrame
	const group = createInstance('Section/Parameter group')

	frame.appendChild(group)

	setText(group, name)
	group.layoutAlign = 'CENTER'
	group.locked = true

	return currentGroup = group
}

function drawField(data:FieldData):BaseNode {
	const frame = currentFrame
	const field = figma.createFrame()

	frame.appendChild(field)

	field.name = data.parameter || 'Field'
	// field.backgrounds = []
	// field.backgroundStyleId = 'S:9bf6cc077471c0c2bd5a9d680d0124cba7c06006,7:124'

	field.resize(frame.width, 30)

	field.layoutMode = 'VERTICAL'
	field.counterAxisSizingMode = 'FIXED'
	field.horizontalPadding = 16
	field.verticalPadding = 8
	field.itemSpacing = 4

	field.setPluginData('PF-DATA', JSON.stringify(data))

	if (data.parameter) {
		const label = drawLabel(data.parameter)
		label.name = 'Label'
		field.appendChild(label)
	}
	const control = drawControl(data)
	field.appendChild(control)

	return currentField = field
}

function drawLabel(content:string):InstanceNode {
	const label = createInstance('Heading/Body')
	setText(label, content)
	return currentLabel = label
}


function drawPlaceholder(content:string) {
	const node = figma.createFrame()

	node.resize(240, 10)
	node.layoutMode = 'VERTICAL'
	node.counterAxisSizingMode = 'FIXED'
	node.horizontalPadding = 16
	node.verticalPadding = 8
	node.opacity = 0.3
	node.locked = true
	node.fills = [{
		'type': 'SOLID',
		'visible': true,
		'opacity': 1,
		'blendMode': 'NORMAL',
		'color': { 'r': 0.9624999761581421, 'g': 0.4531770944595337, 'b': 0.4531770944595337 }
	}]

	const text = figma.createText()
	node.appendChild(text)
	text.characters = content
	text.layoutAlign = 'CENTER'
	text.textAlignHorizontal = 'CENTER'
	text.textAlignVertical = 'CENTER'
	text.fills = [{
		'type': 'SOLID',
		'visible': true,
		'opacity': 1,
		'blendMode': 'NORMAL',
		'color': { 'r': 0.27916666865348816, 'g': 0.08258680999279022, 'b': 0.08258680999279022 }
	}]
	return node
}
function drawControl(data:FieldData):InstanceNode|FrameNode {
	let component = slugify(data.component)
	let control:InstanceNode|FrameNode = createInstance(component)
	if (!control) {
		debug('using place holder instead')
		control = drawPlaceholder(component)
	}
	if (component === 'switch') {
		currentLabel.remove()
	}
	return control
}

function setText(node, content) {
	const text = node.findOne(child => (child.type === 'TEXT')) as TextNode
	text.textAutoResize = 'WIDTH_AND_HEIGHT'
	text.characters = content
	return text
}

function getColorLines(val) {
	if (!val.textFormatRuns) {
		return !val.formattedValue ? [] : val.formattedValue.split(CRLF).map((line, index) => {
			return {
				text: line.trim(),
				color: protoToCssColor(val.effectiveFormat.textFormat.foregroundColor),
				bold: !index
			}
		})
	}
	const lines = []
	val.textFormatRuns.forEach((item, index) => {
		const start = item.startIndex
		const color = item.format.foregroundColor || val.effectiveFormat.textFormat.foregroundColor
		const bold = item.format.hasOwnProperty('bold') ? item.format.bold : val.effectiveFormat.textFormat.bold
		let end = val.formattedValue.length
		if (val.textFormatRuns[index + 1]) {
			end = val.textFormatRuns[index + 1].startIndex
		}
		const value = val.formattedValue.substring(start, end)
		if (value !== '\n') {
			value.trim().split(CRLF).forEach(line => {
				lines.push({ text: line.trim(), color: protoToCssColor(color), bold })
			})
		}
	})
	return lines
}

function protoToCssColor(rgbColor:{[key:string]:any}) {
	const redFrac = rgbColor.red || 0.0
	const greenFrac = rgbColor.green || 0.0
	const blueFrac = rgbColor.blue || 0.0
	const red = Math.floor(redFrac * 255)
	const green = Math.floor(greenFrac * 255)
	const blue = Math.floor(blueFrac * 255)

	if (!('alpha' in rgbColor)) {
		return rgbToCssColor_(red, green, blue)
	}

	const alphaFrac = rgbColor.alpha.value || 0.0
	const rgbParams = [red, green, blue].join(',')
	return ['rgba(', rgbParams, ',', alphaFrac, ')'].join('')
}

function rgbToCssColor_(red, green, blue) {
	const rgbNumber = Number((red << 16) | (green << 8) | blue)
	const hexString = rgbNumber.toString(16)
	const missingZeros = 6 - hexString.length
	const resultBuilder = ['#']
	for (let i = 0; i < missingZeros; i++) {
		resultBuilder.push('0')
	}
	resultBuilder.push(hexString)
	return resultBuilder.join('')
}
