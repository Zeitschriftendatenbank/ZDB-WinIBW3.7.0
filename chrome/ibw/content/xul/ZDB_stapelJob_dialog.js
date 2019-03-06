//============================================================================
// stapelJob_dialog.js
//============================================================================
// Erstellt: GBV, Karen Hachmann 
//============================================================================

var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

var theDir;
var currentFilename = "";
var uploadPfad;

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
function loadFiles()
{
try {
	var arNames = new Array(); // Array to store the names of the files in
	//Verzeichnis upload wird angelegt:
	theDir = getSpecialDirectory("ProfD");
	if (theDir) {
		theDir.append("upload");
		if (!theDir.exists()) {
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Verzeichnis konnte nicht angelegt werden: " + theDir.path);
				return;
			}
		}
	}
	

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
	
	arNames.sort();
	document.getElementById("idLabelPfad").value= theDir.path;
	if(arNames.length == 0){
		document.getElementById("idLabelDateien").hidden=false;
		document.getElementById("idLabelDateien").value="Keine Dateien gefunden!";
	}
	//nur Dateien mit Endung .txt und .asc bleiben:
	for (i = 0; i < arNames.length; i++) {
		//alert(i + " von " + arNames.length + ": " + arNames[i]);
		if (arNames[i].slice(-4) != ".asc" && arNames[i].slice(-4) != ".txt" && arNames[i].slice(-4) != ".ASC" && arNames[i].slice(-4) != ".TXT"){
			//alert(arNames[i] + " wird entfernt");
			arNames.splice(i, 1);
			i--; //Zähler minus 1, ansonsten wird nach dem Löschen eines Kettengliedes das nächste übersprungen
		}
	}
	
	var theFileList = document.getElementById("idFileList");
	for (i = 0; i < arNames.length; i++) {
		var theEle = document.createElement("menuitem");
		theEle.setAttribute("label", arNames[i]);
		theEle.setAttribute("value", arNames[i]);
		theFileList.appendChild(theEle);
	}
	document.getElementById("idFileListMenu").selectedIndex = 0;
	arNames = null;
} catch(e) { alert('loadFiles: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function onLoad()
{
	loadFiles();
	document.getElementById("idRadioAktion").selectedIndex = 0;
}

//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
function onCancel()
{
	return true
}
// globale Variable:
var lZaehler;
var theFileInput = utility.newFileInput();
// Ende globale Variable:
//----------------------------------------------------------------------------
function startAktion()
{
	var fileName = "\\upload\\" + document.getElementById('idFileListMenu').value; //vom Benutzer ausgewählte Datei
	var aktion = document.getElementById("idRadioAktion").selectedIndex; //gibt 0 bis 2 aus
	var theLine;
	lZaehler = 0;

	//wenn mehrmals ausgeführt, bei Klick auf Start-Button zurücksetzen:
	document.getElementById("idSchlussmeldung1").value = "";
	document.getElementById("idSchlussmeldung2").value = "";
	
	if (!theFileInput.openSpecial("ProfD", fileName)) {
			application.messageBox("Datei suchen","Datei " + fileName + " wurde nicht gefunden.", "error-icon");
			return;
	}
	
	switch (aktion){
		case 0:
			sucheIDs("IDN");
			break;
		case 1: 
			sucheIDs("EID");
			break;
		case 2: 
			while (!theFileInput.isEOF()) {
				theLine = theFileInput.readLine();
				application.activeWindow.command(theLine, false);
				lZaehler++;
			}
		break;
	}
	theFileInput.close();
	//Reviewanzeige:
	application.activeWindow.command("r", false);
	document.getElementById("idSchlussmeldung1").value = "In Ihrer Datei wurden  " + lZaehler + " Zeilen gelesen."
}
//----------------------------------------------------------------------------
function sucheIDs(typID){
	var alleID = new Array();
	var teilmengeID = new Array();
	var theLine;
	var i=0, setnr = 0;
	lZaehler = 0;
	
	//alle IDs in Datei lesen:
	while (!theFileInput.isEOF()) {
		theLine = theFileInput.readLine();
		alleID[lZaehler] = theLine;
		lZaehler++;
	}
	if (lZaehler > 25000){
		alert("Diese Aktion ist auf 20000 " + typID + "s begrenzt. \nIhre Datei enthält " + lZaehler + " " + typID + "s.");
		return;
	}
	//Die Suche wird in Blöcke von 250 aufgeteilt:
	while (alleID.length > 0){
		teilmengeID = alleID.slice(i, i+250);
		alleID.splice(i, i+250);
		setnr++;
		application.activeWindow.command("f " + typID + " " + teilmengeID.join(" or "), false);
	}
	document.getElementById("idSchlussmeldung2").value = "Die " + typID + "s wurden in " + setnr + " Sets von max. 250 Datensätzen gesucht.";
}
//----------------------------------------------------------------------------

function fehlerDateiSpeichern()
{
try {
	if (currentFilename == "") return;
	
	// Get the user's profile subdirectory for the upload, and create if
	// if necessary:
	var theDir = getSpecialDirectory("ProfD");
	if (theDir) {
		theDir.append("upload");
		if (!theDir.exists()) {
			// the directory doesn't exist yet, create it
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Verzeichnis für upload konnte nicht erstellt werden!");
				return;			
			}
		}
	}

	// Get the new contents from the edit control:
	var newContents = document.getElementById('idFileEdit70xx').value + "\n" +
					document.getElementById('idFileEdit').value;
	// Open (or create) the output file in the user's profile directory, 
	// and store the new contents:
	var theFileOutput = utility.newFileOutput();
	theFileOutput.createSpecial("ProfD", "\\upload\\" + currentFilename);
	theFileOutput.setTruncate(true);
	theFileOutput.write(newContents);
	
	bContentsChanged = false;
	
	theFileOutput.close();
	theFileOutput = null;
	//document.getElementById('idSaveMsg').value = currentFilename + " gespeichert.";
	return true;
} catch(e) { alert('** '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------

function datumHeute()
{
	//das Datum und die Uhrzeit wird Bestandteil des Dateinamens
	var jetzt = new Date();
	var jahr = jetzt.getFullYear();
	
	var monat = jetzt.getMonth();
	monat = monat + 1;
	if (monat <10){monat = "0" + monat};
	
	var strTag = jetzt.getDate();
	if (strTag <10){strTag = "0" + strTag}; 
	
	var stunde = jetzt.getHours();
	if (stunde <10){stunde = "0" + stunde};
	
	var minute = jetzt.getMinutes();
	if (minute <10){minute = "0" + minute};
	
	var sekunde = jetzt.getSeconds();
	if (sekunde <10){sekunde = "0" + sekunde};
	
	//Dateiname:
	return jahr + "_" + monat + "_" + strTag + "_" + stunde + "_" + minute + "_" + sekunde;
	
}

function fehlerDateiAnlegen()
{
	//Fehlerdatei wird angelegt:
	var theFileOutput = utility.newFileOutput();
	//relativer Pfad + Dateiname:
	var dieFehlerdatei = "upload\\fehlerprot_" + datumHeute() + ".txt";
	//Datei wird angelegt:
	theFileOutput.createSpecial("ProfD", dieFehlerdatei);
	//uploadPfad als String:
	uploadPfad = theFileOutput.getSpecialPath("ProfD", dieFehlerdatei);
	//alert(uploadPfad);
	theFileOutput.write(strfehlerMeldungen, strfehlerMeldungen.length);
	
	//am Ende Fehlerdatei schließen:
	theFileOutput.close();
	theFileOutput = null;
}

function fehlerDateiOeffnen()
{
	application.shellExecute (uploadPfad, 5, "open", "");
}