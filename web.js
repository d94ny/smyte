
// PROJECT NAME : Dopeass Lists
// PROJECT AUTHOR : Daniel Balle
// PROJECT DOMAIN : <DOMAIN>
// PROEJCT PORT : 8892
var port = 8892;

// PROJECT STRUCTURE :
/*
| -- web.js
| -- packages.json
| -- Procfile
| -- views/
|    | -- 404.jade
|    | -- panic.jade
|    | -- layout.jade
|    | -- lists.jade
|    | -- items.jade
| -- public/
|    | -- css/
|	 |	  | -- general.css	
|    | -- js/
|    | -- img/
|    | -- other/
| -- controllers/
|    | -- route.js
|    | -- user.js
| -- node_modules/
*/

// Import libraries
var http = require('http');
var express = require('express');

// Import router
var route = require('./controllers/route');

// Create express app
var app = express();

// Run the app on port 8888 */
app.listen(port);
console.log('Running on '+port);
	
// Use gzip compression
app.use(express.compress());

// Favicon stuff
app.use(express.favicon(__dirname + '/public/img/favicons/favicon.ico')); 

// Setup Express to serve static files
// Static files (css,js,images ...) are located inside /public
app.use(express.static(__dirname + '/public'));

// Set view engine to jade
app.set('view engine', 'jade');

// Set the location of the view files (.jade)
// Located inside /views
app.set('views', __dirname + '/views');

// To parse POST requests
app.use(express.bodyParser());

// To handle Cookies
app.use(express.cookieParser());
app.use(app.router);

// Routes
// Should all call route.something
// calls function(req,res);
app.get('/', route.lists);
app.get('/l/:list', route.items);
app.post('/create', route.create);
app.post('/add', route.add);
app.post('/login', route.login);
app.post('/ri', route.removeItem);
app.post('/el', route.editList);
app.post('/dl', route.deleteList);
app.get('/logout', route.logout);
app.get('/signup', route.form);
app.post('/signup', route.signup);
app.get('/forgot', route.forgot);
app.post('/forgot', route.resend);
app.post('/theme', route.theme);

// Handle the stupid favicon
// app.get('/favicon.ico', route.favicon);

// Handle 404 error message
app.get('*', route.notfound);
app.get('404', route.notfound);
