(function () {
	var exports = {};

	function Client(url, protocols) {
		var self = this;
		this._events = {};

		if (protocols) {
			this._ws = new WebSocket(url, protocols);
		} else {
			this._ws = new WebSocket(url);
		}

		this._ws.addEventListener('open', function () {
			self.emit('connect');
		});

		this._ws.addEventListener('message', function (e) {
			try {
				var msg = JSON.parse(e.data);
				var event = msg['event'];
				var channel = msg['channel'];
				var data = msg['data'];
				if (event === 'publish') {
					self.emit('message', channel, data);
				}
			} catch (e) {
			}
		});

		this._ws.addEventListener('close', function (e) {
			self.emit('close', e.code, e.reason);
		});

		this._ws.addEventListener('error', function (error) {
			var listeners = self._events['error'];
			if (listeners && listeners.length) {
				self.emit('error', error);
			} else {
				throw error;
			}
		});
	}

	Client.prototype.on = function (type, listener) {
		var listeners = this._events[type];
		if (!listeners) {
			listeners = this._events[type] = [];
		}
		listeners.push(listener);
	};

	Client.prototype.off = function (type, listener) {
		var listeners = this._events[type];
		if (listeners) {
			if (listener) {
				var index = listeners.indexOf(listener);
				listeners.splice(index, 1);
			} else {
				delete this._events[type];
			}
		}
	};

	Client.prototype.emit = function (type) {
		var self = this;
		var args = Array.prototype.slice.call(arguments, 1);
		var listeners = this._events[type];
		if (listeners) {
			listeners.forEach(function (listener) {
				listener.apply(self, args);
			});
		}
	};

	Client.prototype.subscribe = function (channel) {
		if (channel) {
			this._ws.send(JSON.stringify({
				event: 'subscribe',
				channel: channel
			}));
		}
	};

	Client.prototype.unsubscribe = function (channel) {
		if (channel) {
			this._ws.send(JSON.stringify({
				event: 'unsubscribe',
				channel: channel
			}));
		}
	};

	Client.prototype.publish = function (channel, data) {
		if (channel && data) {
			this._ws.send(JSON.stringify({
				event: 'publish',
				channel: channel,
				data: data
			}));
		}
	};

	Client.prototype.close = function (code, reason) {
		this._ws.close.apply(this._ws, arguments);
	};

	exports.Client = Client;

	exports.connect = function (url, protocols) {
		return new Client(url, protocols);
	};

	window.npc = exports;
})();