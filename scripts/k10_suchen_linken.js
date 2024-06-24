//	Datei:	k10_suchen_linken.js
//	Autorin:	Karen Hachmann, VZG
//	Datum:	2018.07

// ---Beginn Linking -----------------------------------------------
var K10Linking = {
	editWindowID: "",
	alleFenster: "",
	strDocType: "",
	strSerie: "",
	aktuelleSerie: "",
	aktuelleZaehlung: "",
	strLinkingTag: "",
	bSuche: false,
	bSucheLinkExakt: false,
	bSerie: false,
	szZaehlungHR: "",
	szUnterreihe: "",
	szZaehlungUR: "",
	meldungSerie: "",
//jetzt geht's los:
	pruefung: function(){
		var strSuche, strZeile;
		var regexpTranslit=/\$T\d{2}\$U\w{4}%%/; //Schriftcodefelder $T und $U
		var regexpTranslit_L=/\$T\d{2}\$U\w{4}\$L\w{3}%%/; //Schriftcodefelder $T und $U
		var regexp418x = /418[0-9]/;
		if (!application.activeWindow.title){
		application.messageBox("Suche Link", "Die Funktion 'Suche Link' kann jetzt nicht " +
			"ausgeführt werden.", "error-icon");
		return;
		}
		// bevor ein neues Fenster geöffnet wird, Windowsnapshot herstellen:
		this.editWindowID = application.activeWindow.windowID;
		this.alleFenster = application.windows.getWindowSnapshot();
		this.bSuche = true; // Es wurde gesucht. Variable wird von linkHerstellen geprüft
		this.strDocType = __docType();
		//wenn Serie, dann verzweigen sich die Funktionen:
		this.strLinkingTag = application.activeWindow.title.tag;
		if (regexp418x.test(this.strLinkingTag) == true) {
			this.bSerie = true
			this.serienPruefung();
			return;
		}
		if (this.strDocType == ""){
			application.messageBox("Suche Link", "Die Angaben in Feld 0500 / 005 sind unvollständig!",
				"error-icon");
			return;
		}
		this.strDocType = this.strDocType.substring(0,2);
		//nach der freienLink-Suche:
		//falls etwas markiert ist, soll dies gesucht werden:
		strSuche = application.activeWindow.title.selection;
		if (strSuche == ""){
			strZeile = application.activeWindow.title.currentField;
			if (strZeile.length <= 6) {
			application.messageBox("Suche Link", "Bitte Suchbegriff(e) eintragen!", "error-icon");
				return;
			}
			application.activeWindow.title.startOfField(false);
			application.activeWindow.title.wordRight(1, false);
			if (regexpTranslit_L.test(strZeile) == true){
				application.activeWindow.title.charRight(17, false);
			}
			if (regexpTranslit.test(application.activeWindow.title.currentField) == true){
				application.activeWindow.title.charRight(12, false);
			}
			application.activeWindow.title.endOfField(true);
			strSuche = application.activeWindow.title.selection;
		}
//Die reinen Suchbegriffe ohne folgende Unterfelder
			if (strSuche.indexOf("$4") !=-1)strSuche = strSuche.substring(0,strSuche.indexOf("$4"));
			if (strSuche.indexOf("$B") !=-1)strSuche = strSuche.substring(0,strSuche.indexOf("$B"));
			if (strSuche.indexOf("$p") !=-1)strSuche = strSuche.substring(0,strSuche.indexOf("$p"));
			if (strSuche.indexOf("$h") !=-1)strSuche = strSuche.substring(0,strSuche.indexOf("$h"));
		//alert(strSuche);
		this.linkingKommando(strSuche)
	},
	serienPruefung: function(){
		var thePrompter = utility.newPrompter();
		var str417x;
		var strSerienTitel1, strSerienZaehlung1;
		var strSerienTitel2, strSerienZaehlung2;
		var strFeld = application.activeWindow.title.tag;
		//Unterschiedliche Steuerzeichen alt und neu (RDA)
		this.szZaehlungHR = "$l";
		this.szUnterreihe = "$p";
		this.szZaehlungUR = "$m";
		this.meldungSerie = " wurde kein Steuerzeichen '$l' gefunden.";
		// Sortierzählung eingegeben?
		if (application.activeWindow.title.currentField.indexOf("#") == -1){
			application.messageBox("Suche Link", "Bitte geben Sie zuerst die Sortierzählung in ## ein!", "error-icon");
			return;
		}

		//Vierte Position von 418x:
		strFeld = strFeld.charAt(3);
		strFeld = "417" + strFeld;

		// Inhalt von Feld 417x wird ermittelt:
		str417x = application.activeWindow.title.findTag(strFeld, 0, false, false, false);
		if (str417x == "") {
			application.messageBox("Suche Link", "Feld " + strFeld + " wurde nicht gefunden!", "error-icon");
			return;
		}
		//__meldung("417x: " + str417x);
		var regexpTranslit=/\$T\d{2}\$U\w{4}%%/;
		if (regexpTranslit.test(str417x) == true){
			str417x = str417x.substring(12);//Unterfelder $T und $U werden abgeschnitten
		}

		var lPosUR = str417x.indexOf(this.szUnterreihe);
		// Serie ohne Unterserie:
		if (lPosUR== -1){
			// Prüfung, ob Serie gezählt:
			if (str417x.indexOf(this.szZaehlungHR) == -1 ){
				application.messageBox("Suche Link", "In Feld " + strFeld + this.meldungSerie + "\n" +
					"Ohne dieses Zeichen kann die Zählung nicht per Script ermittelt werden.", "error-icon");
				return;
			} else {
				this.holeTitelUndZaehlung(str417x, "HR");
			}
		} else {
			// Serie mit Unterserie
			var strSerie1 = str417x.substring(0, lPosUR);
			this.holeTitelUndZaehlung(strSerie1, "HR");
			strSerienTitel1 = this.aktuelleSerie;
			strSerienZaehlung1 = this.aktuelleZaehlung;

			var strSerie2 = str417x.substring(lPosUR+2);
			this.holeTitelUndZaehlung(strSerie2, "UR");
			strSerienTitel2 = this.aktuelleSerie;
			strSerienTitel2 = strSerienTitel2.replace(/^ /, ""); //führende Blanks entfernen
			strSerienZaehlung2 = this.aktuelleZaehlung;

			// Beide sind gezählt: Haupt- und Unterreihe
			if ((strSerie1.indexOf(this.szZaehlungHR) != -1) && (strSerie2.indexOf(this.szZaehlungUR) != -1)){
				var auswahlSerie = thePrompter.select("Select", "Welche Schriftenreihe möchten Sie " +
					" suchen?", strSerienTitel1 + "\n" + strSerienTitel2);
				if (!auswahlSerie) {
					return; // Benutzer hat den Dialog abgebrochen
				} else if(auswahlSerie == strSerienTitel1) {
					this.aktuelleSerie = strSerienTitel1;
					this.aktuelleZaehlung = strSerienZaehlung1;
				} else if(auswahlSerie == strSerienTitel2) {
					this.aktuelleSerie = strSerienTitel1 + " " + strSerienTitel2;
					this.aktuelleZaehlung = strSerienZaehlung2;
				}
			}
			// Hauptreihe gezählt, UR nicht:
			else if ((strSerie1.indexOf(this.szZaehlungHR) != -1) && (strSerie2.indexOf(this.szZaehlungUR) == -1)){
				this.aktuelleSerie = strSerienTitel1;
				this.aktuelleZaehlung = strSerienZaehlung1;
			}
			// Hauptreihe nicht gezählt. UR gezählt. UR soll mit Hauptreihe gesucht werden.
			else if ((strSerie1.indexOf(this.szZaehlungHR) == -1) && (strSerie2.indexOf(this.szZaehlungUR) != -1)){
				this.aktuelleSerie = strSerienTitel1 + " " + strSerienTitel2;
				this.aktuelleZaehlung = strSerienZaehlung2;
				//application.messageBox("", str417x, "");
			}
		}
		//entferne die Steuerzeichen (alt und neu) und Zeichen, die die Recherche stören könnten:
		this.aktuelleSerie = this.aktuelleSerie.replace(/\/|\$h|\[|\]|@| - /g," ");
		//alert(this.aktuelleSerie);
		//jetzt wird endlich gesucht:
		this.linkingKommando(this.aktuelleSerie);
	},
	holeTitelUndZaehlung: function(strSerie, typSerie){
		var serienArray = "";
		this.aktuelleSerie = "";
		this.aktuelleZaehlung = "";
		if (typSerie == "HR") {
			serienArray = strSerie.split(this.szZaehlungHR);
		} else {
			serienArray = strSerie.split(this.szZaehlungUR);
		}
		this.aktuelleSerie = serienArray[0];
		this.aktuelleZaehlung = serienArray[1];
		//alert("this.aktuelleSerie: " + this.aktuelleSerie + "\nthis.aktuelleZaehlung: " + this.aktuelleZaehlung);
	},
	linkingKommando: function(strSuchbegriffe){
		var linkKommando, strMessageText, setSize;
		if (this.bSucheLinkExakt == true){
			linkKommando = "\\LNK " + this.strDocType + " D '" + this.strLinkingTag + " " + strSuchbegriffe + "'";
			strMessageText = "Suchbegriffe (exakte Suche): ";
		} else {
			linkKommando = "\\LNK " + this.strDocType + " D " + this.strLinkingTag + " " + strSuchbegriffe;
			strMessageText = "Suchbegriffe (trunkierte Suche): ";
		}
		//seit Windows10 gibt es runtime error wenn die Antwortzeiten zu lang sind.
		try {
			application.activeWindow.command(linkKommando, true);
			//deaktiviert auf der Suche nach dem Runtime-Error: application.activeWindow.appendMessage(strMessageText + strSuchbegriffe, 3);
		} catch (e) {
				__fehler("Suche erzeugte Runtime-Error. Können Sie nach dieser Meldung ohne Neustart der WinIBW3 weiter arbeiten? Bitte berichten an hachmann@gbv.de!");
				return;
		}
		// leider wird immer ein neues Fenster geöffnet, auch bei negativer Ausführung:
		// d.h. NOHITS, kein sinnvoller Suchauftrag, bzw. Feld ist kein Linkingfeld
		// Fenster schließen
		if (application.receivedMessageOnly) {
			application.activateWindow(this.editWindowID);
			application.windows.restoreWindowSnapshot(this.alleFenster);
			// Hier darf nicht this.bSuche auf false gestellt werden,
			// weil nach erfolgloser Suche ein neuer Satz angelegt wird und dann gleich gelinkt wird.
		}
	},
	herstellen: function(){
		var strPPN;
		if ((this.bSuche == false) || (!this.editWindowID)) {
			application.messageBox("Link herstellen", "Es muss zuerst die Funktion 'Suche Link' ausgeführt werden.", "error-icon");
			return;
		}
		if ((__screenID() != "7A") && (__screenID() != "8A")){
			application.messageBox("Link herstellen", "Datensatz muss sich in der Vollanzeige oder Kurzanzeige befinden.", "error-icon");
			return;
		}
		if (__screenID() != "8A"){
			//wir brauchen die Vollanzeige, um danach 005 prüfen zu können
			application.activeWindow.command("\\too d", false);
		}
		//kein Linking mit diesem Normsatztyp: /T[bgpsu]v1e/
		var str005 = application.activeWindow.findTagContent("005", 0, true, true).substr(4,5);
		if(/T[bgpsu]v1e/.test(str005) == true){
			application.messageBox("Link herstellen", "Mit Hinweissätzen (Materialtyp: " + str005 + ") soll nicht verknüpft werden!", "error-icon");
			return;
		}
		strPPN = application.activeWindow.getVariable("P3GPP")
		application.activateWindow(this.editWindowID);
		application.windows.restoreWindowSnapshot(this.alleFenster);
		if (!application.activeWindow.title){
			application.messageBox("Link herstellen", "Es wurde kein Bearbeitungsschirm gefunden!", "error-icon");
			return;
		}
		application.activeWindow.title.selection;
		//zuerst soll dies geprüft werden: Link mit Schriftenreihe?
		if (this.bSerie == true){
			__blanksVorangehendeLoeschen();
			application.activeWindow.title.endOfField(false);
			//alert("this.szZaehlungHR: " + this.szZaehlungHR + "\nthis.aktuelleZaehlung: " + this.aktuelleZaehlung);
			application.activeWindow.title.insertText("!" + strPPN + "!" + this.szZaehlungHR + this.aktuelleZaehlung);
			this.zuruecksetzen();
			return;
		}
		// Linking
		//Diese Prüfung wird in pruefung und auch noch mal in herstellen ausgeführt, weil
		//nach der freienLink-Suche benötigt
		this.strLinkingTag = application.activeWindow.title.tag;
		var selektierterText = application.activeWindow.title.selection;
		//01.11.2023: auch in 3050 und 3150 soll $B $4 erhalten bleiben.
		if (/^3[0-1][0-15][0-9]|4040/.test(this.strLinkingTag) == true && /.*?(\$[B4].*)/.test(selektierterText) == true) {
			//ersetze die Suchbegriffe durch PPN-Link und lasse die Beziehungskennzeichen stehen:
			selektierterText = selektierterText.replace(/.*?(\$[B4].*)/,"!" + strPPN + "!" + "$1");
			application.activeWindow.title.insertText (selektierterText);
		}
		//Ausnahme wenn in den Feldern 65xx, 68xx ein |...| Indikator vorkommt:
		else if (/^6[58][0-9][0-9]/.test(this.strLinkingTag) == true && /(\|.\|)/.test(selektierterText) == true) {
			//ersetze die Suchbegriffe durch PPN-Link und lasse den Indikator stehen stehen:
			selektierterText = selektierterText.replace(/(\|.\|).*/,"$1" + "!" + strPPN + "!");
			application.activeWindow.title.insertText (selektierterText);
		} else {
			//ersetze den kompletten selektierten Text durch PPN-Link:
			application.activeWindow.title.insertText ("!" + strPPN + "!");
		}
		this.zuruecksetzen();
	},
	zuruecksetzen: function(){
		this.editWindowID = "";
		this.alleFenster = "";
		this.strDocType = "";
		this.strSerie = "";
		this.aktuelleSerie = "";
		this.aktuelleZaehlung = "";
		this.strLinkingTag = "";
		this.bSuche = false;
		this.bSucheLinkExakt = false;
		this.bSerie = false;
		/*
		__meldung("editWindowID: " + K10Linking.editWindowID + "\n" +
				"alleFenster: " + K10Linking.alleFenster + "\n" +
				"strDocType: " + K10Linking.strDocType + "\n" +
				"strSerie: " + K10Linking.strSerie + "\n" +
				"aktuelleZaehlung: " + K10Linking.aktuelleZaehlung + "\n" +
				"strLinkingTag: " + K10Linking.strLinkingTag + "\n" +
				"bSuche: " + K10Linking.bSuche + "\n" +
				"bSucheLinkExakt: " + K10Linking.bSucheLinkExakt + "\n" +
				"bSerie: " + K10Linking.bSerie + "\n"
			);
		*/
	}
};

function sucheLink()
{
	K10Linking.zuruecksetzen();
	K10Linking.bSucheLinkExakt = false;
	K10Linking.pruefung();
}
function sucheLinkExakt()
{
	K10Linking.zuruecksetzen();
	K10Linking.bSucheLinkExakt = true;
	K10Linking.pruefung();
}

function AnsLinkSuche()
{
	//eigenes Script wird nicht mehr benötigt. Führe freieLinkSuche aus:
	freieLinkSuche();
}

function freieLinkSuche()
{
	K10Linking.zuruecksetzen();
	if (!application.activeWindow.title){
	application.messageBox("Suche Link", "Die Funktion 'Suche Link' kann jetzt nicht " +
		"ausgeführt werden.", "error-icon");
	return;
	}
	// bevor ein neues Fenster geöffnet wird, Windowsnapshot herstellen:
	K10Linking.editWindowID = application.activeWindow.windowID;
	K10Linking.alleFenster = application.windows.getWindowSnapshot();

	var xulFeatures = "centerscreen, chrome, close, titlebar,resizable, modal=no,dependent=yes, dialog=no";
	__open_xul_dialog("chrome://ibw/content/xul/k10_suchBoxFreieLinksuche.xul", xulFeatures);

	K10Linking.bSuche = true; // Es wurde gesucht. Variable wird von linkHerstellen geprüft
}

function linkHerstellen()
{
	K10Linking.herstellen();
	//alert(K10Linking.bSuche);
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
//globale Variable:
var idK10Fenster="";
var idDNBFenster="";
function __fensterK10DNB(){
	//2020.01: Weil im CBS der ZDB für manche Kennungen keine Caption ausgegeben wird,
	//musste diese Funktion erweitert werden
	var windowIDBeginn = application.activeWindow.windowID; //neu
	var fensterId = new Array();
	var allCaptions = new Array();
	var lFenster = application.windows.count;
	//Prüfung, ob schon die IDs bestimmt wurden:
	if (idK10Fenster == "" || idDNBFenster == ""){
		//FensterIDs gibt es noch nicht. Sie werden jetzt bestimmt:
		if (application.activeWindow.getVariable("P3GCN") == "K10plus"){
			idK10Fenster = application.activeWindow.windowID;
		}
		for (var i=0; i < lFenster; i++) {
			fensterId[i] = application.windows.item(i).windowID;
			allCaptions[i] = application.windows.item(i).text;
			//alert(i + ": " + fensterId[i] + " / Caption: " + allCaptions[i]);
			if (allCaptions[i].indexOf("DNB") != -1){
				idDNBFenster = fensterId[i];
				break;
			}
			//2020.01: Ausnahme, wenn caption leer:
			if (allCaptions[i] == ""){
				//gehe zu dem Fenster, in dem die Caption leer ist.
				application.activateWindow(fensterId[i]);
				//alert("Im Fenster ermittelt: " + application.activeWindow.getVariable("P3GCN"));
				if(application.activeWindow.getVariable("P3GCN") == "DNB"){
					idDNBFenster = fensterId[i];
				} else if(application.activeWindow.getVariable("P3GCN") == "K10plus"){
					idK10Fenster = fensterId[i];
				}
				//gehe zurück zum Fenster, in dem die Funktion ausgeführt wurde:
				application.activateWindow(windowIDBeginn);
			}
		}
		if (idDNBFenster == ""){
			__fehler("Keines der geöffneten Fenster zeigt die Datenbank der DNB." +
				"\nEs muss zwei Fenster geben: K10plus + DNB.");
			return false;
		} else {
			//alert("K10plus: " + idK10Fenster + "\nDNB: " + idDNBFenster);
			return true;
		}
	} else {
		//FensterIDs gibt es schon. Sind noch alle Fenster da?
		//Besteht in den Fenstern noch dieselbe Verbindung?
		for (var i=0; i<application.windows.count; i++) {
			fensterId[i] = application.windows.item(i).windowID;
			switch(fensterId[i]){
				case idDNBFenster:
					lFenster = lFenster + 1;
					break;
				case idK10Fenster:
					lFenster = lFenster + 1;
					break;
			}
		}
		if(lFenster < 2){
			__fehler("Es stehen nicht mehr alle Fenster zur Verfügung." +
				"\nBitte prüfen Sie, ob Sie in je einem Fenster mit K10plus und der DNB verbunden sind!" +
				"\nDann beginnen Sie Ihre Arbeit erneut im K10plus-Fenster.");
			idDNBFenster="";
			idK10Fenster="";
			return false;
		} else {
			return true;
		}
	}
}
function pruefeFenster(dasSystem){
	//ist es noch das K10plus- oder DNB-Fenster?
	//alert(application.activeWindow.getVariable("P3GCN") + "\n" + dasSystem);
	if (application.activeWindow.getVariable("P3GCN") != dasSystem){
		application.activeWindow.command("inf", false);
		__fehler("Leider besteht in diesem Fenster keine Verbindung mehr zu: " + dasSystem +
			"\nEmpfehlung: Speichern Sie Ihren Datensatz, schließen Sie WinIBW und starten Sie WinIBW erneut." +
			"\nDieser Fehler wurde nicht von Ihnen, sondern von WinIBW verursacht. Sie brauchen keine Mitteilung zu machen - das Problem ist bekannt aber unlösbar, seufz!");
		return false;
	}
	return true;
}

// --- Scripte von Stefan Haupt am 20.04.2016: --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
var bDNBSuche;
function Tu_in_GND_suchen() {
	__normAusTtl("Tu", "suchen");
	bDNBSuche = true;
}
function Tu_aus_Titel_erstellen() {
	//Funktionname bei der DNB: TuAusTtl()
	//Funktionsname könnte besser heißen: DNB_Normsatz_anlegen
	//Andrea möchte vorerst, dass die Anwender annehmen, es wäre nur für Tu-Sätze anwendbar.
	if(bDNBSuche == true){
		__normAusTtl("Tu", "neuanlegen");
	} else {
		__fehler("Es ist noch nicht gesucht worden. \nBitte verwenden Sie vor dem Eingeben die Funktion 'Tu_suchen'!")
	}
}
function TpSatz_aus_Titel_erstellen() {
	__normAusTtl("Tp");
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
function __normAusTtl(ent, dieAktion) {
	/*--------------------------------------------------------------------------------------------------------
	Soll TpAusTtl und TnAusTtl ersetzen und auf weitere Materialarten erweitern. Wird jeweils mit Übergabe der Entität "ent", die erstellt werden soll, aufgerufen

	Alte Beschreibung: Die Funktion kopiert den Personennamen des aktuellen Feldes, ruft die PND-Tp-Datenmaske auf,
	fügt den Personennamen in Feld 100 ein und positioniert in Feld 043.
	Nach dem manuellen Speichern kann die Verknüpfung im Titeldatensatz mit der Funktion holeIDN realisiert werden.

	Verwendete Unterfunktionen: DatenmaskeTp/Tn/Tf/Tb/Tu/Tg

	Historie:
	2006-12-15 Detlev Horst		: erstellt
	2010-08-12 Bernd Althaus	: Verwendung der Unterfunktion DatenmaskeTp
	2011-11-15 Stefan Grund   : Anpassungen fuer GND
	2013-03-22 Stefan Grund   : Erweiterung auf alle GND-Entitäten
	2016-05-02 Karen Hachmann : Erweiterung, so dass die Funktion vom K10plus-Fenster zur DNB steuert.
	--------------------------------------------------------------------------------------------------------*/
	var normStr="";
	var aut1="";
	var boxtit = ent + "AusTtl";
	var antwort;
	var thePrompter = utility.newPrompter();

	if(__fensterK10DNB() == false){
			return;
	}
	//in beiden Fällen (neuanlegen und suchen) muss vom K10plus-Fenster aus gestartet werden.
	if (application.activeWindow.windowID == idDNBFenster){
		try {
			application.activateWindow(idK10Fenster);
			if (pruefeFenster("K10plus") == false){
				return;
			}
		} catch (e) {
			__fehler("Funktion muss im K10plus-Fenster ausgeführt werden.");
			return;
		}
	}
	var str3210 = "", str4000 = "";
	var lEnde=0;
	if (!application.activeWindow.title) {
		__dnbfehler(boxtit, "Funktion muss im K10plus-Fenster aus der Korrektur- oder Erfassungsanzeige aufgerufen werden!");
		return(false);
		}
	var matArt = application.activeWindow.title.findTag("0500",0,false,false,false).substr(0,3); //Materialart, um DEA erkennen zu können
	var str0501 = application.activeWindow.title.findTag("0501", 0, false, false, false);
	var str1140 = application.activeWindow.title.findTag("1140", 0, false, false, false);
	if (matArt == "") {
		__dnbfehler(boxtit, "Die Funktion kann erst nach Erfassen einer Materialart in 0500 aufgerufen werden!");
		return(false);
	}
	normStr = application.activeWindow.title.currentField;
	normStr = normStr.substr(5);//Feldinhalt ohne Feld
	application.activeWindow.title.endOfField(false);//Selektion aufheben, weil ansonsten überschrieben werden kann
	if (ent == "Tp") {
		//noch unvollständig!
		//evtl. wie aut1???
//		lEnde = normStr.indexOf("$");
//		if (lEnde > 0){
//			normStr = normStr.substring(0, lEnde);
//		}
//		lEnde = normStr.indexOf("!");
//		if (lEnde > 0){
//			normStr = normStr.substring(0, lEnde);
//		}
		afField = "100";
		if(!application.activeWindow.title){
			//Fehlermeldung kommt aus der Funktion Datenmaske, hier nur Abbruch:
			return;
		}
	} else if ((ent == "Tn") || (ent == "TnStop")){
		Datenmaske_Norm_Tn();
		afField = "100";
	} else if (ent == "Tb") {
		//noch unvollständig!
		afField = "110";
	} else if (ent == "Tf") {
		Datenmaske_Norm_Tf();
		afField = "111";
	} else if (ent == "Tg") {
		Datenmaske_Norm_Tg();
		afField = "151";
	} else if (ent == "Tu") {
		//Ausgangspunkt: Cursor in Feld 4000 oder 4010
		//Aus dem Inhalt von 3210, 4000 oder 4010 soll ein Tu-Satz in der DNB angelegt werden.
		//K10plus-Spezialitäten:
		var strTuSuche = "";
		str3210 = application.activeWindow.title.findTag("3210", 0, false, false, false);
		if (str3210 != ""){
			if (__ppnPruefung(str3210) != "" || str3210.indexOf("$7") != -1){
				//Abbruch, wenn schon Link vorhanden:
				__fehler("In Feld 3210 gibt es schon einen Link zu einem Normsatz!");
				return;
			}
			//nur wenn es 3210 gibt, soll 4000 zu 430 übertragen werden.
			//in allen anderen Fällen:
			str4000 = application.activeWindow.title.findTag("4000", 0, false, false, false);
			if (str4000 != ""){
				str4000 = str4000.replace(/(.*?)\$[a-zA-Z0-9].*/, "$1");
			}
		}
		var startFeld = application.activeWindow.title.tag;
		switch(startFeld){
			case "3210":
				normStr = normStr.replace(/(.*?)\$[hkoA].*/, "$1");
				break;
			case "3211":
				normStr = normStr.replace(/(.*?)\$[hkoA].*/, "$1");
				break;
			case "4000":
				normStr = normStr.replace(/(.*?)\$[a-zA-Z0-9].*/, "$1");
				//falls 3210 vorkommt (ohne Link, dies wurde oben geprüft), dann wird der Inhalt von 3210 genommen.
				if (str3210 != ""){
					normStr = str3210;
					normStr = normStr.replace(/(.*?)\$[hkoA].*/, "$1");
				}
				break;
			case "4010":
				normStr = normStr.replace(/(.*?)\$[a-zA-Z0-9].*/, "$1");
				break;
			default:
				__fehler("Der Cursor muss entweder in Feld 4000, 4010, 3210 oder 3211 stehen!");
				return;
		}
		strTuSuche = "f sw " + normStr;
		if ((aut1 = application.activeWindow.title.findTag("3000",0,true,false,false)) || (aut1 = application.activeWindow.title.findTag("3100",0,true,false,false))) {
			aut1 = aut1.replace(/3(\d)00 /,"5$10 ") //Felder austauschen
			aut1 = aut1.replace(/^(\d\d\d .*?)(\$[7B4].*)/,"$1"); //Unterfelder $B etc entfernen
			aut1 = aut1.replace(/^(\d\d\d )(.*?)(!.*?!)(.*?)/,"$1$4"); //wenn PPN vorkommt, wird Expansion entfernt
			aut1 = aut1.replace(/^(\d\d\d .*?)( ; ID:.*)/,"$1"); //Expansion bis ID übernehmen
			aut1 = aut1.replace(/^(\d\d\d .*?)( \*.*\*)/,"$1"); //Expansion ohne Lebensdaten übernehmen
			aut1 = aut1.replace(/\$P/,""); //Unterfeldkennzeichen $P nur entfernen
			aut1 = aut1.replace(/\$[chln]/g," "); //Unterfeldkennzeichen durch Blank ersetzen
			strTuSuche = strTuSuche + " and rl " + aut1.substring(4);
			//alert(aut1);
		}
		//alert(strTuSuche);
		//Für Suchen oder Neuanlegen wird jetzt das DNB-Fenster in den Vordergrund geholt:
		try {
			application.activateWindow(idDNBFenster);
			//ist es noch das DNB-Fenster?
			if (pruefeFenster("DNB") == false){
				return;
			}
		} catch (e) {
			__fehler("DNB-Fenster wurde nicht gefunden.");
			return;
		}
		//Suchen eines Werk-Normsatzes:
		if(dieAktion == "suchen"){
			application.activeWindow.command(strTuSuche, false);
			if (application.activeWindow.status != "NOHITS") {
				//Wenn Suche erfolgreich:
				application.activeWindow.showMessage("Recherche nach Normsatz in der DNB: " + strTuSuche, 3);
				return;
			} else {
				//Wenn nichts gefunden, Antwort 0 = Ja / 1 = Nein
				antwort = thePrompter.confirmEx("Normsatzsuche Tu", "Suche: " + strTuSuche +
				"\nSuche nach Normsatz in der DNB war erfolglos." +
				"\nWollen Sie jetzt einen neuen Normsatz in der GND anlegen?", "Ja", "Nein", "", "", "")
				if (antwort == 1){
					application.activateWindow(idK10Fenster);
					return; //Nein: Abbruch
				}
			}
		}
		//Jetzt wird der Normsatz in der DNB angelegt
		switch(ent){
			case "Tb":
				Datenmaske_Tb_Koerperschaft();
				break;
			case "Tp":
				Datenmaske_Tp_Person();
				break;
			case "Tu":
				Datenmaske_Tu_Werk();
				break;
		}
		if(!application.activeWindow.title){
			//Fehlermeldung kommt aus der Funktion Datenmaske, hier nur Abbruch:
			return false;
		}
		if (aut1 != "") {
			__geheZuKat(aut1,"",true);
			application.activeWindow.title.insertText(aut1.substr(4));
		}
/* Weil in Datenmaske enthalten, wird es nicht mehr benötigt:
		if (ent=="Tu" && application.activeWindow.title.findTag("011", 0, true, true, false)){
			application.activeWindow.title.endOfField(false);
			application.activeWindow.title.insertText("f");
		}*/
		//Inhalt von 4000 in 430 einfügen, aber nicht bei Musikalien 1140 muno oder muto
		if (str4000 != "" &&  (str1140.indexOf("muno") != -1 && str1140.indexOf("muto")) != -1) {
			__geheZuKat("430","",true);
			application.activeWindow.title.insertText(str4000);
		}
		//normStr = normStr.replace(/(.*?) [:\/].*/,"$1");
		afField = "130";
	} // Ende Tu-Satz
	__geheZuKat(afField,"",true);
	application.activeWindow.title.insertText(normStr);

	//Bei Tn kann gleich verknüpft werden. Sonst bleibt Normdatensatz im Editiermodus. Bei TnStop wird noch 400 hinzugefügt
	if (ent == "Tn") {
		application.activeWindow.simulateIBWKey("FR");
		tnPPN = "!" + (application.activeWindow.getVariable("P3GPP")) + "!";
		application.activeWindow.closeWindow();
		application.activeWindow.title.insertText(tnPPN);
		return;
	} else if (ent == "TnStop") {
		application.activeWindow.title.insertText("\n400 ");
	} else {
		application.activeWindow.title.findTag("008", 0, false, true, false);
	}
	application.activeWindow.showMessage ("Bitte vervollständigen Sie den Normsatz, speichern Sie ihn und stellen Sie danach den Link her.", 3);
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
function __dnbfehler(strCaption, meldungstext)
{
	application.messageBox(strCaption, meldungstext, "error-icon");
}
//--- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
function Tu_GNDLink_zu_K10plus(){
	//GND-Nr. wird als $7-Link im Titel eingetragen
	var meldungFeld="";
	var str3210="";
	if (application.activeWindow.getVariable("P3GCN") != "DNB"){
		__fehler("Linking von DNB zu K10plus hier nicht möglich. Dies ist nicht das DNB-Fenster!");
		return;
	}
	if (__screenID() != "8A"){
		application.messageBox("Tu_Link_zu_K10plus", "Datensatz muss sich in der Vollanzeige befinden.", "error-icon");
		return;
	}
	var strPPN = application.activeWindow.getVariable("P3GPP");
	if (strPPN == ""){
		__fehler("Kein Datensatz / keine PPN");
		return;
	}
	//wir gehen zurück zum K10plus-Fenster:
	try {
		application.activateWindow(idK10Fenster);
		if (pruefeFenster("K10plus") == false){
			return;
		}
	} catch (e) {
		__fehler("K10plus-Fenster wurde nicht gefunden.");
		return;
	}
	if(!application.activeWindow.title){
		__fehler("Es befindet sich kein Titel im Editiermodus!");
		return;
	}
	switch (application.activeWindow.title.tag){
		case "3210":
			str3210 = application.activeWindow.title.currentField;
			application.activeWindow.title.startOfField(false);
			application.activeWindow.title.endOfField(true);
			//Einfügen des $7Links vor den Unterfeldern h, k, o oder A:
			if(/3210 .*?(\$[hkoA].*)/.test(str3210)){
				application.activeWindow.title.insertText("3210 $7gnd" + strPPN + RegExp.$1);
			} else {
				//wenn Unterfelder nicht vorhanden:
				application.activeWindow.title.insertText("3210 $7gnd" + strPPN);
			}
			//application.activeWindow.title.insertText("3210 $7gnd" + strPPN);
			meldungFeld = "3210";
			break;
		case "3211":
			application.activeWindow.title.startOfField(false);
			application.activeWindow.title.endOfField(true);
			application.activeWindow.title.insertText("3211 $7gnd" + strPPN);
			meldungFeld = "3211";
			break;
		case "4000":
			str3210 = application.activeWindow.title.findTag("3210", 0, true, true, true);
			meldungFeld="3210";
			if(str3210 != ""){
				//Einfügen des $7Links vor den Unterfeldern h, k, o oder A:
				if(/3210 .*?(\$[hkoA].*)/.test(str3210)){
					application.activeWindow.title.insertText("3210 $7gnd" + strPPN + RegExp.$1);
				} else {
					//wenn Unterfelder nicht vorhanden:
					application.activeWindow.title.insertText("3210 $7gnd" + strPPN);
				}
			} else {
				//wenn noch nicht vorhanden wird 3210 ergänzt:
				feldEinfuegenNummerisch("3210", "$7gnd" + strPPN);
			}
			break;
		case "4010":
			//Einfügen des Feldes 3211 vor der nächsthöheren Feldnummer
			feldEinfuegenNummerischOhnePruefung("3211", "$7gnd" + strPPN);
			meldungFeld = "3211";
			break;
		default:
			__fehler("Es wurde nichts eingefügt. \nSetzen Sie den Cursor entweder in Feld 4000, 4010, 3210 oder 3211. \nDanach gehen Sie wieder zum DNB-Fenster!");
			break;
	}
	application.activeWindow.showMessage ("$7-Link  eingefügt.", 3);
	application.activeWindow.appendMessage ("Feld " + meldungFeld + ": $7-Link wird über Nacht zu einem PPN-Link umgewandelt.", 3);
	bDNBSuche = false;
}

function __docType(){
	//Bei Neuaufnahmen gibt application.activeWindow.materialCode keinen
	//Rückgabewert aus
	var str0500 = application.activeWindow.title.findTag("0500", 0, false, false, true);
	if (str0500 != ""){
		return str0500;
	} else {
		return application.activeWindow.title.findTag("005", 0, false, false, true)
	}
}