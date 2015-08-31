/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW script functions for copying records
 *
 *************************************************************************************************
 *************************************************************************************************
 *	$Header$
 *	
 *	$Log$
 *	Revision 1.5  2005/06/22 08:37:28  hofmann
 *	we no longer switch NoviceMode on, when performing a title copy
 *	
 *	Revision 1.4  2005/03/18 09:59:19  hofmann
 *	check if title object is null
 *	
 *	Revision 1.3  2004/11/18 16:23:26  pica
 *	Fixed bug 1070: picaCopyRecord
 *	
 *	Revision 1.2  2004/11/10 11:05:31  hofmann
 *	implemented "picaCopyRecord" standard scripts; made WinIBW aware of current "systeem" and "bestand" (via "P3VSY" and "P3VBE")
 *	
 *	Revision 1.1  2004/11/10 09:57:18  hofmann
 *	added standard_copy.js
 *	
 *	
 **************************************************************************************************	
 */


function picaCopyRecord() {
	var bCodedData = application.activeWindow.codedData;
	
	application.activeWindow.codedData = false;
	application.activeWindow.noviceMode = false;
	    
    if (application.activeWindow.getVariable("scr") == "RF" || application.activeWindow.getVariable("scr") == "RB") {
            // external database             
             application.activeWindow.command("\\rem \\too " + gConfig.getFormat(), false);
	} else {
            // cbs database            
            application.activeWindow.command("\\too " + gConfig.getFormat(), false);          
	}
	
	application.activeWindow.copyTitle();

	var matCode = application.activeWindow.materialCode;
	var forceDocType = matCode.substr(0, 2);

	if (gConfig.needSystemSwitch()) {
		application.activeWindow.command("\\sys 1; \\bes 1", false);
	}
	
	application.activeWindow.materialCode = forceDocType;
	
	if (gPicaUtility.isAuthority(matCode)) {
		// insert authority
		application.activeWindow.command("\\inv 2", false);
	} else {
		// insert title
		application.activeWindow.command("\\inv 1", false);
	}
	
	if ((application.activeWindow.status == "OK") && (application.activeWindow.title != null)) {
		application.activeWindow.pasteTitle();
		if (bCodedData) {
			application.activeWindow.codedData = true
		}  
	}
}
