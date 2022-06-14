'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require tools.widgets as widgets';

//	[Widget, Option, Title, Description, {Param: 'Value'}],
var startupConf = [
	[form.Flag, 'disabled', _('Disabled xfrpc service')],
	[form.ListValue, 'loglevel', _('Log level'), _('LogLevel specifies the minimum log level. Valid values are "debug", "info", "notice", "warning", "err", "crit", "alert" and "emerg".<br />By default, this value is "info".'), {values: ['7', '6', '5',  '4', '3', '2', '1', '0']}],
];

var commonConf = [
	[form.Value, 'server_addr', _('Server address'), _('ServerAddr specifies the address of the server to connect to.<br />By default, this value is "0.0.0.0".'), {datatype: 'host'}],
	[form.Value, 'server_port', _('Server port'), _('ServerPort specifies the port to connect to the server on.<br />By default, this value is 7000.'), {datatype: 'port'}],
	[form.Value, 'token', _('Token'), _('Token specifies the authorization token used to create keys to be sent to the server. The server must have a matching token for authorization to succeed. <br />By default, this value is "".')],
];

var baseProxyConf = [
	[form.ListValue, 'type', _('Proxy type'), _('ProxyType specifies the type of this proxy. Valid values include "tcp", "http", "https".<br />By default, this value is "tcp".'), {values: ['tcp', 'http', 'https']}],
	[form.Value, 'local_ip', _('Local IP'), _('LocalIp specifies the IP address or host name to proxy to.'), {datatype: 'ipaddr'}],
	[form.Value, 'local_port', _('Local port'), _('LocalPort specifies the port to proxy to.'), {datatype: 'port'}],
];

var bindInfoConf = [
	[form.Value, 'remote_port', _('Remote port'), _('If remote_port is 0, frps will assign a random port for you'), {datatype: 'port'}]
];

var domainConf = [
	[form.Value, 'custom_domains', _('Custom domains')],
];

function setParams(o, params) {
	if (!params) return;
	for (var key in params) {
		var val = params[key];
		if (key === 'values') {
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.value.apply(o, args);
			}
		} else if (key === 'depends') {
			if (!Array.isArray(val))
				val = [val];
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.depends.apply(o, args);
			}
		} else {
			o[key] = params[key];
		}
	}
	if (params['datatype'] === 'bool') {
		o.enabled = 'true';
		o.disabled = 'false';
	}
}

function defTabOpts(s, t, opts, params) {
	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		var o = s.taboption(t, opt[0], opt[1], opt[2], opt[3]);
		setParams(o, opt[4]);
		setParams(o, params);
	}
}

function defOpts(s, opts, params) {
	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		var o = s.option(opt[0], opt[1], opt[2], opt[3]);
		setParams(o, opt[4]);
		setParams(o, params);
	}
}

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('xfrpc'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['xfrpc']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var renderHTML = "";
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';

	if (isRunning) {
		renderHTML += String.format(spanTemp, 'green', _("x-frp Client "), _("RUNNING"));
	} else {
		renderHTML += String.format(spanTemp, 'red', _("x-frp Client "), _("NOT RUNNING"));
	}

	return renderHTML;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('xfrpc', _('frp c language Client'));

		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function (section_id) {
			L.Poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function(res) {
					var view = document.getElementById("service_status");
					view.innerHTML = renderStatus(res);
				});
			});

			return E('div', { class: 'cbi-map' },
				E('fieldset', { class: 'cbi-section'}, [
					E('p', { id: 'service_status' },
						_('Collecting data ...'))
				])
			);
		}

		s = m.section(form.NamedSection, 'common', 'xfrpc');
		s.dynamic = true;

		s.tab('common', _('Common Settings'));
		s.tab('init', _('Startup Settings'));

		defTabOpts(s, 'common', commonConf, {optional: true});

		o = s.taboption('init', form.SectionValue, 'init', form.TypedSection, 'xfrp', _('Startup Settings'));
		s = o.subsection;
		s.anonymous = true;
		s.dynamic = true;

		defOpts(s, startupConf);

		s = m.section(form.GridSection, 'xfrpc', _('Proxy Settings'));
		s.addremove = true;
		s.filter = function(s) { return s !== 'common'; };
		s.renderSectionAdd = function(extra_class) {
			var el = form.GridSection.prototype.renderSectionAdd.apply(this, arguments),
				nameEl = el.querySelector('.cbi-section-create-name');
			ui.addValidator(nameEl, 'uciname', true, function(v) {
				if (v === 'common') return _('Name can not be "common"');
				return true;
			}, 'blur', 'keyup');
			return el;
		}

		s.tab('general', _('General Settings'));
		s.tab('http', _('HTTP Settings'));

		s.option(form.Value, 'type', _('Proxy type')).modalonly = false;
		s.option(form.Value, 'local_ip', _('Local IP')).modalonly = false;
		s.option(form.Value, 'local_port', _('Local port')).modalonly = false;

		defTabOpts(s, 'general', baseProxyConf, {modalonly: true});

		// TCP
		defTabOpts(s, 'general', bindInfoConf, {optional: true, modalonly: true, depends: [{type: 'tcp'}]});

		// HTTP and HTTPS
		defTabOpts(s, 'http', domainConf, {optional: true, modalonly: true, depends: [{type: 'http'}, {type: 'https'}]});

		return m.render();
	}
});
