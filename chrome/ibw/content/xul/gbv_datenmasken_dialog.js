//============================================================================
// datenmasken_dialog.js
//
// Maintenance dialog for Datenmasken (GBV / BSZ specific).
// Dialog is implemented in datenmasken_dialog.xul, and called from
// scripts/datenmasken.js.
//
// Anpassung GBV: Wir speichern die Datenmasken nicht in .../defaults/datenmasken
//               sondern direkt unterhalb des WinIBW3-Verzeichnisses
//============================================================================



var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

var currentFilename = "";
var bContentsChanged;
var dialogTitle = "";
var theFileName = "";
var currentIndex = 0;

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
	}
};

//----------------------------------------------------------------------------
function getSpecialDirectory(name)
{
	const nsIProperties = Components.interfaces.nsIProperties;
    var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
    					.getService(nsIProperties);

    return dirService.get(name, Components.interfaces.nsIFile);
}

//----------------------------------------------------------------------------
function loadFileByName()
{
try {
	var theList = document.getElementById('idFileListMenu');
	var theFileInput = utility.newFileInput();

    // BinDir is the mozilla definition of the location where WinIBW is installed.
    // ProfD is the mozilla definition of the location where user profile is located.
    // e.g. C:\Documents and Settings\uwsername\Application Data\OCLC\WinIBW30
	if (!theFileInput.openSpecial("ProfD", "\\datenmasken\\" + theList.value)) {
		if (!theFileInput.openSpecial("BinDir", "\\datenmasken\\" + theList.value)) {
			alert("Datei " + theList.value + " wurde nicht gefunden.");
			return;
		}
	}

	var theFileContent;
	for (theFileContent = ""; !theFileInput.isEOF(); ) {
		theFileContent += theFileInput.readLine() + "\n"
	}

	document.getElementById('idFileEdit').value = theFileContent;
	theFileInput.close();
	theFileInput = null;
	currentFilename = theList.value;
	document.getElementById('idSaveMsg').value = " ";
    } catch(e) { alert('loadFileByName: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function loadFiles()
{
try {
	var arNames = new Array(); // Array to store the names of the files in

	// Get the directory with default datenmasken:
	var theDir = getSpecialDirectory("BinDir");
	//theDir.append("defaults");
  	theDir.append("datenmasken");
	if (!theDir.exists()) {
		alert("Die Standard-Datenmasken wurden nicht gefunden.")
		return;
	}

	var theDirEnum = theDir.directoryEntries;
	while (theDirEnum.hasMoreElements()) {
		var theItem = theDirEnum.getNext();
		var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
		if (theFile.isFile()) arNames.push(theFile.leafName);
	}

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
	arNames.sort();
	var theFileList = document.getElementById("idFileList");
	//update FileListMenu with removing all old stofs
	while (theFileList.firstChild) { theFileList.removeChild(theFileList.firstChild); }
	for (i = 0; i < arNames.length; i++) {
		var theEle = document.createElement("menuitem");
		theEle.setAttribute("label", arNames[i]);
		theEle.setAttribute("value", arNames[i]);
		theFileList.appendChild(theEle);
		if (arNames[i] == currentFilename){
		    currentIndex = i;
		}
	}

	document.getElementById("idFileListMenu").selectedIndex = currentIndex;
	loadFileByName();
	arNames = null;
    } catch(e) { alert('LoadFiles: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function onLoad()
{
	loadFiles();
    bContentsChanged = false;
}

//----------------------------------------------------------------------------
function onAccept()
{
	FrageSpeichern();
}

//----------------------------------------------------------------------------
function onCancel()
{
	FrageSpeichern();
}

//----------------------------------------------------------------------------
function FrageSpeichern()
{
	if (bContentsChanged) {
		var prompt = utility.newPrompter();
		prompt.setDebug(true);
		if (prompt.confirmEx("Speichern?", "Änderungen in " + currentFilename
							+ " speichern?", "Yes", "No", "", "", false) == 0) {
			DatenmaskeSpeichern(false);
		}
		bContentsChanged = false;
	}
}

//---------------------------------------------------
function onSelectFile()
{
    var theList = document.getElementById('idFileListMenu');
    if (theList.value != currentFilename)
    	FrageSpeichern();
    currentFilename = theList.value;
	if (currentFilename == "") return;

	var theFile = getSpecialDirectory("ProfD");

	theFile.append("datenmasken");
	theFile.append(currentFilename);

	document.getElementById("fileDelete").setAttribute("disabled", (!theFile.exists()));

	loadFileByName();
}

//----------------------------------------------------------------------------
function DatenmaskeSpeichern(isEditAreaEmpty)
{
try {
	if (currentFilename == "") return;

	// Get the user's profile subdirectory for the datenmasken, and create if
	// if necessary:
	var theDir = getSpecialDirectory("ProfD");
	if (theDir) {

		theDir.append("datenmasken");
		if (!theDir.exists()) {
			// the directory doesn't exist yet, create it
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Verzeichnis für Datenmasken konnte nicht erstellt werden!");
				return;
			}
		}
	}

	// Get the new contents from the edit control if there is:
	var newContents;
	if (isEditAreaEmpty){
	    newContents = "";
	} else {
	    newContents = document.getElementById('idFileEdit').value;
	}
	// Open (or create) the output file in the user's profile directory,
	// and store the new contents:
	var theFileOutput = utility.newFileOutput();
	theFileOutput.createSpecial("ProfD", "\\datenmasken\\" + currentFilename);
	theFileOutput.setTruncate(true);
	theFileOutput.write(newContents);

	bContentsChanged = false;

	theFileOutput.close();
	theFileOutput = null;
	document.getElementById('idSaveMsg').value = currentFilename + " gespeichert.";
    } catch(e) { alert('** '+ e.name + ': ' + e.message); }
}

//---------------------------------------------------------
function makeFileNameValid()
{
    // check if the file name is *.txt
    // if no, append .txt to it
    if (theFileName.lastIndexOf(".txt") == -1){
        theFileName = theFileName + ".txt";
    }
}

//---------------------------------------------------
function fileExists()
{
	var theFile = getSpecialDirectory("ProfD");

	theFile.append("datenmasken");
	theFile.append(theFileName);
	return theFile.exists();
}

//---------------------------------------------------
function cmdDatenmaskeFileNew()
{
	// Save changes, if any
    FrageSpeichern();

    // Get the new and valid file name for datenmasken
	var prompter = utility.newPrompter();
	dialogTitle = "Neue Datenmaske";
	promptTagName = "Bitte geben Sie einen Namen ein:";

	theFileName = "";
	while (theFileName == "") {
		if (!prompter.prompt(dialogTitle, promptTagName, "", "", ""))
			return;
		theFileName = prompter.getEditValue();
		if (theFileName == "") return;

		// Check if the given file name exists already
	    makeFileNameValid();
		if (fileExists()) {
			var msg = "Die Datei '" + theFileName + "' besteht bereits. Bitte wählen Sie einen andere Namen.";
			prompter.alert(dialogTitle, msg);
			    theFileName = "";
		}
	}
	currentFilename = theFileName;
	// Save an empty file with the new name
	DatenmaskeSpeichern(true);
	loadFiles();
}

//---------------------------------------------------
function cmdDatenmaskeFileSaveAs()
{
	// get the file name to be saved as
	var prompter = utility.newPrompter();
	dialogTitle = "Speichern unter";
	var promptTagName = "Bitte geben Sie einen Namen ein:";

	theFileName = "";
	while (theFileName == "") {
		if (!prompter.prompt(dialogTitle, promptTagName, "", "", ""))
			return;
		theFileName = prompter.getEditValue();
		if (theFileName == "") return;

		// Check if the given file name exists already
		makeFileNameValid();
		if (fileExists()) {
			var msg = "Die Datei '" + theFileName + "' besteht bereits. Bitte wählen Sie einen andere Namen.";
		    prompter.alert(dialogTitle, msg);
		    theFileName = "";
		}
	}
	currentFilename = theFileName;
	DatenmaskeSpeichern(false);
    loadFiles();
    document.getElementById('idSaveMsg').value = currentFilename + " gespeichert.";
}

//---------------------------------------------------
function cmdDatenmaskeFileDelete()
{
    // get the to be deleted file from fileListMenu
    var theList = document.getElementById('idFileListMenu');
    currentFilename = theList.value;
	if (currentFilename == "") return;

	// check if the to be deleted file may be deleted? (The file must be in the user's directory!)
	// if yes, delete it and update fileListMenu. Otherwise, do nothing
	var theFile = getSpecialDirectory("ProfD");

	theFile.append("datenmasken");
	theFile.append(currentFilename);
	dialogTitle = "Datei löschen";
	if (theFile.exists()) {
		var prompter = utility.newPrompter();
		if (!prompter.confirm(dialogTitle, "Möchten Sie die Datei '" + currentFilename + "' wirklich löschen?")) {
			return;
		}
		theFile.remove(false);
		currentFilename = "";
		loadFiles();
	}
}
