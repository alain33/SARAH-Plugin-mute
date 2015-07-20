/*
	Sarah mute
	Author: Stéphane Bascher
	
	Date: 10/06/2015
	Version: 1.0: 
	Creation of the module
*/


// Global variables
var SARAH,
	v_mute = true,
	volmute = false,
    job,
	cron,
    flagActiveLazy = false,
	speaktobirds = 0,
    CronJob = require('./lib/cron/cron').CronJob,
	fs = require('fs'),
    _ = require('./lib/underscore/underscore');

// Init Sarah	 
exports.init = function(sarah){
  SARAH = sarah;
  
  var config = SARAH.ConfigManager.getConfig();
  
  SARAH.listen('mute', function(data){
		if (data.key == 'mute') setDefaultContext();
		if (data.key == 'askme') { 
			console.log("info: tempo trigger " + config.modules.mute['asknext']);
			mngSound(true);
			volmute = true;
			setjob(config.modules.mute['asknext']);
		}
  });

  SARAH.remote({'context' : 'lazymute.xml'});
  setcron();
}



exports.action = function(data, callback, config, SARAH){
  
	// ? Are you nuts ? leave back home.
	if (data.command === undefined)
		return callback({});
	
	// table of actions
	var tblActions = {
		defaultcontext: function() {setDefaultContext()},
		autoMute: function() {autoMute(data.values)},
		startAskme: function() {autoMute(data.values)},
		setmaxThreashold: function() {set_threashold('maxThreashold')},
		forceMute: function() {v_mute = true},
		updateThreashold: function() {update_threashold(data.value || '')},
		getThreashold: function() {get_threashold()},
		setDefaultThreashold: function() {set_threashold('defaultThreashold')}
	};

	tblActions[data.command]();
	
	// return fucking callback
	callback({});
}



// Coupe / Remet le son
// Ici les fonctions des plugins pour réaliser les actions
// state true = coupe le son
// state false = remet le son
var mngSound = function (state) {
	// Démo
	// SARAH.call('freebox', {command: 'autoMute', key: state});
	// SARAH.call('SonosPlayer', {command: 'autoMute', key: state});
}



// Default context
// chargement de toutes les grammaires
var setDefaultContext = function (){
	
	// Je coupe le son
	mngSound(true);
	SARAH.remote({'context' : 'default'});
	
}



// Modifie la confidence
var set_threashold = function (prop){

	var config = SARAH.ConfigManager.getConfig();
	var value = config.modules.mute[prop];
	speaktobirds = 0;
	update_threashold(value);
	
}


// Ignore ou active le lazy ?
var ignoreCmd = function (value,callback) {
	
	var config = SARAH.ConfigManager.getConfig();
	var tblIgnoreCmds = config.modules.mute['ignoreCmds'];
	var tblIgnoreStdOptions = config.modules.mute['ignoreOptions'];

	if (value.Options && !_.isEmpty(value.Options)) {	
		if (tblIgnoreCmds[value.Cmd] && tblIgnoreCmds[value.Cmd] == 'ALL')
			return callback(true);
			
		if (value.Options['lazy']) {
			if (value.Options['lazy'] == 'LazyStop') {
				console.log("info: lazy stops for " + value.Cmd);
				v_mute = true;
				volmute = false;
				return callback(false);
			}
			if (value.Options['lazy'] == 'LazyStart') {
				console.log("info: lazy starts for " + value.Cmd);
				v_mute = false;
				return callback(true);
			}
		}	
	
		if (v_mute == false && value.Cmd != 'askme') return callback(true);

		if (value.Options['command'] && value.Options['command'] == 'forceMute' ) {
			console.log("info: force mute");
			return callback(false,true);
		}

		if (tblIgnoreCmds[value.Cmd] || tblIgnoreCmds['ALL']) {
			for (var key in value.Options) {
				if (tblIgnoreCmds[value.Cmd] && tblIgnoreCmds[value.Cmd].indexOf(value.Options[key]) != -1) {
					return callback(true);
				}
				if (tblIgnoreCmds['ALL'] && tblIgnoreCmds['ALL'].length > 0) {
					if (tblIgnoreCmds['ALL'].indexOf(value.Options[key]) != -1)
						return callback(true);
				} 
			}
			var Options = {},
				pending = Object.keys(value.Options).length;
			for (var key in value.Options) {
				if (tblIgnoreStdOptions.indexOf(key) == -1) {
					Options[key] = value.Options[key];
				}
			
				if (!--pending) {
					if (tblIgnoreCmds[value.Cmd] == 'null' && _.isEmpty(Options)) {
						return callback(true);	
					}
					
					callback(false);
				}
			}
		} else
			callback(false);
		
	} else {
		if (tblIgnoreCmds[value.Cmd] && tblIgnoreCmds[value.Cmd] == 'null') {
			return callback(true);	
		}
		callback(false);
	}
}


// Appelé après une règle
var autoMute = function (value) {

	ignoreCmd (value, function(state,val) {
		if (state == false) {
			if (value.Options['command'] && value.Options['command'] == 'defaultcontext' )
				++speaktobirds;
			else
				speaktobirds = 0;
				
			var config = SARAH.ConfigManager.getConfig();
			var increasedThreashold = config.modules.mute['increasedThreashold'];
			
			if (!val || val != true) {
				if (value.Cmd == 'askme') {
					if (value.Options.timeout == false)
						var tempo = config.modules.mute['asknext'] || 45;
					else {
						volmute = false;
						v_mute = true;
						var tempo = config.modules.mute['askend'] || 5;
					}
				} else 
					var tempo = config.modules.mute['tempo'] || 10;
			} else  
				var tempo = config.modules.mute['forceMute'] || 2;
				
			console.log("info: tempo " + tempo);
			setjob(tempo,value,increasedThreashold);
		} else {
			console.log('info: command ignored');
			if (job && v_mute == false) {
				console.log('info: previous job stopped');
				job.stop();
				job = undefined;
			}
			if (cron && v_mute == false) {
				console.log('info: previous cron stopped');
				cron.stop();
				cron = undefined;
			}
		}
	});
}


// Fonction commune d'activation de la grammaire
var setlazymute = function () {

	console.log('info: auto mute job activated');
	SARAH.remote({'context' : 'lazymute.xml'});
	console.log('info: auto mute cron activated');
	setcron();
	
	/* Je remet le son */
	if (volmute == false) {
		mngSound(false);
	}	
}



// Job cron d'activation de la grammaire lazymute.xml
// après une règle, askme, lazy.
var setjob = function (tempo,value,increasedThreashold) {

	var d = new Date();
	var s = d.getSeconds()+tempo;
	d.setSeconds(s);

	if (job) {
		console.log('info: previous job stopped');
		job.stop();
	}
	job = new CronJob(d, function(done) {	
		console.log("info: speaktobirds: " + speaktobirds + ' maximum: ' + increasedThreashold)
		if (value.Options['command'] && value.Options['command'] == 'defaultcontext' && speaktobirds  >= increasedThreashold) {	
			update_threashold(null,function() {  
				setTimeout(function(){ 
					setlazymute();
				}, 1000);
			});	
		} else {
			setlazymute();
			console.log("info: No threashold update");
		}
	},null, true);
}


// Cron d'annulation du reset de la grammaire
// ctxTimeout du custom.ini
var setcron = function () {
  
	if (cron) {
		console.log('info: previous cron stopped');
		cron.stop();
	}
	
	var d = new Date();
	var s = d.getSeconds()+46830;
	d.setSeconds(s);

	cron = new CronJob(d, function(done) {	
		console.log('info: auto mute cron restarted');
		SARAH.remote({'context' : 'lazymute.xml'});
		setcron();
	}, null, true);
}


// Quelle est la confidence courante ?
var get_threashold = function () {

	var file = __dirname + '/lazymute.xml';
	var XmlMute  = fs.readFileSync(file,'utf8');

	if (XmlMute.indexOf('out.action._attributes.threashold="') != -1) {
		var threashold =  parseFloat(XmlMute.substring(XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 3, XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 1 + 4))
		if (threashold != NaN) {
			SARAH.speak(threashold);
		} else	
			SARAH.speak("Il y a une erreur dans le xml, je ne peux pas le retrouver");	
	}
}


// Mise à jour de la confidence dans le lazymute.xml
var update_threashold = function (defaultvalue, callback) {

	// rewrite XML mute
	var file = __dirname + '/lazymute.xml';
	var XmlMute  = fs.readFileSync(file,'utf8');

	if (XmlMute.indexOf('out.action._attributes.threashold="') != -1) {
		var threashold;
		if (defaultvalue && defaultvalue != '')
			threashold = defaultvalue;
		else {
			threashold =  parseFloat(XmlMute.substring(XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 1, XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 1 + 4))
			if (threashold != NaN) 
				threashold += 0.01;
			else	
				console.log("info: enable to update the threashold");
		}
		
		var replaceXml =   XmlMute.substring(0,XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 1)
						  + threashold
						  + XmlMute.substring(XmlMute.indexOf('out.action._attributes.threashold="') + ('out.action._attributes.threashold=').length + 5);
		
		fs.writeFileSync(file, replaceXml, 'utf8');

		SARAH.speak("Je met ma confidence à " + (threashold * 100));
		console.log("info: Update threashold to " + threashold);
		
		if (callback) callback();
			
	} else {
		console.log("info: enable to update the threashold");
		if (callback) callback();
	}
}


