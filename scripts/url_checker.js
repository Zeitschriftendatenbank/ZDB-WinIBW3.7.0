

function validateURLs()
{
	var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);

	var bCodedData = application.activeWindow.codedData;
	var bNoviceMode = application.activeWindow.noviceMode;
	application.activeWindow.codedData = false;
	application.activeWindow.noviceMode = false;
		
	if (!application.activeWindow.title) {
		// we are not editing, do so now
		application.activeWindow.command("\\mut", false);
	}
		
	if ((application.activeWindow.status == "OK") && (application.activeWindow.title != null)) {
		open_xul_dialog("chrome://ibw/content/xul/url_checking_dialog.xul", null, null);
	} else {
		// we silently ignore any errors, the CBS should already have informed the user
		application.activeWindow.codedData = bCodedData
		application.activeWindow.noviceMode = bNoviceMode;
	}
}

function checkBrokenLinks()
{
	var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);

	if (application.activeWindow.getVariable("scr") != "7A") {
		application.messageBox("URLChecker", "You must be in a short presentation to use this function", "message-icon");
		return;
	}
		
	application.activeWindow.codedData = false;
	application.activeWindow.noviceMode = false;

	var theArgs = [true];
	
	open_xul_dialog("chrome://ibw/content/xul/url_checking_dialog.xul", null, theArgs);
}