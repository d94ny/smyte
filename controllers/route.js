
// Required libraries
var User = require('./user');
var Url = require('./url');
var Theme = require('./theme');

// Function to handle rendering
function handleRender(res, err, html, theme){

	// If an error occured while rendering
	if(err) {
		
		// render panic as response
		res.render('panic', {wTheme : theme}, function(err,html){
			if(err) res.send(500, "<h1>Sorry, mega failure of doom</h1>");
			else res.send(500, html);
		});
		console.log(err);

	// Else just send rendered html
	} else res.send(200,html);

}

// Function to handle Errors and CookieUpdates
function handleAndRedirect(res, err, cookieUpdate, redirect, theme) {

	// 1. Check if Error occured
	if (err) {
		res.render('panic', {error : err, wTheme: theme});
		return;
	}

	// 2. If user uses Cookies we need to create new one
	if(cookieUpdate) {
		res.cookie('DopeAssListsData', cookieUpdate, { maxAge: 2592000*1000, httpOnly: true });
	}

	// 3. redirect to List page
	res.redirect(redirect);
	return;
}

/* route.lists : displays a user's lists
 * -------------------------------------------------
 */
exports.lists = function(req, res){

	User.getAll(req,
		// Callback for success(logged, username, revalidate, data)
		function(logged, username, revalidate, data){

			// Check if we have to revalidate the cookie
			// It will be created once the response is sent
			if (!logged && revalidate) {
				res.cookie('DopeAssListsData', data, { maxAge: 2592000*1000, httpOnly: true });
			}

			// get theme
			var w = Theme.whiteTheme(req);

			// render list page
			res.render('lists', {
				wTheme : w,
				loggedIn : logged,
				username : username,
				data : data.reverse()
			}, function(err, html){ handleRender(res, err, html, w) });

		},

		// Callback for failure()
		function(type, err) {
			var w = Theme.whiteTheme(req);
			res.render(type, {error: err, wTheme : w}, function(err, html){ handleRender(res, err, html, w) });
			return;
		}
	);

}

/* route.lists : displays all items for a specific list
 * -------------------------------------------------
 */
exports.items = function(req, res) {

	User.getList(req,
		// Callback for success
		function(list){

			var w = Theme.whiteTheme(req);
			res.render('items', {
				wTheme : w,
				title: list.name,
				listName : list.name,
				listId : list._id.valueOf(),
				listItems : list.items.reverse()
			}, function(err, html){ handleRender(res, err, html, w) });
		},

		// Callback for failure
		function(type, err) {
			// render corresponding error page
			var w = Theme.whiteTheme(req);
			res.render(type, {error: err, wTheme: w}, function(err, html){ handleRender(res, err, html, w) });
			return;

		}
	);
}

/* route.create : creates a new list
 * -------------------------------------------------
 */
exports.create = function(req, res){

	User.createList(req, function(err, id, cookieUpdate) {
		var w = Theme.whiteTheme(req);
		handleAndRedirect(res, err, cookieUpdate, '/l/'+id, w);
		return;
	});
}

/* route.add : add an item to a specific list
 * -------------------------------------------------
 */
exports.add = function(req, res) {

	var w = Theme.whiteTheme(req);

	// Requires optional paramters !
	if(!req.body.itemName) {
		res.render('panic', {error:"Provided information was malformatted", wTheme: w});
		return;
	}

	Url.findLink(req.body.itemName, function(link, title, text) {

		User.editList(req, 2, function(err, cookieUpdate) {
			handleAndRedirect(res, err, cookieUpdate, '/l/'+req.body.listId, w);
			return;
		},
		{"link": link, "title":title, "text": text});

	});
}


/* route.removeItem : remove an item from a List
 * -------------------------------------------------
 */
exports.removeItem = function(req, res) {

	User.editList(req, 1, function(err, cookieUpdate) {
		var w = Theme.whiteTheme(req);
		handleAndRedirect(res, err, cookieUpdate, '/l/'+req.body.listId, w);
		return;
	});

}

/* route.editList : edit the name of a List
 * -------------------------------------------------
 */
exports.editList = function(req, res) {

	User.editList(req, 0, function(err, cookieUpdate) {
		var w = Theme.whiteTheme(req);
		handleAndRedirect(res, err, cookieUpdate, '/', w);
		return;
	});

}

/* route.editList : edit the name of a List
 * -------------------------------------------------
 */
exports.deleteList = function(req, res) {

	User.deleteList(req, function(err, cookieUpdate) {
		var w = Theme.whiteTheme(req);
		handleAndRedirect(res, err, cookieUpdate, '/', w);
		return;
	});

}


/* route.login
 * -------------------------------------------------
 */
exports.login = function(req, res) {

	var input = req.body;
	var w = Theme.whiteTheme(req);

	if(User.loggedIn(req)){
		res.redirect('/');
		return;
	}

	User.login(input,
		// Success function
		function(userID, username) {

			// Create a cookie
			var content = { "userId" : userID, "username" : new Buffer(username).toString('hex') };
		    res.cookie('DopeAssListsUser', content, { maxAge: 2592000*1000, httpOnly: true });
		    res.redirect('/');
		    return;

		},
		// failure function
		function(type, err) {
			switch(type) {
				case "panic":
					res.render(type, {error : err, wTheme: w});
					break;
				case "lists":

					var data = [];
    				if(User.validCookie(req)) data = req.cookies.DopeAssListsData.sort(
    					function(a,b){ return a._id.valueOf() - b._id.valueOf()}
    				);

					res.render('lists', {
						wTheme: w,
						loggedIn : false,
						username : null,
						data : data,
						error : err,
						errorType : 0
					}, function(err, html){ handleRender(res, err, html, w) });
					break;
			}
			return;
		}
	);
}

/* route.logout---------
 */
exports.logout = function(req, res) {

	res.clearCookie('DopeAssListsUser');
  	res.redirect('/');

}

/* route.logout---------
 */
 exports.form = function(req, res) {

 	if(User.loggedIn(req)){
		res.redirect('/');
		return;
	}

	var w = Theme.whiteTheme(req);
 	res.render('signup', {wTheme: w},function(err, html){ handleRender(res, err, html, w) });
 	return;
 }

exports.signup = function(req, res) {

	var input = req.body;

	if(User.loggedIn(req)){
		res.redirect('/');
		return;
	}

	User.signup(req,
		// in case of success
		function(userID, username)  {
			// create cookie
			// Create a cookie
		   	var content = { "userId" : userID, "username" : new Buffer(username).toString('hex') };
		    res.cookie('DopeAssListsUser', content, { maxAge: 2592000*1000, httpOnly: true });
		    res.redirect('/');
		    return;

		},
		// failure
		function(type, err) {
			var w = Theme.whiteTheme(req);
			res.render(type, {error : err, wTheme: w}, function(err, html){ handleRender(res, err, html, w) });
			return;
		}
	);
};

exports.forgot = function(req, res) {
	var w = Theme.whiteTheme(req);
	res.render('forgot', {wTheme: w}, function(err, html){ handleRender(res, err, html,w) });
}

exports.resend = function(req, res) {
	var w = Theme.whiteTheme(req);
	res.render('forgot', {wTheme: w}, function(err, html){ handleRender(res, err, html,w) });
}

exports.theme = function(req, res) {
	Theme.theme(req, function(err, result){

		var w = Theme.whiteTheme(req);
		// 1. check if error
		if (err) {
			res.render('panic', {error : err, wTheme: w});
			return;
		}

		// 2. Change the 
		if(result) {
			res.cookie('DopeAssListsTheme', result, { maxAge: 2592000*1000, httpOnly: true });
		}

		// 3. redirect to List page
		res.redirect('/');
		return;

	});
}

// Panic function
exports.panic = function(req, res){

	// Render panic function without callback to stay coherant
	var w = Theme.whiteTheme(req);
	res.render('panic', {wTheme: w});

}

// 404 function
exports.notfound = function(req, res){

	// Render panic function without callback to stay coherant
	var w = Theme.whiteTheme(req);
	res.render('panic', {error: "404 Page not found", wTheme: w});
	
}

// Handle favicon function
exports.favicon = function(req, res){
	return;
}