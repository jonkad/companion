const App = require('../../app')
const UIHandler = require('./Handler')

/**
 * Logger for messages to send to the user in the UI
 *
 * @author Håkon Nessjøen <haakon@bitfocus.io>
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 * @author William Viker <william@bitfocus.io>
 * @author Julian Waller <me@julusian.co.uk>
 * @since 1.0.12
 * @copyright 2022 Bitfocus AS
 * @license
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for Companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 */
class UILog {
	/**
	 * The debugger for this class
	 * @type {debug.Debugger}
	 * @access protected
	 */
	debug = require('debug')('lib/UI/Log')
	/**
	 * The log array
	 * @type {Array[]}
	 * @access protected
	 */
	history = []
	/**
	 * The core interface client
	 * @type {UIHandler}
	 * @access protected
	 */
	io
	/**
	 * The modules' event emitter interface
	 * @type {App}
	 * @access protected
	 */
	system

	/**
	 * Create a new UI logger
	 * @param {App} system - the modules' event emitter interface
	 * @param {UIHandler} io - the core interface client
	 */
	constructor(system, io) {
		this.system = system
		this.io = io
		this.history.push([Date.now(), 'log', 'info', 'Application started'])

		this.system.on('log', this.add.bind(this))
		this.system.on('io_connect', this.clientConnect.bind(this))
	}

	/**
	 * Log and send a message to the UI
	 * @param {string} source - the name of the module sending the log
	 * @param {string} level - 'debug' | 'info' | 'warn' | 'error'
	 * @param {string} message - the message to print
	 * @access public
	 */
	add(source, level, message) {
		if (level) {
			let now = Date.now()
			this.io.emit('log', now, source, level, message)
			this.history.push([now, source, level, message])
			if (this.history.length > 500) {
				this.history.shift()
			}
		}
	}

	/**
	 * Setup a new socket client's events
	 * @param {SocketIO} client - the client socket
	 * @access public
	 */
	clientConnect(client) {
		client.on('log_clear', () => {
			client.broadcast.emit('log_clear')
			this.history = []
			this.io.emit('log', Date.now(), 'log', 'info', 'Log cleared')
		})
		client.on('log_catchup', () => {
			for (const n in this.history) {
				let arr = this.history[n]
				client.emit('log', arr[0], arr[1], arr[2], arr[3])
			}
		})
	}
}

module.exports = UILog