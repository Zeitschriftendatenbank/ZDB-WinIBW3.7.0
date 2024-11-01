//============================================================================
/* gbv_excelTabelle_dialog.js
 Erstellt: als Scriptdatei: Jürgen Schneider, HEBIS
 Anpassungen für GBV, Karen Hachmann
		alles in einem XUL-Formular untergebracht.
		Pfad 'Listen' wird angelegt, wenn noch nicht vorhanden
		Jede Datei bekommt automatisch einen Namen (Datum und Uhrzeit).
 ***************************************************************************
 GBV: zahlreiche Änderungen:
			writeCSV in Dialogformular übertragen
			04.2013: Anwender können selbst auswählen, welche Trennzeichen
					verwendet werden sollen, wenn ein Feld wiederholbar ist.
					Habe "; " durch strTrennzeichen ersetzt
			11.2013: writeCSV: if-Bedingung entfernt, da ansonsten gerade vorgenommene Änderungen
					in der Konfigurationsdatei des Nutzers nicht gelesen werden
 ***************************************************************************
 ZDB: Wiederholte Felder und Unterfelder
 - Funktionen createResult(), convertText überarbeitet
 - angepasst getMaxOccurrence --> radix hinzugefügt
 - 07.11.16 Fehler Unterfeld a verschwindet bei wiederholbaren Unterfeldern
 - 16.05.19 Unnötige Variablen und Funktionen entfernt. Syntaxfehler etc.
*/
//============================================================================
var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);
//Globale Variable:
var strSystem = "";

//----------------------------------------------------------------------------
function onLoad() {
	document.getElementById("idButtonStart").focus();
	document.getElementById("idLabelInfos1a").value = "Schritt 1: Recherchieren Sie nach den Titeln, die in eine csv-Datei geschrieben werden sollen.";
	document.getElementById("idLabelInfos1b").value = "Schritt 2: Füllen Sie ggf. die Standortangabe im unteren Feld aus.";
	document.getElementById("idLabelInfos1c").value = "Schritt 3: Klicken Sie auf 'Start', um ALLE Datensätze des angezeigten Sets in eine csv-Datei zu schreiben. ";
	document.getElementById("idLabelInfos3").value = "Beim Auswerten der Exemplare werden nur solche berücksichtigt, die ";
	document.getElementById("idLabelInfos4").value = "mit Ihren Angaben im obigen Feld übereinstimmen. Achten Sie auch auf Groß- und Kleinschreibung!";
	document.getElementById("idLabelInfos5").value = "Welches Trennzeichen soll zur Unterteilung von wiederholbaren Feldern verwendet werden?";
	document.getElementById("idLabelInfos6").value = "Standard: Semikolon";
	strTrennzeichen = application.getProfileString("Exceltool", "Trennzeichen", "");
	if (strTrennzeichen === "") {
		strTrennzeichen = "; ";
	}
	document.getElementById("idTextboxTrennzeichen").value = strTrennzeichen;

	//welche Konfigurationsdatei soll verwendet werden?
	einstellungKonfigurationstabelle();
	ladeKonfigurationstabelle();
	ladeKonfigurationstabelleUser();
	bContentsChanged = false;
}

//----------------------------------------------------------------------------
function onAccept() {
	frageSpeichern();
	//Zurücksetzen, falls erneut ausgeführt:
	document.getElementById("idLabelErgebnis1").hidden = false;
	document.getElementById("idLabelErgebnis2").hidden = false;
	document.getElementById("idLabelErgebnis1").value = "Bitte warten bis Schlussmeldung angezeigt wird!";
	document.getElementById("idLabelErgebnis2").value = "WinIBW3 zeigt evtl. keine Reaktion bis zum Ende des Downloads.";
	document.getElementById("idTextboxPfad").value = "";
	feldSST = document.getElementById("idTextboxFeldSST").value;
	strSST = document.getElementById("idTextboxSST").value;
	strTrennzeichen = document.getElementById("idTextboxTrennzeichen").value; //das aktuelle wird verwendet
	if (strTrennzeichen === "") { strTrennzeichen = "; "; }
	writeCSV();
}

//----------------------------------------------------------------------------
function onCancel() {
	frageSpeichern();
}

//----------------------------------------------------------------------------
// Globale Variable:
var global = new Object(), bContentsChanged, strSST, feldSST, strTrennzeichen;
var delimiter = '\u0192'; // Unterfeldzeichen "ƒ" = \u0192
var charCode = 402; // Unterfeldzeichen "ƒ" = 402, Unterfeldzeichen "$" = 36
//----------------------------------------------------------------------------
const utility =
{
	newFileInput: function () {
		return Components.classes["@oclcpica.nl/scriptinputfile;1"]
			.createInstance(Components.interfaces.IInputTextFile);
	},
	newFileOutput: function () {
		return Components.classes["@oclcpica.nl/scriptoutputfile;1"]
			.createInstance(Components.interfaces.IOutputTextFile);
	},
	newPrompter: function () {
		return Components.classes["@oclcpica.nl/scriptpromptutility;1"]
			.createInstance(Components.interfaces.IPromptUtilities);
	}
};

//----------------------------------------------------------------------------
function getSpecialDirectory(name) {
	//gibt ein Object zurück
	const nsIProperties = Components.interfaces.nsIProperties;
	var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
		.getService(nsIProperties);
	return dirService.get(name, Components.interfaces.nsIFile);
}

function datumHeute() {
	//das Datum und die Uhrzeit wird Bestandteil des Dateinamens
	var jetzt = new Date();
	var jahr = jetzt.getFullYear();
	var monat = jetzt.getMonth();

	monat = monat + 1;
	if (monat < 10) { monat = "0" + monat; }

	var strTag = jetzt.getDate();
	if (strTag < 10) { strTag = "0" + strTag; }

	var stunde = jetzt.getHours();
	if (stunde < 10) { stunde = "0" + stunde; }

	var minute = jetzt.getMinutes();
	if (minute < 10) { minute = "0" + minute; }

	var sekunde = jetzt.getSeconds();
	if (sekunde < 10) { sekunde = "0" + sekunde; }

	return jahr + "_" + monat + "_" + strTag + "_" + stunde + "_" + minute + "_" + sekunde;
}

// --------------------------------------------------------------------------------
//Hebis:
String.prototype.leftTrim = function () {
	return (this.replace(/^\s+/, ""));
};
String.prototype.rightTrim = function () {
	return (this.replace(/\s+$/, ""));
};
//kombiniert "leftTrim" und "rightTrim";
String.prototype.basicTrim = function () {
	return (this.replace(/\s+$/, "").replace(/^\s+/, ""));
};
//dampft leerzeichen(-sequenzen) innerhalb einer zeichenkette auf ein einzelnes "space" ein;
String.prototype.superTrim = function () {
	return (this.replace(/\s+/g, " ").replace(/\s+$/, "").replace(/^\s+/, ""));
};
//zugabe: entfernt alle leerzeichen aus einer zeichenkette;
String.prototype.removeWhiteSpaces = function () {
	return (this.replace(/\s+/g, ""));
};
String.prototype.left = function (laenge) {
	return (this.substr(0, laenge));
};
String.prototype.startsWithDigit = function () {
	return (("0" <= this.charAt(0)) && (this.charAt(0) <= "9"));
};

function __hebisError(meldetext) {
	application.messageBox("Fehler", meldetext, "error-icon");
}

function __hebisMsg(meldetext) {
	application.messageBox("Hinweis", meldetext, "alert-icon");
}

function __M(meldungstext) {
	application.messageBox("Hinweis", meldungstext, "message-icon");
}

function __getExpansionFromP3VTX() {

	var satz = application.activeWindow.getVariable("P3VTX");
	satz = satz.replace("<ISBD><TABLE>", "");
	satz = satz.replace("<\/TABLE>", "");
	satz = satz.replace(/<BR>/g, "\n");
	satz = satz.replace(/^$/gm, "");
	satz = satz.replace(/^Eingabe:.*$/gm, "");
	satz = satz.replace(/<a[^<]*>/gm, "");
	satz = satz.replace(/<\/a>/gm, "");
	return satz;
}
//
//------------------------------------------------------------------------------------
//
// Programm zur Generierung einer CSV-Outputdatei (für Excel-Tabelle)
//
// Version 1	HpS	02.06.2008
// überarbeitet: KH, GBV
//
// Version 2	HpS	18.09.2009
//			Sobald Tags in Level2 abgefragt wurden, konnte es geschehen,
//			dass bei fehlenden Tags in einem Exemplar die Werte
//			verschiedener Exemplare vermischt wurden. Dies ist
//			jetzt dadurch behoben, dass jeweils sequentiell Titel
//			mit sigulärem Exemplar zur Auswahl angeboten wird.
//			Exemplare, die keines der gewünschten Tags aufweisen,
//			werden in der Tabell nicht nachgewiesen. Sollte kein
//			Exemplar die gewünschten Tags haben, werden die
//			Level0 un d 1-Daten einfach ausgegeben.
// GBV: keine Begrenzung der Mengen:
//const noRunLimit = 50;	// maximale Anzahl von Titel im Set
//const warnLimit = 10;		// Grenze für Warnung wegen Zeitproblen

const specialChars = "KS";	// spezielle Zeichen für die Ausgabe von
// Werten dieser Tags.
//   K=behalte auch @ und {
//   S=lösche Nicht-Sortier-Anteile
// Default ist: lösche @ und {

// --------------------------------------------------------------------------
// Klassendefinitionen
// --------------------------------------------------------------------------

// Kurze Definition:
// eine Auswahlzeile in csvControl.txt besteht aus
//
// Überschrift, optional gefolgt von SpezialZeichen, gefolgt von Tags
// (PicaPlus) und optional gefolgt vom $x-Wert bei Level-2 Tags. Danach
// kommen die Auswahlbeschreibungen, die aus einer Kette von Alternativen
// besteht, die wiederum festlegen, welche Subfelder aus dem angegebenen
// Tag als Information zu extrahieren sind.
//
// Beispiel:
// Hrsg:          028C $8+" [$B]" $a+", $d"+" [$B]"
//
// Für Herausgeber suche Tag 028C. Als Alternativen werden durchsucht
//	$8+" [$B]"
//	$a+", $d"+" [$B]"

// Für jede Zeile in csvControl.txt wird ein Objekt generiert,
// das dann als Array gespeichert werden.
// Die Klasse ist aufgebaut:
//	dim col		// Zeilenüberschriften
//	dim def		// Definition der Umsetzung (z.Zt. nicht benötigt)
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
// können.
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
//
// Lesen der cvs Control und Definition Dateien
//
// inp	filehandle für Eingabedatei
// must	muss true sein, wenn Definitionen notwendig sind
//		(beim Definitionsfile)
//
// Rückgabe	Inhalt der Datei, null bei Fehler
// --------------------------------------------------------------------------------

function readControl(inp, must) {
	var theFileContent = new Array(), line, tmp, cnt = 0, idx;
	while (!inp.isEOF()) {
		line = inp.readLine();
		if (line === null) {
			if (must) {
				line = "interne Definitionsdatei";
			} else {
				line = "ausgewählte Kommandodatei";
			}
			__hebisError("Die " + line + "kann nicht verarbeitet werden!\n\n" +
				"Möglicherweise enthält sie unzulässige Formatanweisungen\n" +
				"oder Zeichen außerhalb der Unicode-Zeichen-Darstellung.");
			return null;
		}
		if (line.left(2) == "//") { continue; }
		tmp = line.replace(/\t/g, " ");
		tmp = tmp.superTrim();
		if (tmp === "") { continue; }
		idx = tmp.indexOf(":");
		if (tmp.indexOf(" ") < idx) {
			__hebisError("Die Spaltenüberschriften dürfen keine Blanks " +
				"enthalten. Die folgende Zeile " +
				"wird nicht akzeptiert:\n\n" + line);
			//__M("tmp:"+tmp+"!  idx:"+idx+"  blank:"+tmp.indexOf(" ")+"  c:"+tmp.charAt(5)+"!");
			//__M("was:"+(tmp.charAt(5) == " ")+"  wert:"+tmp.charCodeAt(5));
			return null;
		}
		if (idx < 0) {
			if (must) {
				//				__hebisError("In einer csv Definition müssen Kategorien "
				//							+ "angegeben werden. Die folgende Zeile "
				//							+ "wird nicht akzeptiert:\n\n" + line);
				return null;
			}
			theFileContent.push(tmp);
			theFileContent.push(tmp);
		} else {
			theFileContent.push(tmp.substr(0, idx).superTrim());
			theFileContent.push(tmp.substr(idx + 1).superTrim());
		}
		cnt++;
	}

	if (cnt === 0) return null;
	return theFileContent;
}

// --------------------------------------------------------------------------------
//
// Ersetzen genutzte Definitionen durch deren Wert
//
// defs	Definitionen
// content	Inhalt der Control-Datei
//
// liefert neues Array zurück
//
// --------------------------------------------------------------------------------
function replaceDefinitions(defs, content) {
	var newcont = new Array();
	for (var idx = 0; idx < content.length; idx += 2) {
		var defval;
		newcont.push(content[idx]);
		defval = getDefinition(defs, content[idx + 1]);
		if (defval === null) {
			if (!checkIfTag(content[idx + 1])) {
				//__hebisError("Diese Zeile in der Konfigurationsdatei ist fehlerhaft:\n\n"
				//			+ content[idx] + ": " + content[idx+1]);
				var thePrompter = utility.newPrompter();
				var antwort = thePrompter.confirmEx("Hinweis zur Konfigurationstabelle",
					"Diese Zeile in Ihrer Konfigurationstabelle ist fehlerhaft:\n" + content[idx] + ": " + content[idx + 1] +
					"\n\nInformationen zur Konfigurationstabelle finden Sie im WinIBW3-Wiki." +
					"\nWollen Sie die Informationen jetzt lesen?",
					"Ja", "Nein", "", "", "");
				//alert(antwort);
				if (antwort === 0) {
					//WinIBW-Handbuch K10plus:
					application.shellExecute("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-KonfigurationdesExcel-Werkzeugs", 5, "open", "");
					window.close(); //Dialogform wird geschlossen
				}
				return null;
			}
			newcont.push(content[idx + 1]);
		} else {
			newcont.push(defval);
		}
	}
	return newcont;
}

// --------------------------------------------------------------------------------
//
// Suchen von Definitionen und Rückgabe deren Werts
//
// defs	Menge der Definitionen
// mask	zu suchende Definion
//
// liefert neuen Text zurück
//
// --------------------------------------------------------------------------------
function getDefinition(defs, mask) {
	var idx;
	for (idx = 0; idx < defs.length; idx += 2) {
		if (defs[idx] == mask) { return defs[idx + 1]; }
	}
	return null;
}

// --------------------------------------------------------------------------------
//
// Check, ob Text als Special + Kategorie interpretierbar ist
//
// liefert true oder false zurück
//
// --------------------------------------------------------------------------------
function checkIfTag(text) {
	var idx = 0, lev2;

	if (specialChars.indexOf(text.charAt(0).toUpperCase()) >= 0) { idx = 1; }
	lev2 = (text.charAt(idx) == "2");
	if ((text.charAt(idx) < "0") || ("2" < text.charAt(idx++))) { return false; }
	if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
	if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
	if ((text.charAt(idx) < "@") || ("Z" < text.charAt(idx++))) { return false; }

	if (text.charAt(idx) == "/") {
		if (lev2) { return false; }
		idx++;
		if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
		if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
		if (text.charAt(idx) != " ") {
			if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
		}
	} else if (text.charAt(idx) == "x") {
		if (!lev2) { return false; }
		idx++;
		if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
		if ((text.charAt(idx) < "0") || ("9" < text.charAt(idx++))) { return false; }
	}
	return (text.charAt(idx) == " ");
}

// --------------------------------------------------------------------------------
//
// Generierung des Control-Arrays
//
// content	Daten in ergänzter Control Datei
//
// Rückgabe Control Array
//
// --------------------------------------------------------------------------------
function createCtrlArray(content) {
	//wertet den Inhalt der Datei csvDefinition.txt aus:
	var tmpline, ctrl = new Array();
	global.csvLevel2 = false;

	for (var idx = 0; idx < content.length; idx += 2) {
		var obj = new Object();
		obj.col = content[idx];
		obj.def = content[idx + 1];
		obj.val = "";
		obj.adr = 0;
		//__M(content[idx]);
		tmpline = getSpecial(obj, content[idx + 1]);
		//alert("getSpecial: " + tmpline);//ganze Zeile, Kategorie und Unterfelder
		if (tmpline === null) { return null; }

		tmpline = getTagInfos(obj, tmpline);
		//alert("getTagInfos: " + tmpline);//nur Unterfelder
		if (tmpline === null) { return null; }

		tmpline = orPartitions(obj, tmpline);
		//alert("orPartitions: " + tmpline);
		if (tmpline === null) { return null; }

		ctrl[idx / 2] = obj;
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
// Rückgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------
function getSpecial(ctrl, tmpline) {
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
// Extrahieren der Informationen über Tags
//
// ctrl	Control array
// tmpline	zu behandelnde Zeile
//
// setzt ctrl.xsbf und ctrl.tagspec
// Rückgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------
function getTagInfos(ctrl, tmpline) {
	var idx;
	if (tmpline.charAt(0) == "2") {
		global.csvLevel2 = true;
	}

	if (tmpline.charAt(4) == "x") {
		ctrl.xsbf = String.fromCharCode(charCode) + tmpline.substr(4, 3);
		tmpline = tmpline.substr(0, 4) + tmpline.substr(7);
	} else {
		ctrl.xsbf = "";
	}

	idx = tmpline.indexOf(" ");
	ctrl.tag = tmpline.substr(0, idx);

	return tmpline.substr(idx + 1);
}

// --------------------------------------------------------------------------------
//
// Einlesen der Or-Partitionen
//
// ctrl	Control array
// tmpline	zu behandelnde Zeile
//
// setzt ctrl.data
// Rückgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------
function orPartitions(ctrl, tmpline) {
	var termOr = new Array(),
		tmpObj = new Object(),
		idx = 0;

	//__M("or:"+tmpline);
	tmpline = " " + tmpline;
	while (tmpline.charAt(0) == " ") {

		tmpline = andPartitions(tmpObj, tmpline.substr(1));
		//__M("nach andPa tmpline:"+tmpline);
		if (tmpline === null) { return null; }

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
// Rückgabe	modifizierte Zeile
//
// --------------------------------------------------------------------------------
function andPartitions(termOr, tmpline) {
	var termAnd = new Array(), tmpObj = new Object(), idx = 0;

	//__M("and:"+tmpline);
	tmpline = "+" + tmpline;
	while (tmpline.charAt(0) == "+") {
		tmpline = sbfPart(tmpObj, tmpline.substr(1));
		//alert("andPartitions: "+ tmpline);
		if (tmpline === null) { return null; }
		//__M("nach sbf:"+tmpline+"!  idx:"+idx+"   tmpObj:"+tmpObj.field.sbf);
		termAnd[idx] = new Object();
		termAnd[idx++] = tmpObj.field;
		//__M("modidx:"+(idx-1)+"  wert:"+tmpObj.field.sbf+"  tw:"+termAnd[idx-1].sbf);
	}
	if ((tmpline !== "") && (tmpline.charAt(0) != " ")) { return null; }

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
// Rückgabe templine
//
// --------------------------------------------------------------------------------
function sbfPart(obj, tmpline) {
	var idx,
		jdxe,
		tmp,
		field = new Object();

	//__M("sbfPart:"+tmpline);
	if (tmpline.charAt(0) == "$") {
		field.pre = "";
		field.sbf = String.fromCharCode(charCode) + tmpline.charAt(1);
		field.post = "";
		tmpline = tmpline.substr(2);
	} else if (tmpline.charAt(0) == "\"") {
		tmpline = tmpline.substr(1);
		jdxe = tmpline.indexOf("\"");
		if (jdxe < 2) { return null; }

		tmp = tmpline.substr(0, jdxe);
		tmpline = tmpline.substr(jdxe + 1);

		idx = tmp.indexOf("$");
		if (idx < 0) { return null; }
		if (idx == tmp.length - 1) { return null; }
		if (idx === 0) {
			field.pre = "";
		} else {
			field.pre = tmp.substr(0, idx);
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
// Rückgabe Header
//
// --------------------------------------------------------------------------------
function createHeader(ctrl) {
	var idx = -1;
	var header = '"PPN"\t' + '"EPN"\t';
	while (++idx < ctrl.length) {
		header += '"' + ctrl[idx].col.replace(/\u0022/g, "'") + '"\t';
	}
	header = header.replace(/;$/, "");
	return header;
}

// --------------------------------------------------------------------------------
//
// Aufbau einer Liste zur Darstellung eines Arrays
//
// satz	Datensatz
// ctrl	Inhalt Control
//
// Rückgabe aus Datensatz stammende(n) Zeile(n)
//
// --------------------------------------------------------------------------------
function handleRecord(satz, ctrl) {
	var lineblock, tmp_satz, tmp_line, idx, loopcnt, occ;
	//__M(satz);//der vollständige Titel mit allen Exemplaren

	//Dies soll in jedem Fall ausgeführt werden:
	loopcnt = getMaxOccurrence(satz);
	//__M("loopcnt:"+loopcnt);
	lineblock = "";
	for (idx = 1; idx <= loopcnt; idx++) {
		if (strSystem == "K10plus") {
			//idx = 10 - 99:
			occ = "/0" + idx;
			if (idx < 10) {
				occ = "/00" + idx;
			}
			if (idx > 99) {
				occ = "/" + idx;
			}
		} else {
			occ = (idx < 10) ? "/0" + idx : "/" + idx;
		}
		tmp_satz = filterCopy(satz, occ);
		//__M("satz: " + satz + "\nocc: " + occ);
		//__M("Titel mit Exemplar:\n" + tmp_satz);
		if (tmp_satz !== "") {
			tmp_line = handleRecordPart(tmp_satz, ctrl);
			if (tmp_line !== "") {
				lineblock += tmp_line + "\n";
			}
		}
	}
	//alert("lineblock: " + lineblock);
	lineblock = lineblock.replace(/\n$/, "");
	//GBV: nur wenn Anwender keine Selektion nach SST vornimmt, soll dies stattfinden:
	if (lineblock === "" && strSST === "") {
		tmp_satz = filterCopy(satz, "/00");
		lineblock = handleRecordPart(tmp_satz, ctrl);
	}
	return lineblock;
}

// --------------------------------------------------------------------------------
//
// Laden der höchsten Occurrence der Exemplare eines Titels
//
//
// edited C. Klee 14.10.2011: added radix (10) to parseInt
//
// satz	Datensatz
//
// liefert 0, wenn kein Exemplar vorhanden
//
// --------------------------------------------------------------------------------
function getMaxOccurrence(satz) {
	var idx = satz.lastIndexOf("\n203@/");//Kat. 7800
	if (idx < 0) { return 0; }
	//K10plus und ZDB verwenden unterschiedliche Occurrences:
	if (strSystem == "K10plus") {
		//K10plus: 3stellig
		return (parseInt(satz.substr(idx + 6, 3), 10));
	} else {
		//ZDB: 2stellig
		return (parseInt(satz.substr(idx + 6, 2), 10));
	}
}

// --------------------------------------------------------------------------------
//
// Aufbau eines temporären Satzes, der neben Level0 und 1
// nur die Daten des Exemplars mit der Occurrence occ hat
//
// satz	Datensatz
// occ	Occurrence String "/xx"
//
// liefert leeren String, falls kein entsprechendes Exemplar
// gefunden (Lücke in Zählung)
//
// --------------------------------------------------------------------------------
function filterCopy(satz, occ) {
	var tmp_satz = "",
		arr,
		idx,
		found = false;

	if (occ == "/00") { found = true; }

	arr = satz.split("\n");
	for (idx = 0; idx < arr.length; idx++) {
		if (arr[idx].left(1) != "2") {
			tmp_satz += arr[idx] + "\n";
		} else {
			if ((strSystem == "K10plus" && arr[idx].substr(4, 4) == occ) || (strSystem != "K10plus" && arr[idx].substr(4, 3) == occ)) {
				tmp_satz += arr[idx] + "\n";
				found = true;
			}
		}
	}
	if (!found) { tmp_satz = ""; }

	//GBV: Prüfung nur wenn Feld "Standort" ausgefüllt wurde
	// wenn der SST nicht übereinstimmt, soll das Exemplar nicht
	// in die Tabelle
	//Prüfung, ob Kat. 7100 vorkommt:
	//var regex7100 = /209A\/.*?x00/;
	if (strSST !== "") {
		var regex4800 = new RegExp(feldSST + ".+" + strSST, 'g');
		return (regex4800.test(tmp_satz)) ? tmp_satz : '';
	}

	/*if (strSST !== "") {
		//if (regex7100.test(tmp_satz) === false) {
		if (regex4800.test(tmp_satz) === false) {
			tmp_satz = "";
		} else {
			alert(strSST);
			//var arr7100 = tmp_satz.match(regex7100);
			var arr7100 = tmp_satz.match(regex4800);
			// Unterfeldzeichen "ƒ" = \u0192
			//if (arr7100[0].indexOf(delimiter + "f" + strSST + delimiter) == -1) {
			if (arr7100[0].indexOf(delimiter + "9" + strSST + delimiter) == -1) {
				tmp_satz = "";
			}
		}
	}
	//alert("filterCopy: tmp_satz = \n" + tmp_satz);
	return tmp_satz;*/
}

// --------------------------------------------------------------------------------
//
// Aufbau einer Liste zur Darstellung eines Arrays
//
// satz	Datensatz
// ctrl	Inhalt Control
//
// Rückgabe aus datensatz stammende Zeile(n)
//
// --------------------------------------------------------------------------------
function handleRecordPart(satz, ctrl) {
	var line, idx = -1;
	while (++idx < ctrl.length) {
		ctrl[idx].val = "";
		ctrl[idx].adr = 0;
	}
	//__M("handleRecordPart acc:"+accept+"\n"+satz);

	//GBV: nach createResult soll diese Funktion nicht abgebrochen werden
	//if (!createResult(satz,accept,ctrl))	return "";
	createResult(satz, ctrl);
	//EPN wird ermittelt:
	var str7800 = "";
	line = '"' + application.activeWindow.getVariable("P3GPP") + '"\t';
	//if (global.csvLevel2) {
	//GBV: if-Bedingung bewirkt, dass nur die EPN eingetragen wird, wenn in der Konfigurationsdatei
	//     eine Kategorie der Ebene 2 vorkommt. If-Bedingung entfernt,  EPN soll immer ermittelt werden.
	idx = satz.indexOf("\n203@");
	//__M("idx:"+idx);
	if (idx < 0) {
		//alert(idx + "\n" + satz);
		line += "\t";
	} else {
		if (strSystem == "K10plus") {
			str7800 = satz.substr(idx + 12, satz.length);//bis Rest des Exemplares
		} else {
			str7800 = satz.substr(idx + 11, satz.length);//bis Rest des Exemplares
		}
		//__M("str7800\n" + str7800);
		str7800 = str7800.substring(0, str7800.indexOf("\n")); //bis Zeilenende
		line += '"' + str7800 + '"\t';
		//__M(line);
	}

	idx = -1;
	while (++idx < ctrl.length) {
		ctrl[idx].val = ctrl[idx].val.replace(/&amp;/g, "&");
		ctrl[idx].val = ctrl[idx].val.replace(/&lt;/g, "<");
		ctrl[idx].val = ctrl[idx].val.replace(/&gt;/g, ">");
		line += '"' + ctrl[idx].val.replace(/\u0022/g, "'") + '"\t';
	}
	line = line.replace(/;$/, "");
	//__M("line:"+line); //ganze Zeile, die in Tabelle eingefügt wird.
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
// Rückgabe true, wenn okay
// --------------------------------------------------------------------------------
function createResult(satz, ctrl) {
	var tag, suche, regex, group, text, idx = -1, w;
	while (++idx < ctrl.length) {
		// das tag, dass ausgelesen werden soll
		tag = ctrl[idx].tag;
		// handelt es sich um ein tag mit subfield?
		//suche = "("+tag+".+)"+ctrl[idx].xsbf;
		suche = tag + ".+" + ctrl[idx].xsbf;
		regex = new RegExp(suche, "g");
		group = satz.match(regex);
		if (group) {
			var tempArray = new Array();
			// workaround fuer 7120/4024(ZDB)
			// nur fuer Feld 7120/4012
			if (ctrl[idx].tag == "031N" || ctrl[idx].tag == "231@") {
				// nur wenn Unterfeld $0 vorkommt
				if (satz.indexOf(String.fromCharCode(charCode) + "0") != -1) {
					// teile zeile anhand von $0 (Semikolon)
					text = group[0].split(String.fromCharCode(charCode) + "0 ");
					// konvertiere jeden Teilstring
					for (var p = 0; p < text.length; p++) {
						tempArray[p] = convertOrText(text[p], ctrl[idx].spec, ctrl[idx].data);
					}
					ctrl[idx].val = tempArray.join(strTrennzeichen);
				}
				// normale prozedur
				else {
					for (w = 0; w < group.length; w++) {
						tempArray[w] = convertOrText(group[w], ctrl[idx].spec, ctrl[idx].data);
					}
				}
			}
			else {
				for (w = 0; w < group.length; w++) {
					tempArray[w] = convertOrText(group[w], ctrl[idx].spec, ctrl[idx].data);
				}
				if (tempArray.length > 1) {
					ctrl[idx].val = tempArray.join(strTrennzeichen);
				}
				else {
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
// data	Referenz für data Part
// --------------------------------------------------------------------------------
function convertOrText(text, spec, data) {
	var idx = -1, tmp;
	while (++idx < data.length) {
		//__M("or aufruf idx:"+idx+"  anz:"+data.length);
		tmp = convertText(text, spec, data[idx]);
		if (tmp !== "") { return tmp; }
	}
	return "";
}
// --------------------------------------------------------------------------------
//
// Extraktion der interessierenden Daten aus Datensatz
// (hier Übernahme der Daten unter Beachtung des Spezialzeichens)
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
function convertText(text, spec, andArr) {
	var tmp = "", idx = -1, idxe, jdxa, jdxe, test = false, tmpArray, tmpSf, jdxl;
	while (++idx < andArr.length) {
		// erstes vorkommen
		jdxa = text.indexOf(andArr[idx].sbf);
		// letztes vorkommen
		jdxl = text.lastIndexOf(andArr[idx].sbf);
		//__M("ctext in while idx:"+idx+"   jdxa:"+jdxa);
		// nur wenn das unterfeld ueberhaupt vorkommt
		if (jdxa >= 0) {
			// nur wenn unterfelder wiederholt werden
			if (jdxa != jdxl) {
				tmpArray = new Array();
				while (test === false) {
					jdxe = text.indexOf(String.fromCharCode(charCode), jdxa + 1);
					if (jdxe < 0) { jdxe = text.length; }
					tmpSf = andArr[idx].pre + text.substr(jdxa + 2, jdxe - jdxa - 2) + andArr[idx].post;
					tmpArray.push(tmpSf);
					if (jdxa == jdxl) test = true;
					jdxa = text.indexOf(andArr[idx].sbf, jdxa + 1);
				}
				tmp += tmpArray.join(strTrennzeichen);
			}
			else {
				jdxe = text.indexOf(String.fromCharCode(charCode), jdxa + 1);
				if (jdxe < 0) { jdxe = text.length; }
				tmp += andArr[idx].pre + text.substr(jdxa + 2, jdxe - jdxa - 2) + andArr[idx].post;
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
			idxe = tmp.indexOf(" ", idx);
			if (idxe < 0) {
				tmp = tmp.substr(0, idx - 1);
			} else {
				tmp = tmp.substr(0, idx - 1) + tmp.substr(idxe + 1);
			}
			idx = tmp.indexOf("{");
		}
		tmp = tmp.substr(1);
	} else if (spec !== "K") {
		tmp = tmp.replace("@", ""); //GBV: evtl. Blank eingefügen, weil sonst bei Personen in $8 Blank zwischen Vorn. u. Nachn. fehlt
		tmp = tmp.replace("{", "");
	}
	//__M("ctext nach spec tmp:"+tmp);
	tmp = tmp.replace(String.fromCharCode(27) + "N", "");
	tmp = tmp.superTrim();
	//__M("retval tmp:"+tmp);
	return tmp;
}

function writeCSV() {
	var content, ctrl, cnt, header, ergebnis = "", idx, scr, listenPfad, satz, outval;
	frageSpeichern();
	global.msgboxHeader = "Schreiben einer CSV-Datei";
	//In welchem CBS sind wir?
	strSystem = application.activeWindow.getVariable("P3GCN");
	scr = application.activeWindow.getVariable("scr");
	if ((scr != "8A") && (scr != "7A")) {
		__hebisError("Das Skript kann nur aus einer Kurztitelliste oder " +
			"der Präsentation eines Titels aufgerufen werden.");
		return false;
	}
	//Anzahl der Titel:
	cnt = parseInt(application.activeWindow.getVariable("P3GSZ"));
	//GBV: keine Begrenzung der Mengen. Anweisungen zur Begrenzung der Sets entfernt.
	//GBV: Tabelle soll immer neu gelesen werden, denn sonst werden Änderungen
	//     und Korrekturen in der Auswahl der Felder nicht berücksichtigt.
	//     deshalb if-Bedingung auskommentiert
	var defInpFile = utility.newFileInput();
	//die ausgewählte Konfigurationsdatei wird verwendet:
	if (einstellungKonfigurationstabelle() == 1) {
		if (!defInpFile.openSpecial("ProfD", "\\csvDefinitionUser.txt")) {
			__hebisMsg("Die Konfigurationsdatei des Anwenders wurde nicht gefunden.\n" +
				"Bitte wenden Sie sich an Ihre Systembetreuer.");
			return false;
		}
	} else {
		//default ist die Standardkonfiguration in Bin
		if (!defInpFile.openSpecial("BinDir", "ttlcopy\\csvDefinition.txt")) {
			__hebisMsg("Standardkonfigurationsdatei nicht gefunden.\n" +
				"Bitte wenden Sie sich an Ihre Systembetreuer.");
			return false;
		}
	}

	global.csvDefinitions = readControl(defInpFile, true);
	defInpFile.close();
	defInpFile = null;
	if (global.csvDefinitions === null) { return false; }
	//__M(global.csvDefinitions.join("!\n!"));

	//Lesen der Definition:
	content = global.csvDefinitions;
	content = replaceDefinitions(global.csvDefinitions, content);
	if (content === null) { return; }
	//__M("content: \n" + content.join("!\n!"));
	ctrl = createCtrlArray(content);
	//	__M("ctrl:"+ctrl[0].col+"  spec:"+ctrl[0].spec+"  tag;"+ctrl[0].tag
	//		+"  xsbf:"+ctrl[0].xsbf+"   len or:"+ctrl[0].data.length);

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
	//Änderung von csv in txt, weil dann in Excel sofort der Importierassistent aufgerufen wird.
	var theRelativePath = "listen\\liste_" + datumHeute() + ".txt";
	//Datei wird angelegt:
	global.csvOutFile.createSpecial("ProfD", theRelativePath);
	//listenPfad als String:
	listenPfad = global.csvOutFile.getSpecialPath("ProfD", theRelativePath);
	//alert(listenPfad);

	//GBV: es soll immer eine neue Datei angelegt werden.
	global.csvOutFile.setTruncate(true);
	global.csvOutFile.writeLine("\ufeff" + header);

	//GBV:
	//Anweisungen für Template 8A entfernt. Hier wurde nur der in der Vollanzeige befindliche Titel heruntergeladen.
	//es sollen immer alle (d.h. 1 bis viele) Datensätze ausgewertet werden
	var outcnt = 0;
	ctrl.cnt = 0;
	for (idx = 1; idx <= cnt; idx++) {
		//__M("s "+idx);
		application.activeWindow.command("show " + idx + " p", false);
		if (application.activeWindow.status != "OK") { continue; }
		satz = "\n" + __getExpansionFromP3VTX();
		satz = satz.replace(/\r/g, "\n");
		satz = satz.replace(/\u001b./g, ""); // replace /n (Zeilenumbruch) entfernt,
		// weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
		outval = handleRecord(satz, ctrl);
		if (outval !== "") {
			global.csvOutFile.writeLine(outval);
			outcnt++;
		}
		//__M(outval);
	}
	application.activeWindow.command("s k", false);

	//GBV:
	if (outcnt != cnt) {
		ergebnis = "Leider konnten in " + (cnt - outcnt) + " Titel die gesuchten Felder nicht gefunden werden.";
	} else {
		ergebnis = ctrl.cnt + " Zeilen für " + outcnt + " Titel ausgegeben.";
	}
	//__hebisMsg(outval);

	global.csvOutFile.close();
	global.csvOutFile.setTruncate(false);
	global.csvDefinitions = null;//zurücksetzen, damit Konfigdatei beim nächsten Mal neu gelesen wird.

	//zurücksetzen auf Anzeigeformat d
	application.activeWindow.command("s d", false);
	//Kurzanzeige
	application.activeWindow.command("s k", false);

	//Ausgabe auf dem Dialogformular:
	document.getElementById("idLabelErgebnis1").hidden = false;
	document.getElementById("idLabelErgebnis1").value = ergebnis;
	document.getElementById("idLabelErgebnis2").hidden = false;
	document.getElementById("idLabelErgebnis2").value = "Sie finden die Ergebnisdatei im unten genannten Verzeichnis. Pfad befindet sich im Zwischenspeicher.";
	document.getElementById("idTextboxPfad").value = listenPfad;
	document.getElementById("idTextboxPfad").hidden = false;
}

//**************************************************************************
function wikiWinibw() {
	//Hilfe allgemein
	application.shellExecute("https://wiki.k10plus.de/x/agDUAw", 5, "open", "");
}

function wikiAnzeigen2() {
	//Hilfe Konfiguration
	application.shellExecute("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-KonfigurationdesExcel-Werkzeugs", 5, "open", "");
}

function wikiAnzeigen3() {
	//Hilfe Trennzeichen
	application.shellExecute("https://wiki.k10plus.de/x/agDUAw#Excel-Tabelleerstellen-Trennzeichen", 5, "open", "");
}

//----------------------------------------------------------------------------
function allesZuruecksetzen() {
	document.getElementById("idLabelErgebnis1").hidden = true;
	document.getElementById("idLabelErgebnis2").hidden = true;
	document.getElementById("idTextboxPfad").value = "";
	document.getElementById("idTextboxPfad").hidden = true;
}

//-----------------------------------------------------------------------------
/*
	Registerkarte 2:
	Die Anwender können Felder auswählen
*/
//-----------------------------------------------------------------------------
var arrayTabelle = new Array();

function ladeKonfigurationstabelle() {
	try {
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
		for (zeile = ""; !defInpFile.isEOF();) {
			zeile = defInpFile.readLine();
			if (zeile.substring(0, 2) != "//" && zeile.length !== 0) {
				arrayTabelle[i] = zeile;
				i++;
			}
		}
		//alert("!"+arrayTabelle.join("\n")+"!");

		var treeView = {
			rowCount: arrayTabelle.length,
			getCellText: function (row, column) {
				if (column == "idColAlle") return arrayTabelle[row];
			},
			setTree: function (treebox) { this.treebox = treebox; },
			isContainer: function (row) { return false; },
			isSeparator: function (row) { return false; },
			isSorted: function () { return false; },
			getLevel: function (row) { return 0; },
			getImageSrc: function (row, col) { return null; },
			getRowProperties: function (row, props) { },
			getCellProperties: function (row, col, props) { },
			getColumnProperties: function (colid, col, props) { }
		};

		document.getElementById("idTree").view = treeView;
		document.getElementById("idTree").addEventListener("keypress", handle_key_press_auswahl, false);
	} catch (e) { alert('ladeKonfigurationstabelle: ' + e.name + ': ' + e.message); }
}

function ladeKonfigurationstabelleUser() {
	try {
		//in dieser Funktion wird die Konfigurationstabelle gelesen
		//der Inhalt wird auf der zweiten Registerkarte des Dialogformulars angezeigt
		var zeile = "", i = 0, defInpFile = utility.newFileInput(), arrayTabelle = new Array();

		if (!defInpFile.openSpecial("ProfD", "\\csvDefinitionUser.txt")) {
			//Es gibt keine Konfigrationseinstellungen des Benutzers
			return;
		}

		//Alle Zeilen der Datei lesen:
		for (zeile = ""; !defInpFile.isEOF();) {
			zeile = defInpFile.readLine();
			if (zeile.substring(0, 2) != "//" && zeile.length !== 0) {
				arrayTabelle[i] = zeile;
				i++;
			}
		}
		//zeige die Zeilen aus der Konfigurationstabelle im Textfeld an:
		document.getElementById("idAuswahlZeilen").value = arrayTabelle.join("\n");
	} catch (e) { alert('ladeKonfigurationstabelleUser: ' + e.name + ': ' + e.message); }
}

function waehleZeile() {
	var lAuswahl = document.getElementById("idTree").currentIndex;
	if (document.getElementById("idAuswahlZeilen").value === "") {
		document.getElementById("idAuswahlZeilen").value += arrayTabelle[lAuswahl];
	} else {
		//Einfügen auf neuer Zeile:
		document.getElementById("idAuswahlZeilen").value += "\n" + arrayTabelle[lAuswahl];
	}
	bContentsChanged = true;
}

function handle_key_press_auswahl(evt) {
	if (evt.keyCode == Event.prototype.DOM_VK_RETURN) {
		evt.preventDefault();
		evt.preventBubble();
		evt.stopPropagation();
		waehleZeile();
		return;
	}
}

function frageSpeichern() {
	if (bContentsChanged) {
		var prompt = utility.newPrompter();
		prompt.setDebug(true);
		if (prompt.confirmEx("Speichern?", "Änderungen in der Konfiguration speichern?", "Yes", "No", "", "", false) === 0) {
			auswahlSpeichern();
		}
		bContentsChanged = false;
	}
}

function auswahlSpeichern() {
	try {
		var newContents = document.getElementById('idAuswahlZeilen').value;
		var theFileOutput = utility.newFileOutput();
		theFileOutput.createSpecial("ProfD", "\\csvDefinitionUser.txt");
		theFileOutput.setTruncate(true);
		theFileOutput.write(newContents);
		theFileOutput.close();
		theFileOutput = null;

		//wenn alle Zeilen gelöscht, wird Datei gelöscht.
		if (newContents === "") {
			auswahlLoeschen();
		} else {
			//Falls noch die Standardtabelle gewählt ist:
			if (document.getElementById("idRadioTabelle").selectedIndex === 0) {
				var prompt = utility.newPrompter();
				prompt.setDebug(true);
				if (prompt.confirmEx("Neue Auswahl", "Soll Ihre Auswahl von Feldern für die nächste Exceltabelle verwendet werden?",
					"Yes", "No", "", "", false) === 0) {
					document.getElementById("idRadioTabelle").selectedIndex = 1;
					application.writeProfileInt("winibw", "GBVexcelTabelle", 1);
				}
			}
			document.getElementById("idLabelAuswahl").value = "Neue Auswahl gespeichert.";
			bContentsChanged = false;
		}
		var trennzeichen = document.getElementById("idTextboxTrennzeichen").value;
		if (trennzeichen === "") { trennzeichen = "; "; }
		application.writeProfileString("Exceltool", "Trennzeichen", trennzeichen);

		return true;
	} catch (e) { alert('auswahlSpeichern: ' + e.name + ': ' + e.message); }
}

function auswahlLoeschen() {
	//Anwender will  alle Felder aus der eigenen Auswahl entfernen#
	//Textfeld und Konfigurationsdatei werden gelöscht
	var prompt = utility.newPrompter();
	prompt.setDebug(true);
	if (prompt.confirmEx("Alles löschen?", "Soll Ihre Auswahl und Ihre persönliche Konfigurationstabelle " +
		"gelöscht werden? \nFür zukünftige Listen wird die Standardtabelle verwendet.",
		"Yes", "No", "", "", false) === 0) {
		document.getElementById("idAuswahlZeilen").value = "";
		var theFile = utility.newFileInput();
		theFile.openSpecial("ProfD", "csvDefinitionUser.txt");
		theFile.remove();
		//Meldung:
		document.getElementById("idLabelAuswahl").value = "Auswahl gelöscht.";
		//default ist jetzt die Standardtabelle:
		document.getElementById("idRadioTabelle").selectedIndex = 0;
		application.writeProfileInt("winibw", "GBVexcelTabelle", 0);

		//es soll keine Rückfrage kommen, falls zuerst Kategorien eingefügt und dann gelöscht wurden:
		bContentsChanged = false;
	}
}

function einstellungKonfigurationstabelle() {
	//welche Konfigurationstabelle ist im Userprofile eingestellt?
	var auswahlTabelle = application.getProfileInt("winibw", "GBVexcelTabelle", 0);
	if (!auswahlTabelle) { auswahlTabelle = 0; }
	document.getElementById("idRadioTabelle").selectedIndex = auswahlTabelle;
	return auswahlTabelle;
}

function waehleKonfigurationstabelle() {
	//Im Userprofile wird eingetragen, welche  Konfigurationstabelle verwendet werden soll
	var auswahlRadio = document.getElementById("idRadioTabelle").selectedIndex; //gibt 0 oder 1 aus
	//wenn eigene Konfigurationsdatei leer, kann diese nicht ausgewählt werden
	if (auswahlRadio == 1 && document.getElementById('idAuswahlZeilen').value === "") {
		document.getElementById("idRadioTabelle").selectedIndex = 0;
		alert("Ihre Konfigurationsdatei ist leer. Bitte wählen Sie Felder aus der Standardtabelle aus!");
		return;
	}
	application.writeProfileInt("winibw", "GBVexcelTabelle", auswahlRadio);
}

/**
* Debugging function to view objects as text
*
**/
function __objToString(obj) {
	var str = '{';
	if (typeof obj == 'object') {
		for (var p in obj) {
			if (obj.hasOwnProperty(p)) {
				str += "    " + p + ':' + __objToString(obj[p]) + ",\n";
			}
		}
	}
	else {
		if (typeof obj == 'string') {
			return '"' + obj + '"';
		}
		else {
			return obj + '';
		}
	}
	return str.substring(0, str.length - 1) + "}";
}
