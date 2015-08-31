/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW utility script functions
 *
 *  It will read site specific settings from the gPicaConfig object
 *  The gPicaConfig object is defined in either:
 *    - config_pica.js
 *    - config_abes.js
 *	  - config_german.js
 *
 *  You may modify config_german.js to your needs.
 *
 *************************************************************************************************
 *************************************************************************************************
 *	$Header$
 *	
 *
 *	$Log$
 *	Revision 1.14  2006/08/24 09:12:18  bouwmeef
 *	Force WinIBW to the foreground at the end of open_xul_dialog.
 *	
 *	Revision 1.13  2006/08/22 08:53:01  bouwmeef
 *	Moved open_xul_dialog to standard_utility.js
 *	
 *	Revision 1.12  2005/06/30 07:37:53  hofmann
 *	fixed attribute problems in utility scripting objects
 *	
 *	Revision 1.11  2005/06/13 12:48:59  hofmann
 *	*** empty log message ***
 *	
 *	Revision 1.10  2005/06/13 12:33:11  hofmann
 *	fix for TTP1385, FT3425 -> FT3360 is not fixed by this fix!!
 *	
 *	Revision 1.9  2005/04/05 10:07:19  bouwmeester
 *	Corrected argument list in findTag
 *	
 *	Revision 1.8  2005/03/18 10:16:40  hofmann
 *	security checks in standard scripts, to make sure title object is non-null
 *	
 *	Revision 1.7  2004/12/02 11:34:33  hofmann
 *	several bug fixes
 *	changed wrong calls from createInstance to getService for the IBWService
 *	implemented leading ! in the commandLine for executing command in new window
 *	
 *	Revision 1.6  2004/11/09 15:07:39  hofmann
 *	some more standard scripts
 *	
 *	Revision 1.5  2004/10/19 09:31:13  pica
 *	VBScript interface for window snapshot functions
 *	
 *	Revision 1.4  2004/10/08 09:25:45  hofmann
 *	added missing syntax colouring related stuff
 *	
 *	Revision 1.3  2004/07/15 11:41:59  hofmann
 *	all kind of script related stuff
 *	
 *	Revision 1.2  2004/07/14 07:16:01  hofmann
 *	*** empty log message ***
 *	
 *	Revision 1.1  2004/07/13 09:55:22  hofmann
 *	some more script related stuff
 *	
 *	
 **************************************************************************************************	
 */

const utility = 
{
	newFileInput: function() {
		return Components.classes["@oclcpica.nl/scriptinputfile;1"]
								.createInstance(Components.interfaces.IInputTextFile);
	},

     newFileOutput: function() {
        return Components.classes["@oclcpica.nl/scriptoutputfile;1"]
                                 .createInstance(Components.interfaces.IOutputTextFile);
	},

	newPrompter: function() {
         return Components.classes["@oclcpica.nl/scriptpromptutility;1"]
                                   .createInstance(Components.interfaces.IPromptUtilities);
   },
   
	getSpecialDirectory: function(name) {
		const nsIProperties = Components.interfaces.nsIProperties;
		var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
    					.getService(nsIProperties);

		return dirService.get(name, Components.interfaces.nsIFile);
	}
};	
 
const theIOService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
const thePrefs = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefBranch);	 

const gPicaUtility = 
{
	doCmdShowFull: function(bExtraWindow) {	    
		application.activeWindow.command(gConfig.getCmdShowFull(), bExtraWindow);
	},

	getEditMaterialType: function() {
		var screen = application.activeWindow.getVariable("scr");
		var strMatCode;

		var bAuthority = (screen == "II" || screen == "MI");
		var bTitle     = (screen == "IT" || screen == "MT");

		if (!bTitle && !bAuthority) return "";

		if (application.activeWindow.title == null) return "";
		 
        strMatCode = application.activeWindow.title.findTag(
						bAuthority ? gConfig.getTagMaterialAuthority() : gConfig.getTagMaterialTitle(), 0, false, false, false);
		return strMatCode.replace(gConfig.getRegExpMatCode(), "$1");        
	},

	getMaterialType: function() {
		var strMatCode;
		var screen = application.activeWindow.getVariable("scr");        
		// check if we are editing a title
		if (screen == "MI" || screen == "MT") {
			// yes, it seems so			
			strMatCode = application.activeWindow.materialCode;					
			if (strMatCode == "") {
				strMatCode = this.getEditMaterialType();				
			}
		} else if (screen == "II" || screen == "IT") {
			strMatCode = this.getEditMaterialType();
		} else {		   
			this.doCmdShowFull(false);			
			strMatCode = application.activeWindow.materialCode;							
		}        
		strMatCode = strMatCode.slice(0, 2);		
		return strMatCode;
	},

	// checks if strMaterialType represents an authority record
	isAuthority: function(strMaterialType) {
		re = /^T.*/;
		return re.test(strMaterialType);
	},

	mustAppendToTag: function() {	    
		return gConfig.getRegExpAddToTag().test(application.activeWindow.title.tag);
	},


	buildInsertString: function(bAuthority, strPPN) {
		if (bAuthority) {
			return gConfig.getAuthorityLinkPrefix() + strPPN + gConfig.getLinkSuffix();
		} else {
			return gConfig.getTitleLinkPrefix() + strPPN + gConfig.getLinkSuffix();
		}
	},

	insertLink: function(strMaterialType, strPPN) {
		if (application.activeWindow.title == null) return;
		var strReplace = application.activeWindow.title.selection;

        var format = gConfig.getFormat();
		if ((format == "p") || (format == "d")) {			
			// escape the sub-field for inserting
			var startP = application.activeWindow.title.selStart;
			var endP  = application.activeWindow.title.selEnd;
			var ind1 = strReplace.lastIndexOf("#");
			var ind2 = strReplace.lastIndexOf("\]");
			var ind3 = strReplace.indexOf(" ; ");
			var ind4 = strReplace.indexOf("$");
		
			if (ind1 >=0) {		
				startP = startP+ind1+1;
			} else if (ind2 >=0) {		
				startP = startP+ind2+1;
			} 
		
			if (ind3 >=0) {		
				endP = endP-strReplace.length+ind3;
			} else if (ind4 >=0) {		
				endP = endP-strReplace.length+ind4;
			} 
		}	
				
		if (this.mustAppendToTag()) {		 
			strReplace += this.buildInsertString(this.isAuthority(strMaterialType), strPPN);
		} else {		  
			strReplace = this.buildInsertString(this.isAuthority(strMaterialType), strPPN);
			if ((format == "p") || (format == "d")) {
				application.activeWindow.title.setSelection(startP, endP, "true"); 
		    }		
		}
		
		if ((format == "p") || (format == "d")) {
			if (application.activeWindow.title.canReplaceSelection) {
				application.activeWindow.title.insertText(strReplace);			
			} else {
				application.activeWindow.title.insertText2(strReplace);
			}
		} else {		    
			application.activeWindow.title.insertText(strReplace);
		}	
	},

	// builds a link command for strMaterialType and strSearchTerm
	// bExact specifies if we want to search exactly or truncated
	buildLinkCommand: function(bExact, strMaterialType, strSearchTerm) {
		var quoteAsRequired = bExact ? "'" : "";
		return "\\LNK " + strMaterialType + " " + gConfig.getFormat() + " " + 
			   quoteAsRequired + strSearchTerm + quoteAsRequired;
	},

	formatMessage: function(strId) {
		var arr = new Array();
		var i;
		for (i = 1; i < arguments.length; i++) {
			arr.push(arguments[i]);
		}
		return this.stringBundle().formatStringFromName(strId, arr, arr.length);
	},

	getMessage: function(strId) {
		return this.stringBundle().GetStringFromName(strId);
	},

	stringBundle: function() {
		if (this.__stringBundle == null) {
			var Cc = Components.classes;
			var Ci = Components.interfaces;
			var cls = Cc["@mozilla.org/intl/stringbundle;1"];
			var svc = cls.getService(Ci.nsIStringBundleService);
			this.__stringBundle = svc.createBundle(gConfig.messageURL);
			//return svc.createBundle(gConfig.messageURL);
		}
		return this.__stringBundle;
	},

	confirm: function(title, text) {
		var Cc = Components.classes;
		var Ci = Components.interfaces;
		var cls = Cc["@mozilla.org/embedcomp/prompt-service;1"];
		var svc = cls.getService(Ci.nsIPromptService);
		return svc.confirm(null, title, text);
	},

	__stringBundle: null	
};

// set the syntax colouring as specified in gConfig
gConfig.setSyntaxColour();
 
// set the paste replacements as specified in gConfig
// if the function does not exist in gConfig, use some reasonable default
if (gConfig.setPasteReplacements) {
	gConfig.setPasteReplacements();
} else {
	application.clearPasteReplacements();
	// remove all kind of directional markers
	application.addPasteReplacement("[\\x{200E}] ", "");
	application.addPasteReplacement("[\\x{200E}\\x{200F}\\x{2028}-\\x{202F}]", "");
}	

function open_xul_dialog(theUrl, theFeatures, theArguments)
{
	// try to get the window-watcher
	var ww    = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                 .getService(Components.interfaces.nsIWindowWatcher);
	if (!ww) {
		// no chance, give up
		return false;
	}

	// let's try to get a valid parent
	var theParent   = ww.activeWindow;

	var features = null;
	if (theFeatures != null) {
		features = theFeatures;		
	} else {
		// you may choose to remove some of the features
		// you may also want to specify width=xxx and/or height=xxx 
		features = "centerscreen,chrome,close,titlebar,resizable,modal,dialog=yes";		
	}
	
  	// check if theUrl is ok before ww.openWindow()
  	var theUri = theIOService.newURI(theUrl, null, null);
	var theDirAndFilenameXul = "\\" + theUri.scheme + "\\" + theUri.host + "\\"; 
	var index, indexStart = 1;	
	var indexEnd = theUri.path.lastIndexOf("/");
	var msg, subStr;
	var theDir = utility.getSpecialDirectory("BinDir");
	
	if (theDir) {
		theDir.append(theUri.scheme);
		theDir.append(theUri.host);
		for (index = 0; index<=indexEnd; ) {
			if (index == indexEnd) {
				if (!theDir.exists()) {
					msg = "\"" + theDirAndFilenameXul + "\"" + " " + gPicaUtility.getMessage("InValidPath");
					application.messageBox("Alert",msg, "alert-icon");
    				return false;
    		    }  
    		    subStr = theUri.path.substr(index +1, theUri.path.length-index-1);					
   		 		theDirAndFilenameXul = theDirAndFilenameXul + subStr;	
				theDir.append(subStr);
				index = theUri.path.length;
			} else {
				index = theUri.path.indexOf("/", indexStart);
				subStr = theUri.path.substr(indexStart, index-indexStart);
				theDirAndFilenameXul = theDirAndFilenameXul + subStr + "\\";
				theDir.append(subStr);
				indexStart = index +1;				
			}	
		}
		if (!theDir.exists()) {
			msg = "\"" + theDirAndFilenameXul + "\"" + " " + gPicaUtility.getMessage("FileCanNotBeFound");
			application.messageBox("Alert",msg, "alert-icon");
    		return false;
   		}
	}		

	// it doesn't matter, if we don't have a parent
	// we just use the active window, whether its null or not
	// Remark1: The following function will crash the application, when theUrl is meant for one non-existing XUL.
	// Remark2: That is why the checking is done before calling the openWindow function.
	ww.openWindow(theParent, theUrl, "", features, theArguments);
	
	// make sure WinIBW stays in the foreground
	application.activate();
} 
