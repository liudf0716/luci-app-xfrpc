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

function renderGithubInfo() {
	var renderHTML = "";
	var starHTML = '<a class="gh-button" href="https://github.com/liudf0716/xfrpc">' +
				   '<span class="gh-button__title">' +
				   '<svg class="gh-button__icon gh-button__icon--github-logo" viewbox="0 0 1024 1024">' +
				   '<path d="M512 0C229.252 0 0 229.25199999999995 0 512c0 226.251 146.688 418.126 350.155 485.813 25.593 4.686 34.937-11.125 34.937-24.626 0-12.188-0.469-52.562-0.718-95.314-128.708 23.46-161.707-31.541-172.469-60.373-5.525-14.809-30.407-60.249-52.398-72.263-17.988-9.828-43.26-33.237-0.917-33.735 40.434-0.476 69.348 37.308 78.471 52.75 45.938 77.749 119.876 55.627 148.999 42.5 4.654-32.999 17.902-55.627 32.501-68.373-113.657-12.939-233.22-56.875-233.22-253.063 0-55.94 19.968-101.561 52.658-137.404-5.22-12.999-22.844-65.095 5.063-135.563 0 0 42.937-13.749 140.811 52.501 40.811-11.406 84.594-17.031 128.124-17.22 43.499 0.188 87.314 5.874 128.188 17.28 97.689-66.311 140.686-52.501 140.686-52.501 28 70.532 10.375 122.564 5.124 135.499 32.811 35.844 52.626 81.468 52.626 137.404 0 196.686-119.751 240-233.813 252.686 18.439 15.876 34.748 47.001 34.748 94.748 0 68.437-0.686 123.627-0.686 140.501 0 13.625 9.312 29.561 35.25 24.562C877.436 929.998 1024 738.126 1024 512 1024 229.25199999999995 794.748 0 512 0z" />' +
				    '</svg>' +
				    '<span class="gh-button__title__text">xfrpc</span>' +
				    '</span>' +
				  	'<span class="gh-button__stat">' +
				    '<svg class="gh-button__icon gh-button__icon--star" viewbox="0 0 896 1024">' +
				    '<path d="M896 384l-313.5-40.781L448 64 313.469 343.219 0 384l230.469 208.875L171 895.938l277-148.812 277.062 148.812L665.5 592.875 896 384z" />' +
				    '</svg>' +
				    '<span class="gh-button__stat__text">4,500</span>' +
				  	'</span>' +
					'</a>';
	
	renderHTML += starHTML;
	
	return renderHTML;
}

document.querySelector('head').appendChild(E('link', {
		    'rel': 'stylesheet',
		    'type': 'text/css',
		    'href': L.resource('view/xfrpc/gh-button.css')
}));

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('xfrpc', _('xfrpc'));
		m.description = _("xfrpc is a c language frp client for frps. It has more advantage in OpenWrt box than frpc");
		
		s = m.section(form.NamedSection, '_github');
		s.anonymous = true;
		s.render = function (section_id) {
			L.Poll.add(function () {
				return L.resolveDefault().then(function() {
					var view = document.getElementById("github_info");
					view.innerHTML = renderGithubInfo();
				});
			});

			return E('div', { class: 'cbi-map' },
				E('fieldset', { class: 'cbi-section'}, [
					E('p', { id: 'github_info' },
						_('Collecting x-frpc github info ...'))
				])
			);

		}

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
