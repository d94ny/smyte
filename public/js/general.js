function create() {

	if($("#29302").is(":visible")) {
		$("#29302").hide();
		$("#9904").show();
		$("#9904i").focus();
	} else {
		$("#9904").hide();
		$("#29302").show();
	}

	return;
}

function log() {

	if($("#17325").is(":visible")) {
		$("#17325").hide();
		$("#l385109").show();
	} else {
		$("#l385109").hide();
		$("#17325").show();
	}

	return;
}

function togggle(prefix, listId) {

	if($("#l"+listId).is(":visible")) {
		$("#l"+listId).hide();
		$("#"+prefix+listId).show();
	} else {
		$("#l"+listId).show();
		$("#"+prefix+listId).hide();
	}

	return;
}

function loading() {
	$('#217619139').hide();
	$("#217619140").html("Coming up with a title ...");
}

function terms() {
	$('#terms').html("Just kidding, there aren't any. Were you actually about to read them ?");
}

function ofcourse() {
	$('#terms').html("Of course you read them. But there actually aren't any.");
}

function email() {
	$('#email').html("Seriously? Well, nothing we can do about that.<br/><br/>");
}
