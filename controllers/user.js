var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var format = require('util').format;
var crypto = require('crypto');
var BSON = mongo.BSONPure;

// Check if loggedIn
function loggedIn(req){
  return (req.cookies.DopeAssListsUser!==undefined && req.cookies.DopeAssListsUser != "");
}

// Checks if the cookie for a specific request is valid
function validCookie(req){
  return (req.cookies.DopeAssListsData!==undefined&&(req.cookies.DopeAssListsData instanceof Array));
}

// returns Username of Logged in user
function getUsername(req) {
	return new Buffer(req.cookies.DopeAssListsUser.username, 'hex').toString('utf8');
}

function getUserId(req) {
	return (req.cookies.DopeAssListsUser.userId)? req.cookies.DopeAssListsUser.userId : "";
}

/* User.getAll : get's all the lists of the user.
 * -------------------------------------------------
 * @param req : the request
 * @param success : callback in case of success
 *		  Of the form function(logged, username, revalidate, data)
 * @param failure : callback in case of failure
 *		  Of the form fonction(type, err)
 */
function getAll(req, success, failure) {

	/* 0A. Lists
	[
		{ name: String,
		  _id: ObjectID,
		  items: [ String ]
		}
	]

	/* 0B. Users and Lists in MongoDB
	[ { username: String,
	  password: String,
	  _id: ObjectID
	} ]
	
	[ { name: String,
		_id: ObjectID,
		owner : String,
		items: [ String ]
	} ]
	*/

	// or items: [ { text:String, link:bool, title:String  } ]
	// text contains url if Link

	// 1. DETERMINE IF SIGNED UP USER
	if(loggedIn(req)) {

		// 1A. We are logged in, get the userdata from the database
		var url = format("mongodb://127.0.0.1/dopeasslistsdb");
		MongoClient.connect(url, function(err, db) {

			// 1Ai. If we encounter error while connecting
			if(err) {
				failure("panic", "Sorry we can't load your lists right now. Try again later.");
				console.log(err);
				return;
			}

    		// 1Aii. We are connected
    		var lists = db.collection('lists');
    		try { var UserId = new BSON.ObjectID(getUserId(req));
    		} catch(err) {
    			failure("panic", "Your cookie is malformated. Try to logout and login again.");
    			return;
    		}
	        lists.find({"owner" : UserId}, { "sort": [ "_id", "desc" ] }).toArray(function(err, documents){

				if(err) {
					failure("panic", "Sorry we can't load your lists right now. Try again later.");
					return;
	          	}

	          	try { var username = getUsername(req)}
	          	catch(err) { 
	          		failure("panic", "Your cookie is malformated. Try to logout and login again.");
    				return;
	          	}

	          	success(true, username, null, documents);
				return;

	        });

		});

	} else { 
	// 2. THE USER IS NOT SIGNED UP

		// 2A. Check if we has a valid Cookie already
		var data = [];
		var valid = validCookie(req);

    	if(valid) data = req.cookies.DopeAssListsData.sort(function(a,b){ return a._id.valueOf() - b._id.valueOf() });

    	success(false, null, !valid, data);
		return;

	}

}

/* User.getList : gets a specific list of the user.
 * -------------------------------------------------
 * @param req : the request
 * @param success : callback in case of success
 *		  Of the form function(list)
 * @param failure : callback in case of failure
 *		  Of the form fonction(type, err)
 */
function getList(req, success, failure) {

	// 0. Get the ID and make sure it is valid
	var id = req.params.list;

	if (id.length != 24) {
		failure("404", "The id seems to be misformated");
		return;
	}


	// 1. DETERMINE IF SIGNED UP USER
	if(loggedIn(req)) {

		// 1A. We are logged in, get the userdata from the database
		var url = format("mongodb://127.0.0.1/dopeasslistsdb");
		MongoClient.connect(url, function(err, db) {

			// 1Ai. If we encounter error while connecting
			if(err) {
				failure("panic", "Sorry, the database seems to be dead.");
				return;
			}

    		// 1Aii. We are connected
    		var lists = db.collection('lists');
    		try { var UserId = new BSON.ObjectID(getUserId(req));
    		} catch(err) {
    			failure("panic", "Your cookie is malformated. Try to logout and login again.");
    			return;
    		}
    		var ObjId = new BSON.ObjectID(id);
	        lists.find({"owner" : UserId, "_id" : ObjId }).toArray(function(err, documents){

				if(err) {
					failure("panic", "Sorry, an error occured while getting your stuff.");
					return;
	          	}

	          	if(documents.length < 1) {
	          		failure("panic", "404 The list does not exist");
	          		return;
	          	}

	          	success(documents[0]);
				return;

	        });

		});

	} else { 
	// 2. THE USER IS NOT SIGNED UP

		// 2A. Check if we has a valid Cookie already
    	if(validCookie(req)) data = req.cookies.DopeAssListsData;
    	else {
    		failure("panic", "Something is wrong with your cookie");
    		return;
    	}

		var index = findList(id, data);

		if(index == -1) {
			failure("panic", "404 The list does not exist");
          	return;
		}

    	success(data[index]);
		return;

	}

}


/* User.createList : creates a new list
 * -------------------------------------------------
 * @param req : the request
 * @param callback : general callback
 *		  Of the form function(err, id, cookieData)
 */
function createList(req, callback) {

	// 0. get the data
	var input = req.body;

	if(!input.listName || input.listName == "" || input.listName.length > 200) {
		callback("Provided information was malformatted", null, null);
		return;
	}

	// 1. DETERMINE IF SIGNED UP USER
	if(loggedIn(req)) {

		// 1A. We are logged in, get the userdata from the database
		var url = format("mongodb://127.0.0.1/dopeasslistsdb");
		MongoClient.connect(url, function(err, db) {

			// 1Ai. If we encounter error while connecting
			if(err) {
				callback("The database seems to be dead", null, null);
				return;
    		}

    		// 1Aii. We are connected
    		try { var username = getUsername(req);
    		} catch(err) { 
    			callback("Your cookie is malformatted. Try to logout and login again.", null);
    			return;
    		}
    		try { var UserId = new BSON.ObjectID(getUserId(req));
    		} catch(err) {
    			failure("panic", "Your cookie is malformated. Try to logout and login again.");
    			return;
    		}

    		var users = db.collection('users');
	        users.find({"username" : username, "_id": UserId }).toArray(function(err, documents){

	        	if (err) {
	        		callback("Sorry the database is doing stupid stuff", null, null);
	        		return;
	        	}

				if(documents.length < 1) {
					callback("User seems to be invalid", null, null);
					return;
	          	}

				// We have a valid user.
				var lists = db.collection('lists');
				var safe = input.listName;
				
				lists.insert({"name":safe, "owner":UserId, "items":[]}, function(err, docs){

					// Id is used for url, so use valueOf();
					callback(err, docs[0]._id.valueOf(), null);
					return;

				});

	        });

		});

	} else { 
	// 2. THE USER IS NOT SIGNED UP

    	if(validCookie(req)) {
    		
    		var id = new BSON.ObjectID();
    		var data = req.cookies.DopeAssListsData;
    		data.push({ name: input.listName, _id: id, items:[] });

    		// requires Cookie upadte
			callback(false, id.valueOf(), data);
			return;

    	} else {

    		callback("Not a valid cookie", null, null);
    		return;
    	}

	}
}


/* User.editList : edit the name of a List
 * -------------------------------------------------
 * @param req : the request containing form inputs
 * @param type : type of edit
 * @param callback : general callback(err, cookieData)
 * @param optional : provided by prior stuff
 */
 function editList(req, type, callback, optional) {

 	// type :
 	// 0 = edit List (requires listId, listName)
 	// 1 = delete Item from List (requires listId, itemName)
 	// 2 = add Item to List (requires listId, itemName, optional.link, optional.title) 

 	// 0. get the data
	var input = req.body;

	// 0. verify listId (needed in all cases)
	if(!input.listId || input.listId.length != 24 || (!input.listName && !input.itemName) ) {
		callback("Provided information was malformatted", null);
		return;
	}

	// 1. DETERMINE IF SIGNED UP USER
	if(loggedIn(req)) {

		// 1A. We are logged in, get the userdata from the database
		var url = format("mongodb://127.0.0.1/dopeasslistsdb");
		MongoClient.connect(url, function(err, db) {

			// 1Ai. If we encounter error while connecting
			if(err) {
				callback(err, null);
				return;
    		}

    		// Make sure user is really valid
    		try { var username = getUsername(req);
    		} catch(err) { 
    			callback("Your cookie is malformatted. Try to logout and login again.", null);
    			return;
    		}
    		try { var UserId = new BSON.ObjectID(getUserId(req));
    		} catch(err) {
    			failure("panic", "Your cookie is malformated. Try to logout and login again.");
    			return;
    		}

    		var users = db.collection('users');
	        users.find({"username" : username, "_id": UserId }).toArray(function(err, documents){

	        	if (err) {
	        		callback("Sorry the database is doing stupid stuff", null);
	        		return;
	        	}

				if(documents.length < 1) {
					callback("User seems to be invalid", null);
					return;
	          	}


	    		// 1Aii. We are connected
	    		var lists = db.collection('lists');
	    		var ObjId = new BSON.ObjectID(input.listId);

	    		// 1B. Now check what to do
	    		var query = {};

	    		switch(type) {
	    			case 0: // EDIT LIST
	    				if(input.listName && input.listName.length > 0 && input.listName.length < 201 ) query = { $set: { "name": input.listName } };
	    				else {
	    					callback("Provided information was malformatted", null);
	    					return;
	    				}
	    				break;
	    			case 1: // DELETE ITEM
	    				if(input.itemName && input.itemName.length > 0 && input.itemName.length < 201 ) { 
	    					// OLD: query = { $pull: { "items": input.itemName } };
	    					query = { $pull: { "items" : { "text" : input.itemName } } }
	    				} else {
	    					callback("Provided information was malformatted", null);
	    					return;
	    				}
	    				break;
	    			case 2: // ADD ITEM
	    				// OLD : if(input.itemName && input.itemName.length > 0) query = { $push: { "items": input.itemName } };
	    				if(optional.text && optional.text.length > 0 && optional.text.length < 201
	    					&& optional.link !== undefined && optional.title !== undefined) {
	    					query = { $push: { "items":  {text:optional.text, link:optional.link, title:optional.title } } }
	    				} else {
	    					callback("Provided information was malformatted", null);
	    					return;
	    				}
	    				break;
	    		}

	    		// 1C Perform query
		        lists.update({"owner" : UserId, "_id": ObjId }, query, { multi: false } , function(err, documents){

					if(err) {
						callback(err, null);
						return;
		          	}

		          	if (documents.length < 1) {
		          		callback("The list does not exists", null);
		          		return;
		          	}

					callback(false, null);
					return;

		        });

		    });

		});

	} else { 
	// 2. THE USER IS NOT SIGNED UP

    	if(validCookie(req)) {
    		
    		// 2A. get data from cookie
    		var data = req.cookies.DopeAssListsData;
    		// 2B. get specific list
    		var index = findList(input.listId , data);

    		// Check for possible errors
    		if(index == -1) {
    			callback("The list does not exist", null);
	          	return;
    		}

    		switch(type) {
    			case 0: // EDIT LIST
    				if(input.listName && input.listName.length > 0 && input.listName.length < 201 ) data[index].name = input.listName;
    				else {
    					callback("Provided information was malformatted", null);
    					return;
    				}
    				break;
    			case 1: // DELETE ITEM
    				if(input.itemName && input.itemName.length > 0 && input.itemName.length < 201) {

    					// get index of itemName
    					var index2 = findItem(input.itemName, data[index].items);
    					// OLD :var index2 = data[index].items.indexOf(input.itemName);
			    		if(index2 == -1) {
			    			callback("The item does not exist", null);
			    			return;
			    		}
    					data[index].items.splice(index2, 1);
    				} else {
    					callback("Provided information was malformatted", null);
    					return;
    				}
    				break;
    			case 2: // ADD ITEM
    				if(optional.text && optional.text.length > 0 && optional.text.length < 201
    					&& optional.link !== undefined && optional.title !== undefined ) {
    					// OLD : data[index].items.push(input.itemName);
    					data[index].items.push( {text:optional.text, link:optional.link, title:optional.title }  );
    				} else {
    					callback("Provided information was malformatted", null);
    					return;
    				}
    				break;
    		}

			callback(false, data);
			return;

    	} else {

    		callback("Not a valid cookie", null);
    		return;
    	}

	}

 }


/* User.deleteList : deletes a List
 * -------------------------------------------------
 * @param req : the request
 * @param callback : general callback
 *		  Of the form function(err, cookieData)
 */
function deleteList(req, callback) {

 	// 0. get the data
	var input = req.body;

	// 0. verify listId (needed in all cases)
	if(!input.listId || input.listId.length != 24 ) {
		callback("Provided information was malformatted", null);
		return;
	}


	// 1. DETERMINE IF SIGNED UP USER
	if(loggedIn(req)) {

		// 1A. We are logged in, get the userdata from the database
		var url = format("mongodb://127.0.0.1/dopeasslistsdb");
		MongoClient.connect(url, function(err, db) {

			// 1Ai. If we encounter error while connecting
			if(err) {
				callback("Error while connecting : " + err, null, null);
				return;
    		}

    		// Make sure user is really valid
    		try { var username = getUsername(req);
    		} catch(err) { 
    			callback("Your cookie is malformatted. Try to logout and login again.", null);
    			return;
    		}
    		try { var UserId = new BSON.ObjectID(getUserId(req));
    		} catch(err) {
    			failure("panic", "Your cookie is malformated. Try to logout and login again.");
    			return;
    		}

    		var users = db.collection('users');
	        users.find({"username" : username, "_id": UserId }).toArray(function(err, documents){

	        	if (err) {
	        		callback("Sorry the database is doing stupid stuff", null);
	        		return;
	        	}

				if(documents.length < 1) {
					callback("User seems to be invalid", null);
					return;
	          	}

	    		// 1Aii. We are connected
	    		var lists = db.collection('lists');
	    		var ObjId = new BSON.ObjectID(input.listId);

	    		lists.remove({"owner" : UserId, "_id": ObjId }, { "single": true}, function(err, documents){

					if(err) {
						callback(err, null);
						return;
		          	}

		          	if (documents.length < 1) {
		          		callback("The list does not exists", null);
		          		return;
		          	}

					callback(false, null);
					return;

		        });

		    });

		});

	} else { 
	// 2. THE USER IS NOT SIGNED UP

    	if(validCookie(req)) {
    		
    		// 2A. get data from cookie
    		var data = req.cookies.DopeAssListsData;
    		// 2B. get specific list
    		var index = findList(input.listId , data);

    		// Check for possible errors
    		if(index == -1) {
    			callback("The list does not exist", null);
	          	return;
    		}

    		data.splice(index, 1);

    		// requires Cookie update
			callback(false, data);
			return;

    	} else {

    		callback("Not a valid cookie", null);
    		return;
    	}

	}
}


/* findList : returns the index of the list with given id
 * -------------------------------------------------
 * @param id : the id of the desired list
 * @param data : array of Lists
 */
function findList(id, data) {

	for(var i = 0; i < data.length; i++) {
		if(data[i]._id.valueOf() == id) return i;
	}
	return -1;
}

/* findItem : returns the index of the item with given text
 * -------------------------------------------------
 * @param text : the text of the desired item
 * @param items : array of items
 */
function findItem(text, items) {

	for(var i = 0; i < items.length; i++) {
		if(items[i].text == text) return i;
	}
	return -1;
}


/* User.login : login obviously
 * -------------------------------------------------
 * @param req : the request
 * @param success : function(userId)
 * @param failure : function(type, err)
 */
exports.login = function(input, success, failure) {

	if(!input.username || !input.password) {
		failure('lists', "Some info is missing. You really thought I wouldn't notice ?");
 		return;
 	}
	if(input.username.length<3 || input.username.length > 32) {
		failure('lists', "Your username has to be between 3 and 32 characters long.");
 		return;
 	}
 	if(input.password.length<3 || input.password.length > 32) {
 		failure('lists', "Your password has to be between 3 and 32 characters long.");
 		return;
 	}

	var hashed = crypto.createHash('sha1').update(input.password).digest("hex");

	var url = format("mongodb://127.0.0.1/dopeasslistsdb");
	MongoClient.connect(url, function(err, db) {

		// 1Ai. If we encounter error while connecting
		if(err) {
			failure("panic", "Sorry, the database seems to be dead.");
			return;
		}

		// 1Aii. We are connected
		var users = db.collection('users');
        users.find({"username" : input.username.trim(), "password": hashed }).toArray(function(err, documents){

        	if(err) {
        		failure("panic", "Sorry, the database is doing stupid stuff again.");
        		return;
        	}

        	if(documents.length < 1) {
        		failure("lists", "Wrong credentials");
        		return;

        	} else {

				success(documents[0]._id.valueOf(), documents[0].username);
				return;

			}

		});
	
	});	

} 

/* User.signup : signup obviously
 * -------------------------------------------------
 * @param req : the request
 * @param success : function(userId)
 * @param failure : function(type, err)
 */
 exports.signup = function(req, success, failure) {

 	var input = req.body;
 	if(!input.username || !input.password || !input.email) { 
 		failure('signup', "Some info is missing. You really thought I wouldn't notice ?");
 		return;
 	}
 	if(input.username.length<3 || input.username.length > 32) {
 		failure('signup', "Your username has to be between 3 and 32 characters long.");
 		return;
 	}
 	if(input.password.length<3 || input.password.length > 32) {
 		failure('signup', "Your password has to be between 3 and 32 characters long.");
 		return;
 	}
 	if(input.email.length<4 || input.email.length > 100) {
 		failure('signup', "Your email has to be between 4 and 100 characters long.");
 		return;
 	}

 	var hashed = crypto.createHash('sha1').update(input.password).digest("hex");

 	var url = format("mongodb://127.0.0.1/dopeasslistsdb");
	MongoClient.connect(url, function(err, db) {

		// 1Ai. If we encounter error while connecting
		if(err) {
			failure("panic", "Sorry, the database seems to be dead.");
			return;
		}

		// 1Aii. We are connected
		var users = db.collection('users');
        users.find({"username" : input.username}).toArray(function(err, documents){

        	if(err) {
        		failure("panic", "Sorry, the database is doing stupid stuff again.");
        		return;
        	}

        	if(documents.length > 0) {
        		failure("signup", "Ah bummer! That username is already taken.");
        		return;

        	} else {

        		// Check if email is already used
        		users.find({"email" : input.email.trim()}).toArray(function(err, documents){

		        	if(err) {
		        		failure("panic", "Sorry, the database is doing stupid stuff again.");
		        		return;
		        	}

		        	if(documents.length > 0) {
		        		failure("signup", "That email was already used for an account.");
		        		return;
		        	}

					// username and email not taken
					users.insert({"username" : input.username.trim(), "password" : hashed, "email": input.email.trim()}, function(err, docs){

						if(err) {
							failure("panic", "Sorry, the database is doing stupid stuff again.");
	        				return;
						}

						// return userID and username for cookie
						success(docs[0]._id.valueOf(), input.username.trim());
						return;

					});

				});	
			}

		});
	
	});	

 }

// LIST DISPLAY
exports.getAll = getAll;
exports.getList= getList;

// LISTS MANIPULATION
exports.createList = createList;
exports.editList = editList;
exports.deleteList = deleteList;

// OTHER STUFF
exports.findList = findList;
exports.loggedIn = loggedIn;
exports.validCookie = validCookie;
exports.getUsername = getUsername;