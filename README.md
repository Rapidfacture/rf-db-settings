# rf-db

Get Settings from Rapifacture database module with error handling. Try to use 'rf-log'

## installation

> npm install rf-db-settings

```javascript
var getDbSettings = require('rf-db-settings');


getDbSettings({
   settings: [
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
      }
   ]
   mergeDbSettingsInto: config

}, function(settings){ // callback after fetch
   // settings looks like:
   // {
   //    globalSettings: Object,
   //    appSettings: Object,
   //    mailSettings: Object
   // }
});
```
