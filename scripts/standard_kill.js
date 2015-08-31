/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW script functions for killing records
 *
 *************************************************************************************************
 *************************************************************************************************
 *	$Header$
 *	
 *	$Log$
 *	Revision 1.9  2006/06/08 13:55:39  bouwmeef
 *	Changed caption in message boxes to "WinIBW 3" instead of "WinIBW 3.0"
 *	
 *	Revision 1.8  2005/04/05 10:04:31  bouwmeester
 *	Fixed display of both messages after re-linking
 *	
 *	Revision 1.7  2005/03/18 10:16:40  hofmann
 *	security checks in standard scripts, to make sure title object is non-null
 *	
 *	Revision 1.6  2005/02/07 14:03:13  bouwmeester
 *	Fixed typo in correctLinks
 *	
 *	Revision 1.5  2004/12/02 16:10:39  hofmann
 *	small bug-fix in script
 *	removed F9 from accelerators
 *	
 *	Revision 1.4  2004/12/02 13:26:37  hofmann
 *	*** empty log message ***
 *	
 *	Revision 1.3  2004/12/02 11:34:33  hofmann
 *	several bug fixes
 *	changed wrong calls from createInstance to getService for the IBWService
 *	implemented leading ! in the commandLine for executing command in new window
 *	
 *	Revision 1.2  2004/11/09 15:07:39  hofmann
 *	some more standard scripts
 *	
 *	
 **************************************************************************************************	
 */

const gPicaKill = 
{
	selectCorrectPPN : function() {
		this.__correctPPN = application.activeWindow.getVariable("P3GPP");
		
		if (!this.isValidPPN(this.__correctPPN)) {		
			this.__correctPPN = null;
			this.simpleMessage("GetPPNFailed");
			return;
		}		
		var msg = gPicaUtility.formatMessage("PPNCorrectSelected", this.__correctPPN);
		application.activeWindow.appendMessage(msg, 0);
	},
	
	selectIncorrectPPN : function() {
		this.__incorrectPPN = application.activeWindow.getVariable("P3GPP");
		
		if (!this.isValidPPN(this.__incorrectPPN)) {
			this.__incorrectPPN = null;
			this.simpleMessage("GetPPNFailed");
			return;
		}
		var msg = gPicaUtility.formatMessage("PPNIncorrectSelected", this.__incorrectPPN);
		application.activeWindow.appendMessage(msg, 0);
	},
	
	requestKill : function() {
		if (!this.__correctPPN) {
			this.simpleMessage("CorrectPPNRequired");
			return;
		}
		
		application.activeWindow.codedData = false;
		application.activeWindow.noviceMode = false;
		
		if (!application.activeWindow.title) {
			// we are not editing, do so now
			application.activeWindow.command("\\mut", false);
		}
		
		if ((application.activeWindow.status == "OK") && (application.activeWindow.title != null)) {
			application.activeWindow.title.startOfBuffer(false);
			application.activeWindow.title.insertText(gConfig.getKillString() + this.__correctPPN + "\n");
			application.activeWindow.simulateIBWKey("FR");
		}
		this.__correctPPN = null;
	},
	
	correctLinks : function() {	
		if (!this.__correctPPN) {
			this.simpleMessage("CorrectPPNRequired");
			return;
		}
		
		if (!this.__incorrectPPN) {
			this.simpleMessage("WrongPPNRequired");
			return;
		}
		
		if (application.activeWindow.getVariable("scr") != "7A") {
			this.simpleMessage("MustBeOnSet");
			return;
		}
		
		var strSet = "S" + application.activeWindow.getVariable("P3GSE");
		var strCount = application.activeWindow.getVariable("P3GSZ");
		var msg = gPicaUtility.formatMessage("ReplacePrompt",
												this.__incorrectPPN,
												this.__correctPPN,
												strSet,
												strCount);
		if (!gPicaUtility.confirm(gPicaUtility.getMessage("ReplaceTitle"), msg)) {
			this.__correctPPN = null;
			this.__incorrectPPN = null;
			return;
		}
		
		var iAuthorities = 0;
		var iRecords = 0;
		
		var count = parseInt(strCount);
		for (var i = 1; i <= count; i++) {
			var cmd = "\\mut " + strSet + " " + i + " " + gConfig.getFormat();
			application.activeWindow.command(cmd, false);
			if (gPicaUtility.isAuthority(application.activeWindow.materialCode)) {
				iAuthorities++;
				application.activeWindow.simulateIBWKey("FE");
			} else if (application.activeWindow.title != null) {
				iRecords++;
				application.activeWindow.title.replaceAll(this.__incorrectPPN, this.__correctPPN, false, false);
				gConfig.insertRequiredTags();
				application.activeWindow.simulateIBWKey("FR");
			} else {
				application.activeWindow.simulateIBWKey("FE");
			}
		}
		
		this.__correctPPN = null;
		this.__incorrectPPN = null;
		
		msg = gPicaUtility.formatMessage("TitlesProcessed", "" + iRecords);
		application.activeWindow.showMessage(msg, 0);
		msg = gPicaUtility.formatMessage("AuthoritiesIgnored", "" + iAuthorities);
		application.activeWindow.appendMessage(msg, 0);
		
	},
	
	isValidPPN : function(ppn) {
		re = /^\d{8}(x|X|\d)/;
		return re.test(ppn);
	},
	
	simpleMessage : function(strId) {
		application.messageBox("WinIBW 3", gPicaUtility.getMessage(strId), "error-icon");
	},

	// private members for storing our state
	__correctPPN: null,
	__incorrectPPN: null
};

function picaSelectCorrectPPN()
{
	gPicaKill.selectCorrectPPN();
}

function picaSelectWrongPPN()
{
	gPicaKill.selectIncorrectPPN();
}

function picaRequestKill()
{
	gPicaKill.requestKill();
}

function picaCorrectLinks()
{
	gPicaKill.correctLinks();
}



