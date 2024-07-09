//============================================================================
// exemplarmasken_dialog.js
//
// Maintenance dialog for Exemplarmasken (GBV specific).
// Dialog is implemented in exemplarmasken_dialog.xul, and called from
// scripts/gbv_exemplarmasken.js.
//
//============================================================================
// $Log: exemplarmasken_dialog.js,v $
// Erstellt: GBV, Karen Hachmann auf Basis der Datenmasken
//============================================================================

var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

//Globale Variable:
var exSchema="";
var lExMaximal=0;
var currentFilename = "";
var bContentsChanged1, bContentsChanged2;
var exNrAnfang, exNrEnde,checkboxExEingabe, exUrl;
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
	FrageSpeichern();
	var theList = document.getElementById('idFileListMenu');
	var theFileInput = utility.newFileInput();

	if (!theFileInput.openSpecial("ProfD", "\\exemplarmasken\\" + theList.value)) {
		if (!theFileInput.openSpecial("BinDir", "\\exemplarmasken\\" + theList.value)) {
			alert("Datei " + theList.value + " wurde nicht gefunden.");
			return;
		}
	}
	var theFileContent;
	for (theFileContent = ""; !theFileInput.isEOF(); ) {
		theFileContent += theFileInput.readLine() + "\n"
	}
	var lEndeZeile1 = theFileContent.indexOf("\n"); //1. Zeile enthält Selektionszeichen
	var theFileContentExxx = theFileContent.slice(0, lEndeZeile1)
	var theFileContentWeitereKat = theFileContent.slice(lEndeZeile1+1); //Zeilen enthalten weitere ExKategorien
	document.getElementById('idFileEditExxx').value = theFileContentExxx;
	document.getElementById('idFileEdit').value = theFileContentWeitereKat;
	theFileInput.close();
	theFileInput = null;
	currentFilename = theList.value;
	//document.getElementById('idSaveMsg1').value = " ";
} catch(e) { alert('loadFileByName: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function loadFiles()
{
try {
	var arNames = new Array(); // Array to store the names of the files in

	// Get the directory with default Exemplarmasken:
	var theDir = getSpecialDirectory("BinDir");
	theDir.append("exemplarmasken");
	if (!theDir.exists()) {
		alert("Die Standard-Exemplarmasken wurden nicht gefunden.")
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
	theDir.append("exemplarmasken");
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
	for (i = 0; i < arNames.length; i++) {
		var theEle = document.createElement("menuitem");
		theEle.setAttribute("label", arNames[i]);
		theEle.setAttribute("value", arNames[i]);
		theFileList.appendChild(theEle);
	}

	document.getElementById("idFileListMenu").selectedIndex = 0;
	loadFileByName();
	arNames = null;
} catch(e) { alert('loadFiles: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function onLoad()
{
	loadFiles();
	bContentsChanged1 = false;
	bContentsChanged2 = false;
	exemplarProfilLesen();
	//Eine bestimmte Registerkarte in den Vordergrund bringen
	var lRegisterkarte = application.getProfileInt("einstellungenKat", "registerkarte", "");
	if (lRegisterkarte != 0){
		document.getElementById("idTabs").selectedIndex = lRegisterkarte;
		//Zurücksetzen der Einstellung:
		application.writeProfileInt("einstellungenKat", "registerkarte", 0);
	}
	__exSchema();
}

function __exSchema(){
	var strGCN = application.activeWindow.getVariable("P3GCN");
	if(strGCN.indexOf("K10plus")== -1){
		exSchema = "7";
		lExMaximal=99;
	} else {
		exSchema = "E";
		lExMaximal=999;
	}
}

//----------------------------------------------------------------------------
function onAccept()
{
	return auswahlSpeichern();
}

//----------------------------------------------------------------------------
function onCancel()
{
	FrageSpeichern();
}

//----------------------------------------------------------------------------

function exemplarProfilLesen()
{
try {
	exNrAnfang = application.getProfileString("Exemplareingabe", "exNrAnfang", "");
	exNrEnde = application.getProfileString("Exemplareingabe", "exNrEnde", "");
	checkboxExEingabe = application.getProfileString("Exemplareingabe", "checkboxExEingabe", "");
	exUrl = application.getProfileString("Exemplareingabe", "exUrl", "");
	//alert (checkboxExEingabe);
	document.getElementById('exNrAnfang').value = exNrAnfang;
	document.getElementById('exNrEnde').value = exNrEnde;
	if (checkboxExEingabe == "true") {
		document.getElementById('checkboxExEingabe').checked = "true";
	}
	document.getElementById("idRadioUrl").selectedIndex = exUrl;
} catch(e) { alert('** '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function FrageSpeichern()
{
	if (bContentsChanged1) {
		var prompt = utility.newPrompter();
		prompt.setDebug(true);
		if (prompt.confirmEx("Speichern?", "Änderungen in " + currentFilename
							+ " speichern?", "Yes", "No", "", "", false) == 0) {
			exemplarmaskeSpeichern();
		}
		bContentsChanged1 = false;
	}
	if (bContentsChanged2) {
		var prompt = utility.newPrompter();
		prompt.setDebug(true);
		if (prompt.confirmEx("Speichern?", "Weitere Änderungen speichern?", "Yes", "No", "", "", false) == 0) {
			weitereSpeichern();
		}
		bContentsChanged2 = false;
	}
}

//----------------------------------------------------------------------------
function auswahlSpeichern()
{
	if (bContentsChanged1) {
		if (!exemplarmaskeSpeichern()) return false;
	}
	bContentsChanged1 = false;

	if (bContentsChanged2) {
		if (!weitereSpeichern()) return false;
	}
	bContentsChanged2 = false;
	einstellungURLSpeichern();
	return true;
}
//----------------------------------------------------------------------------

function exemplarmaskeSpeichern()
{
try {
	if (currentFilename == "") return;

	// Get the user's profile subdirectory for the Exemplarmasken, and create if
	// if necessary:
	var theDir = getSpecialDirectory("ProfD");
	if (theDir) {
		theDir.append("exemplarmasken");
		if (!theDir.exists()) {
			// the directory doesn't exist yet, create it
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Verzeichnis für Exemplarmasken konnte nicht erstellt werden!");
				return;
			}
		}
	}

	// Get the new contents from the edit control:
	var newContents = document.getElementById('idFileEditExxx').value + "\n" +
					document.getElementById('idFileEdit').value;
	// Open (or create) the output file in the user's profile directory,
	// and store the new contents:
	var theFileOutput = utility.newFileOutput();
	theFileOutput.createSpecial("ProfD", "\\exemplarmasken\\" + currentFilename);
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

function weitereSpeichern()
{
try {
	var strExNrAnfangNeu;
	var strExNrEndeNeu;
	var lExNrAnfangNeu;
	var lExNrEndeNeu;
	//Anfang:
	strExNrAnfangNeu = document.getElementById('exNrAnfang').value;
	if (strExNrAnfangNeu == "") {
		application.writeProfileString("Exemplareingabe", "exNrAnfang", "1")
	} else {
		lExNrAnfangNeu = parseInt(strExNrAnfangNeu,10)
		if (lExNrAnfangNeu < 1 || lExNrAnfangNeu > lExMaximal || isNaN(lExNrAnfangNeu)) {
			alert("Bitte geben Sie eine Exemplarnummer von 1 bis " + lExMaximal + " ein!");
			return false;
		}
		application.writeProfileString("Exemplareingabe", "exNrAnfang", lExNrAnfangNeu);
	};
	//Ende:
	strExNrEndeNeu = document.getElementById('exNrEnde').value;
	if (strExNrEndeNeu == "") {
		application.writeProfileString("Exemplareingabe", "exNrEnde", lExMaximal)
	} else {
		lExNrEndeNeu = parseInt(strExNrEndeNeu,10);
		if (lExNrEndeNeu < 1 || lExNrEndeNeu > lExMaximal || isNaN(lExNrEndeNeu)) {
			alert("Bitte geben Sie eine Exemplarnummer von 1 bis " + lExMaximal + " ein!");
			return false;
		}
		if (lExNrAnfangNeu > lExNrEndeNeu){
			alert("Letzte Exemplarnummer muss zwischen " + lExNrAnfangNeu + " und " + lExMaximal + " liegen.");
			return false;
		}
		application.writeProfileString("Exemplareingabe", "exNrEnde", lExNrEndeNeu)
	};
	application.writeProfileString("Exemplareingabe", "checkboxExEingabe", document.getElementById('checkboxExEingabe').checked);
	//alert ("Einstellungen gespeichert: \n" + lExNrAnfangNeu + "\n" + lExNrEndeNeu);
	return true;
} catch(e) { alert('** '+ e.name + ': ' + e.message); }
}

function einstellungURLSpeichern()
{
	var einstellung = document.getElementById("idRadioUrl").selectedIndex;
	application.writeProfileString("Exemplareingabe", "exUrl", einstellung);
}

function wikiWinibw()
{
	//ab 09.2018:
	application.shellExecute ("https://wiki.k10plus.de/x/KgD3B", 5, "open", "");
}

