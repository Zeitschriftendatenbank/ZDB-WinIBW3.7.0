//===================================================
// TableEditDlg.js
//
//===================================================

// Pull in the WinIBW application object:
var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

var currentFilename;

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

//---------------------------------------------------
function getSpecialDirectory(name)
{
	return Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties)
				.get(name, Components.interfaces.nsIFile);
}

//---------------------------------------------------
function insertLine(treechildren, strCol)
{
	var treeitem = document.createElement('treeitem');
	treechildren.appendChild(treeitem);
	var treerow = document.createElement('treerow');
	treeitem.appendChild(treerow);
	treerow.appendChild(document.createElement('treecell')).setAttribute('label', strCol);
}

//----------------------------------------------------------------------------
function loadFiles()
{
try {
	var arNames = new Array(); // Array to store the names of the files in the list

	// Get the user's datamasken:
	theDir = getSpecialDirectory("ProfD");

	theDir.append("datenmasken");
	if (theDir.exists()) {
		theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				for (found = false, i = 0; (i < arNames.length) && !found; i++) {
					found = (arNames[i] == theFile.leafName);
				}
				if (!found) arNames.push(theFile.leafName);
			}
		}
	}

    // Get the standard datamasken:
	theDir = getSpecialDirectory("BinDir");

	//theDir.append("defaults");
	theDir.append("datenmasken");
	if (theDir.exists()) {
		theDirEnum = theDir.directoryEntries;
		while (theDirEnum.hasMoreElements()) {
			var theItem = theDirEnum.getNext();
			var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
			if (theFile.isFile()) {
				for (found = false, i = 0; (i < arNames.length) && !found; i++) {
					found = (arNames[i] == theFile.leafName);
				}
				if (!found) arNames.push(theFile.leafName);
			}
		}
	}


	// sort the file names
	arNames.sort();

    // fill the datenmasken filenames into the list
    var theChildren = document.getElementById("theChildren");
	for (i = 0; i < arNames.length; i++) {
		insertLine(theChildren, arNames[i]);
	}

	arNames = null;
	document.getElementById("treecol1").setAttribute("flex", 6);

	document.getElementById("idTree").view.selection.select(0);
	document.getElementById("idTree").boxObject.scrollToRow(0);

	document.getElementById("idTree").focus();
    } catch(e) { alert('LoadFiles: '+ e.name + ': ' + e.message); }
}

//--------------------------------------------------------------------------------------------
function DatenmaskeEinfuegen()
{
	var theFileInput = utility.newFileInput();
	var thePrompter = utility.newPrompter();
	var antwort, dasKommando = "", kommandoTitel, kommandoNorm;
	var titel;
	var fileName = "\\datenmasken\\" + currentFilename;

	//Kommandos zum Eingeben von Titeln und Normdaten
	kommandoTitel = "\\inv 1"
	kommandoNorm = "\\inv 2"

	// Datenmaskendatei im Verzeichnis profiles\<user>\datenmasken oeffnen:
	if (!theFileInput.openSpecial("ProfD", fileName)) {
	    fileName = "\\datenmasken\\" + currentFilename;
	    if (!theFileInput.openSpecial("BinDir", fileName)) {
			alert("Datei " + currentFilename + " wurde nicht gefunden.");
			return;
		}
	}

	for (titel = ""; !theFileInput.isEOF(); ) {
		titel += theFileInput.readLine() + "\n"
	}
	theFileInput.close();

	var editing = (application.activeWindow.title != null);
	var Datentyp;
	
	strSystem = application.activeWindow.getVariable("system");
	if (strSystem == "ACQ" || strSystem == "OUS"|| strSystem == "OWC"){
		//wir sind im LBS:
		dasKommando  = "\\inv";
	}else {
		if ((Datentyp = titel.substr(0,4)) == "0500")
			dasKommando = kommandoTitel
		else if ((Datentyp = titel.substr(0,3)) == "005")
			dasKommando = kommandoNorm
		else if (!editing) {
			//wenn weder 0500 noch 005 vorkommt, muss er Benutzer nun entscheiden:
			antwort = thePrompter.select("Auswahl", "Leider konnte die WinIBW nicht erkennen," +
				"ob die Datenmaske für Titel oder Normdaten verwendet werden soll.\n" +
				"Bitte wählen Sie aus:", "Titeldaten\nNormdaten");
	
			if (!antwort) {
				// Benutzer hat den Dialog abgebrochen:
				return;
			}
			if (antwort == "Titeldaten")
				dasKommando = kommandoTitel
			else if (antwort == "Normdaten")
				dasKommando = kommandoNorm
		}
	}

	if (dasKommando == "") {
		// The data is inserted in the edit window at the cursor position.
		// The "++" is not removed (as in maskeEinfuegen), because the data already present
		// might contain this.
		application.activeWindow.title.endOfBuffer(false);
		maskeEinfuegen(titel);
		return;
	}

	//wenn editing = true, dann wird das Kommando in neuem Fenster ausgeführt
	application.activeWindow.command(dasKommando, editing);

	// Eingeben oder Abbruch, falls kein titleedit vorliegt:
	if (application.activeWindow.title) {
	    maskeEinfuegen(titel);
	}
	else {
		application.messageBox("Fehler", "Datenmaske kann nicht eingefügt werden!", "error-icon");
		return;
	}
}

//------------------------------------------------------------------------------------------------
function maskeEinfuegen(titel)
{
    //Datenmaske einfügen:
    var startP = application.activeWindow.title.selStart;
	application.activeWindow.title.insertText(titel);
	application.activeWindow.title.setSelection(startP, startP, false);
	var suchePlus = application.activeWindow.title.find("++", false, false, true);

	if (suchePlus == true){
		//Entfernen der Plusse, der Cursor bleibt hier stehen:
		application.activeWindow.title.deleteSelection();
	}
}

//--------------------------------------------------------------------------------------------------
function onSelectFile()
{
    var theTree = document.getElementById("idTree");
    currentFilename = theTree.view.getCellText(theTree.currentIndex, "treecol1");
    if (currentFilename == "") return;

	var theFile = getSpecialDirectory("ProfD");

	theFile.append("datenmasken");
	theFile.append(currentFilename);
	if (!theFile.exists()) {
	    var theFile = getSpecialDirectory("BinDir");
	//    theFile.append("defaults");
		theFile.append("datenmasken");
		theFile.append(currentFilename);
		if (!theFile.exists()) {
			alert("Datei" + currentFilename + " wurde nicht gefunden.");
		}
	}
}

//----------------------------------------------------------------------------
function onLoad()
{
	loadFiles();
}

//----------------------------------------------------------------------------
function onAccept()
{
    onSelectFile();
    DatenmaskeEinfuegen();
}

//----------------------------------------------------------------------------
function onCancel()
{
}
