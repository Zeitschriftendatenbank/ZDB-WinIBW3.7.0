//============================================================================
// Erstellt: GBV, Karen Hachmann
//           2009.02
// letzte Änderung: 2012-11-26 Klee ZDB
//============================================================================

// Pull in the WinIBW application object:
var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
                    .getService(Components.interfaces.IApplication);

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

/*
Ein Problem, das ich nicht lösen kann: Wenn in der Schleife der abzuarbeitenden Datensätze eine
Fehlermeldung erscheint, dann wird die Schleife unterbrochen. Auch wenn man die Popup-Meldungen
ausschaltet, ist dies so. Denn beim Abbrechen der Bearbeitung mit Escape wird nochmals nachgefragt: "Vorgang abbrechen?".
Diese Meldung kann ich nicht abfangen
Test: Ein Script im Verzeichnis scripts bearbeitet ein Set. Fehlermeldungen können mit "FE" übergangen werden.
DASSELBE Script in das Dialogformular eingefügt bringt bei jedem Fehler nach "FE" die Meldung "Vorgang abbrechen?"

Jian schrieb am 23.04.2010, dass leider nur bei den Standardscripten die Meldung übergangen wird.
Bei XUL soll dies mit einer  zukünftigen WinIBW3-Version auch möglich sein.
*/


//Globale Variable: -------------------------------------------------------
var lProfileAlert,lProfileError, lProfileMessage;
var strEln;
var strErsetze = "";
var strSuche = "";
var Kat1 = "";
var Kat2 = "";
var bcaseSensitive = "";
var bwholeWord = false;
var bFehler = false;
var strfehlerMeldungen = "";



var listenPfad = "";
var lBearbeitet = 0;
var strEbene = "";
var strSatzart = "";
var hinweisVZG = "Sie haben Kategorien der bibliographischen Ebene (Titelebene) ausgewählt. " +
        "\nDas Bearbeiten ganzer Sets auf bibliographischer Ebene ist der Verbundzentrale vorbehalten."
var hinweisAusnahme = "Ausnahme: Td-, Te- und Tw-Sätze dürfen bearbeitet werden";
//Variable des Zufügen-Tabs:
var wennKat = "";
var wennText = "";
var dannKat = "";
var dannText = "";
var loescheKat = "";

//-------------------------------------------------------------------------

function onLoad()
{
    //dies deaktivierte Feld zeige ich nur, um dem Anwender zu zeigen, dass bibliographische Daten
    //nicht bearbeitet werden können.
    strEln = application.activeWindow.getVariable("libID");

    if (strEln != ("8007" || "9001" || "9006" || "9002")){
        document.getElementById("idCheckboxExemplar").checked = true;
        document.getElementById("idCheckboxExemplar").disabled = true;
    } else {
        //nur für VZG sichtbar:
        //document.getElementById("tabLoeschen").hidden=false;
        document.getElementById("tabLoeschen").label="Löschen von Kategorien";
        document.getElementById("idSeite3").hidden=false;
    }

    //Einstellungen der Meldungen holen und speichern:
    lProfileAlert = application.getProfileInt("winibw.messages", "alert", "");
    lProfileError = application.getProfileInt("winibw.messages", "error", "");
    lProfileMessage = application.getProfileInt("winibw.messages", "message", "");
    //alert(lProfileAlert + "\n" + lProfileError + "\n" + lProfileMessage);

    //Einstellen aller Meldungsarten nur in Meldezeile:
    application.writeProfileInt("winibw.messages", "alert", 1);
    application.writeProfileInt("winibw.messages", "error", 1);
    application.writeProfileInt("winibw.messages", "message", 1);
}

function onCancel()
{
    //Zurücksetzen aller Meldungsarten auf den vorher eingestellten Stand:
    application.writeProfileInt("winibw.messages", "alert", lProfileAlert);
    application.writeProfileInt("winibw.messages", "error", lProfileError);
    application.writeProfileInt("winibw.messages", "message", lProfileMessage);
//	alert(application.getProfileInt("winibw.messages", "alert", "") + "\n" +
//		application.getProfileInt("winibw.messages", "error", "") + "\n" +
//		application.getProfileInt("winibw.messages", "message", "") + "\n");
}

function onAccept()
{
    //nix weil es 2 Tabs gibt
}

function focusFeldidSuche()
{
    document.getElementById("idSuche").focus();
}

function focusFeldidWennKat()
{
    document.getElementById("idWennKat").focus();
}

function focusFeldidLoescheKat()
{
    document.getElementById("idLoescheKat").focus();
}

function testEbene(kategorie)
{
//	Einschränkungen für Bibliotheken:
//	Nur die Lokal- und Exemplarebene darf bearbeitet werden:
    //Voreinstellung:
    strEbene="0";
    var oRegExpKatLok = /(2080|348[01]|354[0-9]|471[056]|476[34]|60[0-9xX][0-9xX]|6100|65[0-9xX][0-9xX])/;
    //ergänzt 8000-8099 für SIM:
    // edited ZDB
    //var oRegExpKatExe = /(43[0-9][0-9]|480[12347]|67[0-9xX][0-9xX]|68[0-9xX][0-9xX]|70[0-9xX][0-9xX]|710[0-9]|712[0123]|713[39]|7200|73[0-9][0-9]|7800|7901|80[0-9][0-9]|8100|8200|8510|8519|8600)/;
    var oRegExpKatExe = /(480[012]|4820|4822|6700|70[0-9xX][0-9xX]|710[0-9]|7120|713[345678]|714[0-9]|715[09]|7[89]00|8001|803[12345]|8[12]00|844[89]|846[567]|8510|859[45678])/;

    if (oRegExpKatLok.test(kategorie)== true) strEbene = "1";
    else if (oRegExpKatExe.test(kategorie)== true) strEbene = "2";

    //alert ("Kategorie: " + kategorie + "\nEbene: " + strEbene);

    return strEbene;
}

function zaehleDatensaetze()
{
    var strPPN, i;
    var alleMeldungen = "";
    if (application.activeWindow.status == "ERROR"){
        bError = true;
        strPPN = application.activeWindow.getVariable("P3GPP");
        for (i=0; i < application.activeWindow.messages.count; i++){
            alleMeldungen += application.activeWindow.messages.item(i).text;

        }
        strfehlerMeldungen += "\r\nPPN: " + strPPN + " / Meldung: " + alleMeldungen;
        //alert(strfehlerMeldungen);
        //Abbruch:
        application.activeWindow.simulateIBWKey("FE");
        return;
    } else if (application.activeWindow.messages.item(0).text == "OK") {
        //ansonsten wäre der Status auch "OK" aber Meldung: "Der Datensatz wurde NICHT verändert"
        lBearbeitet = lBearbeitet  + 1;
        return;
    }
}
//----------- Fehlerdatei -----------------------------
/*function getSpecialPath(theDirName, theRelativePath)
{
    //gibt den Pfad als String aus
    const nsIProperties = Components.interfaces.nsIProperties;
    var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(nsIProperties);
    var theFile = dirService.get(theDirName, Components.interfaces.nsILocalFile);
    theFile.appendRelativePath(theRelativePath);
    return theFile.path;
}
*/

function getSpecialDirectory(name)
{
    //gibt ein Object zurück
    const nsIProperties = Components.interfaces.nsIProperties;
    var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(nsIProperties);
    return dirService.get(name, Components.interfaces.nsIFile);
}

function fehlerDateiAnlegen()
{
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
    theDir = null;
    //Listendatei wird angelegt:
    var theFileOutput = utility.newFileOutput();
    //relativer Pfad + Dateiname:
    var theRelativePath = "listen\\fehlerprot_" + datumHeute() + ".txt";
    //Datei wird angelegt:
    theFileOutput.createSpecial("ProfD", theRelativePath);
    //listenPfad als String:
    listenPfad = theFileOutput.getSpecialPath("ProfD", theRelativePath);
    //alert(listenPfad);
    theFileOutput.write(strfehlerMeldungen, strfehlerMeldungen.length);

    //am Ende Fehlerdatei schließen:
    theFileOutput.close();
    theFileOutput = null;
    return;
}

function fehlerDateiOeffnen()
{
    application.shellExecute (listenPfad, 5, "open", "");
    return;
}

//----------------------------------------------------------------
// Tab 1: Ersetzen von Inhalten in Kategorien
//----------------------------------------------------------------

function bearbeiteSetErsetzen()
{
try{
    var lSetsize;
    var bError = false;
    var prompter = utility.newPrompter();
    var antwort;
    var strTag;
    var datensatzNr = 0;
    var textKategorie;
    strfehlerMeldungen = "";
    strEln = application.activeWindow.getVariable("libID");
//alert("Variable: " + application.activeWindow.getVariable("system"));
    application.writeProfileInt("winibw.messages", "alert", 1);
    application.writeProfileInt("winibw.messages", "error", 1);
    application.writeProfileInt("winibw.messages", "message", 1);


    var screenID = application.activeWindow.getVariable("scr");
    if (screenID != "7A" && screenID != "8A"){
        bFehler = true;
        alert("Datensatz muss sich in der Kurz- oder Vollanzeige befinden!");
        return;
    }

    //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
    lBearbeitet = 0;
    document.getElementById("idSchlussmeldung1").value = " ";
    document.getElementById("idSchlussmeldung2").value = " ";
    document.getElementById("idSchlussmeldung3").value = " ";

    strSuche = document.getElementById("idSuche").value;
    strErsetze = document.getElementById("idErsetze").value;
    Kat1 = document.getElementById("idKategorie1").value;
    Kat2 = document.getElementById("idKategorie2").value;

    //Kontrolle der libID:
    //if ((strEln != ("8007" || "9001" || "9006" || "9002")) && (testEbene(Kat1) == "0")){
    if (checkEln(strEln) && testEbene(Kat1) == "0"){
        var antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\n" + hinweisAusnahme +
            "\nWeitermachen?", "Ja", "Nein", "", "", "");
        if (antwort2 == 1) { // 1 = nein
            return;
        }
    }

    //if (Kat2 != ""){ //so geht's nicht.
    if (Kat2.length != 0){
        if (testEbene(Kat1) != testEbene(Kat2)){
            alert(Kat1 + " und " + Kat2 + " können nicht in demselben Vorgang bearbeitet werden." +
                "\n Grund: Verschiedene Datensatzebenen.");
            return;
        }
    }

    if (strSuche == ""){
        alert("Das Feld 'Suche' muss ausgefüllt werden!");
        return;
    }

    if (strSuche.length <= 1){
        alert("Das Austauschen von Einzelzeichen ist nicht erlaubt - zu riskant!");
        return;
    }

    if (strErsetze == ""){
        antwort = prompter.confirmEx("Suche / Ersetze", "Das Feld 'Ersetze' enthält keinen Text. "+
            "\nSoll der Suchtext durch nichts ersetzt, d.h. gelöscht werden?", "Ja", "Nein", "", "", "")
        if (antwort == 1) { // 1 = nein
            return;
        }
    }

    if (Kat1 == ""){
        alert("Im Feld 'Kategorie' muss eine Kategorie eingetragen werden!");
        return;
    }

    if (Kat1.length < 3 || Kat1.length > 4){
        alert("Bitte tragen Sie in beiden Feldern entweder 3- oder 4-stellige Kategorien ein!");
        return;
    }

    if (isNaN(Kat1) || isNaN(Kat2)) {
        alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
        return;
    }

    if (Kat2 == "") {
        textKategorie = "\nKategorie: " + Kat1;
    }else {
        textKategorie = "\nKategorie: " + Kat1 + " bis " + Kat2;
    }

    lSetsize = application.activeWindow.getVariable("P3GSZ");
    antwort = prompter.confirmEx("Suche / Ersetze", "Suche: " + strSuche + "\nErsetze: " + strErsetze +
        textKategorie + "\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "")
    //wenn Antwort 1 = nein:
    if (antwort == 1) {
        return;
    }

    //wenn Kat2 nicht ausgefüllt, wird dort der Wert von Kat1 verwendet:
    if (Kat2 == "") Kat2 = Kat1;

    //Kategorien in Ziffern umwandeln:
    bcaseSensitive = document.getElementById("idCheckboxCase").checked;
    bwholeWord = document.getElementById("idCheckboxWort").checked;

    //Set bearbeiten:
    for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr++){
        application.activeWindow.command("\\too " + datensatzNr, false);
        //welche Ebene darf bearbeitet werden?
        if (testEbene(Kat1) == "2") {bearbeiteEbene2("ersetzen");}
        else {bearbeiteEbene0und1("ersetzen");}
        document.getElementById("idSchlussmeldung1").value = "App: " + application.length + " Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet."
    }
    application.activeWindow.command("\\too k", false);
    document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
    //alert(strfehlerMeldungen);
    if (strfehlerMeldungen != ""){
        fehlerDateiAnlegen();
        document.getElementById("idButtonDatei").label="Fehlerprotokoll öffnen";
        document.getElementById("idButtonDatei").hidden=false;
    }
} catch(e) {
    application.messageBox ("", e, "");
    return;
    }
    return;
}

//----------------------------------------------------------------
// Tab 2: Ergänzen von Kategorien
//----------------------------------------------------------------
function bearbeiteSetZufuegen()
{
try{
    var lSetsize;
    var datensatzNr = 0;
    var bError = false;
    var prompter = utility.newPrompter();
    var antwort;
    strEln = application.activeWindow.getVariable("libID");

    wennKat = document.getElementById("idWennKat").value;
    wennText = document.getElementById("idWennText").value;
    dannKat = document.getElementById("idDannKat").value;
    dannText = document.getElementById("idDannText").value;

    var alleTextboxen = document.getElementsByAttribute("name", "textboxTab2");
    for (var i = 0; i<alleTextboxen.length; i++) {
        //alert("Ergaenze :" + i + ": " + alleTextboxen[i].value);
        if (alleTextboxen[i].value == "") {
            alert("Zufügen: Bitte füllen Sie alle vier Felder aus!");
            return;
        };
    }

    var screenID = application.activeWindow.getVariable("scr");
    if (screenID != "7A" && screenID != "8A"){
        bFehler = true;
        alert("Funktion kann nur aus der Kurz- oder Vollanzeige heraus gestartet werden!");
        return;
    }

    //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
    lBearbeitet = 0;
    document.getElementById("idSchlussmeldung1").value = " ";
    document.getElementById("idSchlussmeldung2").value = " ";
    document.getElementById("idSchlussmeldung3").value = " ";

    if (wennKat.length != dannKat.length){
        alert("Bitte tragen Sie in beiden Feldern entweder 3- bzw. 4-stellige Kategorien ein!");
        return;
    }

    if (isNaN(wennKat) || isNaN(dannKat)) {
        alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
        return;
    }

    if (testEbene(wennKat) != testEbene(dannKat)){
        alert(wennKat + " und " + dannKat + " können nicht in demselben Vorgang bearbeitet werden." +
            "\n Grund: Verschiedene Datensatzebenen.");
        return;
    }

    //Kontrolle der libID und Datensatzebene (hier nur einzufügende Kategorie):
    if (checkEln(strEln) && (testEbene(wennKat) == "0" || testEbene(dannKat) == "0")){
        var antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\n" + hinweisAusnahme +
            "\nWeitermachen?", "Ja", "Nein", "", "", "")
        if (antwort2 == 1) { // 1 = nein
            return;
        }
    }

    lSetsize = application.activeWindow.getVariable("P3GSZ");
    antwort = prompter.confirmEx("Ergänzen", "Suche Kategorie " + wennKat + " mit Text '" + wennText + "'" +
        "\nErgänze Kategorie " + dannKat + " mit Text '" + dannText + "'" +
        "\n\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "")
    //wenn Antwort 1 = nein:
    if (antwort == 1) {
        return;
    }

    //Set bearbeiten:
    for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr++){
        application.activeWindow.command("\\too " + datensatzNr, false);
        //welche Ebene darf bearbeitet werden?
        if (testEbene(wennKat) == "2") {bearbeiteEbene2("zufuegen");}
        else {bearbeiteEbene0und1("zufuegen");}
        document.getElementById("idSchlussmeldung1").value = "Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet."
    }
    application.activeWindow.command("\\too k", false);
    document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
    //alert(strfehlerMeldungen);
    if (strfehlerMeldungen != ""){
        fehlerDateiAnlegen();
        document.getElementById("idButtonDatei").label="Fehlerprotokoll öffnen";
        document.getElementById("idButtonDatei").hidden=false;
    }
} catch(e) {
    application.messageBox ("", e, "");
    return;
    }
    return;
}

//----------------------------------------------------------------
// Tab 3: Löschen von Kategorien
//----------------------------------------------------------------
function bearbeiteSetLoeschen()
{
try{
    var lSetsize;
    var datensatzNr = 0;
    var bError = false;
    var prompter = utility.newPrompter();
    var antwort;
    strEln = application.activeWindow.getVariable("libID");
    loescheKat = document.getElementById("idLoescheKat").value;
    strSuche = document.getElementById("idLoescheText").value;

    var alleTextboxen = document.getElementsByAttribute("name", "textboxTab3");
    for (var i = 0; i<alleTextboxen.length; i++) {
        //alert("Ergaenze :" + i + ": " + alleTextboxen[i].value);
        if (alleTextboxen[i].value == "") {
            alert("Zufügen: Bitte füllen Sie alle vier Felder aus!");
            return;
        };
    }

    var screenID = application.activeWindow.getVariable("scr");
    if (screenID != "7A" && screenID != "8A"){
        bFehler = true;
        alert("Funktion kann nur aus der Kurz- oder Vollanzeige heraus gestartet werden!");
        return;
    }

    //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
    lBearbeitet = 0;
    document.getElementById("idSchlussmeldung1").value = " ";
    document.getElementById("idSchlussmeldung2").value = " ";
    document.getElementById("idSchlussmeldung3").value = " ";

    if (isNaN(loescheKat)) {
        alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
        return;
    }

    //Kontrolle der libID und Datensatzebene (hier nur einzufügende Kategorie):
    if (checkEln(strEln) && testEbene(loescheKat) == "0"){
        var antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\n" + hinweisAusnahme +
            "\nWeitermachen?", "Ja", "Nein", "", "", "")
        if (antwort2 == 1) { // 1 = nein
            return;
        }
    }

    lSetsize = application.activeWindow.getVariable("P3GSZ");
    antwort = prompter.confirmEx("Löschen", "Suche und lösche Kategorie " + loescheKat + " mit Text '" + strSuche + "'" +
        "\n\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "")
    //wenn Antwort 1 = nein:
    if (antwort == 1) {
        return;
    }

    //Set bearbeiten:
    for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr++){
        application.activeWindow.command("\\too " + datensatzNr, false);
        //welche Ebene darf bearbeitet werden?
        if (testEbene(loescheKat) == "2")
        {
            bearbeiteEbene2("loeschen");
        }
        else
        {
            bearbeiteEbene0und1("loeschen");
        }
        document.getElementById("idSchlussmeldung1").value = "Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet."
    }
    application.activeWindow.command("\\too k", false);
    document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
    //alert(strfehlerMeldungen);
    if (strfehlerMeldungen != ""){
        fehlerDateiAnlegen();
        document.getElementById("idButtonDatei").label="Fehlerprotokoll öffnen";
        document.getElementById("idButtonDatei").hidden=false;
    }
} catch(e) {
    application.messageBox ("", e, "");
    return;
    }
    return;
}

//----------------------------------------------------------------
function bearbeiteEbene0und1(aktion)
{
    //bearbeite die bibliographische bzw. lokale Ebene:
    var strKommando = "";
    if (strEbene == "1") {
        strKommando = "\\mut l";
        strSatzart = "Lokalsätzen";
    } else {
        strKommando = "\\mut";
        strSatzart = "Datensätzen";
    }

    var strMat = application.activeWindow.materialCode;
    strEln = application.activeWindow.getVariable("libID");
    if (checkEln(strEln) && (strMat != "Te" && strMat != "Td" && strMat != "Tw") && (strEbene != "1")){
        alert("Sie dürfen nur Td-, Te- und Tw-Sätze bearbeiten.");
        return;
    }

    //alert("Bearbeite 0 oder 1 " + strKommando);
    application.activeWindow.command(strKommando, false);
    //alert(application.activeWindow.status);
    if (aktion == "ersetzen") bearbeiteZeilenErsetzen();
    if (aktion == "zufuegen") bearbeiteZeilenZufuegen();
    if (aktion == "loeschen") bearbeiteZeilenLoeschen();

    application.activeWindow.simulateIBWKey ("FR");
    zaehleDatensaetze();

    return;
}

function bearbeiteEbene2(aktion)
{
    //bearbeite Exemplare
    strSatzart = "Exemplarsätzen";
    var strTitle =  application.activeWindow.copyTitle();
    var regexpExe = /\n(70[0-9][0-9])/g;
    var alleExe = new Array();
    alleExe = strTitle.match(regexpExe);
    //application.messageBox("", alleExe, "message-icon");

    //wenn keine Exemplare vorhanden:
    if (!alleExe) return;

    for (var i=0; i < alleExe.length; ++i){
        var exNr = alleExe[i].substring(3,5);
        application.activeWindow.command("\\mut e" + exNr, false);
        if (aktion == "ersetzen") bearbeiteZeilenErsetzen();
        if (aktion == "zufuegen") bearbeiteZeilenZufuegen();
        if (aktion == "loeschen") bearbeiteZeilenLoeschen();
        application.activeWindow.simulateIBWKey ("FR");
        zaehleDatensaetze();
    }

    return;
}

function bearbeiteZeilenErsetzen()
{
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll

    var strbedingung = document.getElementById("idBedingung").value;
    var strbedingung2 = document.getElementById("idBedingung2").value;
    var zeilenNr, tagContent, strTag;
    application.activeWindow.title.endOfBuffer(false);
    var lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);
    var bedingungInRange;
    var matches;
    var modifier = (bcaseSensitive) ? "" : "i";
    var re = new RegExp(strSuche,modifier);
    if (strbedingung2 != "")
    {
        var bedingungInRange = false;
        if (application.activeWindow.title.find(strbedingung2, bcaseSensitive, false, bwholeWord) == true){
            strTag = application.activeWindow.title.tag;
            if(strTag >= Kat1 && strTag <= Kat2)
            {
                bedingungInRange = true;
            }
            application.activeWindow.title.startOfBuffer(false);
        }
    } else {
        bedingungInRange = true; // keine Bedingung
    }
    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr++){
        strTag = application.activeWindow.title.tag;
        //alert("strTag: " + strTag + "\nKat1: " + Kat1 + "\nKat2: " + Kat2);
        //alle Vorkommnisse in der Kategorie werden ersetzt:
        if (strTag >= Kat1 && strTag <= Kat2){
            if(bedingungInRange)
            {
                if(matches = application.activeWindow.title.currentField.match(re))
                {
                    strSuche = matches[0];
                }
                
                if (strbedingung != "")
                {
                    if (application.activeWindow.title.find(strbedingung, bcaseSensitive, true, bwholeWord) == true)
                    {

                        application.activeWindow.title.startOfField(false);//Suche ab Zeilenanfang:
                        while(application.activeWindow.title.find(strSuche, bcaseSensitive, true, bwholeWord) == true)
                        {
                            application.activeWindow.title.insertText(strErsetze);
                        }
                    }
                } else {
                    while(application.activeWindow.title.find(strSuche, bcaseSensitive, true, bwholeWord) == true){
                        application.activeWindow.title.insertText(strErsetze);
                    }
                }
            }

            //alert(Kat1 + "\n" + strSuche + "\n" + application.activeWindow.title.find(strSuche, bcaseSensitive, true, bwholeWord));
            //find geht zum gesuchten Begriff und markiert ihn. Nochmals ausgeführt wird im Rest der Zeile gesucht
//			while(application.activeWindow.title.find(strSuche, bcaseSensitive, true, bwholeWord) == true){
//				application.activeWindow.title.insertText(strErsetze);
//			}
        }
        application.activeWindow.title.endOfField(false);//wichtig bei mehrzeiligen Inhalten!
        application.activeWindow.title.lineDown(1, false);
        application.activeWindow.title.startOfField(false);
    }

    return;
}

function bearbeiteZeilenZufuegen()
{
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll
/*	var zeilenNr, strTag, strInhalt;
    application.activeWindow.title.endOfBuffer(false);
    var lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);

    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr++){
        strTag = application.activeWindow.title.tag;
        strInhalt = application.activeWindow.title.currentField;
        strInhalt = strInhalt.substring(strTag.length);
//alert("Prüfung:\n" + strTag + ": " + (strTag == wennKat) + "\n" + strInhalt +"\n Pos: " + strInhalt.indexOf(wennText) );
        if (strTag == wennKat && strInhalt.indexOf(wennText) != -1){
            application.activeWindow.title.endOfField(false);
            application.activeWindow.title.insertText("\n" + dannKat + " " + dannText);
        }
        application.activeWindow.title.lineDown(1, false);
        application.activeWindow.title.startOfField(false);
    }
*/

    var strInhalt;
    application.activeWindow.title.startOfBuffer(false);
    var i = 0;
    while( (strInhalt = application.activeWindow.title.findTag2(wennKat,i,false,true,true) ) != "" )
    {
        if(application.activeWindow.title.find(wennText,true,true,false))
        {
            application.activeWindow.title.endOfBuffer(false);
            application.activeWindow.title.insertText("\n" + dannKat + " " + dannText);
            break;
        }
        i++;
    }

    return;
}

function bearbeiteZeilenLoeschen()
{
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll
    var bBedingung;
    var zeilenNr;
    var strTag;
    var loescheKat = document.getElementById("idLoescheKat").value;
    //wie lang ist der Datensatz?
    application.activeWindow.title.endOfBuffer(false);
    var lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);

    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr++){
        strTag = application.activeWindow.title.tag;
        bBedingung = application.activeWindow.title.find(strSuche, true, true, false);
        if ((strTag == loescheKat) && (bBedingung == true)){
            application.activeWindow.title.deleteLine(1);
        } else {
        //diesen Sprung in der Zeile machen wir nur, wenn keine Zeile gelöscht wurde:
            application.activeWindow.title.endOfField(false);//wichtig bei mehrzeiligen Inhalten!
            application.activeWindow.title.lineDown(1, false);
            application.activeWindow.title.startOfField(false);
        }
    }

    return;
}



//----------------------------------------------------------------

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
//--------------------------------------------
function resetAllErsetzen()
{
    var alleTextboxen = document.getElementsByAttribute("name", "textboxTab1");
    for (var i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    var alleCheckboxen = document.getElementsByAttribute("name", "checkbox");
    for (i = 0; i < alleCheckboxen.length; i++) {
        alleCheckboxen[i].checked = false;
    }	
    resetAlles();
    return;
}

function resetAllZufuegen()
{
    var alleTextboxen = document.getElementsByAttribute("name", "textboxTab2");
    for (var i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    resetAlles();
    return;
}

function resetAllLoeschen()
{
    var alleTextboxen = document.getElementsByAttribute("name", "textboxTab3");
    for (var i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    resetAlles();
    return;
}
function resetAlles()
{
    document.getElementById("idSchlussmeldung1").value = " ";
    document.getElementById("idSchlussmeldung2").value = " ";
    document.getElementById("idSchlussmeldung3").value = " ";


    strErsetze = "";
    strSuche = "";
    wennKat = "";
    wennText = "";
    dannKat = "";
    dannText = "";
    loescheKat = "";
    bFehler = false;
    strfehlerMeldungen = "";
    document.getElementById("idButtonDatei").hidden=true;
    return;
}

function checkEln(eln)
{
    var allowed = new Array("8007","9001","9006","9002");
    for(var x = 0; x < allowed.length; x++)
    {
        if(allowed[x] == eln) return false;
    }
    return true;
}