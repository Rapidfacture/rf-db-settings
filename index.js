// rf-db

var merge = require('lodash.merge');

// logging
var log = {
   info: console.log,
   error: console.error,
   critical: function () {
      throw new Error(console.error.apply(arguments));
   }
};
try { // try using rf-log
   log = require(require.resolve('rf-log')).customPrefixLogger('[rf-db-settings]');
} catch (e) {}



module.exports = function (options, callback) {

   // housekeeping
   if (!options.settings || (options.settings.length && options.settings.length < 1)) {
      log.info('no settings specified in "options.settings", aborting.');
      return;
   }
   if (!options.db) {
      log.critical('no db access, options.db is ', options.db);
   }

   if (!options.callback) {
      log.critical('no callback was defined (second parameter), aborting...');
   }


   var db = options.db;
   var settingsToFetch = options.settings; // something like:
   // [
   //    {
   //       name: 'globalSettings',
   //       query: 'global'
   //    },
   //    {
   //       name: 'appSettings',
   //       query: config.app.name
   //    },
   //    {
   //       name: 'mailSettings',
   //       query: 'mail'
   //    }
   // ]
   var mergeObj = options.mergeDbSettingsInto;
   if (mergeObj) { // merge without conflict?
      settingsToFetch.forEach(function (setting) {
         if (mergeObj[setting.name]) {
            log.critical('You try to overwrite mergeDbSettingsInto.' + setting.name + ' aborting. Please Choose antoher "name" in "settings" in rf-db-settings option ');
         }
      });
   }


   var dBsettings = {}; // settings to fetch from db



   // iterate throught settingsToFetch
   var counter = 0;
   function fetchNextSetting () {
      var settingFetch = settingsToFetch[counter];

      if (!settingFetch.name) {
         log.critical('no "name" found in "settings[" ' + counter + ']. settings looks like:', settingsToFetch);
      }

      if (!settingFetch.query) {
         log.critical('no "query" found in "settings[" ' + counter + ']. settings looks like:', settingsToFetch);
      }

      db.global.settings
         .findOne({
            'name': settingFetch.query
         })
         .exec(function (err, doc) {
            if (err) {
               log.critical(err);
            } else if (doc && doc.settings) {
               log.success('got "' + settingFetch.query + '" settings from db.global.settings');
               dBsettings[settingFetch.name] = doc.settings;
            } else if (settingFetch.optional) {
               log.info('could not fetch "' + settingFetch.query + '" settings from db.global.settings, but was optional');
               dBsettings[settingFetch.name] = null;
            } else {
               log.critical('no ' + settingFetch.query + ' settings found in DB global');
            }

            counter++;

            if (counter < settingsToFetch.length) fetchNextSetting();

            if (counter === settingsToFetch.length) { // jump out of the loop
               finish();
            }

         });
   }


   // init
   fetchNextSetting();


   function finish () {
      // optional: merge dbSettings into passed object
      if (mergeObj) {
         mergeObj = merge(mergeObj, dBsettings);
      }

      callback(dBsettings);
   }

};
