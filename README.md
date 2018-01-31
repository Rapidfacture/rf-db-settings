# rf-db
Rapifacture database module. Provides mongoose, Gridfs and Db settings

* tries to use 'rf-log'


##

>npm install rf-db

```js
var db = require('rf-db').start({
   db: db,
   pathsSchemas: 'dest',
   settings: {

   }
});

// the webserver is running on port 3000 using folder 'dest' as root
// user express 'app' for further things like
// adding middleware, websockets, etc.
```
