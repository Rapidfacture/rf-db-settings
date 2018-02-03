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
   var settingsToFetch = options.settings;
   var mergeObj = options.mergeDbSettingsInto;
   // should be something like:
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
   // ];
   var dBsettings = {}; // settings to fetch from db



   // iterate throught settingsToFetch
   fetchNextSetting();
   var counter = 0;
   function fetchNextSetting () {
      var name = settingsToFetch[counter];
      var query = settingsToFetch[counter];
      getGlobalSettings(query, function (dbSetting) {
         counter++;
         dBsettings[name] = dbSetting;
         if (counter < settingsToFetch.length) fetchNextSetting();
      });
   }

   function getGlobalSettings (name, callback) {
      db.global.settings
         .findOne({
            'name': name
         })
         .exec(function (err, doc) {
            if (doc && doc.settings) {
               callback(doc.settings);
            } else if (err) {
               log.critical(err);
            } else {
               log.critical('no ' + name + ' settings found in DB global');
            }
         });
   }


   // optional: merge dbSettings into passed object
   if (mergeObj) {
      mergeObj = merge(mergeObj, dBsettings);
   }


   callback(dBsettings);
};
