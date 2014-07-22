// get theme
// doesn't throw anything
function whiteTheme(req) {
	try {

		if(req.cookies.DopeAssListsTheme) {
			var theme = req.cookies.DopeAssListsTheme;
			return (theme == 68567885);
		}
		else false;

	} catch(err) {
		return false;
	}
}

exports.whiteTheme = whiteTheme;

// callback(err, result)
exports.theme = function(req, callback) {

	var input = req.body;
	if(!input.newTheme || isNaN(input.newTheme) || input.newTheme.length > 10 || input.newTheme.length< 1) {
		callback("There was an error with your settings.", null);
		return;
	}

	callback(false, input.newTheme);
	return;
}