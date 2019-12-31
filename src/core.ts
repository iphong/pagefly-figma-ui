import { emit, listen } from './lib/events'
import groupBy from 'lodash/groupBy'
import { UI_COMPONENT_NAMES } from './lib/defines'

listen('load', load)
listen('save', save)
listen('draw', draw)
listen('cache', cache)
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

const component_names = UI_COMPONENT_NAMES.map(slugify)
const storageKey = 'PF-APP3'

interface FieldData {
	group?:string,
	values?:string|string[],
	element?:string,
	tooltip?:string,
	category?:string,
	condition?:string,
	parameter?:string,
	component?:string,
	placeholder?:string

	[key:string]:any
}

type group_t = Map<string, Map<string, Set<FieldData>>>|Map<string, Set<FieldData>>

const FIELDS:FieldData = {
	group: 'group',
	values: 'value(s)',
	element: 'element',
	tooltip: 'tooltip',
	category: 'category',
	parameter: 'parameter',
	component: 'ui component',
	placeholder: 'placeholder'
}

let count
const componentsMap = new Map
function cache({ components }:{components:{[key:string]:any}}) {
	count = 0
	Object.entries(components).forEach(([id, component]) => {
		component.name = slugify(component.name)
		const { name, key } = component
		if (!componentsMap.has(name)) {
			const match = component_names.find((baseName:string) => name.startsWith(baseName))
			if (match) {
				count++
				figma.importComponentByKeyAsync(key).then(node => {
					componentsMap.set(name, {
						id,
						key,
						name,
						node
					})
				})
			}
		}
	})

}

const allFields = new Map
const variableFields = new Map
const conditionalFields = new Map

function gatherComponentInfo() {
	allFields.clear()
	variableFields.clear()
	conditionalFields.clear()
	figma.currentPage.findAll((node) => {
		if (node && node.getPluginData('PF-TYPE') === 'FIELD') {
			const data = JSON.parse(node.getPluginData('PF-DATA'))
			allFields.set(node, data)
			if (data.valueColors.length > 1) {
				data.valueColors.forEach(item => {
					if (item.text === data.value) {
						variableFields.set(node, data)
					}
				})
			}
			data.paramColors.forEach(item => {
				if (item.color !== '#000000') {
					conditionalFields.set(node, data)
				}
			})
		}
		return false
	})
}

function updateParam(newData) {
	allFields.forEach((data, node) => {
		if (newData.element === data.element && newData.group === data.group && newData.parameter === data.parameter) {
			setFieldValue(newData.value, node)
		}
	})
}
function setFieldValue(value, node = figma.currentPage.selection[0]) {
	const data = allFields.get(node)
	data.value = value
	updateControl(node, data)
	node.setPluginData('PF-DATA', JSON.stringify(data))
	updateVisibility()
}

function updateControl(node, data) {
	let control:InstanceNode = node.children[node.children.length - 1]
	switch (data.component.toLowerCase()) {
		case 'switch': {
			control.masterComponent = findComponent('Switch/' + data.value)
			setText(control, data.parameter)
			break
		}
		case 'basic select':{
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
		data.valueColors.forEach(item => {
			if (item.text === data.value) {
				elements[k].set(item.color, node)
			}
		})
	})
	conditionalFields.forEach((data, node) => {
		const colors = elements[data.element + ':' + data.group]
		const visible = data.paramColors.some(item => {
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
	componentsMap.forEach((data) => {
		if (data.name.startsWith(name)) {
			similar.push(data.name)
			if (!target) target = data.node
		}
	})
	if (similar.length > 1) {
		const defaultIndex = similar.indexOf(`${name}-default`)
		const offIndex = similar.indexOf(`${name}-dff`)
		if (defaultIndex >= 0) {
			target = componentsMap.get(similar[defaultIndex]).node
		} else if (offIndex >= 0) {
			target = componentsMap.get(similar[offIndex]).node
		}
	} else if (!similar.length) {

	}
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

async function load() {
	gatherComponentInfo()
	updateVisibility()
	const data = await figma.clientStorage.getAsync(storageKey) || {}
	data.page = readPage(figma.currentPage)
	data.selection = getSelection()
	return data
}

async function save(data) {
	delete data.page
	delete data.selection
	return await figma.clientStorage.setAsync(storageKey, data)
}

function readPage(page = figma.currentPage) {
	let id = page.getPluginData('PF-ID')
	let data = {
		items: [...allFields.values()]
	}
	if (id) {
		Object.assign(data, JSON.parse(page.getPluginData('PF-DATA')))
	}
	return data
}

function getSelection(nodes = figma.currentPage.selection) {
	return nodes
		.filter(node => node.getPluginData('PF-TYPE') === 'FIELD')
		.map(node => JSON.parse(node.getPluginData('PF-DATA')))
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

function merge(keys:string[], values:string[][], grid) {
	const items:FieldData[] = []

	values.forEach((data:any[], rowIndex) => {
		const item:FieldData = {}

		Object.entries(FIELDS).forEach(([key, value]) => {
			const index = keys.indexOf(value)
			if (key === 'values') {
				item.valueColors = getColorLines(grid.sheets[0].data[0].rowData[rowIndex].values[index])
			}
			if (key === 'parameter') {
				item.paramColors = getColorLines(grid.sheets[0].data[0].rowData[rowIndex].values[index])
			}
			item[key] = data[index] || ''
		})
		// item.parameter = item.parameter.split(CRLF)[0]

		if (item.element && item.group && item.component) items.push(item)
	})

	return group(items, 'element', 'group') as group_t
}

function draw(payload) {
	const { data, grid } = payload
	const keys = data.slice(0, 1)[0].map((c?:string) => c ? c.toLowerCase() : '')
	const values = data.slice(1)
	const items = merge(keys, values, grid)

	drawPage(payload)
	items.forEach((groups, element) => {
		drawFrame(element)
		groups.forEach((fields:Set<FieldData>, group:string) => {
			drawGroup(group)
			fields.forEach((field) => {
				drawField(field)
			})
		})
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
	const { id, title, url, sheet, sheets, time } = payload
	page.setPluginData('PF-ID', payload.id)
	page.setPluginData('PF-DATA', JSON.stringify({ id, title, url, sheet, sheets, time }))
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
	field.backgrounds = []
	field.backgroundStyleId = 'S:9bf6cc077471c0c2bd5a9d680d0124cba7c06006,7:124'

	field.resize(frame.width, 30)

	field.layoutMode = 'VERTICAL'
	field.counterAxisSizingMode = 'FIXED'
	field.horizontalPadding = 16
	field.verticalPadding = 8
	field.itemSpacing = 4

	field.setPluginData('PF-TYPE', 'FIELD')
	field.setPluginData('PF-DATA', JSON.stringify(data))

	if (data.parameter) {
		const label = drawLabel(data.parameter)
		label.name = 'Label'
		field.appendChild(label)
	}
	const control = drawControl(data)
	field.appendChild(control)

	updateControl(field, data)

	return currentField = field
}

function drawLabel(content:string):InstanceNode {
	const label = createInstance('Heading/Body')
	setText(label, content)
	return currentLabel = label
}

function drawControl(data:FieldData):InstanceNode {
	let component = slugify(data.component)
	let control:InstanceNode|SliceNode = createInstance(component)
	if (!control) {
		control = createInstance('Static text/Danger')
		const text = setText(control, component)
		control.layoutAlign = 'CENTER'
		control.resize(240, 30)
		control.opacity = 0.2
		text.textAlignHorizontal = 'CENTER'
		text.textAlignVertical = 'CENTER'
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
				bold: !index ? true : false
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
