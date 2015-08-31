/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW script functions for adding number and language-code
 *
 *************************************************************************************************
 */		 					
 var selectedNumber = 0;				// selected number in nameCodesArray
 var selectedSourceCode = "";	   // selected sourceCode in nameCodesArray
 var dataFilename = "number_languagecode.txt";   // the file for storing number and languagecode, which is in the directory /profiles/user-name/transliterate
 

const unicodeUtility =
{
    add_numberLanCode: function(tag, nr_sourceCode) {
   
         application.activeWindow.title.startOfField(false); 
         application.activeWindow.title.charRight(tag.length+1, false);
         application.activeWindow.title.insertText(nr_sourceCode);
         
         application.activeWindow.title.lineDown(1, false);
         application.activeWindow.title.startOfField(false);         
    } , 
     
   readSavedDataFromFile: function() {
        var theFileInput = utility.newFileInput();
            
        // ProfD is the mozilla definition of the location where user profile is located.   
    	if (!theFileInput.openSpecial("ProfD", "\\transliterate\\" + dataFilename)) {
 		//		application.messageBox("Alert", gPicaUtility.getMessage("AddNumberAndCode"), "alert-icon");
    			return false;
    	}
    		
    	for (var i=0; i<2; i++) {
    	   switch (i) {
    	       	case 0:  selectedNumber = theFileInput.readLine();  break;	
    			case 1:  selectedSourceCode = theFileInput.readLine();  break;    			
    			default: break;	
    		}	
    	}
        
        theFileInput.close();  
	return true;	
    }
};        

function addNumberLanguageCode()
{
	open_xul_dialog("chrome://ibw/content/xul/addNumberLanguagecode_dialog.xul", null);
}

function __addNumberLanguageCode()
{
	return __isDBaseSelected();    
}


// The function is to repeat addNumberLanguagecode process with saved data
function repeatAddNumberLanguagecode()
{  
	if (!application.activeWindow.title) {
		application.messageBox("Alert",gPicaUtility.getMessage("MustBeEditing"), "alert-icon"); 
		return;
	}	
	
	// read the saved number and languagecode from the file "number_languagecode.txt"
	if (!unicodeUtility.readSavedDataFromFile()) {
	    addNumberLanguageCode(); 
		return;		
	}
	
    // set the start point of the selected texts   
    var positionStart = application.activeWindow.title.selStart;
      
    // set the end point of the selected texts
    var positionEnd = application.activeWindow.title.selEnd;
    application.activeWindow.title.setSelection(positionEnd, positionEnd, "false");
    var lineNrEnd = application.activeWindow.title.currentLineNumber;
      
    // preparation for adding number and Languagecode for each line
    application.activeWindow.title.setSelection(positionStart, positionStart, "false");
    var curTag;
    var lineNrCurrent; 
    
    // get transSyntax, transPrefix, transCenter, transSuffix
    __getSyntaxType();
     
    // add number and Languagecode for each line  
    do {
         curTag = application.activeWindow.title.tag;
         lineNrCurrent  = application.activeWindow.title.currentLineNumber; 
         
         if ((lineNrCurrent >= lineNrEnd) && (curTag == "")) {            
			return;
		 }	
         
         // if line is empty, only move cursor one line down         
         if (curTag == "") {
		 		 
     		if (lineNrCurrent >= lineNrEnd) {
     		// if the empty line at the end, do not perform further
     			break;
			}			
			application.activeWindow.title.lineDown(1, false);          
 	     } else {
			numberSourceCode = transPrefix + selectedNumber + transCenter + selectedSourceCode + transSuffix;
   			unicodeUtility.add_numberLanCode(curTag, numberSourceCode); 
		 }                  
     }  while (lineNrCurrent < lineNrEnd)
          
     // set the cursor at the beginning of the next line after adding
     application.activeWindow.title.startOfBuffer(false);
     application.activeWindow.title.lineDown(lineNrEnd-1, false);
     while (application.activeWindow.title.tag == "") {
		application.activeWindow.title.lineUp(1, false); 
	 }	
	 application.activeWindow.title.lineDown(1, false);
	 application.activeWindow.title.startOfField(false);   
     if (application.activeWindow.title.getRTLEnabled() == false) { 
		application.switchRTL ();
	 } 
	 application.activeWindow.title.refresh();       
}

function __repeatAddNumberLanguagecode()
{
    return __isInEditMode();	
}

