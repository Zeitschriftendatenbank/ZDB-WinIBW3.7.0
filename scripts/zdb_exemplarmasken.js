//Datei:	exemplarmasken.js
//Autor:	Karen Hachmann, GBV
//Datum:	Juli, Oktober 2006
//

function Exemplarmasken_bearbeiten()
{
	open_xul_dialog("chrome://ibw/content/xul/gbv_exemplarmasken_dialog.xul", null);
}
//----------------------------------------


function ExemplarmaskeA()
{
	//der Wert "_a" wird in den Parametern uebergeben und in der
	//aufgerufenen Funktion in die Variable exMusterNr geschrieben
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
function ExemplarmaskeOpus()
{
	__exemplarmaskeEinfuegen("_opus");
}
function ExemplarmaskeZDB()
{
	__exemplarmaskeEinfuegen("_zdb");
}

function __exemplarmaskeEinfuegen(exMusterNr)
{
	var erstesEx, letztesEx, naechstesEx;
	var maskenInhalt = "";
	var exKommando = "";
	var checkboxExEingabe = application.getProfileString("Exemplareingabe", "checkboxExEingabe", "");
	naechstesEx = "";
	
	erstesEx = __exemplarProfilLesenErstes()
	letztesEx = __exemplarProfilLesenLetztes()
	
	maskenInhalt = __exemplarMusterLesen(exMusterNr);
	if (maskenInhalt == "") return; // wenn die Maske nicht existiert, meldet die Funktion "" zurück
	var maskenInhalt = maskenInhalt.replace(/\+\+/, "_cursor_"); //++ wird durch _cursor_ ersetzt,
						//damit nicht in einem Titel vorkommende ++ gelöscht werden
	
	var regexpScreens = /7A|8A|IT|MT|IE|ME/;
	var screen = application.activeWindow.getVariable("scr");
		if (screen.search(regexpScreens) == -1){
		application.messageBox("Exemplar anhängen","In der Anzeige befinden sich keine Titel." +
			"\nAnhängen von Exemplaren jetzt nicht möglich.", "error-icon");
		return;
	}
	
	//Schirm "Exemplar eingeben" oder "Exemplar ändern":
	if ((__screenID() == "IE") || (__screenID() == "ME")){
		var exNrSchirm = application.activeWindow.getVariable("P3GLV");
		naechstesEx = "70" + exNrSchirm.substr(1,2);
	}
	//Schirm: Vollanzeige
	if (__screenID() == "8A" || __screenID() == "7A"){
		__formatD()
		if (__matCode1() == "T") {
		application.messageBox("Exemplar anhängen","Anhängen von Exemplaren an Normdaten " +
			"weder möglich noch erforderlich!", "error-icon");
		return;
		}
		naechstesEx = __titelLesenVollanzeige(erstesEx, letztesEx)
	}

	//Schirm Titel eingeben, Titel ändern
	if (__screenID() == "IT" || __screenID() == "MT") {
		naechstesEx = __titelLesenEditSchirm(erstesEx, letztesEx);
	}
	
	if (naechstesEx > letztesEx){
		application.messageBox("Exemplarmasken", "Es können nur Exemplare bis zur " +
			"Exemplarnummer " + letztesEx + " erfasst werden. \n" +
			"Prüfen Sie ggf. Ihre Einstellungen bei den Exemplarmasken! ", "error-icon")
		return;
	}
	
	if (checkboxExEingabe == "true") {exKommando = "\\inv e" + (naechstesEx-7000)}
	else {exKommando = "\\mut"}
	if (__screenID() == "8A") {application.activeWindow.command(exKommando, false)}
	
	if (!application.activeWindow.title) {application.messageBox ("Exemplar anhängen", 
		"Die Funktion 'Anhängen von Exemplaren' kann nicht ausgeführt werden.", "error-icon");
		return;}
	
	//Jetzt wird das Exemplar eingefügt:	
	application.activeWindow.title.endOfBuffer(false);
	application.activeWindow.title.insertText("\n" + naechstesEx + " " + maskenInhalt);
	
	application.activeWindow.title.startOfBuffer(false);
	var suchePlus = application.activeWindow.title.find("_cursor_", false, false, true);

	if (suchePlus == true){
		//Entfernen der Zeichenfolge _cursor_, der Cursor bleibt hier stehen:
		application.activeWindow.title.deleteSelection();
	}
}

function __exemplarMusterLesen(exMusterNr)
{
	var theFileInput = utility.newFileInput();
	var theLine;
	
	//der Inhalt der Variablen exMusterNr wurde von einer der obigen Funktionen
	//ExemplarmaskeA-K als Parameter uebergeben
	var fileName = "\\exemplarmasken\\exmuster" + exMusterNr + ".txt";
	
	// exemplarmaskendatei im Verzeichnis winibw/profiles/<user>/exemplarmasken oeffnen,
	// falls nicht vorhanden, wird das Verzeichnis winibw/datenmasken verwendet
	if (!theFileInput.openSpecial("ProfD", fileName)) {
		if (!theFileInput.openSpecial("BinDir", fileName)) {
			application.messageBox("Exemplar anhängen","Exemplarmaske für Exemplar exmuster" + exMusterNr + 
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

function __exemplarProfilLesenErstes()
{
	var exNrAnfang = application.getProfileString("Exemplareingabe", "exNrAnfang", "");
	
	if (exNrAnfang == "") {return 7001;} 
	else {return exNrAnfang;}

}

function __exemplarProfilLesenLetztes()
{
	var exNrEnde = application.getProfileString("Exemplareingabe", "exNrEnde", "");
	
	if (exNrEnde == "") {return 7099}
	else {return exNrEnde};
}

function __titelLesenEditSchirm(erstesEx, letztesEx)
{
	var i, strTag;
	for (i=erstesEx; i<=letztesEx; i++){
		strTag = application.activeWindow.title.findTag(i, 0, true, false, false);
		if (strTag == "") break;
	}
	return i;
}

function __titelLesenVollanzeige(erstesEx, letztesEx)
{
	var i, strTitle, strTag;
	strTitle = application.activeWindow.copyTitle();
	//__meldung (erstesEx + "\n" + letztesEx);

	for (i=erstesEx; i<=letztesEx; i++){
			strTag = __kategorieInhalt(strTitle, String(i), false);
			if (strTag == "") break;
		}
	return i;

}