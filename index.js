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
         log.critical('"name" not found in passed "settings[" ' + counter + ']. settings looks like:', settingsToFetch);
      }

      if (!settingFetch.query) {
         log.critical('"query" not found in passed "settings[" ' + counter + ']. settings looks like:', settingsToFetch);
      }

      getGlobalSettings(settingFetch.query, function (dbSetting) {
         dBsettings[settingFetch.name] = dbSetting;

         counter++;

         if (counter < settingsToFetch.length) fetchNextSetting();

         if (counter === settingsToFetch.length) { // jump out of the loop
            finish();
         }
      });
   }
   function getGlobalSettings (queryName, callback) {
      db.global.settings
         .findOne({
            'name': queryName
         })
         .exec(function (err, doc) {
            log.info(queryName);

            if (doc && doc.settings) {
               callback(doc.settings);
            } else if (err) {
               log.critical(err);
            } else {
               log.critical('no ' + queryName + ' settings found in DB global');
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

      if (callback) callback(dBsettings);
   }

};
