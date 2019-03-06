//===================================================
/* TableEditDlg.js
 Stand: 12.2014 
        Eric Helsper hat den Dialog nach meinen Vorgaben ueberarbeitet:
        - If a table file is renamed by changing the tag and/or description, 
          the old file is removed.
        - If the new tag/description results in a file name that already exists, 
          the file is not saved; a message is popped up.
        - function convertTableName(): Eric commented out the call to this function, 
          because Karen didn't want it and Eric also thinks it should not be default behavior. 
          But he also fixed the function so it will do nothing if there is no description, 
          in case it is re-enabled again.
*/

//===================================================

// Pull in the WinIBW application object:
var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);
const theIOService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
// Pull in the fileinput, fileoutput and prompter objects:
const utility = {
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
	}
};

var bTableDirty = false;
var strCurrentTable = "";
var strTableBeforeUpdate = "";
var dialogTitle = "";
var promptSaveChanges = "";
var promptDeleteTable = "";
var promptTagName = "";
var promptTagExists = "";
var promptTagEmpty = "";
var promptOverwrite = "";
var tableDescription = "";
var tableDescriptionMsg = "";
var arNames;


//---------------------------------------------------
function getSpecialDirectory(name)
{
	return Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties)
				.get(name, Components.interfaces.nsIFile);
}

//---------------------------------------------------
function onLoad()
{
    getTableNameList();
	getTableList();
	dialogTitle			= document.getElementById("dialogTitle").getAttribute("label");
	promptSaveChanges	= document.getElementById("promptSaveChanges").getAttribute("label");	
	promptDeleteTable	= document.getElementById("promptDeleteTable").getAttribute("label");	
	promptTagName		= document.getElementById("promptTagName").getAttribute("label");	
	promptTagExists		= document.getElementById("promptTagExists").getAttribute("label");	
	promptTagEmpty		= document.getElementById("promptTagEmpty").getAttribute("label");	
	promptOverwrite		= document.getElementById("promptOverwrite").getAttribute("label");	
	tableDescription    = document.getElementById("tableDescription").getAttribute("label");
	tableDescriptionMsg = document.getElementById("tableDescriptionMsg").getAttribute("label");	
	return true;	
}

//---------------------------------------------------
function getTableNameList()
{
    arNames = new Array();    

	var theDir = getSpecialDirectory("BinDir");
	theDir.append("tables");
	if (theDir.exists()) {
		var theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				var theName = theFile.leafName;
				if (theName.length >= 3) { 			        			        
		//	        if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}			 
						arNames.push(theName);
				}
			}
		}
	}

	var theDir = getSpecialDirectory("ProfD");
	theDir.append("tables");
	if (theDir.exists()) {
		var theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				var theName = theFile.leafName;   
			    if (theName.length >= 3) { 			        			        
		//	        if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}			 
						arNames.push(theName);
				}
			}
		}
	}

	arNames.sort();	
	var i;
	for (i = 0; i < arNames.length; i++) {
		// If you want file names to be converted to tag + description on winibw
		// startup, uncomment the next line. 
		// convertTableName(arNames[i]);
	}
//	arrNames = null;
}

//---------------------------------------------------
function getTableList()
{
//	var arNames = new Array();
    arNames = new Array();
    var theName;
    var theTable;

	var theDir = getSpecialDirectory("BinDir");
	theDir.append("tables");
	if (theDir.exists()) {
		var theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				theName = theFile.leafName;
				/*
				if (theName.length > 6 && theName.length < 9) {
					if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}
					arNames.push(theName);
				} */
				if (theName.length >= 3) { 			        			        
			        if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}			 
						arNames.push(theName);
				}
			}
		}
	}

	var theDir = getSpecialDirectory("ProfD");
	theDir.append("tables");
	if (theDir.exists()) {
		var theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				theName = theFile.leafName;
    /*            if ((theName.length > 6) && (theName.length < 9)) {
					if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}
					for (found = false, i = 0; (i < arNames.length) && !found; i++)
						found = (arNames[i] == theName);
					if (!found)  */				
			    if (theName.length >= 3) { 			        			        
			        if (theName.substr(-4) == ".tab") {	theName = theName.slice(0, -4);	}			 
						arNames.push(theName);
				}
			}
		}
	}

	// construct the combobox:
	arNames.sort();
	var theTableList = document.getElementById("mpTableList");
	while (theTableList.firstChild) { theTableList.removeChild(theTableList.firstChild); }
	var index = 0;
	for (i = 0; i < arNames.length; i++) {
		var menuitem = document.createElement("menuitem");	
	    theName = arNames[i]; 
	    theTable = arNames[i];	    




		menuitem.setAttribute("label", theName);  
		theTableList.appendChild(menuitem);	   
	    if (theTable == strCurrentTable) index = i;  
	} 
	document.getElementById("mlTables").selectedIndex = index; 
	onSelectTable();
//	arrNames = null;
}

//---------------------------------------------------
function PromptSaveTable()
{  
	if (bTableDirty) {
		var prompter = utility.newPrompter();
		rc = prompter.confirmEx(dialogTitle, promptSaveChanges.replace(/\$1/, strCurrentTable),
								"Yes", "Cancel", "No", "", false);
		if (rc == 1) { return false; }
		if (rc == 0) { cmdTableSave(true); }
		bTableDirty = false;
	}
	return true;
}

//---------------------------------------------------
function setElementFields(shortCut, textContent, textDescription)
{
	document.getElementById("tbElmShortcut").value = shortCut;
	document.getElementById("tbElmText").value = textContent;
	document.getElementById("tbElmDescription").value = textDescription;
}

//---------------------------------------------------
function Trim(sInString)
{
	sInString = sInString.replace( /^\s+/g, "" );// strip leading
	return sInString.replace( /\s+$/g, "" );// strip trailing
}

//---------------------------------------------------
function insertLine(treechildren, strCol1, strCol2, strCol3)
{
	var treeitem = document.createElement('treeitem');
	treechildren.appendChild(treeitem);
	var treerow = document.createElement('treerow');
	treeitem.appendChild(treerow);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', strCol1);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', strCol2);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', strCol3);
}

//---------------------------------------------------
function removeLines(treechildren)
{
	while (treeitem = treechildren.lastChild) {
		while (treerow = treeitem.lastChild) {
			while (treerow.lastChild) {
				treerow.removeChild(treerow.lastChild);
			}
			treeitem.removeChild(treerow);
		}
		treechildren.removeChild(treeitem);
	}
}

function getValidTableDescription(theTableDes)
{
    // convert/remove diacritics and other chars that cannot be in file names.

    return theTableDes
	.replace(/[\u00C0\u00C1\u00C2\u00C3\u00C5]/g,'A')
	.replace(/[\u00E0\u00E1\u00E2\u00E3\u00E5]/g,'a')
	.replace(/[\u00C8\u00C9\u00CA\u00CB]/g,'E')
	.replace(/[\u00E8\u00E9\u00EA\u00EB]/g,'e')
	.replace(/[\u00CC\u00CD\u00CE\u00CF]/g,'I')
	.replace(/[\u00EC\u00ED\u00EE\u00EF]/g,'i')
	.replace(/[\u00D2\u00D3\u00D4]/g,'O')
	.replace(/[\u00F2\u00F3\u00F4]/g,'o')
	.replace(/[\u00D9\u00DA\u00DB]/g,'U')
	.replace(/[\u00F9\u00FA\u00FB]/g,'u')
	.replace(/\u00C4/g,'Ae')
	.replace(/\u00E4/g,'ae')
	.replace(/\u00D6/g,'Oe')
	.replace(/\u00F6/g,'oe')
	.replace(/\u00DC/g,'Ue')
	.replace(/\u00FC/g,'ue')
	.replace(/\u00DF/g,'ss')
	.replace(/\u00C7/g,'C')
	.replace(/\u00E7/g,'c')
	.replace(/\u00C6/g,'Ae')
	.replace(/\u00E6/g,'ae')
	.replace(/[^a-z0-9-,\.;\(\)_ ]/gi,'-');


















}

//---------------------------------------------------
function convertTableName(strName)
{   
    var addTab = false;
    var addTableDes = false;
    
    if ((strName.substr(-4) == ".tab") && (strName.indexOf("_") >= 0)) return;	    
    if (strName.substr(-4) != ".tab") addTab = true;
    if (strName.indexOf("_") < 0) addTableDes = true;    
    
    var theDir;
    
    // Find the directory of the file with name "strName"
	var theFileInput = utility.newFileInput();  
	if (!theFileInput.openSpecial("ProfD", "\\tables\\" + strName)) {
		if (!theFileInput.openSpecial("BinDir", "\\tables\\" + strName)) {
			alert("File " + strName + ".tab" + " does not exist.");
			return false;
		} else { 
			theDir = "BinDir";
		}		
	} else {  
		theDir = "ProfD";
	} 		
    
    // Get the table description from table file
	var theLine;
	var strCurrDesc;
	while (!theFileInput.isEOF()) {
		theLine = theFileInput.readLine();
		if ((theLine.length > 4) && (theLine.substr(0, 4) == "<tt>")) {
			strCurrDesc = Trim(theLine.substr(4));			
		}
	}
	theFileInput.close();
	theFileInput = null; 
	
	strCurrDesc = getValidTableDescription(strCurrDesc);
	if (!strCurrDesc) return;
	
	// Copy the old file to the new one and remove the old one
	// The name of the new table file is with the form: tag + "_" + tableDescription + ".tab"
	theFileInput = utility.newFileInput();
	var theFileOutput = utility.newFileOutput();
	theFileInput.openSpecial(theDir, "\\tables\\" + strName);
	if ((addTableDes) && (addTab)) {	
		theFileOutput.createSpecial(theDir, "\\tables\\" + strName + (strCurrDesc ? ("_" + strCurrDesc) : "") + ".tab");
	} else if (addTableDes) {	   
		theFileOutput.createSpecial(theDir, "\\tables\\" + strName.slice(0, -4) + (strCurrDesc ? ("_" + strCurrDesc) : "") + ".tab");
	} else if (addTab) {
		theFileOutput.createSpecial(theDir, "\\tables\\" + strName + ".tab");
	}
	while (!theFileInput.isEOF()) {
		theLine = theFileInput.readLine();
		theFileOutput.writeLine(theLine);
	}

	theFileInput.remove();
	theFileOutput.close();
	theFileInput = null; 	
	theFileOutput = null; 	
}

//---------------------------------------------------
function loadTable(strName)
{
    deleteButton = document.getElementById("btnTblDelete");
	deleteButton.setAttribute("disabled", false);
	var theFileInput = utility.newFileInput();
	if (!theFileInput.openSpecial("ProfD", "\\tables\\" + strName + ".tab")) {
		if (!theFileInput.openSpecial("BinDir", "\\tables\\" + strName + ".tab")) {
			alert("File " + strName + ".tab" + " does not exist.");
			return false;
		}
		else {
			deleteButton.setAttribute("disabled", true);
		}
	}

	setElementFields("", "", "");
	
	var theChildren = document.getElementById("theChildren");
	var theText = "";
	var theLine;
	var colWidth1 = 10;
	var colWidth2 = 10;
	var colWidth3 = 10;
	removeLines(theChildren);
	while (!theFileInput.isEOF()) {
		theLine = theFileInput.readLine();
		if ((theLine.length > 5) && (theLine.substr(0, 5) == "<row>")) {
			theLine = theLine.substr(5);
			arrValues = theLine.split("QQ");
			if (arrValues.length > 0) {
				strCol1 = Trim(arrValues[0]);
				strCol2 = (arrValues.length > 1) ? Trim(arrValues[1]) : "";
				strCol3 = (arrValues.length > 2) ? Trim(arrValues[2]) : "";
				if (strCol1.length > colWidth1) colWidth1 = strCol1.length;
				if (strCol2.length > colWidth2) colWidth2 = strCol2.length;
				if (strCol3.length > colWidth3) colWidth3 = strCol3.length;
				insertLine(theChildren, strCol1, strCol2, strCol3);

			}
		}
		else if ((theLine.length > 4) && (theLine.substr(0, 4) == "<tt>")) {
			strCurrDesc = Trim(theLine.substr(4));
			var idx = strCurrDesc.indexOf('_');
			// Take the first part off, if it looks like a tag.
			if (idx >= 0 && idx <= 4 && parseInt(strCurrDesc.substr(0, idx)) > 0) {
			    strCurrDesc = strCurrDesc.substr(idx + 1);
			}
			document.getElementById("tbTableDescription").value = strCurrDesc;
		}
		else if ((theLine.length > 5) && (theLine.substr(0, 5) == "<tag>")) {
			document.getElementById("tbTableTagname").value = Trim(theLine.substr(5));
		}
	}
	document.getElementById("treecol1").setAttribute("flex", colWidth1);
	document.getElementById("treecol2").setAttribute("flex", colWidth2);
	document.getElementById("treecol3").setAttribute("flex", colWidth3);
	document.getElementById("idTree").view.selection.select(0);

	document.getElementById("tbElmShortcut").focus();

	theFileInput.close();
}

//---------------------------------------------------
function onSelectElement()
{
	var theTree = document.getElementById("idTree");
	if ((theTree.currentIndex < 0) || (theTree.currentIndex >= theTree.view.rowCount)) { return; };

	document.getElementById("btnMoveUp").setAttribute("disabled", (theTree.currentIndex == 0));
	document.getElementById("btnMoveDn").setAttribute("disabled", (theTree.currentIndex == theTree.view.rowCount-1));
	
	return;
}

//---------------------------------------------------
function onDblClick()
{
	var theTree = document.getElementById("idTree");
	if ((theTree.currentIndex < 0) || (theTree.currentIndex >= theTree.view.rowCount)) { return; };

	if (theTree.view.rowCount == 0) {
		setElementFields("", "", "");
		return;
	}
	var treeitem = document.getElementById("theChildren").firstChild;
	for (i = 0; i < theTree.currentIndex; i++) treeitem = treeitem.nextSibling;
	var treerow  = treeitem.firstChild;
	var theShortCut    = treerow.firstChild.getAttribute('label');
	var theText        = treerow.firstChild.nextSibling.getAttribute('label').replace(/\\r/g, "\n");
	var theDescription = treerow.lastChild.getAttribute('label');
	
	setElementFields(theShortCut, theText, theDescription);
	
	document.getElementById("btnMoveUp").setAttribute("disabled", (theTree.currentIndex == 0));
	document.getElementById("btnMoveDn").setAttribute("disabled", (theTree.currentIndex == theTree.view.rowCount-1));
	
	document.getElementById("tbElmShortcut").focus();
	return;
}

//---------------------------------------------------
function onSelectTable()
{   
	var theTableList = document.getElementById("mlTables");
	if (theTableList.selectedIndex < 0) { return; }
	
//	var tableName = Trim(theTableList.label); 
    var tableName = Trim(arNames[theTableList.selectedIndex]);
	if ((tableName) && (tableName != strCurrentTable)) { 
		PromptSaveTable();
		loadTable(tableName);
		strCurrentTable = tableName; 
		strTableBeforeUpdate = strCurrentTable;
	}
}

//---------------------------------------------------
function moveItem(bDown)
{
	var theTree = document.getElementById("idTree");
	var curIndex = theTree.currentIndex;
	
	if (bDown) {
		if (curIndex == theTree.view.rowCount - 1) return;
		newIndex = curIndex + 1;
	}
	else {
		if (curIndex <= 0) return;
		newIndex = curIndex - 1;
	}
	
	var treechildren = document.getElementById("theChildren");
	var treeitem = treechildren.firstChild;
	for (i = 0; i < curIndex; i++) treeitem = treeitem.nextSibling;

	var newitem = treeitem.cloneNode(true);
	if (bDown)
		treechildren.insertBefore(newitem, treeitem.nextSibling.nextSibling);
	else
		treechildren.insertBefore(newitem, treeitem.previousSibling);
	treechildren.removeChild(treeitem);

	
	theTree.view.selection.select(newIndex);
	theTree.boxObject.ensureRowIsVisible(newIndex);

	bTableDirty = true;
}

//---------------------------------------------------
function cmdUpdateElement()
{
	var theTree = document.getElementById("idTree");
	var theShortCut    = document.getElementById("tbElmShortcut").value;
	
	if (theShortCut == "0") {
		alert(document.getElementById("shortCutFieldWarning").getAttribute("label"));
		return;
	}
		
	var theText        = document.getElementById("tbElmText").value.replace(/\n/g, "\\r");

	if (theText == "0") {
		alert(document.getElementById("textFieldWarning").getAttribute("label"));
		return;
	}

	var theDescription = document.getElementById("tbElmDescription").value;

	if (theDescription == "0") {
		alert(document.getElementById("descriptionFieldWarning").getAttribute("label"));
		return;
	}

	var treechildren = document.getElementById("theChildren");
	var treeitem = treechildren.firstChild;
	if (!treeitem) {
		insertLine(treechildren, theShortCut, theText, theDescription);
		theTree.view.selection.select(0);
	}
	else {
		for (i = 0; i < theTree.currentIndex; i++) treeitem = treeitem.nextSibling;
		var treerow  = treeitem.firstChild;
		treerow.firstChild.setAttribute('label', theShortCut);
		treerow.firstChild.nextSibling.setAttribute('label', theText);
		treerow.lastChild.setAttribute('label', theDescription);
	}
	bTableDirty = true;
}

//---------------------------------------------------
function cmdInsertElement()
{
	var theTree = document.getElementById("idTree");
	var curIndex = theTree.currentIndex;
	if (theTree.view.rowCount == 0) curIndex = -1;
	var theShortCut    = document.getElementById("tbElmShortcut").value;
	
	if (theShortCut == "0") {
		alert(document.getElementById("shortCutFieldWarning").getAttribute("label"));
		return;
	}
	
	var theText = document.getElementById("tbElmText").value.replace(/\n/g, "\\r");

	if (theText == "0") {
		alert(document.getElementById("textFieldWarning").getAttribute("label"));
		return;
	}

	var theDescription = document.getElementById("tbElmDescription").value;

	if (theDescription == "0") {
		alert(document.getElementById("descriptionFieldWarning").getAttribute("label"));
		return;
	}

	var treechildren = document.getElementById("theChildren");
	var treeitem = treechildren.firstChild;
	var newitem = document.createElement('treeitem');
	if (!treeitem || (curIndex == theTree.view.rowCount-1))
		treechildren.appendChild(newitem);
	else {
		for (i = 0; i < curIndex; i++) treeitem = treeitem.nextSibling;
		treechildren.insertBefore(newitem, treeitem.nextSibling);
	}
	var treerow = document.createElement('treerow');
	newitem.appendChild(treerow);

	treerow.appendChild(document.createElement('treecell')).setAttribute('label', theShortCut);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', theText);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', theDescription);

	if (curIndex++ >= theTree.view.rowCount) curIndex = theTree.view.rowCount - 1;
	theTree.view.selection.select(curIndex);
	theTree.boxObject.ensureRowIsVisible(curIndex);

	setElementFields("", "", "");
	document.getElementById("tbElmShortcut").focus();
	
	bTableDirty = true;
}

//---------------------------------------------------
function cmdDeleteElement()
{
	var theTree = document.getElementById("idTree");
	var curIndex = theTree.currentIndex;
	
	var treechildren = document.getElementById("theChildren");
	var treeitem = treechildren.firstChild;
	for (i = 0; i < curIndex; i++) treeitem = treeitem.nextSibling;
	var treerow  = treeitem.firstChild;
	while (treerow.firstChild) treerow.removeChild(treerow.firstChild);
	treeitem.removeChild(treerow);
	treechildren.removeChild(treeitem);
	
	if (curIndex >= theTree.view.rowCount) curIndex = theTree.view.rowCount - 1;
	theTree.view.selection.select(curIndex);

	bTableDirty = true;
}

//---------------------------------------------------
function TagExists(theTag)
{
	var theFile = getSpecialDirectory("ProfD");
	theFile.append("tables");
	theFile.append(theTag + ".tab");
	return theFile.exists();
}

//---------------------------------------------------
function TableExists(theTag, theTableDes)
{
	var theFile = getSpecialDirectory("ProfD");
	theFile.append("tables");
	theFile.append(theTag + (theTableDes ? ("_" + theTableDes) : "") + ".tab");
	return theFile.exists();
}

//---------------------------------------------------
function TagIsValid(theTag)
{
//	return /^[0-9xX]{2,3}[0-9a-zA-Z@]$/.test(theTag);
	
	var ret = (/^[0-9xX]{2,3}[0-9a-zA-Z@]$/.test(theTag)) || (/^[MLC][0-9xX]{1,2}[0-9a-zA-Z@]$/.test(theTag));
	return ret;
}

//---------------------------------------------------
function TablenameIsValid(theTableDes)
{
//    alert(/^[0-9a-zA-Z]$/.test(theTableDes));
//    return /^[0-9a-zA-Z]$/.test(theTableDes);
    var len = theTableDes.length;
    for (var i=0; i<len; i++) {
		switch (theTableDes.charAt(i)) {
			case "\\": 
			case "/":  
			case ":": 		
			case "*": 
			case "?": 
			case "\"": 
			case "<": 
			case ">": 
			case "|": {
			    alert("Character: " + "\\,  /,  :,  *,  ?,  \",  <,  >,  |, " + tableDescriptionMsg);
				return false; 				
			};	break;
			default: break;	
		}
	}					
    return true;
}

//---------------------------------------------------
function cmdTableNew()
{
    var theTag;
	var prompter = utility.newPrompter();
	do {
		if (!prompter.prompt(dialogTitle, promptTagName, "", "", "")) 
			return;
		theTag = prompter.getEditValue();
		if (theTag == "") return;
	} while (!TagIsValid(theTag));
	
	/*
	if (TagExists(theTag)) {
			prompter.alert(dialogTitle, promptTagExists.replace(/\$1/, theTag));
			return;
	}  */
	
	var theTableDes;
	prompter = utility.newPrompter();		
	do {
		if (!prompter.prompt(dialogTitle, tableDescription, "", "", "")) 
			return;
		theTableDes = prompter.getEditValue();

	} while (!TablenameIsValid(theTableDes));
	
	PromptSaveTable();
	strCurrentTable = theTag;
	document.getElementById("tbTableTagname").value = theTag;
	document.getElementById("tbTableDescription").value = Trim(theTableDes);
	
	if (TableExists(theTag, theTableDes)) {
	        var tableName = theTag + (theTableDes ? ("_" + theTableDes) : "") + ".tab"; 
			prompter.alert(dialogTitle, promptTagExists.replace(/\$1/, tableName));
			strCurrentTable = theTag + (theTableDes ? ("_" + theTableDes) : "");;
			return;
	}
	
	removeLines(document.getElementById("theChildren"));
	setElementFields("", "", "");
	cmdTableSave(false);
//	getTableList();

	document.getElementById("tbTableDescription").focus();
}

//---------------------------------------------------
function cmdTableSave(needReplace)
{
	if (strCurrentTable == "") return;

	var theTree = document.getElementById("idTree");
	
	var theDir = getSpecialDirectory("ProfD");
	if (theDir) {
		theDir.append("tables");
		if (!theDir.exists()) {
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Error creating directory " + theDir.path);
				return;			
			}
		}
	} 
	
	var theTag;
	var tableName = strCurrentTable;
	var theTableDes = document.getElementById("tbTableDescription").value; 	
	theTableDes = getValidTableDescription(Trim(theTableDes));

	if (strCurrentTable.slice(0, -4) == ".tab") tableName = strCurrentTable.slice(0, -4);
	    var ind = tableName.indexOf("_");
	    if (ind < 0) {	    
			theTag = tableName;
	    } else {
			theTag = tableName.substr(0, ind);
	    }
	strCurrentTable	= theTag + (theTableDes ? ("_" + theTableDes) : "");

    var newContents = "<tbl>";
	newContents += "\n<tt> " + document.getElementById("tbTableDescription").value;
	newContents += "\n<dt> " + strCurrentTable + ".tab";
	newContents += "\n<tag> " + document.getElementById("tbTableTagname").value;
	for (i = 0; i < theTree.view.rowCount; i++) {
		newContents += "\n<row> " + theTree.view.getCellText(i, "treecol1");
		newContents += " QQ " + theTree.view.getCellText(i, "treecol2");
		newContents += " QQ " + theTree.view.getCellText(i, "treecol3");
	}
	newContents += "\n</tbl>";	
    // Create a new table

	if (strCurrentTable != strTableBeforeUpdate && TagExists(strCurrentTable)) {
		// Prevent a change/removal of description to overwrite an existing file

		utility.newPrompter().alert(dialogTitle,
			promptTagExists.replace(/\$1/, strCurrentTable + '.tab'));
		return;
	}


	var theFileOutput = utility.newFileOutput(); 	
	theFileOutput.createSpecial("ProfD", "\\tables\\" + strCurrentTable + ".tab");
	theFileOutput.setTruncate(true);
	theFileOutput.write(newContents);	
	theFileOutput.close();
	theFileOutput = null;

	if (needReplace == true) { 
		if (strCurrentTable != strTableBeforeUpdate) {		

			// Remove the old table
			theFileOutput = utility.newFileOutput(); 		
			theFileOutput.createSpecial("ProfD", "\\tables\\" + strTableBeforeUpdate + ".tab");
			theFileOutput.remove();	
			theFileOutput = null;
		}	
	}	

    strTableBeforeUpdate = strCurrentTable;
	document.getElementById("btnTblDelete").setAttribute("disabled", false);
	
	bTableDirty = false;
	getTableList();
}


function cmdTableSaveAs()
{
	var prompter = utility.newPrompter();
	if (!prompter.prompt(dialogTitle, promptTagName, "", "", "")) 
		return;
	var theTag = prompter.getEditValue();
	strCurrentTable = theTag;
	/*
	if (TagExists(theTag)) {
			prompter.alert(dialogTitle, promptTagExists.replace(/\$1/, theTag));
			return;
	} */

	prompter = utility.newPrompter();	
	var theTableDes;
	do {
		if (!prompter.prompt(dialogTitle, tableDescription, "", "", "")) 
			return;
		theTableDes = prompter.getEditValue();

	} while (!TablenameIsValid(theTableDes));

	document.getElementById("tbTableTagname").value = theTag;
	document.getElementById("tbTableDescription").value = Trim(theTableDes);
	
	if (TableExists(theTag, theTableDes)) {
	        var tableName = theTag + (theTableDes ? ("_" + theTableDes) : "") + ".tab"; 
			prompter.alert(dialogTitle, promptTagExists.replace(/\$1/, tableName));
			strCurrentTable = theTag + (theTableDes ? ("_" + theTableDes) : "");
			return;
	}
	
	cmdTableSave(false);
//	getTableList();
}
//---------------------------------------------------
function cmdTableDelete()
{
    if (strCurrentTable == "") return;
	
	var theFile = getSpecialDirectory("ProfD");
	theFile.append("tables");
	theFile.append(strCurrentTable + ".tab");
	if (theFile.exists()) {
		var prompter = utility.newPrompter();
		if (!prompter.confirm(dialogTitle, promptDeleteTable.replace(/\$1/, strCurrentTable + ".tab"))) {
			return;
		}
		theFile.remove(false);
		strCurrentTable = "";
		bTableDirty = false;
		getTableList();
	}
}

//---------------------------------------------------
function cmdSort(col)
{
	var theTree = document.getElementById("idTree");
	var view = theTree.view;
	var arr = new Array();
	
	for (i = 0; i < theTree.view.rowCount; i++) {
		if (col == 1) 
			txt = view.getCellText(i, "treecol1") + "\n" +
				  view.getCellText(i, "treecol2") + "\n" +
				  view.getCellText(i, "treecol3");
		else
			txt = view.getCellText(i, "treecol2") + "\n" +
				  view.getCellText(i, "treecol1") + "\n" +
				  view.getCellText(i, "treecol3");
		arr.push(txt);
	}
	arr.sort();

	var children = document.getElementById("theChildren");
	removeLines(children);

	for (i = 0; i < arr.length; i++) {
		txts = arr[i].split("\n");
		if (col == 1)
			insertLine(children, txts[0], txts[1], txts[2]);
		else
			insertLine(children, txts[1], txts[0], txts[2]);
	}
	theTree.view.selection.select(0);
	arr = null;
}

//---------------------------------------------------
function onAccept()
{
	return PromptSaveTable();
}

//---------------------------------------------------
function onCancel()
{
	return PromptSaveTable();
}

//-------------------------------------------------------------------------
function adjustTableDescription(value)
{
	var theTableDes = getValidTableDescription(Trim(value));

	var tableName = strCurrentTable;
	if (strCurrentTable.slice(0, -4) == ".tab") {
		tableName = strCurrentTable.slice(0, -4);
	}	
	
	var theTag; 
	var ind = tableName.indexOf("_"); 	
	if (ind < 0) {	    
		theTag = tableName;
	} else {
		theTag = tableName.substr(0, ind);
	}
	
	strCurrentTable	= theTag + (theTableDes ? ("_" + theTableDes) : "");
	
	if(strCurrentTable != strTableBeforeUpdate) bTableDirty = true;
}

//-------------------------------------------------------------------------
function adjustTableTag(value)
{
	var tableName = strCurrentTable;
	if (strCurrentTable.slice(0, -4) == ".tab") {
		tableName = strCurrentTable.slice(0, -4);
	}
	var ind = tableName.indexOf("_");
	var theTableDes;
	if (ind < 0) {	    
		theTableDes = "";
	} else {
		theTableDes = tableName.substr(ind+1, tableName.length-ind+1);
	}
	strCurrentTable	= value + (theTableDes ? ("_" + theTableDes) : "");
	
	if(strCurrentTable != strTableBeforeUpdate) bTableDirty = true;
}

function wikiWinibw(){
	application.shellExecute ("http://www.gbv.de/wikis/cls/WinIBW3:Textbausteine_der_WinIBW3.7", 5, "open", "");	
}
