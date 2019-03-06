//============================================================================
/* gbv_excelTabelle_dialog.js
 Erstellt: als Scriptdatei: J�rgen Schneider, HEBIS
 Anpassungen f�r GBV, Karen Hachmann
    alles in einem XUL-Formular untergebracht.
    Pfad 'Listen' wird angelegt, wenn noch nicht vorhanden
    Jede Datei bekommt automatisch einen Namen (Datum und Uhrzeit).
 ***************************************************************************
 GBV: zahlreiche �nderungen:
      writeCSV in Dialogformular �bertragen
      04.2013: Anwender k�nnen selbst ausw�hlen, welche Trennzeichen
               verwendet werden sollen, wenn ein Feld wiederholbar ist.
               Habe "; " durch strTrennzeichen ersetzt
      11.2013: writeCSV: if-Bedingung entfernt, da ansonsten gerade vorgenommene �nderungen
               in der Konfigurationsdatei des Nutzers nicht gelesen werden
 ***************************************************************************
 ZDB: Wiederholte Felder und Unterfelder
 - Funktionen createResult(), convertText �berarbeitet
 - angepasst getMaxOccurrence --> radix hinzugef�gt
 - 07.11.16 Fehler Unterfeld a verschwindet bei wiederholbaren Unterfeldern
*/
//============================================================================

var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

//----------------------------------------------------------------------------
function onLoad()
{
	document.getElementById("idButtonStart").focus();
	document.getElementById("idLabelInfos1a").value = "Schritt 1: Recherchieren Sie nach den Titeln, die in eine csv-Datei geschrieben werden sollen.";
	document.getElementById("idLabelInfos1b").value = "Schritt 2: F�llen Sie ggf. die Standortangabe im unteren Feld aus.";
	document.getElementById("idLabelInfos1c").value = "Schritt 3: Klicken Sie auf 'Start', um ALLE Datens�tze des angezeigten Sets in eine csv-Datei zu schreiben. ";
	document.getElementById("idLabelInfos3").value = "Beim Auswerten der Exemplare werden nur solche ber�cksichtigt, deren Standortangabe in Kategorie 7100";
	document.getElementById("idLabelInfos4").value = "mit Ihren Angaben im obigen Feld �bereinstimmt. Achten Sie auch auf Gro�- und Kleinschreibung!";
	document.getElementById("idLabelInfos5").value = "Welches Trennzeichen soll zur Unterteilung von wiederholbaren Feldern verwendet werden?";
	document.getElementById("idLabelInfos6").value = "Standard: Semikolon";
	strTrennzeichen = application.getProfileString("Exceltool", "Trennzeichen", "");
	if (strTrennzeichen == ""){
		strTrennzeichen = "; "
	}
	document.getElementById("idTextboxTrennzeichen").value = strTrennzeichen;

	//welche Konfigurationsdatei soll verwendet werden?
	einstellungKonfigurationstabelle();

	ladeKonfigurationstabelle();
	ladeKonfigurationstabelleUser();
	bContentsChanged = false;
}

//----------------------------------------------------------------------------
function onAccept()
{
	application.disableScreenUpdate(true);
	frageSpeichern();
	//Zur�cksetzen, falls erneut ausgef�hrt:
	document.getElementById("idLabelErgebnis1").hidden=false;
	document.getElementById("idLabelErgebnis2").hidden=false;
	document.getElementById("idLabelErgebnis1").value = "Bitte warten bis Schlussmeldung angezeigt wird!";
	document.getElementById("idLabelErgebnis2").value = "WinIBW3 zeigt evtl. keine Reaktion bis zum Ende des Downloads."
	document.getElementById("idTextboxPfad").value="";
	strSST = document.getElementById("idTextboxSST").value;
	strTrennzeichen = document.getElementById("idTextboxTrennzeichen").value; //das aktuelle wird verwendet
	if (strTrennzeichen == ""){strTrennzeichen="; "}
	writeCSV();
	application.disableScreenUpdate(false);
}

//----------------------------------------------------------------------------
function onCancel()
{
	frageSpeichern();
}

//----------------------------------------------------------------------------
// Globale Variable:
var global = new Object();
var directory;
var bContentsChanged;
var strSST;
var auswahlDatei; //Standardkonfigurationstabelle oder eigeneAuswahl
var strTrennzeichen;
var delimiter = '\u0192'; // Unterfeldzeichen "�" = \u0192
var charCode = 402; // Unterfeldzeichen "�" = 402, Unterfeldzeichen "$" = 36
//----------------------------------------------------------------------------

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
function getSpecialPath(theDirName, theRelativePath)
{
	//gibt den Pfad als String aus
	const nsIProperties = Components.interfaces.nsIProperties;
	var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
							.getService(nsIProperties);
	var theFile = dirService.get(theDirName, Components.interfaces.nsILocalFile);
	theFile.appendRelativePath(theRelativePath);
	return theFile.path;
}

function getSpecialDirectory(name)
{
	//gibt ein Object zur�ck
	const nsIProperties = Components.interfaces.nsIProperties;
	var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
							.getService(nsIProperties);
	return dirService.get(name, Components.interfaces.nsIFile);
}

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

	return jahr + "_" + monat + "_" + strTag + "_" + stunde + "_" + minute + "_" + sekunde;

}

// --------------------------------------------------------------------------------
//Hebis:
  String.prototype.leftTrim = function () {
    return (this.replace(/^\s+/,""));
  };
  String.prototype.rightTrim = function () {
    return (this.replace(/\s+$/,""));
  };
//kombiniert "leftTrim" und "rightTrim";
  String.prototype.basicTrim = function () {
    return (this.replace(/\s+$/,"").replace(/^\s+/,""));
  };
//dampft leerzeichen(-sequenzen) innerhalb einer zeichenkette auf ein einzelnes "space" ein;
  String.prototype.superTrim = function () {
    return(this.replace(/\s+/g," ").replace(/\s+$/,"").replace(/^\s+/,""));
  };
//zugabe: entfernt alle leerzeichen aus einer zeichenkette;
  String.prototype.removeWhiteSpaces = function () {
    return (this.replace(/\s+/g,""));
  };
  String.prototype.left = function (laenge) {
    return ( this.substr(0, laenge));
  };
  String.prototype.startsWithDigit = function () {
    return ( ("0" <= this.charAt(0)) && (this.charAt(0) <= "9") );
  };

function __hebisError(meldetext)
{
	application.messageBox("Fehler", meldetext, "error-icon");
}
function __hebisMsg(meldetext)
{
	application.messageBox("Hinweis", meldetext, "alert-icon");
}
function __M(meldungstext)
{
	application.messageBox("Hinweis", meldungstext, "message-icon");
}

function __getExpansionFromP3VTX() {

	satz = application.activeWindow.getVariable("P3VTX");
	satz = satz.replace("<ISBD><TABLE>","");
	satz = satz.replace("<\/TABLE>","");
	satz = satz.replace(/<BR>/g,"\n");
	satz = satz.replace(/^$/gm,"");
	satz = satz.replace(/^Eingabe:.*$/gm,"");
	satz = satz.replace(/<a[^<]*>/gm,"");
	satz = satz.replace(/<\/a>/gm,"");
	return satz;
}
//
//------------------------------------------------------------------------------------
//
// Programm zur Generierung einer CSV-Outputdatei (f�r Excel-Tabelle)
//
// Version 1	HpS	02.06.2008
// �berarbeitet: KH, GBV
//
// Version 2	HpS	18.09.2009
//			Sobald Tags in Level2 abgefragt wurden, konnte es geschehen,
//			dass bei fehlenden Tags in einem Exemplar die Werte
//			verschiedener Exemplare vermischt wurden. Dies ist
//			jetzt dadurch behoben, dass jeweils sequentiell Titel
//			mit sigul�rem Exemplar zur Auswahl angeboten wird.
//			Exemplare, die keines der gew�nschten Tags aufweisen,
//			werden in der Tabell nicht nachgewiesen. Sollte kein
//			Exemplar die gew�nschten Tags haben, werden die
//			Level0 un d 1-Daten einfach ausgegeben.
// GBV: keine Begrenzung der Mengen:
//const noRunLimit = 50;	// maximale Anzahl von Titel im Set
//const warnLimit = 10;		// Grenze f�r Warnung wegen Zeitproblen

const specialChars = "KS";	// spezielle Zeichen f�r die Ausgabe von
				// Werten dieser Tags.
				//   K=behalte auch @ und {
				//   S=l�sche Nicht-Sortier-Anteile
				// Default ist: l�sche @ und {

// --------------------------------------------------------------------------
// Klassendefinitionen
// --------------------------------------------------------------------------

// Kurze Definition:
// eine Auswahlzeile in csvControl.txt besteht aus
//
// �berschrift, optional gefolgt von SpezialZeichen, gefolgt von Tags
// (PicaPlus) und optional gefolgt vom $x-Wert bei Level-2 Tags. Danach
// kommen die Auswahlbeschreibungen, die aus einer Kette von Alternativen
// besteht, die wiederum festlegen, welche Subfelder aus dem angegebenen
// Tag als Information zu extrahieren sind.
//
// Beispiel:
// Hrsg:          028C $8+" [$B]" $a+", $d"+" [$B]"
//
// F�r Herausgeber suche Tag 028C. Als Alternativen werden durchsucht
//	$8+" [$B]"
//	$a+", $d"+" [$B]"

// F�r jede Zeile in csvControl.txt wird ein Objekt generiert,
// das dann als Array gespeichert werden.
// Die Klasse ist aufgebaut:
//	dim col		// Zeilen�berschriften
//	dim def		// Definition der Umsetzung (z.Zt. nicht ben�tigt)
//	dim val		// aus Tag extrahierter Text
//	dim adr		// Adresse des Tags im Datensatz
//	dim spec	// Spezialzeichen (s.o.)
//	dim tag		// zu untersuchende Kategorie
//	dim xsbf	// Subfeld $x Wert bei Level-2 Daten
//	dim data	// Datenfelder ---> Or-Felder --> And_Felder

// data ist das Ergebnis der Umsetzung der Auswahldefinition in csvControl.txt
// in eine interne Struktur. Die Definitionen enthalten ein oder mehrere durch
// Blanks getrennte Strings, die so lange durchsucht werden, bis ein passender
// gefunden wird.

// Jeder String in einem And-Feld besteht aus einem Subfeld (geschrieben als
// $x (oder einem anderen Zeichen) oder wird von zwei //"// eingegrenzt. Der
// Inhalt besteht aus beliebigen Zeichen (kein //"// und kein //$//) gefolgt
// von einem Subfeld ($x), dem wiederum beliebige Zeichen (kein //"//) folgen
// k�nnen.
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
//
// Lesen der cvs Control und Definition Dateien
//
// inp	filehandle f�r Eingabedatei
// must	muss true sein, wenn Definitionen notwendig sind
//		(beim Definitionsfile)
//
// R�ckgabe	Inhalt der Datei, null bei Fehler
// --------------------------------------------------------------------------------

function readControl ( inp, must ) {

	var theFileContent = new Array();
	var line, tmp;
	var cnt = 0;

	while (!inp.isEOF()) {
		line = inp.readLine();
		if (line == null) {
			if (must)	line = "interne Definitionsdatei";
			else		line = "ausgew�hlte Kommandodatei";
			__hebisError("Die " + line + "kann nicht verarbeitet werden!\n\n"
						+ "M�glicherweise enth�lt sie unzul�ssige Formatanweisungen\n"
						+ "oder Zeichen au�erhalb der Unicode-Zeichen-Darstellung.");
			return null;
		}
		if (line.left(2) == "//")		continue;
		tmp = line.replace(/\t/g," ");
		tmp = tmp.superTrim();
		//tmp = line.replace(/[\s:]+$/,"").replace(/^[\s:]+/,"");
		if (tmp == "")					continue;

		idx = tmp.indexOf(":");
		if (tmp.indexOf(" ") < idx) {
			__hebisError("Die Spalten�berschriften d�rfen keine Blanks "
						+ "enthalten. Die folgende Zeile "
							+ "wird nicht akzeptiert:\n\n" + line);
			//__M("tmp:"+tmp+"!  idx:"+idx+"  blank:"+tmp.indexOf(" ")+"  c:"+tmp.charAt(5)+"!");
			//__M("was:"+(tmp.charAt(5) == " ")+"  wert:"+tmp.charCodeAt(5));
			return null;
		}
		if (idx < 0) {
			if (must) {
//				__hebisError("In einer csv Definition m�ssen Kategorien "
//							+ "angegeben werden. Die folgende Zeile "
//							+ "wird nicht akzeptiert:\n\n" + line);
				return null;
			}
			theFileContent.push(tmp);
			theFileContent.push(tmp);
		} else {
			theFileContent.push(tmp.substr(0,idx).superTrim());
			theFileContent.push(tmp.substr(idx+1).superTrim());
		}
		cnt++;
	}

	if (cnt == 0)	return null;
	return theFileContent;
}

// --------------------------------------------------------------------------------
//
// Ersetzen genutzte Definitionen durch deren Wert
//
// defs	Definitionen
// content	Inhalt der Control-Datei
//
// liefert neues Array zur�ck
//
// --------------------------------------------------------------------------------

function replaceDefinitions ( defs, content ) {
	var newcont = new Array();
	for (var idx=0; idx < content.length; idx += 2) {
		var defval;
		newcont.push(content[idx]);
		defval = getDefinition(defs,content[idx+1]);
		if (defval == null) {
			if (!checkIfTag(content[idx+1])) {
				//__hebisError("Diese Zeile in der Konfigurationsdatei ist fehlerhaft:\n\n"
				//			+ content[idx] + ": " + content[idx+1]);
				var thePrompter = utility.newPrompter();
				var antwort = thePrompter.confirmEx("Hinweis zur Konfigurationstabelle",
					"Diese Zeile in Ihrer Konfigurationstabelle ist fehlerhaft:\n" + content[idx] + ": " + content[idx+1]
					+ "\n\nInformationen zur Konfigurationstabelle finden Sie im WinIBW3-Wiki."
					+ "\nWollen Sie die Informationen jetzt lesen?",
					"Ja", "Nein", "", "", "");
				//alert(antwort);
				if (antwort == 0) {
					//neu seit 09.2018:
					application.shellExecute ("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-KonfigurationdesExcel-Werkzeugs", 5, "open", "");
					window.close(); //Dialogform wird geschlossen
				}
				return null;
			}
			newcont.push(content[idx+1]);
		} else {
			newcont.push(defval);
		}
	}

	return (newcont)
}

// --------------------------------------------------------------------------------
//
// Suchen von Definitionen und R�ckgabe deren Werts
//
// defs	Menge der Definitionen
// mask	zu suchende Definion
//
// liefert neuen Text zur�ck
//
// --------------------------------------------------------------------------------

function getDefinition ( defs, mask ) {

	var idx, idxe

	for (var idx=0; idx<defs.length; idx+=2) {
		if (defs[idx] == mask)	return defs[idx+1];
	}

	return null;

}

// --------------------------------------------------------------------------------
//
// Check, ob Text als Special + Kategorie interpretierbar ist
//
// liefert true oder false zur�ck
//
// --------------------------------------------------------------------------------

function checkIfTag ( text ) {
	var idx = 0;
	var lev2;

	if (specialChars.indexOf(text.charAt(0).toUpperCase()) >= 0)	idx = 1;
	lev2 = (text.charAt(idx) == "2");
	if ( (text.charAt(idx) < "0") || ("2" < text.charAt(idx++)) )	return false;
	if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
	if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
	if ( (text.charAt(idx) < "@") || ("Z" < text.charAt(idx++)) )	return false;

	if (text.charAt(idx) == "/") {
		if (lev2)														return false;
		idx++;
		if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
		if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
		if (text.charAt(idx) != " ") {
			if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
		}
	} else if (text.charAt(idx) == "x") {
		if (!lev2)														return false;
		idx++;
		if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
		if ( (text.charAt(idx) < "0") || ("9" < text.charAt(idx++)) )	return false;
	}

	return (text.charAt(idx) == " ");
}

// --------------------------------------------------------------------------------
//
// Generierung des Control-Arrays
//
// content	Daten in erg�nzter Control Datei
//
// R�ckgabe Control Array
//
// --------------------------------------------------------------------------------

function createCtrlArray ( content ) {
	//wertet den Inhalt der Datei csvDefinition.txt aus:
	var tmpline;
	var ctrl = new Array();
	global.csvLevel2 = false;

	for (var idx=0; idx<content.length; idx+=2) {
		var obj = new Object();
		obj.col = content[idx];
		obj.def = content[idx+1];
		obj.val = "";
		obj.adr = 0;
		//__M(content[idx]);
		tmpline = getSpecial(obj,content[idx+1]);
		//alert("getSpecial: " + tmpline);//ganze Zeile, Kategorie und Unterfelder
		if (tmpline == null)						return null;

		tmpline = getTagInfos(obj,tmpline);
		//alert("getTagInfos: " + tmpline);//nur Unterfelder
		if (tmpline == null)						return null;

		tmpline = orPartitions(obj,tmpline);
		//alert("orPartitions: " + tmpline);
		if (tmpline == null)						return null;

		ctrl[idx/2] = obj;
	}

	ctrl.cnt = 0;
    //alert(__objToString (ctrl));

	return ctrl;

}

// --------------------------------------------------------------------------------
//
// Extrahieren der SpezialSteuerung (K oder S)
//
// ctrl	Control array
// tmpline	zu behandelnde Zeile
//
// setzt ctrl.spec
// R�ckgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------


function getSpecial ( ctrl, tmpline ) {
	if (tmpline.startsWithDigit()) {
		ctrl.spec = " ";
	} else {
		ctrl.spec = tmpline.charAt(0).toUpperCase();
		tmpline = tmpline.substr(1);
	}

	return tmpline;
}


// --------------------------------------------------------------------------------
//
// Extrahieren der Informationen �ber Tags
//
// ctrl	Control array
// tmpline	zu behandelnde Zeile
//
// setzt ctrl.xsbf und ctrl.tagspec
// R�ckgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------

function getTagInfos ( ctrl, tmpline ) {

	var idx;
	if (tmpline.charAt(0) == "2") {
		global.csvLevel2 = true;
	}

	if (tmpline.charAt(4) == "x") {
		ctrl.xsbf = String.fromCharCode(charCode) + tmpline.substr(4,3);
		tmpline = tmpline.substr(0,4) + tmpline.substr(7);
	} else {
		ctrl.xsbf = "";
	}

	idx = tmpline.indexOf(" ");
	ctrl.tag = tmpline.substr(0,idx);

	return tmpline.substr(idx+1);

}


// --------------------------------------------------------------------------------
//
// Einlesen der Or-Partitionen
//
// ctrl	Control array
// tmpline	zu behandelnde Zeile
//
// setzt ctrl.data
// R�ckgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------

function orPartitions ( ctrl, tmpline ) {

	var termOr = new Array();
	var tmpObj = new Object();
	var idx = 0;

//__M("or:"+tmpline);
	tmpline = " " + tmpline;
	while (tmpline.charAt(0) == " ") {

	tmpline = andPartitions(tmpObj,tmpline.substr(1));
//__M("nach andPa tmpline:"+tmpline);
		if (tmpline == null)			return null;

		termOr[idx] = new Array();
		termOr[idx++] = tmpObj.termAnd;
//__M("or idx:"+(idx-1)+"  and:"+tmpObj.termAnd.length+"   wert:"+termOr[idx-1][0].sbf);
	}


	ctrl.data = termOr;
	//__M("vor Abschluss or 0:"+termOr[0][0].sbf+"   1:"+termOr[1][0].sbf);
	//__M("jetzt abschluss or Anzahl:"+ctrl.data[0][0].sbf);
	//alert("or: " +tmpline);
	return tmpline;

}

// --------------------------------------------------------------------------------
//
// Einlesen der and-Partitionen
//
// termOr	Referenz zum or-Teil
// tmpline	zu behandelnde Zeile
//
// setzt termOt.termAnd
// R�ckgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------

function andPartitions ( termOr, tmpline ) {
	var termAnd = new Array();
	var tmpObj = new Object();
	var idx;
	idx = 0;
//__M("and:"+tmpline);
	tmpline = "+" + tmpline;
	while (tmpline.charAt(0) == "+") {
		tmpline = sbfPart(tmpObj,tmpline.substr(1));
		//alert("andPartitions: "+ tmpline);
		if (tmpline == null)			return null;
//__M("nach sbf:"+tmpline+"!  idx:"+idx+"   tmpObj:"+tmpObj.field.sbf);
		termAnd[idx] = new Object();
		termAnd[idx++] = tmpObj.field;
		//__M("modidx:"+(idx-1)+"  wert:"+tmpObj.field.sbf+"  tw:"+termAnd[idx-1].sbf);
	}
	if ( (tmpline != "") && (tmpline.charAt(0) != " ") )	return null;

	termOr.termAnd = termAnd;
	//__M("and schluss:"+termOr.termAnd[0].sbf+"  laenge termand:"+termAnd.length);
	return tmpline;
}

// --------------------------------------------------------------------------------
//
// Einlesen von Text oder Subfeldern
//
// obj	Referenz zum field Objekt
// tmpline	modifizierte Zeile
//
// setzt obj.field
// R�ckgabe templine
//
// --------------------------------------------------------------------------------


function sbfPart ( obj, tmpline ) {

	var idx, jdxe, tmp
	var field = new Object();

	//__M("sbfPart:"+tmpline);
	if (tmpline.charAt(0) == "$") {
		field.pre = "";
		field.sbf = String.fromCharCode(charCode) + tmpline.charAt(1);
		field.post = ""
		tmpline = tmpline.substr(2);
	} else if (tmpline.charAt(0) == "\"") {
		tmpline = tmpline.substr(1);
		jdxe = tmpline.indexOf("\"");
		if (jdxe < 2)					return null;

		tmp = tmpline.substr(0,jdxe);
		tmpline = tmpline.substr(jdxe+1);

		idx = tmp.indexOf("$");
		if (idx < 0)					return null;
		if (idx == tmp.length-1)		return null;
		if (idx == 0) {
			field.pre = "";
		} else {
			field.pre = tmp.substr(0,idx);
			tmp = tmp.substr(idx);
		}
		field.sbf = String.fromCharCode(charCode) + tmp.charAt(1);
		field.post = tmp.substr(2);
	} else {
		return null;
	}
//__M("sbf ende:"+tmpline+"!");
	obj.field = field;
//__M(" in sbf obj field sbf:"+obj.field.sbf);
	return tmpline;
}

// --------------------------------------------------------------------------------
//
// Generieren der Kopfzeile
//
// ctrl	Control-Array
//
// R�ckgabe Header
//
// --------------------------------------------------------------------------------

function createHeader ( ctrl ) {

	var idx = -1;
	var header = '"PPN"\t' + '"EPN"\t';;
	//GBV: im Header soll immer EPN vorkommen
	//if (global.csvLevel2)	header += '"EPN"\t';

	while (++idx < ctrl.length) {
		header += '"' + ctrl[idx].col.replace(/\u0022/g,"'") + '"\t';
	}
	header = header.replace(/;$/,"");
	return header;
}
// --------------------------------------------------------------------------------
//
// �ffnen der Ausgabedatei
//
// filename	Name der datei
//
// R�ckgabe -1:abbrechen, 0:Daei neu schreiben, +1: �berschreiben
//
// --------------------------------------------------------------------------------

function csvTestHeader ( filename, header ) {

	var f, ant, line;

	var	txtOutEQ =
		"Die Ausgabedatei existiert schon. Die in ihr gepeicherte Tabelle hat die gleichen\n"
	+	"Spalten�berschriften wie die jetzt zu erzeugende. Soll sie �berschrieben werden?\n\n"
	+	"Antworten Sie bitte mit\n\n"
	+	"Ja,..........wenn sie �berschrieben werden soll\n"
	+	"Nein,........wenn die neue Werte angeh�ngt werden sollen\n"
	+	"Abbrechen, wenn das Skript ohne Ausgabe beendet werden soll";

	var txtOutNE =
		"Die Ausgabedatei existiert schon. Die in ihr gepeicherte Tabelle hat aber andere\n"
	+	"Spalten�berschriften als die jetzt zu erzeugende. Soll sie �berschrieben werden?\n\n"
	+	"Antworten Sie bitte mit\n\n"
	+	"Ja,..........wenn sie �berschrieben werden soll\n"
	+	"Abbrechen, wenn das Skript ohne Ausgabe beendet werden soll";

	ant = 0;
	f = utility.newFileInput();
	if (f.open(filename)) {
		if (!f.isEOF()) {
			line = f.readLine();
			if (line != "") {
				if (header == line) {
					ant = global.prompter.confirmEx(global.msgboxHeader,txtOutEQ,
							"Ja","Abbrechen","Nein",null,null);
				} else {
					ant = global.prompter.confirmEx(global.msgboxHeader,txtOutNE,
							"Ja","Abbrechen",null,null,null);
				}
			}
		}
	}

	f.close();
	f = null;

	if (ant == 1)	return (-1);	// Abbrechen
	if (ant == 2)	return (+1);	// append
	return 0;						// �berschreiben
}
// --------------------------------------------------------------------------------
//
// Aufbau einer Liste zur Darstellung eines Arrays
//
// satz	Datensatz
// ctrl	Inhalt Control
//
// R�ckgabe aus Datensatz stammende(n) Zeile(n)
//
// --------------------------------------------------------------------------------

function handleRecord ( satz, ctrl ) {

	var		lineblock, tmp_satz, tmp_line, idx, loopcnt;
	//__M(satz);//der vollst�ndige Titel mit allen Exemplaren
//GBV: If-Bedingung entfernt: wenn in der Konfigurationsdatei keine Kategorien der Ebene 2 vorkommen
//	if (!global.csvLevel2) {
//		lineblock = handleRecordPart(satz,true,ctrl);
//	} else {
		//Dies soll in jedem Fall ausgef�hrt werden:
		loopcnt = getMaxOccurrence(satz);
		//__M("loopcnt:"+loopcnt);
		lineblock = "";
		for (idx=1; idx<=loopcnt; idx++) {
			var	occ = (idx<10)? "/0"+idx : "/"+idx;
			tmp_satz = filterCopy(satz,occ);
			//__M("Titel mit Exemplar:\n" + tmp_satz);
			if (tmp_satz != "") {
				tmp_line = handleRecordPart(tmp_satz,false,ctrl);
				if (tmp_line != "") {
					lineblock += tmp_line + "\n";
				}
			}
		}
		//alert("lineblock: " + lineblock);
		lineblock = lineblock.replace(/\n$/,"");
	//GBV: nur wenn Anwender keine Selektion nach SST vornimmt, soll dies stattfinden:
		if (lineblock == "" && strSST == "") {
			tmp_satz = filterCopy(satz,"/00");
			lineblock = handleRecordPart(tmp_satz,true,ctrl);
		}
	//ende else} GBV: entfernt
	return lineblock;
}

// --------------------------------------------------------------------------------
//
// Laden der h�chsten Occurrence der Exemplare eines Titels
//
//
// edited C. Klee 14.10.2011: added radix (10) to parseInt
//
// satz	Datensatz
//
// liefert 0, wenn kein Exemplar vorhanden
//
// --------------------------------------------------------------------------------

function getMaxOccurrence ( satz ) {
	var	idx;

	idx = satz.lastIndexOf("\n203@/");//GBV: Kat. 7800
	if (idx < 0)	return (0);
	//return (parseInt(satz.substr(idx+6,2),10)); //Korrektur Scherer f�r Exemplare > E100
	return (parseInt(satz.substr(idx+6,3),10));
}

// --------------------------------------------------------------------------------
//
// Aufbau eines tempor�ren Satzes, der neben Level0 und 1
// nur die Daten des Exemplars mit der Occurrence occ hat
//
// satz	Datensatz
// occ	Occurrence String "/xx"
//
// liefert leeren String, falls kein entsprechendes Exemplar
// gefunden (L�cke in Z�hlung)
//
// --------------------------------------------------------------------------------

function filterCopy ( satz, occ ) {

	var	tmp_satz = "";
	var	arr;
	var	idx;
	var	found = false;

	if (occ == "/00")	found = true;

	arr = satz.split("\n");
	for (idx=0; idx<arr.length; idx++) {
		if (arr[idx].left(1) != "2") {
			tmp_satz += arr[idx] + "\n";
		} else {
			//if (arr[idx].substr(4,3) == occ) { //Korrektur Scherer f�r Exemplare > E100
			if ((arr[idx].substr(7,1) == " " && arr[idx].substr(4,3) == occ) || arr[idx].substr(4,4) == occ) {
				tmp_satz += arr[idx] + "\n";
				found = true;
			}
		}
	}

	if (!found)	tmp_satz = "";

	//GBV: Pr�fung nur wenn Feld "Standort" ausgef�llt wurde
	// wenn der SST nicht �bereinstimmt, soll das Exemplar nicht
	// in die Tabelle
	//Pr�fung, ob Kat. 7100 vorkommt:
	var regex7100 = /209A\/.*?x00/;
	if (strSST != ""){
		strSST = strSST.replace(/!/g,"") //Standort ohne !!
		if (regex7100.test(tmp_satz) == false){
			tmp_satz = "";
		} else{
			var arr7100 = tmp_satz.match(regex7100);
			// Unterfeldzeichen "�" = \u0192
			if (arr7100[0].indexOf(delimiter+"f"+strSST+delimiter) == -1){
				tmp_satz = "";
			}

		}
	}
	//alert("filterCopy: tmp_satz = \n" + tmp_satz);
	return tmp_satz;
}

// --------------------------------------------------------------------------------
//
// Aufbau einer Liste zur Darstellung eines Arrays
//
// satz	Datensatz
// ctrl	Inhalt Control
//
// R�ckgabe aus datensatz stammende Zeile(n)
//
// --------------------------------------------------------------------------------

function handleRecordPart ( satz, accept, ctrl ) {

	var line, idx;

	idx = -1;
	while (++idx < ctrl.length) {
		ctrl[idx].val = "";
		ctrl[idx].adr = 0;
	}

	//__M("handleRecordPart acc:"+accept+"\n"+satz);

	//GBV: nach createResult soll diese Funktion nicht abgebrochen werden
	//if (!createResult(satz,accept,ctrl))	return "";
	createResult(satz,ctrl);
	//EPN wird ermittelt:
	var str7800 = "";
	line = '"' + application.activeWindow.getVariable("P3GPP") + '"\t';
	//if (global.csvLevel2) {
	//GBV: if-Bedingung bewirkt, dass nur die EPN eingetragen wird, wenn in der Konfigurationsdatei
	//     eine Kategorie der Ebene 2 vorkommt.Entfernt, weil EPN immer ermittelt werden soll
		idx = satz.indexOf("\n203@");
		//__M("idx:"+idx);
		if (idx < 0) {
			//alert(idx + "\n" + satz);
			line += "\t";
		} else {
			str7800 = satz.substr(idx+11, satz.length);//bis Rest des Exemplares
			//__M("str7800\n" + str7800);
			str7800 = str7800.substring(0, str7800.indexOf("\n")); //bis Zeilenende
			line += '"' + str7800 + '"\t';
			//__M(line);
		}

	idx = -1
	while (++idx < ctrl.length) {
		ctrl[idx].val = ctrl[idx].val.replace(/&amp;/g,"&");
		ctrl[idx].val = ctrl[idx].val.replace(/&lt;/g,"<");
		ctrl[idx].val = ctrl[idx].val.replace(/&gt;/g,">");
		line += '"' + ctrl[idx].val.replace(/\u0022/g,"'") + '"\t';
	}
	line = line.replace(/;$/,"");
	//__M("line:"+line); //ganze Zeile, die in Tabelle eingef�gt wird.
	ctrl.cnt++;
	return line;
}


// --------------------------------------------------------------------------------
//
// Extraktion der interessierenden Daten aus Datensatz
//
//
// edited C. Klee 06.01.2012: Wiederholbare Felder/Unterfelder
//
//
// satz Datensatz
// ctrl	 Control array
//
// R�ckgabe true, wenn okay
// --------------------------------------------------------------------------------

function createResult ( satz, ctrl ) {
	var tag, suche, regex, group, text, idx;
	idx = -1;
	while (++idx < ctrl.length)
	{

		// das tag, dass ausgelesen werden soll
		tag = ctrl[idx].tag;

		// handelt es sich um ein tag mit subfield?
		//suche = "("+tag+".+)"+ctrl[idx].xsbf;
		suche = tag+".+"+ctrl[idx].xsbf;
		regex = new RegExp(suche, "g");
		group = satz.match(regex);
		if(group)
		{
			var tempArray = new Array();

			// workaround fuer 7120/4024(ZDB)
			// nur fuer Feld 7120/4012
			if (ctrl[idx].tag == "031N" || ctrl[idx].tag == "231@")
			{
				// nur wenn Unterfeld $0 vorkommt
				if(satz.indexOf(String.fromCharCode(charCode)+"0") != -1)
				{
					// teile zeile anhand von $0 (Semikolon)
					text = group[0].split(String.fromCharCode(charCode)+"0 ");
					// konvertiere jeden Teilstring
					for(var p = 0; p < text.length; p++){
						tempArray[p] = convertOrText(text[p],ctrl[idx].spec,ctrl[idx].data);
					}
					ctrl[idx].val = tempArray.join(strTrennzeichen);
				}
				// normale prozedur
				else
				{
					for (var w = 0; w < group.length; w++)
					{
						tempArray[w] = convertOrText(group[w],ctrl[idx].spec,ctrl[idx].data);
					}
				}
			}
			else
			{
				for (var w = 0; w < group.length; w++)
				{
					tempArray[w] = convertOrText(group[w],ctrl[idx].spec,ctrl[idx].data);
				}
				if(tempArray.length > 1)
				{
					ctrl[idx].val = tempArray.join(strTrennzeichen);
				}
				else
				{
					ctrl[idx].val = tempArray[0];
				}
			}
		}
	}
	//__M("retval:"+retval);
	return;
}

// --------------------------------------------------------------------------------
//
// Extraktion der interessierenden Daten aus Datensatz
// (hier Beh&&lung einer der Alternativen)
//
// text	nutzende Kategorie
// spec	Spezialzeichen
// data	Referenz f�r data Part
// --------------------------------------------------------------------------------

function convertOrText ( text, spec, data ) {

	var idx, tmp, xidx;
	idx = -1;
	while (++idx < data.length) {
		//__M("or aufruf idx:"+idx+"  anz:"+data.length);
		tmp = convertText(text,spec,data[idx]);
		if (tmp != "")	return tmp;
	}

	return "";
}

// --------------------------------------------------------------------------------
//
// Extraktion der interessierenden Daten aus Datensatz
// (hier �bernahme der Daten unter Beachtung des Spezialzeichens)
//
//
// edited C. Klee 12.10.2011: Wiederholbare Felder/Unterfelder
// edited C. Klee 07.11.2016: Fehler: Subfield a vanishes with Wiederholbare Felder/Unterfelder
//
// text	nutzende Kategorie
// spec	Spezialzeichen (S oder K oder blank)
// andArr	Referrenz auf andArray
//
// --------------------------------------------------------------------------------

function convertText ( text, spec, andArr ) {
	var tmp, idx, idxe, xidx, jdxa, jdxe, test, tmpArray, tmpSf;

// ZDB: Diese Zeile verusrsacht das Abbrechen der Funktion, wenn das erste Unterfeld nicht vorkommt --> Daher auskommentiert
//	if (text.indexOf(andArr[0].sbf) < 0)	return "";

	tmp = "";
	idx = -1;
	test = false;

	while (++idx < andArr.length) {
		// erstes vorkommen
		jdxa = text.indexOf(andArr[idx].sbf);
		// letztes vorkommen
		jdxl = text.lastIndexOf(andArr[idx].sbf);
		//__M("ctext in while idx:"+idx+"   jdxa:"+jdxa);
		// nur wenn das unterfeld ueberhaupt vorkommt
		if (jdxa >= 0) {
			// nur wenn unterfelder wiederholt werden
			if(jdxa != jdxl)
			{
                tmpArray = new Array();
				while(test == false){
					jdxe = text.indexOf(String.fromCharCode(charCode),jdxa+1);
					if (jdxe < 0)	jdxe = text.length;
					tmpSf = andArr[idx].pre + text.substr(jdxa+2,jdxe-jdxa-2) + andArr[idx].post;
					tmpArray.push(tmpSf);
					if (jdxa == jdxl) test = true;
					jdxa = text.indexOf(andArr[idx].sbf,jdxa+1);
				}
				tmp += tmpArray.join(strTrennzeichen);
			}
			else
			{
				jdxe = text.indexOf(String.fromCharCode(charCode),jdxa+1);
				if (jdxe < 0)	jdxe = text.length;
				tmp += andArr[idx].pre + text.substr(jdxa+2,jdxe-jdxa-2) + andArr[idx].post;
			}
		}
	}
	//__M("ctext nach while tmp:"+tmp+"  spec:"+spec);
	if (spec == "S") {
		idx = tmp.indexOf("@");
		if (idx < 0) {
			tmp = "@" + tmp;
		} else {
			tmp = tmp.substr(idx);
		}
		idx = tmp.indexOf("{");
		while (idx >= 1) {
			idxe = tmp.indexOf(" ",idx);
			if (idxe < 0) {
				tmp = tmp.substr(0,idx-1);
			} else {
				tmp = tmp.substr(0,idx-1) + tmp.substr(idxe+1);
			}
			idx = tmp.indexOf("{");
		}
		tmp = tmp.substr(1);
	} else if (spec == "K") {
		idx = idx;	// dummy
	} else {
		tmp = tmp.replace("@",""); //GBV: evtl. Blank eingef�gen, weil sonst bei Personen in $8 Blank zwischen Vorn. u. Nachn. fehlt
		tmp = tmp.replace("{","");
	}
	//__M("ctext nach spec tmp:"+tmp);
	tmp = tmp.replace(String.fromCharCode(27)+"N","");
	tmp = tmp.superTrim();
	//__M("retval tmp:"+tmp);
	return tmp;
}


function writeCSV()
{
	var		directory;
	var		content;
	var		ctrl;

	var		src;
	var		cnt;
	var		header;
	var ergebnis = "";
	frageSpeichern();
	global.msgboxHeader = "Schreiben einer CSV-Datei";

	scr = application.activeWindow.getVariable("scr");
	if ( (scr != "8A") && (scr != "7A") ) {
		__hebisError("Das Skript kann nur aus einer Kurztitelliste oder "
					+ "der Pr�sentation eines Titels aufgerufen werden.");
		return false;
	}
	//Anzahl der Titel:
	cnt = parseInt(application.activeWindow.getVariable("P3GSZ"));
	//GBV: keine Begrenzung der Mengen. Anweisungen zur Begrenzung der Sets entfernt.

	//GBV: Tabelle soll immer neu gelesen werden, denn sonst werden �nderungen
	//     und Korrekturen in der Auswahl der Felder nicht ber�cksichtigt.
	//     deshalb if-Bedingung auskommentiert
	//if (global.csvDefinitions == null) {
		var defInpFile = utility.newFileInput();
		//die ausgew�hlte Konfigurationsdatei wird verwendet:
		if (einstellungKonfigurationstabelle() == 1){
			if (!defInpFile.openSpecial("ProfD", "\\csvDefinitionUser.txt")) {
				__hebisMsg("Die Konfigurationsdatei des Anwenders wurde nicht gefunden.\n"
						+ "Bitte wenden Sie sich an Ihre Systembetreuer.");
				return false;
			}
		}else {
			//default ist die Standardkonfiguration in Bin
			if (!defInpFile.openSpecial("BinDir", "ttlcopy\\csvDefinition.txt")) {
				__hebisMsg("Standardkonfigurationsdatei nicht gefunden.\n"
						+ "Bitte wenden Sie sich an Ihre Systembetreuer.");
				return false;
			}
		}

		global.csvDefinitions = readControl(defInpFile,true);
		defInpFile.close();
		defInpFile = null;
		if (global.csvDefinitions == null)		return false;
		//__M(global.csvDefinitions.join("!\n!"));
	//} Ende der if-Bedingung auskommentiert

	//Lesen der Definition:
	content = global.csvDefinitions;
	content = replaceDefinitions(global.csvDefinitions,content);
	if (content == null)	return;
	//__M("content: \n" + content.join("!\n!"));
	ctrl = createCtrlArray(content);
//	__M("ctrl:"+ctrl[0].col+"  spec:"+ctrl[0].spec+"  tag;"+ctrl[0].tag
//		+"  xsbf:"+ctrl[0].xsbf+"   len or:"+ctrl[0].data.length);

	var xline = "";
	for (var kdx=0; kdx<ctrl.length; kdx++) {
		var xline = "ctrl["+kdx+"]\n"
				+	"\tcol:\t"+ctrl[kdx].col+"\n"
				+	"\tspec:\t"+ctrl[kdx].spec+"\n"
				+	"\ttag:\t"+ctrl[kdx].tag+"\n"
				+	"\txsbf:\t"+ctrl[kdx].xsbf+"\n";
		for (var idx=0; idx<ctrl[kdx].data.length; idx++) {
			for (var jdx=0; jdx<ctrl[kdx].data[idx].length; jdx++) {
				xline += "\t"+idx+"\t"+jdx+"\tpre:\""+ctrl[kdx].data[idx][jdx].pre+"\""
					  +  "\tsbf:\""+ctrl[kdx].data[idx][jdx].sbf+"\""
					  +  "\tpost:\""+ctrl[kdx].data[idx][jdx].post+"\"\n";
			}
		}
	//__M(xline);
	}

	header = createHeader(ctrl);
	//__M(header+"!");

	//Verzeichnis Listen wird angelegt:
	var theDir = getSpecialDirectory("ProfD");
	if (theDir) {
		theDir.append("listen");
		if (!theDir.exists()) {
			theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
			if (!theDir.exists()) {
				alert("Verzeichnis konnte nicht angelegt werden: " + theDir.path);
				return;
			}
		}
	}

	//Listendatei wird angelegt:
	global.csvOutFile = utility.newFileOutput();
	//relativer Pfad + Dateiname:
	//var theRelativePath = "listen\\liste_" + datumHeute() + ".csv";
	//�nderung von csv in txt, weil dann in Excel sofort der Importierassistent aufgerufen wird.
	var theRelativePath = "listen\\liste_" + datumHeute() + ".txt";
	//Datei wird angelegt:
	global.csvOutFile.createSpecial("ProfD", theRelativePath);
	//listenPfad als String:
	listenPfad = global.csvOutFile .getSpecialPath("ProfD", theRelativePath);
	//alert(listenPfad);

	//GBV: es soll immer eine neue Datei angelegt werden.
	global.csvOutFile.setTruncate(true);
	global.csvOutFile.writeLine("\ufeff"+header);


	//GBV:
	//Anweisungen f�r Template 8A entfernt. Hier wurde nur der in der Vollanzeige befindliche Titel heruntergeladen.
	//es sollen immer alle (d.h. 1 bis viele) Datens�tze ausgewertet werden
	var outcnt = 0;
	ctrl.cnt = 0;
	for (var idx=1; idx<=cnt; idx++) {
		//__M("s "+idx);

		application.activeWindow.command("show "+idx+" p",false);
		if (application.activeWindow.status != "OK")	continue;
		satz = "\n" + __getExpansionFromP3VTX();
		satz = satz.replace(/\r/g, "\n");
		satz = satz.replace(/\u001b./g,""); // replace /n (Zeilenumbruch) entfernt,
											// weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
		outval = handleRecord(satz,ctrl);
		if (outval != "") {
			global.csvOutFile.writeLine(outval);
			outcnt++;
		}
		//__M(outval);

		//setTimeout(testAsync, 0, idx, ctrl);
	}
	application.activeWindow.command("s k",false);

	//GBV:
	if (outcnt != cnt) {
		ergebnis = "Leider konnten in " + (cnt-outcnt) + " Titel die gesuchten Kategorien nicht gefunden werden.";
	} else {
		ergebnis = ctrl.cnt + " Zeilen f�r " + outcnt + " Titel ausgegeben.";
	}
	//__hebisMsg(outval);

	global.csvOutFile.close();
	global.csvOutFile.setTruncate(false);
	global.csvDefinitions = null;//zur�cksetzen, damit Konfigdatei beim n�chsten Mal neu gelesen wird.

	//zur�cksetzen auf Anzeigeformat d
	application.activeWindow.command("s d",false);
	//Kurzanzeige
	application.activeWindow.command("s k",false);

	//Ausgabe auf dem Dialogformular:
	document.getElementById("idLabelErgebnis1").hidden=false;
	document.getElementById("idLabelErgebnis1").value = ergebnis;
	document.getElementById("idLabelErgebnis2").hidden=false;
	document.getElementById("idLabelErgebnis2").value = "Sie finden die Ergebnisdatei im unten genannten Verzeichnis. Pfad befindet sich im Zwischenspeicher."
	document.getElementById("idTextboxPfad").value=listenPfad;
	document.getElementById("idTextboxPfad").hidden=false;
}

/*var outcnt = 0;

function testAsync(idx, ctrl) {
	var newWindowID = application.newWindow();
	application.activeWindow.command("show "+idx+" p",false);
	if (application.activeWindow.status != "OK")	return;
	satz = "\n" + __getExpansionFromP3VTX();
	application.closeWindow(newWindowID);
	satz = satz.replace(/\r/g, "\n");
	satz = satz.replace(/\u001b./g,""); // replace /n (Zeilenumbruch) entfernt,
										// weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
	outval = handleRecord(satz,ctrl);
	if (outval != "") {
		global.csvOutFile.writeLine(outval);
		outcnt++;
	}
}*/

//**************************************************************************

function wikiWinibw()
{
    //Hilfe allgemein
    //neu seit 09.2018:
    application.shellExecute ("https://wiki.k10plus.de/x/agDUAw", 5, "open", "");
    }
    function wikiAnzeigen2()
    {
    //Hilfe Konfiguration
    application.shellExecute ("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-KonfigurationdesExcel-Werkzeugs", 5, "open", "");
    }
    function wikiAnzeigen3()
    {
    //Hilfe Trennzeichen
    application.shellExecute ("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-Trennzeichen", 5, "open", "");
}

function dateiOeffnen()
{
	//funktioniert zwar, aber dann werden die Zeilen nicht richtig formatiert.
	//f�hrende Nullen bei PPNs und EPNs entfallen
	//man kann nicht einstellen, dass aller Inhalt als Text gelesen werden soll
	//nur wenn man in Excel die Daten importiert, dann kann man Semikolon als Trennzeichen
	//und aller Inhalt als Text einstellen.
	application.shellExecute (listenPfad, 5, "open", "");
}
//----------------------------------------------------------------------------

function allesZuruecksetzen()
{
	document.getElementById("idLabelErgebnis1").hidden=true;
	document.getElementById("idLabelErgebnis2").hidden=true;
	document.getElementById("idTextboxPfad").value="";
	document.getElementById("idTextboxPfad").hidden=true;
}

//-----------------------------------------------------------------------------
/*
	Registerkarte 2:
	Die Anwender k�nnen Kategorien ausw�hlen
*/
//-----------------------------------------------------------------------------
var arrayTabelle = new Array();
var currentIndex = 0; //der aus einer Liste ausgew�hlte Wert
function ladeKonfigurationstabelle()
{
try{
	var zeile = "";
	var i = 0;
	var defInpFile = utility.newFileInput();
	//Die Standardkonfiguration wird gesucht:
	if (!defInpFile.openSpecial("BinDir", "ttlcopy\\csvDefinition.txt")) {
		__hebisMsg("CSV Definitionen nicht gefunden.\n" +
				"Bitte wenden Sie sich an Ihre Systembetreuer.");
		return false;
		}

	//Alle Zeilen der Datei lesen:
	for (zeile = ""; !defInpFile.isEOF(); ) {
		zeile = defInpFile.readLine();
			if (zeile.substring(0,2) != "//" && zeile.length != 0){
				arrayTabelle[i] = zeile;
				i++
			}
	}
	//alert("!"+arrayTabelle.join("\n")+"!");

	var treeView = {
		rowCount : arrayTabelle.length,
		getCellText : function(row,column){
			if (column == "idColAlle") return arrayTabelle[row];
		},
		setTree: function(treebox){ this.treebox = treebox; },
		isContainer: function(row){ return false; },
		isSeparator: function(row){ return false; },
		isSorted: function(){ return false; },
		getLevel: function(row){ return 0; },
		getImageSrc: function(row,col){ return null; },
		getRowProperties: function(row,props){},
		getCellProperties: function(row,col,props){},
		getColumnProperties: function(colid,col,props){}
	}

	document.getElementById("idTree").view = treeView;
	document.getElementById("idTree").addEventListener("keypress", handle_key_press_auswahl, false);
} catch(e) { alert('ladeKonfigurationstabelle: '+ e.name + ': ' + e.message); }
}

function ladeKonfigurationstabelleUser()
{
    try{
        //in dieser Funktion wird die Konfigurationstabelle gelesen
        //der Inhalt wird auf der zweiten Registerkarte des Dialogformulars angezeigt
        var zeile = "";
        var i = 0;
        var defInpFile = utility.newFileInput();
        var arrayTabelle = new Array();

        if (!defInpFile.openSpecial("ProfD", "\\csvDefinitionUser.txt")) {

        //Es gibt keine Konfigrationseinstellungen des Benutzers
        return;
        }

        //Alle Zeilen der Datei lesen:
        for (zeile = ""; !defInpFile.isEOF(); ) {
            zeile = defInpFile.readLine();
            if (zeile.substring(0,2) != "//" && zeile.length != 0){
                arrayTabelle[i] = zeile;
                i++
            }
        }
        //zeige die Zeilen aus der Konfigurationstabelle im Textfeld an:
        document.getElementById("idAuswahlZeilen").value = arrayTabelle.join("\n");
    } catch(e) { alert('ladeKonfigurationstabelleUser: '+ e.name + ': ' + e.message); }
}

function waehleZeile()
{
	var lAuswahl = document.getElementById("idTree").currentIndex;
	if (document.getElementById("idAuswahlZeilen").value == ""){
		document.getElementById("idAuswahlZeilen").value += arrayTabelle[lAuswahl];
	} else {
		//Einf�gen auf neuer Zeile:
		document.getElementById("idAuswahlZeilen").value += "\n" + arrayTabelle[lAuswahl];
	}
	bContentsChanged = true;
}

function handle_key_press_auswahl(evt)
{
	if (evt.keyCode == Event.prototype.DOM_VK_RETURN ) {
		evt.preventDefault();
		evt.preventBubble();
		evt.stopPropagation();
		waehleZeile();
		return;
	}
}

function frageSpeichern(){
	if (bContentsChanged) {
		var prompt = utility.newPrompter();
		prompt.setDebug(true);
		if (prompt.confirmEx("Speichern?", "�nderungen in der Konfiguration speichern?", "Yes", "No", "", "", false) == 0) {
			auswahlSpeichern();
		}
		bContentsChanged = false;
	}
}

function auswahlSpeichern()
{
try {
	var newContents = document.getElementById('idAuswahlZeilen').value;
	var theFileOutput = utility.newFileOutput();
	theFileOutput.createSpecial("ProfD", "\\csvDefinitionUser.txt");
	theFileOutput.setTruncate(true);
	theFileOutput.write(newContents);
	theFileOutput.close();
	theFileOutput = null;

	//wenn alle Zeilen gel�scht, wird Datei gel�scht.
	if (newContents == ""){
		auswahlLoeschen();
	} else {
		//Falls noch die Standardtabelle gew�hlt ist:
		if (document.getElementById("idRadioTabelle").selectedIndex == 0){
			var prompt = utility.newPrompter();
			prompt.setDebug(true);
			if (prompt.confirmEx("Neue Auswahl", "Soll Ihre Auswahl von Kategorien f�r die n�chste Exceltabelle verwendet werden?",
				"Yes", "No", "", "", false) == 0) {
				document.getElementById("idRadioTabelle").selectedIndex = 1;
				application.writeProfileInt("winibw", "GBVexcelTabelle", 1);
			}
		}
		document.getElementById("idLabelAuswahl").value = "Neue Auswahl gespeichert.";
		bContentsChanged = false;
	}
	var trennzeichen = document.getElementById("idTextboxTrennzeichen").value;
	if (trennzeichen == ""){trennzeichen = "; "}
	application.writeProfileString("Exceltool", "Trennzeichen", trennzeichen);

	return true;
} catch(e) { alert('auswahlSpeichern: '+ e.name + ': ' + e.message); }
}

function auswahlLoeschen()
{
	//Anwender will  alle Kategorien aus der eigenen Auswahl entfernen#
	//Textfeld und Konfigurationsdatei werden gel�scht
	var prompt = utility.newPrompter();
	prompt.setDebug(true);
	if (prompt.confirmEx("Alles l�schen?", "Soll Ihre Auswahl und Ihre pers�nliche Konfigurationstabelle " +
			"gel�scht werden? \nF�r zuk�nftige Listen wird die Standardtabelle verwendet.",
			"Yes", "No", "", "", false) == 0) {
		document.getElementById("idAuswahlZeilen").value = "";
		var theFile = getSpecialDirectory("ProfD");
		theFile.append("csvDefinitionUser.txt");
		if (theFile.exists()) {
			theFile.remove(false);
		}
		//Meldung:
		document.getElementById("idLabelAuswahl").value = "Auswahl gel�scht.";

		//default ist jetzt die Standardtabelle:
		document.getElementById("idRadioTabelle").selectedIndex = 0;
		application.writeProfileInt("winibw", "GBVexcelTabelle", 0);

		//es soll keine R�ckfrage kommen, falls zuerst Kategorien eingef�gt und dann gel�scht wurden:
		bContentsChanged = false;
	}
}

function einstellungKonfigurationstabelle()
{
	//welche Konfigurationstabelle ist im Userprofile eingestellt?
	auswahlTabelle = application.getProfileInt("winibw", "GBVexcelTabelle", 0);
	if (!auswahlTabelle) {auswahlTabelle = 0}
	document.getElementById("idRadioTabelle").selectedIndex = auswahlTabelle;
	return auswahlTabelle;
}

function waehleKonfigurationstabelle()
{
	//Im Userprofile wird eingetragen, welche  Konfigurationstabelle verwendet werden soll
	var auswahlRadio = document.getElementById("idRadioTabelle").selectedIndex; //gibt 0 oder 1 aus
	//wenn eigene Konfigurationsdatei leer, kann diese nicht ausgew�hlt werden
	if (auswahlRadio == 1 && document.getElementById('idAuswahlZeilen').value == ""){
		document.getElementById("idRadioTabelle").selectedIndex = 0;
		alert("Ihre Konfigurationsdatei ist leer. Bitte w�hlen Sie Kategorien aus der Standardtabelle aus!");
		return;
	}
	application.writeProfileInt("winibw", "GBVexcelTabelle", auswahlRadio);
}

/**
* Debugging function to view objects as text
*
**/
function __objToString (obj) {
    var str = '{';
    if(typeof obj=='object')
      {

        for (var p in obj) {
          if (obj.hasOwnProperty(p)) {
              str += "    " + p + ':' + __objToString (obj[p]) + ",\n";
          }
      }
    }
      else
      {
         if(typeof obj=='string')
          {
            return '"'+obj+'"';
          }
          else
          {
            return obj+'';
          }
      }
    return str.substring(0,str.length-1)+"}";
}
