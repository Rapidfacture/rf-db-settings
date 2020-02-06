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

   if (!callback) {
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
   var settingsInfo = '';
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

            // error handling
            if (err) {
               log.critical(err);
            } else if (doc && doc.settings) {
               settingsInfo += settingFetch.name + ', ';
               dBsettings[settingFetch.name] = doc.settings;
            } else if (settingFetch.optional) {
               log.info('could not fetch "' + settingFetch.query + '" settings from db.global.settings, but was optional');
               dBsettings[settingFetch.name] = null;
            } else {
               // restart after some time, as this is critical
               var notFound = 'no ' + settingFetch.query + ' settings found in DB global';
               log.error(notFound);
               setTimeout(function () {
                  log.critical(notFound);
               }, 25000);
            }


            // next setting
            counter++;
            if (counter < settingsToFetch.length) fetchNextSetting();


            // finish
            if (counter === settingsToFetch.length) { // jump out of the loop
               // optional: merge dbSettings into passed object
               if (mergeObj) mergeObj = merge(mergeObj, dBsettings);
               callback(dBsettings, settingsInfo);
            }

         });
   }


   // init
   fetchNextSetting();


};
