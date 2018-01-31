// rf-db

// logging
var log = {
   info: console.log,
   error: console.error,
   critical: function () {
      throw new Error(console.error.apply(arguments))
   }
};
try { // try using rf-log
   log = require(require.resolve('rf-log')).customPrefixLogger('[rf-db]');
} catch (e) {}


var mongooseMulti = require('mongoose-multi'),




module.exports.start = function (options, callback) {


   if (!options.db) {
      log.critical("no db configuration specified ", options.db)
   }
   if (!options.pathsSchemas){
       log.critical("no db schemas specified ", options.pathsSchemas)
   }

   var db = mongooseMulti.start(options.db, options.pathsSchemas);

   db.global.mongooseConnection.once('open', function () {


  // TODO: create a function that gets a list of setting files to fetch and returns the settings

      var settings= [
         {
            name: 'globalSettings',
            query: 'global'
         },
         {
            name: 'appSettings',
            query: config.app.name
         },
         {
            name: 'mailSettings',
            query: 'mail'
         },
      ];
      
      // how can this parameter be passed back?
      var config = {};

      var counter = 0;

      function getNextSetting(){
         var name = settings[counter];
         var query = settings[counter];
         getGlobalSettings(query, function setGlobalSettings (setting) {
            counter++;
            config.[name] = setting;
            if (counter < settings.length) getNextSetting();
         });
      }
      
      getNextSetting()


      // Load settings
      getGlobalSettings('global', function setGlobalSettings (globalSettings) {
         config.global = globalSettings;
         getGlobalSettings(config.app.name, function setGlobalSettings (appSettings) {
            config.appSettings = appSettings;
            callback(db);
         });
      });
      
   });
   
   return db;
};



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
