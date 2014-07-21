var request = require('request');

/* findLink : tells if a string is a link and gets it's title
 * -------------------------------------------------
 * @param name : the string
 * @param callback : callback(link, title, name)
 */

exports.findLink = function(name, callback) {

	// determine if link
	var link = (name.indexOf('http://') == 0 || name.indexOf('https://') == 0);
	if(!link && name.indexOf('www') == 0) {
		link = true;
		name = "http://"+name;
	}

	if(link) {

		// If error occurs just use url as title
		var title = name.replace('http://','').replace('https://','').replace('www','');
		request(name, function (error, response, body) {
			if (!error && response.statusCode == 200) {

		  		var titles = body.match(/<title>(.*?)<\/title>/);
		  		if(titles && titles.length>0) callback(true, titles[1], name);
				else callback(true, title, name);
				return;

			} else {

		  		callback(true, title, name);
		  		return;

			}
		})

	} else callback(false, null, name);


}