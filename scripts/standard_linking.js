/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW script functions for linking
 *
 *************************************************************************************************
 *************************************************************************************************
 *	$Header$
 *	
 *
 *	$Log$
 *	Revision 1.8  2005/03/18 10:16:40  hofmann
 *	security checks in standard scripts, to make sure title object is non-null
 *	
 *	Revision 1.7  2004/11/09 15:07:39  hofmann
 *	some more standard scripts
 *	
 *	Revision 1.6  2004/10/25 12:28:19  pica
 *	Fix for bug 968, by addition of return value to CConnection::Communicate
 *	
 *	Revision 1.5  2004/10/19 09:31:13  pica
 *	VBScript interface for window snapshot functions
 *	
 *	Revision 1.4  2004/07/15 11:41:59  hofmann
 *	all kind of script related stuff
 *	
 *	Revision 1.3  2004/07/14 07:16:01  hofmann
 *	*** empty log message ***
 *	
 *	Revision 1.2  2004/07/13 09:55:36  hofmann
 *	some more script related stuff
 *	
 *	Revision 1.1  2004/07/12 08:32:22  hofmann
 *	moved file
 *	
 *	Revision 1.3  2004/07/07 17:58:39  hofmann
 *	tests only
 *	
 *	Revision 1.2  2004/07/07 13:00:29  hofmann
 *	start implementation
 *	
 *	Revision 1.1  2004/07/07 12:57:47  hofmann
 *	*** empty log message ***
 *	
 **************************************************************************************************	
 */
 
 const gPicaLink = 
 {
	// search a link; bExact as opposite to truncated
	searchLink:	function(bExact) {
		if (this.initialize() == false) {
			this.cleanup();
			return false;
		}

		this.__searched = true;

		var strMatCode = gPicaUtility.getMaterialType();		
		if (strMatCode == "") {
			application.messageBox(gPicaUtility.getMessage("LinkTitle"),
								   gPicaUtility.getMessage("NoDocType"),
								   "error-icon");
			this.cleanup();
			return false;
		}

		if (application.activeWindow.title == null) {
			this.cleanup();
			return false;
		}
		
		// check if we have a selection
		if (application.activeWindow.title.selection == "") {
			// no selection, select whole field
			application.activeWindow.title.startOfField(false);
			application.activeWindow.title.wordRight(1, false);
			application.activeWindow.title.endOfField(true);
		}
		
		var searchTerm = application.activeWindow.title.tagAndSelection;
		var format = gConfig.getFormat();
		if ((format == "p") || (format == "d")) {		
			// expansion may not be taken for searching
			// this feature is only for Dutch configuration
			var ind1 = searchTerm.indexOf(" ; ");	
			var ind2 = searchTerm.indexOf("$");
			if (ind1>=0) {
				searchTerm = searchTerm.substr(0, ind1); 
			} else if (ind2>=0) {
				searchTerm = searchTerm.substr(0, ind2); 
			}	
		}	
		var strCommand = gPicaUtility.buildLinkCommand(bExact, strMatCode, searchTerm);
		application.activeWindow.command(strCommand, true);
				
		// check if the command only returned a message
		// if so, cleanup the object, so we can not paste nonsens
		if (application.receivedMessageOnly) { 
		    // If no lineking is found, return false
			this.restoreWindows();
			this.cleanup();
			return false;
		} else {
		    // if the linking is found, return true
			this.__found = true;
			return true;
		}
	},
		
	// will paste the link if we are valid
	pasteLink:	function () {
		// make sure we searched
		if (!this.__searched) {
			application.messageBox(gPicaUtility.getMessage("LinkTitle"),
								   gPicaUtility.getMessage("MustHaveSearched"),
								   "error-icon");			
			return false;
		}
		
		// make sure we found something
		if (!this.__found) {
			application.messageBox(gPicaUtility.getMessage("LinkTitle"),
								   gPicaUtility.getMessage("MustHaveFound"),
								   "error-icon");			   
			return false;
		}
		
		// make sure we do not link to ourselfs
		if (application.activeWindow.windowID == this.__activeWindow) {
			application.messageBox(gPicaUtility.getMessage("LinkTitle"),
								   gPicaUtility.getMessage("PasteImpossible"),
								   "error-icon");								   
			return false;
		}
		
				
		var matType = gPicaUtility.getMaterialType();
		var ppn = application.activeWindow.getVariable("P3GPP");
				
		application.activateWindow(this.__activeWindow);
		gPicaUtility.insertLink(matType, ppn);
		application.activateView();
		this.restoreWindows();
		this.cleanup();
		this.__searched = false;
		return true;
	},
		
	
	initialize: function () {
		this.__found = false;
		this.__searched = false;
		
		// check if we are editing a record
		if (!application.activeWindow.title) {
			var title = gPicaUtility.getMessage("LinkTitle");
			var msg   = gPicaUtility.getMessage("MustBeEditing");
			application.messageBox(title, msg, "error-icon");
			this.cleanup();
			return false;
		}
	
		// save the open windows
		this.__openWindows = application.windows.getWindowSnapshot();
		
		// save the active window
		this.__activeWindow = application.activeWindow.windowID;
		
		return true;
	},
	
	restoreWindows: function() {
		if (this.__openWindows) {
			application.windows.restoreWindowSnapshot(this.__openWindows);
		}
		application.activateWindow(this.__activeWindow);
	},
	
	cleanup: function() {
		this.__found = false;
		this.__openWindows = null;
		this.__activeWindow = null;
	},
		
	// "private" member for storing our state
	__searched: false,
	__found: false,
	__openWindows: null,
	__activeWindow: null
 };
 
 function picaSearchLink()
 {
	return gPicaLink.searchLink(false);		
 }
 
 function picaSearchLinkExact()
 {
	return gPicaLink.searchLink(true);	
 }
 
 function picaPasteLink()
 {
	return gPicaLink.pasteLink();	
 }
 
 