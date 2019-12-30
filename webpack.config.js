const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const mode = process.argv.includes('--mode=production') || process.argv.includes('-p') ? 'production' : 'development'

module.exports = {
	mode: mode,
	devtool: mode === 'production' ? false : 'inline-source-map',
	entry: {
		app: './src/app.tsx',
		core: './src/core.ts'
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js']
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: 'app.html',
			inlineSource: '.(js)$',
			chunks: ['app']
		}),
		new HtmlWebpackInlineSourcePlugin()
	]
}