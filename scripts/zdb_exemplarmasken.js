// Datei:	k10_exemplarmasken.js
// Autorin:	Karen Hachmann
// Datum:	2018.07

//Globale Variable:
bExemplareSet = false;
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

function Exemplarmasken_bearbeiten()
{
	open_xul_dialog("chrome://ibw/content/xul/k10_exemplarmasken_dialog.xul", null);
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
function ExemplarmaskeA()
{
	//der Wert "_a" wird in den Parametern uebergeben und in der
	//aufgerufenen Funktion in die Variable exMaskeNr geschrieben
	__exemplarmaskeEinfuegen("_a");
}
function ExemplarmaskeB()
{
	__exemplarmaskeEinfuegen("_b");
}
function ExemplarmaskeC()
{
	__exemplarmaskeEinfuegen("_c");
}
function ExemplarmaskeD()
{
	__exemplarmaskeEinfuegen("_d");
}
function ExemplarmaskeE()
{
	__exemplarmaskeEinfuegen("_e");
}
function ExemplarmaskeF()
{
	__exemplarmaskeEinfuegen("_f");
}
function ExemplarmaskeG()
{
	__exemplarmaskeEinfuegen("_g");
}
function ExemplarmaskeH()
{
	__exemplarmaskeEinfuegen("_h");
}
function ExemplarmaskeI()
{
	__exemplarmaskeEinfuegen("_i");
}
function ExemplarmaskeK()
{
	__exemplarmaskeEinfuegen("_k");
}
function ExemplarmaskeZDB()
{
	__exemplarmaskeEinfuegen("_zdb");
}
function __ExemplarmaskeSet()
{
	//wird von function exemplareAnhaengenSet() verwendet.
	bExemplareSet = true;
	__exemplarmaskeEinfuegen("_set");
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
function __exemplarmaskeEinfuegen(exMaskeNr)
{
	//Juli 2024: ZDB stellt um auf CBS 9 und von 70xx auf Exxx
	var naechstesEx = "";
	var maskenInhalt = "";
	var exKommando = "";
	var checkboxExEingabe = application.getProfileString("Exemplareingabe", "checkboxExEingabe", "");
	var material="";
	var strErstesEx = application.getProfileString("Exemplareingabe", "exNrAnfang", "");
	if (strErstesEx==""){
		strErstesEx=1;
	}
	var strLetztesEx = application.getProfileString("Exemplareingabe", "exNrEnde", "");
	if (strLetztesEx==""){
		strLetztesEx = 999;
	}
	var lErstesEx = parseInt(strErstesEx,10);
	var lLetztesEx = parseInt(strLetztesEx,10);
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
	maskenInhalt = __exemplarMaskeLesen(exMaskeNr);
	if (maskenInhalt == "") return; // wenn die Maske nicht existiert, meldet die Funktion "" zurück
	var maskenInhalt = maskenInhalt.replace(/\+\+/, "_cursor_"); //++ wird durch _cursor_ ersetzt,
						//damit nicht in einem Titel vorkommende ++ gelöscht werden

	var regexpScreens = /7A|8A|IT|MT|IE|ME/;
	var derSchirm = application.activeWindow.getVariable("scr");
		if (derSchirm.search(regexpScreens) == -1){
		application.messageBox("Exemplar anhängen","In der Anzeige befinden sich keine Titel." +
			"\nAnhängen von Exemplaren jetzt nicht möglich.", "error-icon");
		return;
	}
	//Schirm "Exemplar eingeben" oder "Exemplar ändern":
	//in diesem Fall kann keine URL aus der Titelaufnahme übernommen werden.
	if (derSchirm == "IE" || derSchirm == "ME"){
		var exNrSchirm = application.activeWindow.getVariable("P3GLV");
		naechstesEx = exNrSchirm.substr(1,2);
	}
	//Schirm: Vollanzeige
	if (derSchirm == "8A" || derSchirm == "7A"){
		__formatD();
		naechstesEx = __rechneNaechstesEx("8A", lErstesEx, lLetztesEx);
		material = __matCode1();
	}
	if(application.activeWindow.title){
		material = application.activeWindow.title.findTag("0500", 0, false, false, false);
		material = material.charAt(0);
	}
	//Vorab Prüfung, ob Einstellungen in Registry für URL-Übernahme vorhanden:
	if (material == "O") {
		//Einstellungen in Registry lesen. Sie wurden über Exemplarmasken-Dialog erfasst.
		//0 = ja mit URL; 1 = nein ohne URL
		if (application.getProfileString("Exemplareingabe", "exUrl", "") == ""){
			//es war noch nichts eingestellt. Das kann der Benutzer jetzt nachholen:
			application.writeProfileInt("einstellungenKat", "registerkarte", 2);//das Zurücksetzen findet im XUL-Formular statt
			var xulFeatures = "centerscreen, chrome, close, titlebar,modal=no,dependent=yes, dialog=yes";
			open_xul_dialog("chrome://ibw/content/xul/k10_exemplarmasken_dialog.xul", xulFeatures);
			return;
		}
	}
	//Schirm Titel eingeben/ändern
	if (derSchirm == "IT" || derSchirm == "MT") {
		naechstesEx = __rechneNaechstesEx(derSchirm, lErstesEx, lLetztesEx);
	}
	if (naechstesEx > lLetztesEx){
		application.messageBox("Exemplarmasken", "Es können nur Exemplare bis zur " +
			"Exemplarnummer " + lLetztesEx + " erfasst werden. \n" +
			"Prüfen Sie ggf. Ihre Einstellungen bei den Exemplarmasken! ", "error-icon")
		return;
	}
	//Eingabe im Exemplaredit-Schirm:
	if ((checkboxExEingabe == "true") || (bExemplareSet == true)) {
		exKommando = "\\inv e" + (naechstesEx);
	} else {
		exKommando = "\\mut"
	}
	if (__screenID() == "8A") {
		application.activeWindow.command(exKommando, false);
	}
	if (!application.activeWindow.title) {
		application.messageBox ("Exemplar anhängen", "Die Funktion 'Anhängen von Exemplaren' kann nicht ausgeführt werden.", "error-icon");
		return;
	}
	naechstesEx = String(naechstesEx);
//alert("naechstesEx: " + naechstesEx + "\nLänge: " + naechstesEx.length + "\n" + "E");
	if(naechstesEx.length == 1){
		naechstesEx = "00" + naechstesEx;
	}
	if(naechstesEx.length == 2){
		naechstesEx = "0" + naechstesEx;
	}
	application.activeWindow.title.endOfBuffer(false);
	application.activeWindow.title.insertText("\n" + "E" + naechstesEx + " " + maskenInhalt);

	//bei elektronischen Aufnahmen sollen evtl. URLs in das Exemplar kopiert werden
	if (material == "O") {
		if (application.getProfileString("Exemplareingabe", "exUrl", "") == 0){
			__urlExemplar();
		}
	}
	application.activeWindow.title.startOfBuffer(false);
	var suchePlus = application.activeWindow.title.find("_cursor_", false, false, true);

	if (suchePlus == true){
		//Entfernen der Zeichenfolge _cursor_, der Cursor bleibt hier stehen:
		application.activeWindow.title.deleteSelection();
	}
	//diese Information wird von den Profildiensten für die Eingabe der Order im ACQ benötigt:
	return naechstesEx;
}

function __exemplarMaskeLesen(exMaskeNr)
{
	var theFileInput = utility.newFileInput();
	var theLine;
	//der Inhalt der Variablen exMaskeNr wurde von einer der obigen Funktionen
	//ExemplarmaskeA-K als Parameter uebergeben
	var fileName = "\\exemplarmasken\\exmuster" + exMaskeNr + ".txt";
	// exemplarmaskendatei im Verzeichnis winibw/profiles/<user>/exemplarmasken oeffnen,
	// falls nicht vorhanden, wird das Verzeichnis winibw/datenmasken verwendet
	if (!theFileInput.openSpecial("ProfD", fileName)) {
		if (!theFileInput.openSpecial("BinDir", fileName)) {
			application.messageBox("Exemplar anhängen","Exemplarmaske für Exemplar " + exMaskeNr +
				" wurde nicht gefunden.", "error-icon");
			return maskenInhalt = "";
		}
	}
	for (maskenInhalt = ""; !theFileInput.isEOF(); ) {
		maskenInhalt += theFileInput.readLine() + "\n"
	}
	theFileInput.close();
	return maskenInhalt;
}

function __rechneNaechstesEx(derSchirm, lErstesEx, lLetztesEx)
{
	var naechstesEx=0;
	var sucheFeld="";
	var i, strTag;
	var strTitle = application.activeWindow.copyTitle();
	for (i=lErstesEx; i<=lLetztesEx; i++){
		if(i<10){
			sucheFeld = "E"+"00"+String(i);
		} else if (i >=10 && i < 100) {
			sucheFeld = "E"+"0"+String(i);
		} else {
			sucheFeld = "E"+String(i);
		}
		//im Editschirm:
		if (derSchirm == "IT" || derSchirm == "MT"){
			strTag = application.activeWindow.title.findTag(sucheFeld, 0, true, false, false);
			if (strTag == "") {
				break;
			}
		}
		//in der Vollanzeige:
		if (derSchirm == "8A"){
			strTag = __feldInhalt(strTitle, sucheFeld, false);
			if (strTag == "") {
				break;
			}
		}
	}
	//Rückgabewert ist eine Ziffer:
	return i;
}

function exemplareAnhaengenSet() {
	var thePrompter = utility.newPrompter();
	var antwort;
	var bURL = application.getProfileString("Exemplareingabe", "exUrl", "");//wenn bURL == 0, dann soll 7133 eingefügt werden.
	var strURL="";
	var i = 0;
	var exNeu = 0;
	var alleFehler = "";

	if(__screenID() != "7A"){
		application.messageBox("exemplareAnhaengenSet", "Die Funktion 'exemplareAnhaengenSet' muss in der Kurzanzeige " +
			"ausgeführt werden." , "alert-icon");
		return;
	}
	// Größe des Sets ermitteln
	var setSize = application.activeWindow.getVariable("P3GSZ");
	if (setSize > 2000){
		application.messageBox("exemplareAnhaengenSet", "Setgröße: " + setSize +
			"\nDas Ausführen der Funktion 'exemplareAnhaengenSet' mit mehr als 2000 Titeln ist nicht erlaubt." , "alert-icon");
		return;
	}
	antwort = thePrompter.confirmEx("Set bearbeiten", "Wollen Sie wirklich an alle " + setSize + " Datensätze Exemplare hängen?" +
		"\nEs wird Exemplarmaske 'exemplarmaske_set' verwendet.", "Ja", "Nein", "Exemplarmaske bearbeiten", "", "")
		// 0 = Ja / 1 = Nein / 2 = Exemplarmasken bearbeiten
	if (antwort == 1){
		return;
	} else if (antwort == 2){
		application.activeWindow.appendMessage("Bearbeiten Sie das Exemplarmaske 'exemplarmaske_set.txt'", 2);
		Exemplarmasken_bearbeiten();
		return;
	}

	// Wenn 0 = ja, Datensatz für Datensatz aufrufen:
	for(i=1; i <= setSize; i++) {
		strURL="";
		application.activeWindow.command("s " + i, false);
		if (__matCode1() == "O" && bURL == 0){
			strURL = application.activeWindow.findTagContent("4950", 0, false);
			strURL = stringTrim(strURL);
		}
		//Wenn kein Normsatz: Exemplar ergänzen
		if(__matCode1() != "T") {
			//Exemplar ergänzen
			bExemplareSet = true;
			__ExemplarmaskeSet();
			application.activeWindow.title.endOfBuffer(false);
			application.activeWindow.title.insertText("\n7133 " + strURL);
			application.activeWindow.simulateIBWKey("FR");
			if (application.activeWindow.status == "OK"){
				exNeu = exNeu + 1;
				//allePPN = allePPN + application.activeWindow.getVariable("P3GPP") + " - Exemplar ergänzt\n";
			} else {
				var meldeText =  __alleMeldungen();
				application.activeWindow.simulateIBWKey("FE");
				alleFehler = alleFehler +
					"PPN " + application.activeWindow.getVariable("P3GPP") +
					": " + meldeText;
			}
		} else {
			alleFehler = alleFehler + "PPN " + application.activeWindow.getVariable("P3GPP") +
					": " + "Normsatz\n";
		}
	}
	bExemplareSet = false;
	application.activeWindow.command("s k", false);
	application.activeWindow.clipboard = alleFehler;//+ "\n" + allePPN;

	//Schlussmeldung:
	application.activeWindow.appendMessage("Ergebnis: " + exNeu + " Exemplare in einem Set von " + setSize + " Titeln.", 3);
	if(alleFehler != "") {
		application.messageBox("Bitte beachten Sie die Fehlermeldungen!", "\nFehlermeldungen: \n" + alleFehler +
			"\n\nDie Liste der Fehlermeldungen befindet sich auch in der Zwischenablage." +
			"\nDie Liste kann mit Strg+v in eine Datei eingefügt werden.", "alert-icon");
	}
}

function __urlExemplar()
{
	//im angezeigten Datensatz wird das Feld 4950 gesucht und zu 7133 und 7139 kopiert.
	var oRegExpUrl = /4950|4960|4961/;
	var alleUrl = new Array();
	var i=0;
	var dieZeile = "";
	var letzteZeile;
	var thePrompter = utility.newPrompter();
	var antwort;
	application.activeWindow.title.endOfBuffer(false);
	letzteZeile = application.activeWindow.title.currentLineNumber;
	application.activeWindow.title.startOfBuffer(false);

	for (var n=0; n<= letzteZeile; n++) {
		dieZeile = application.activeWindow.title.currentField;
		if(oRegExpUrl.test(application.activeWindow.title.tag) == true){
			dieZeile = dieZeile.replace(/4950 /, "7133 ");
			dieZeile = dieZeile.replace(/4960 /, "7139 ");
			alleUrl[i] = dieZeile;
			i++;
		}
		application.activeWindow.title.endOfField(false);//wichtig bei mehrzeiligen Inhalten!
		application.activeWindow.title.lineDown (1, false);
	}

	application.activeWindow.title.endOfBuffer(false);
	//wenn es mehr als 1 URL gibt, können die Anwender eine auswählen:
	if(alleUrl.length > 1){
		alleUrl = alleUrl.join("\n");
		antwort = thePrompter.select("Auswahl URL", "Welche URL soll eingefügt werden?", alleUrl);
		if (!antwort) {
		// Benutzer hat den Dialog abgebrochen:
			return;
		} else {
			application.activeWindow.title.insertText (antwort + "\n");
		}
	} else {
		application.activeWindow.title.insertText(alleUrl);
	}
}