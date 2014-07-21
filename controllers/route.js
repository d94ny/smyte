
// Required libraries
var User = require('./user');
var Url = require('./url');

// Function to handle rendering
function handleRender(res, err, html){

	// If an error occured while rendering
	if(err) {
		
		// render panic as response
		res.render('panic', function(err,html){
			if(err) res.send(500);
			else res.send(500, html);
		});
		console.log(err);

	// Else just send rendered html
	} else res.send(200,html);

}

// Function to handle Errors and CookieUpdates
function handleAndRedirect(res, err, cookieUpdate, redirect) {

	// 1. Check if Error occured
	if (err) {
		res.render('panic', {error : err});
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

			// render list page
			res.render('lists', {
				loggedIn : logged,
				username : username,
				data : data.reverse()
			}, function(err, html){ handleRender(res, err, html) });

		},

		// Callback for failure()
		function(type, err) {
			res.render(type, {error: err}, function(err, html){ handleRender(res, err, html) });
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

			res.render('items', {
				listName : list.name,
				listId : list._id.valueOf(),
				listItems : list.items.reverse()
			}, function(err, html){ handleRender(res, err, html) });
		},

		// Callback for failure
		function(type, err) {
			// render corresponding error page
			res.render(type, {error: err}, function(err, html){ handleRender(res, err, html) });
			return;

		}
	);
}

/* route.create : creates a new list
 * -------------------------------------------------
 */
exports.create = function(req, res){

	User.createList(req, function(err, id, cookieUpdate) {
		handleAndRedirect(res, err, cookieUpdate, '/l/'+id);
		return;
	});
}

/* route.add : add an item to a specific list
 * -------------------------------------------------
 */
exports.add = function(req, res) {

	// Requires optional paramters !
	if(!req.body.itemName) {
		res.render('panic', {error:"Provided information was malformatted"});
		return;
	}

	Url.findLink(req.body.itemName, function(link, title, text) {

		User.editList(req, 2, function(err, cookieUpdate) {
			handleAndRedirect(res, err, cookieUpdate, '/l/'+req.body.listId);
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
		handleAndRedirect(res, err, cookieUpdate, '/l/'+req.body.listId);
		return;
	});

}

/* route.editList : edit the name of a List
 * -------------------------------------------------
 */
exports.editList = function(req, res) {

	User.editList(req, 0, function(err, cookieUpdate) {
		handleAndRedirect(res, err, cookieUpdate, '/');
		return;
	});

}

/* route.editList : edit the name of a List
 * -------------------------------------------------
 */
exports.deleteList = function(req, res) {

	User.deleteList(req, function(err, cookieUpdate) {
		handleAndRedirect(res, err, cookieUpdate, '/');
		return;
	});

}


/* route.login
 * -------------------------------------------------
 */
exports.login = function(req, res) {

	var input = req.body;

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
					res.render(type, {error : err});
					break;
				case "lists":

					var data = [];
    				if(User.validCookie(req)) data = req.cookies.DopeAssListsData.sort(
    					function(a,b){ return a._id.valueOf() - b._id.valueOf()}
    				);

					res.render('lists', {
						loggedIn : false,
						username : null,
						data : data,
						error : err,
						errorType : 0
					}, function(err, html){ handleRender(res, err, html) });
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

 	res.render('signup', function(err, html){ handleRender(res, err, html) });
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
			res.render(type, {error : err});
			return;
		}
	);
};

exports.forgot = function(req, res) {
	res.render('forgot', function(err, html){ handleRender(res, err, html) });
}

exports.resend = function(req, res) {
	res.render('forgot', function(err, html){ handleRender(res, err, html) });
}

// Panic function
exports.panic = function(req, res){

	// Render panic function without callback to stay coherant
	res.render('panic');

}

// 404 function
exports.notfound = function(req, res){

	// Render panic function without callback to stay coherant
	res.render('panic', {error: "404 Page not found"});
	
}

// Handle favicon function
exports.favicon = function(req, res){
	return;
}