//============================================================================
// Erstellt: GBV, Karen Hachmann
//           2009.02
// Änderung: 2011.03
//     Ausnahmeregel: ELN 1999 (VZG), 2012 (GND) und 2013 (PND) dürfen auch die bibliographische Ebene bearbeiten
// Änderung: 2016.08 Klee
//      Optionale Nutzung von Regulären Ausdrücken
//============================================================================
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
// Pull in the WinIBW application object:
var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
                    .getService(Components.interfaces.IApplication),

    zeigeWeitereBedingungen = false,

    utility = {
        newFileInput: function () {
            return Components.classes["@oclcpica.nl/scriptinputfile;1"]
                        .createInstance(Components.interfaces.IInputTextFile);
        },
        newFileOutput: function () {
            return Components.classes["@oclcpica.nl/scriptoutputfile;1"]
                        .createInstance(Components.interfaces.IOutputTextFile);
        },
    },
    prompter = Components.classes["@oclcpica.nl/scriptpromptutility;1"]
                        .createInstance(Components.interfaces.IPromptUtilities),
    lProfileAlert,
    lProfileError,
    lProfileMessage,
    strErsetze = "",
    strSuche = "",
    Kat1 = "",
    Kat2 = "",
    bcaseSensitive = "",
    caseFlag = "i",
    bwholeWord = false,
    bFehler = false,
    strfehlerMeldungen = "",
    listenPfadFehler = "",
    listenPfadProtokoll = "",
    protokollDatei = "",
    bProtokoll = false,
    lBearbeitet = 0,
    strEbene = "",
    strSatzart = "",
    hinweisVZG = "",
    bError,
//Variable des Zufügen-Tabs:
    wennKat = "",
    wennText = "",
    dannKat = "",
    dannText = "",
    loescheKat = "",
    loeschenSichtbar = false,
    elnText = "",
//Variable, abhängig vom Verbund!
    strELN = "",
    strUser = "",
    strKatLok = "",
    strKatExe = "";
//-------------------------------------------------------------------------
function erweitereRechte() {
    //Prüfe ELN:
    //1999 = VZG, 2012 = GND, 2013 = PND
    //7777 = ELN des GBV in der DNB
    var oRegExpELN = new RegExp(strELN),
        ergebnis1 = oRegExpELN.test(application.activeWindow.getVariable("libID")),
        elns,
        oRegExpUser,
        ergebnis2;
    if (ergebnis1 == true) {
        //Kategorien ergänzen:
        elns = strELN.split("|").join(", ");
        elnText = "Diese Registerkarte ist nur sichtbar für die ELN " + elns + ".";
        loeschenSichtbar = true;
    }
    // Prüfe User:
    oRegExpUser = new RegExp(strUser);
    ergebnis2 = oRegExpUser.test(application.activeWindow.getVariable("P3GUK"));
    if (ergebnis1 == true || ergebnis2 == true) {
        return true;
    }
    return false;
}

function onLoad() {
    var strVerbund = application.activeWindow.getVariable("P3GCN");
    switch (strVerbund) {
    case "GBV":
        hinweisVZG = "Sie haben Kategorien der bibliographischen Ebene (Titelebene) ausgewählt. " +
            "\nDas Bearbeiten ganzer Sets auf bibliographischer Ebene ist der Verbundzentrale vorbehalten." +
            "\nBitte senden Sie Ihre Korrekturvorschläge an Frau Hachmann: hachmann@gbv.de";
        strELN = "1999|2012|2013|7777";
        strUser = "1343|6723";
        strKatLok = "2080|348[01]|354[0-9]|471[056]|476[34]|60[0-9xX][0-9xX]|6100|65[0-9xX][0-9xX]";
        strKatExe = "43[0-9][0-9]|480[12347]|67[0-9xX][0-9xX]|68[0-9xX][0-9xX]|70[0-9xX][0-9xX]|71[0-9][0-9]|712[0123]|713[39]|7200|73[0-9][0-9]|7800|7901|8[0-8][0-9][0-9]";
        break;
    case "DNB":
        hinweisVZG = "Sie haben Kategorien der bibliographischen Ebene (Titelebene) ausgewählt. " +
            "\nDas Bearbeiten ganzer Sets auf bibliographischer Ebene ist der Zentralredaktion vorbehalten." +
            "\nBitte senden Sie Ihre Korrekturvorschläge an zdb-winibw@sbb.spk-berlin.de";
        strELN = "8007|8009|9001|9006|9002";
        strUser = "6001|6199|6099|6004|6207";
        strKatLok = "2080|348[01]|354[0-9]|471[056]|476[34]|60[0-9xX][0-9xX]|6100|65[0-9xX][0-9xX]";
        strKatExe = "480[012]|4820|4822|6700|70[0-9xX][0-9xX]|710[0-9]|7120|713[345678]|714[0-9]|715[09]|7[89]00|8001|803[12345]|8[12]00|844[89]|846[567]|8510|859[45678]";
        break;
    default:
        alert("Unbekannte Datenbank!");
    }
    if (!erweitereRechte()) {
        document.getElementById("idCheckboxExemplar").checked = true;
        document.getElementById("idCheckboxExemplar").disabled = true;
    }
    if (loeschenSichtbar) {
        //nur für Auserwählte sichtbar:
        document.getElementById("tabLoeschen").label = "Löschen von Kategorien";
        document.getElementById("idSeite3").hidden = false;
    }
    document.getElementById("idCheckboxProtokoll").checked = true;
    document.getElementById("idLabelAusnahme").value = elnText;
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

function onCancel() {
    //Zurücksetzen aller Meldungsarten auf den vorher eingestellten Stand:
    application.writeProfileInt("winibw.messages", "alert", lProfileAlert);
    application.writeProfileInt("winibw.messages", "error", lProfileError);
    application.writeProfileInt("winibw.messages", "message", lProfileMessage);
}

function onAccept() {
    //nix weil es 2 Tabs gibt
}

function focusFeldidSuche() {
    document.getElementById("idSuche").focus();
}

function focusFeldidWennKat() {
    document.getElementById("idWennKat").focus();
}

function focusFeldidLoescheKat() {
    document.getElementById("idLoescheKat").focus();
}

function testEbene(kategorie) {
    //	Einschränkungen für Bibliotheken:
    //	Nur die Lokal- und Exemplarebene darf bearbeitet werden:
    //Voreinstellung:
    strEbene = "0";
    var oRegExpKatLok = new RegExp(strKatLok),//Kategorien der Lokalebene:
        oRegExpKatExe = new RegExp(strKatExe);//Kategorien der Exemplarebene:
    if (oRegExpKatLok.test(kategorie) == true) {
        strEbene = "1";
    } else if (oRegExpKatExe.test(kategorie) == true) {
        strEbene = "2";
    }
    //alert ("Kategorie: " + kategorie + "\nEbene: " + strEbene);
    return strEbene;
}

function zaehleDatensaetze() {
    var strPPN, i, alleMeldungen = "";
    if (application.activeWindow.status == "ERROR") {
        bError = true;
        strPPN = application.activeWindow.getVariable("P3GPP");
        for (i = 0; i < application.activeWindow.messages.count; i += 1) {
            alleMeldungen += application.activeWindow.messages.item(i).text;
        }
        strfehlerMeldungen += "\r\nPPN: " + strPPN + " / Meldung: " + alleMeldungen;
        //alert(strfehlerMeldungen);
        //Abbruch:
        application.activeWindow.simulateIBWKey("FE");
    } else if (/OK|Warnung/.test(application.activeWindow.messages.item(0).text)) {
        //ansonsten wäre der Status auch "OK" aber Meldung: "Der Datensatz wurde NICHT verändert"
        lBearbeitet += 1;
    }
}
//----------------------------------------------------------------
// Tab 1: Ersetzen von Inhalten in Kategorien
//----------------------------------------------------------------

function bearbeiteSetErsetzen() {
    var lSetsize,
        antwort,
        datensatzNr = 0,
        textKategorie,
        meldungBedingung1 = "",
        strBedingung2Kat = document.getElementById("idBedingung2Kat").value,
        strBedingung2Inhalt = document.getElementById("idBedingung2Inhalt").value,
        meldungBedingung2 = "",
        strfehlerMeldungen = "",
        screenID,
        antwort2;
    bError = false;
    try {
        document.getElementById("idButtonDateiFehler").label = "";
        document.getElementById("idButtonDateiFehler").hidden = true;
        document.getElementById("idButtonDateiProtokoll").label = "";
        document.getElementById("idButtonDateiProtokoll").hidden = true;
        window.sizeToContent();

        application.writeProfileInt("winibw.messages", "alert", 1);
        application.writeProfileInt("winibw.messages", "error", 1);
        application.writeProfileInt("winibw.messages", "message", 1);

        screenID = application.activeWindow.getVariable("scr");
        if (screenID != "7A" && screenID != "8A") {
            bFehler = true;
            alert("Datensatz muss sich in der Kurz- oder Vollanzeige befinden!");
            return;
        }

        //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
        lBearbeitet = 0;
        bProtokoll = false;
        verbergeSchlussmeldung(true);

        strSuche = document.getElementById("idSuche").value;
        strErsetze = document.getElementById("idErsetze").value;
        Kat1 = document.getElementById("idKategorie1").value;
        Kat2 = document.getElementById("idKategorie2").value;

        if ((!erweitereRechte()) && (testEbene(Kat1) == 0)) {
            antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\nAusnahme: Td- und Te-Sätze dürfen bearbeitet werden." +
                "\nWeitermachen?", "Ja", "Nein", "", "", "");
            if (antwort2 == 1) { // 1 = nein
                return;
            }
        }

        //if (Kat2 != "") { //so geht's nicht.
        if (Kat2.length != 0) {
            if (testEbene(Kat1) != testEbene(Kat2)) {
                alert(Kat1 + " und " + Kat2 + " können nicht in demselben Vorgang bearbeitet werden." +
                    "\n Grund: Verschiedene Datensatzebenen.");
                return;
            }
        }

        if (strSuche == "") {
            alert("Das Feld 'Suche' muss ausgefüllt werden!");
            return;
        }

        if (strSuche.length <= 1) {
            alert("Das Austauschen von Einzelzeichen ist nicht erlaubt - zu riskant!");
            return;
        }

        if (strErsetze == "") {
            antwort = prompter.confirmEx("Suche / Ersetze", "Das Feld 'Ersetze' enthält keinen Text. " +
                "\nSoll der Suchtext durch nichts ersetzt, d.h. gelöscht werden?", "Ja", "Nein", "", "", "");
            if (antwort == 1) { // 1 = nein
                return;
            }
        }

        if (Kat1 == "") {
            alert("Im Feld 'Kategorie' muss eine Kategorie eingetragen werden!");
            return;
        }

        if (Kat1.length < 3 || Kat1.length > 4) {
            alert("Bitte tragen Sie in beiden Feldern entweder 3- oder 4-stellige Kategorien ein!");
            return;
        }

        if (isNaN(Kat1) || isNaN(Kat2) || isNaN(strBedingung2Kat)) {
            alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
            return;
        }

        if (Kat2 == "") {
            textKategorie = "\nKategorie: " + Kat1;
        } else {
            textKategorie = "\nKategorie: " + Kat1 + " bis " + Kat2;
        }

        if (document.getElementById("idBedingung1").value != "") {
            meldungBedingung1 = "\nWenn in derselben Kategorie dieser Text vorkommt: " + document.getElementById("idBedingung1").value;
        }

        //Felder von Bedingung2 korrekt ausgefüllt?
        if ((strBedingung2Kat != "" && strBedingung2Inhalt == "") || (strBedingung2Kat == "" && strBedingung2Inhalt != "")) {
            alert("Bitte füllen Sie bei Bedingung 2 beide Felder oder keines aus!");
            return;
        }
        if (strBedingung2Kat != "" && strBedingung2Inhalt != "") {
            meldungBedingung2 = "\nWenn auch Kategorie " + strBedingung2Kat + " mit diesem Text vorkommt: " + strBedingung2Inhalt;
        }

        lSetsize = application.activeWindow.getVariable("P3GSZ");
        antwort = prompter.confirmEx("Suche / Ersetze", textKategorie
            + "\nSuche: " + strSuche
            + "\nErsetze: " + strErsetze
            + meldungBedingung1
            + meldungBedingung2
            + "\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "");
        //wenn Antwort 1 = nein:
        if (antwort == 1) {
            return;
        }

        if (document.getElementById("idCheckboxProtokoll").checked == true) {
            bProtokoll = true;
            protokollDateiAnlegen();
        }

        //wenn Kat2 nicht ausgefüllt, wird dort der Wert von Kat1 verwendet:
        if (Kat2 == "") {
            Kat2 = Kat1;
        }
        //Kategorien in Ziffern umwandeln:
        bcaseSensitive = document.getElementById("idCheckboxCase").checked;
        if (bcaseSensitive) {
            caseFlag = '';
        }
        bwholeWord = document.getElementById("idCheckboxWort").checked;

        //Blende Schlussmeldung ein:
        verbergeSchlussmeldung(false);
        //Set bearbeiten:
        for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr += 1) {
            application.activeWindow.command("\\too " + datensatzNr, false);
            if (bProtokoll == true) {
                protokollDateiSchreiben(application.activeWindow.getVariable('P3CLIP'));
            }
            //welche Ebene darf bearbeitet werden?
            if (testEbene(Kat1) == "2") {
                bearbeiteEbene2("ersetzen");
            } else {
                bearbeiteEbene0und1("ersetzen");
            }
            document.getElementById("idSchlussmeldung1").value = "Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet.";
        }
        application.activeWindow.command("\\too k", false);
        document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
        //alert(strfehlerMeldungen);
        if (strfehlerMeldungen != "") {
            fehlerDateiAnlegen();
            document.getElementById("idButtonDateiFehler").label = "Fehlerliste öffnen";
            document.getElementById("idButtonDateiFehler").hidden = false;
        }

        if (bProtokoll == true) {
            document.getElementById("idButtonDateiProtokoll").label = "Protokolldatei öffnen";
            document.getElementById("idButtonDateiProtokoll").hidden = false;
        }
        window.sizeToContent();
    } catch (e) {
        application.messageBox("Fehler 1", e, "");
    }
}

//----------------------------------------------------------------
// Tab 2: Ergänzen von Kategorien
//----------------------------------------------------------------
function bearbeiteSetZufuegen() {
    try {
        var lSetsize,
            datensatzNr = 0,
            antwort,
            alleTextboxen,
            i,
            screenID,
            antwort2;
        bError = false;

        wennKat = document.getElementById("idWennKat").value;
        wennText = document.getElementById("idWennText").value;
        dannKat = document.getElementById("idDannKat").value;
        dannText = document.getElementById("idDannText").value;

        alleTextboxen = document.getElementsByAttribute("name", "textboxTab2");
        for (i = 0; i < alleTextboxen.length; i += 1) {
            //alert("Ergaenze :" + i + ": " + alleTextboxen[i].value);
            if (alleTextboxen[i].value == "") {
                alert("Zufügen: Bitte füllen Sie alle vier Felder aus!");
                return;
            }
        }

        screenID = application.activeWindow.getVariable("scr");
        if (screenID != "7A" && screenID != "8A") {
            bFehler = true;
            alert("Funktion kann nur aus der Kurz- oder Vollanzeige heraus gestartet werden!");
            return;
        }

        //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
        lBearbeitet = 0;
        bProtokoll = false;
        verbergeSchlussmeldung(true);

        if (wennKat.length != dannKat.length) {
            alert("Bitte tragen Sie in beiden Feldern entweder 3- bzw. 4-stellige Kategorien ein!");
            return;
        }

        if (isNaN(wennKat) || isNaN(dannKat)) {
            alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
            return;
        }

        if (testEbene(wennKat) != testEbene(dannKat)) {
            alert(wennKat + " und " + dannKat + " können nicht in demselben Vorgang bearbeitet werden." +
                "\n Grund: Verschiedene Datensatzebenen.");
            return;
        }

        //Kontrolle der Datensatzebene (hier nur einzufügende Kategorie):
        if ((!erweitereRechte()) && (testEbene(wennKat) == 0 || testEbene(dannKat) == 0)) {
            antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\nAusnahme: Td- und Te-Sätze dürfen bearbeitet werden." +
                "\nWeitermachen?", "Ja", "Nein", "", "", "");
            if (antwort2 == 1) { // 1 = nein
                return;
            }
        }

        lSetsize = application.activeWindow.getVariable("P3GSZ");
        antwort = prompter.confirmEx("Ergänzen", "Suche Kategorie " + wennKat + " mit Text '" + wennText + "'" +
            "\nErgänze Kategorie " + dannKat + " mit Text '" + dannText + "'" +
            "\n\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "");
        //wenn Antwort 1 = nein:
        if (antwort == 1) {
            return;
        }
        //Schlussmeldung einblenden:
        verbergeSchlussmeldung(false);
        //Set bearbeiten:
        for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr += 1) {
            application.activeWindow.command("\\too " + datensatzNr, false);
            //welche Ebene darf bearbeitet werden?
            if (testEbene(wennKat) == "2") {
                bearbeiteEbene2("zufuegen");
            } else {
                bearbeiteEbene0und1("zufuegen");
            }
            document.getElementById("idSchlussmeldung1").value = "Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet.";
        }
        application.activeWindow.command("\\too k", false);
        document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
        //alert(strfehlerMeldungen);
        if (strfehlerMeldungen != "") {
            fehlerDateiAnlegen();
            document.getElementById("idButtonDateiFehler").label = "Fehlerliste öffnen";
            document.getElementById("idButtonDateiFehler").hidden = false;
            window.sizeToContent();
        }
    } catch (e) {
        application.messageBox("Fehler 2", e, "");
    }
}

//----------------------------------------------------------------
// Tab 3: Löschen von Kategorien
//----------------------------------------------------------------
function bearbeiteSetLoeschen() {
    try {
        var lSetsize,
            datensatzNr = 0,
            antwort,
            alleTextboxen = document.getElementsByAttribute("name", "textboxTab3"),
            i,
            screenID,
            antwort2;
        bError = false;
        loescheKat = document.getElementById("idLoescheKat").value;
        strSuche = document.getElementById("idLoescheText").value;


        for (i = 0; i < alleTextboxen.length; i += 1) {
            //alert("Ergaenze :" + i + ": " + alleTextboxen[i].value);
            if (alleTextboxen[i].value == "") {
                alert("Zufügen: Bitte füllen Sie alle vier Felder aus!");
                return;
            }
        }

        screenID = application.activeWindow.getVariable("scr");
        if (screenID != "7A" && screenID != "8A") {
            bFehler = true;
            alert("Funktion kann nur aus der Kurz- oder Vollanzeige heraus gestartet werden!");
            return;
        }

        //Falls Aktion erneut gestartet (z.B. nach Fehlermeldung)
        lBearbeitet = 0;
        //Schlussmeldung ausblenden:
        verbergeSchlussmeldung(true);

        if (isNaN(loescheKat)) {
            alert("Bitte geben Sie im Feld 'Kategorie' nur Zahlen ein!");
            return;
        }

        //Kontrolle der Datensatzebene (hier nur einzufügende Kategorie):
        if ((!erweitereRechte()) && (testEbene(loescheKat) == 0)) {
            antwort2 = prompter.confirmEx("Suche / Ersetze", hinweisVZG + "\n\nAusnahme: Td- und Te-Sätze dürfen bearbeitet werden." +
                "\nWeitermachen?", "Ja", "Nein", "", "", "");
            if (antwort2 == 1) { // 1 = nein
                return;
            }
        }

        lSetsize = application.activeWindow.getVariable("P3GSZ");
        antwort = prompter.confirmEx("Löschen", "Suche und lösche Kategorie " + loescheKat + " mit Text '" + strSuche + "'" +
            "\n\nWollen Sie jetzt alle " + lSetsize + " Datensätze bearbeiten?", "Ja", "Nein", "", "", "");
        //wenn Antwort 1 = nein:
        if (antwort == 1) {
            return;
        }
        //Schlussmeldung einblenden:
        verbergeSchlussmeldung(false);
        //Set bearbeiten:
        for (datensatzNr = 1; datensatzNr <= lSetsize; datensatzNr += 1) {
            application.activeWindow.command("\\too " + datensatzNr, false);
            //welche Ebene darf bearbeitet werden?
            if (testEbene(loescheKat) == "2") {
                bearbeiteEbene2("loeschen");
            } else {
                bearbeiteEbene0und1("loeschen");
            }
            document.getElementById("idSchlussmeldung1").value = "Datensatz Nr. " + datensatzNr + " von " + lSetsize + " wird bearbeitet.";
        }
        application.activeWindow.command("\\too k", false);
        document.getElementById("idSchlussmeldung1").value = "In " + lBearbeitet + " " + strSatzart + " wurde der Text ersetzt. ";
        //alert(strfehlerMeldungen);
        if (strfehlerMeldungen != "") {
            fehlerDateiAnlegen();
            document.getElementById("idButtonDateiFehler").label = "Fehlerliste öffnen";
            document.getElementById("idButtonDateiFehler").hidden = false;
            window.sizeToContent();
        }
    } catch (e) {
        application.messageBox("Fehler 3", e, "");
    }
}

//----------------------------------------------------------------
function doAktion(aktion) {
    switch (aktion) {
    case 'ersetzen':
        bearbeiteZeilenErsetzen();
        break;
    case 'zufuegen':
        bearbeiteZeilenZufuegen();
        break;
    case 'loeschen':
        bearbeiteZeilenLoeschen();
        break;
    }
    application.activeWindow.simulateIBWKey("FR");
    zaehleDatensaetze();
}
function bearbeiteEbene0und1(aktion) {
    //bearbeite die bibliographische bzw. lokale Ebene:
    var strKommando = "",
        strMat;
    if (strEbene == "1") {
        strKommando = "\\mut l";
        strSatzart = "Lokalsätzen";
    } else {
        strKommando = "\\mut";
        strSatzart = "Datensätzen";
    }

    strMat = application.activeWindow.materialCode;
    if ((!erweitereRechte()) && (strMat != "Te" && strMat != "Td") && (strEbene != "1")) {
        alert("Sie dürfen nur Td- und Te-Sätze bearbeiten.");
        return;
    }

    //alert("Bearbeite 0 oder 1 " + strKommando);
    application.activeWindow.command(strKommando, false);
    //alert(application.activeWindow.status);
    doAktion(aktion);
}

function bearbeiteEbene2(aktion) {
    //bearbeite Exemplare
    strSatzart = "Exemplarsätzen";
    var strTitle = application.activeWindow.getVariable('P3CLIP'),
    //var strTitle = application.activeWindow.copyTitle();
        regexpExe = /\n(70[0-9][0-9])/g,
        alleExe = [],
        exNr,
        i;
    alleExe = strTitle.match(regexpExe);
    //application.messageBox("", alleExe, "message-icon");

    //wenn keine Exemplare vorhanden:
    if (!alleExe) {
        return;
    }

    for (i = 0; i < alleExe.length; i += 1) {
        exNr = alleExe[i].substring(3, 5);
        application.activeWindow.command("\\mut e" + exNr, false);
        //Wenn Status nicht "OK", liegt es ggf. daran, dass die Kennung keine Befugnisse zum Ändern
        //des Exemplares mit Selektionszeichen einer anderen Bibliothek hat.
        if (application.activeWindow.status == "OK") {
            //alert("Aktion: " + aktion + "\nBearbeite Exemplar Nr.: " + exNr);
            doAktion(aktion);
        }
    }
}

function bearbeiteZeilenErsetzen() {
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll
    if (pruefeBedingung2() == false) {
        return;
    }
    var strbedingung1 = document.getElementById("idBedingung1").value,
        regex = false,
        regexBed1 = false,
        zeilenNr,
        bed1,
        current,
        replaced,
        lZeilen,
        strTag;
    if (true == document.getElementById("idCheckboxBedingungen1").checked) {
        regexBed1 = new RegExp(strbedingung1, caseFlag);
    }
    if (true == document.getElementById("idCheckboxSuche").checked) {
        regex = new RegExp(strSuche, "g" + caseFlag);
    }

    application.activeWindow.title.endOfBuffer(false);
    lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);

    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr += 1) {
        bed1 = true;
        strTag = application.activeWindow.title.tag;
        //alert("strTag: " + strTag + "\nKat1: " + Kat1 + "\nKat2: " + Kat2);
        //alle Vorkommnisse in der Kategorie werden ersetzt:
        if (strTag >= Kat1 && strTag <= Kat2) {
            if (strbedingung1 != "") {
                if (regexBed1) {
                    if (!regexBed1.test(application.activeWindow.title.currentField)) {
                        bed1 = false;
                    }
                } else if (application.activeWindow.title.find(strbedingung1, bcaseSensitive, true, bwholeWord) == false) {
                    bed1 = false;
                }
            }
            if (bed1) {
                application.activeWindow.title.startOfField(false);
                application.activeWindow.title.endOfField(true);
                if (regex) {
                    current = application.activeWindow.title.currentField;
                    replaced = current.replace(regex, strErsetze);
                    application.activeWindow.title.insertText(replaced);
                } else {
                    while (application.activeWindow.title.find(strSuche, bcaseSensitive, true, bwholeWord) == true) {
                        application.activeWindow.title.insertText(strErsetze);
                    }
                }
            }
        }
        application.activeWindow.title.endOfField(false);//wichtig bei mehrzeiligen Inhalten!
        application.activeWindow.title.lineDown(1, false);
        application.activeWindow.title.startOfField(false);
    }
}

function bearbeiteZeilenZufuegen() {
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll
    var zeilenNr, strTag, strInhalt, lZeilen;
    application.activeWindow.title.endOfBuffer(false);
    lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);

    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr += 1) {
        strTag = application.activeWindow.title.tag;
        strInhalt = application.activeWindow.title.currentField;
        strInhalt = strInhalt.substring(strTag.length);
        //alert("Prüfung:\n" + strTag + ": " + (strTag == wennKat) + "\n" + strInhalt +"\n Pos: " + strInhalt.indexOf(wennText) );
        if (strTag == wennKat && strInhalt.indexOf(wennText) != -1) {
            application.activeWindow.title.endOfField(false);
            application.activeWindow.title.insertText("\n" + dannKat + " " + dannText);
        }
        application.activeWindow.title.endOfField(false); //wichtig bei mehrzeiligen Kategorien!
        application.activeWindow.title.lineDown(1, false);
        application.activeWindow.title.startOfField(false);
    }
}

function bearbeiteZeilenLoeschen() {
    //Zuerst werden die Zeilen gezählt, dann wandert das Script durch
    //den ganzen Datensatz und vergleicht die Kategorien mit den Vorgaben des Anwenders
    //bei der find-Anweisung steht lineOnly immer auf true, weil jede Zeile einzeln
    //untersucht werden soll
    var bBedingung, zeilenNr, strTag,
        loescheKat = document.getElementById("idLoescheKat").value,
        lZeilen;
    //wie lang ist der Datensatz?
    application.activeWindow.title.endOfBuffer(false);
    lZeilen = application.activeWindow.title.currentLineNumber;
    application.activeWindow.title.startOfBuffer(false);

    //alle Zeilen im Datensatz prüfen:
    for (zeilenNr = 1; zeilenNr <= lZeilen; zeilenNr += 1) {
        strTag = application.activeWindow.title.tag;
        bBedingung = application.activeWindow.title.find(strSuche, true, true, false);
        if ((strTag == loescheKat) && (bBedingung == true)) {
            application.activeWindow.title.deleteLine(1);
        } else {
        //diesen Sprung in der Zeile machen wir nur, wenn keine Zeile gelöscht wurde:
            application.activeWindow.title.endOfField(false);//wichtig bei mehrzeiligen Inhalten!
            application.activeWindow.title.lineDown(1, false);
            application.activeWindow.title.startOfField(false);
        }
    }
}

//----------------------------------------------------------------
function weitereBedingungen() {
    var strBedingung1 = document.getElementById("idBedingung1").value,
        strBedingung2Kat = document.getElementById("idBedingung2Kat").value,
        strBedingung2Inhalt = document.getElementById("idBedingung2Inhalt").value,
        antwort;

    //wenn ausgeblendet, dann jetzt einblenden:
    if (zeigeWeitereBedingungen == false) {
        //weitere Bedingungen sichtbar machen:
        document.getElementById("idGroupboxBedingungen").hidden = false;
        document.getElementById("idBedingung1").focus();
        document.getElementById("idButtonWeitere").label = "Weitere Bedingungen ausblenden";
        zeigeWeitereBedingungen = true;
    } else {
        //Felder sind ausgefüllt, jetzt löschen?
        if (strBedingung1 != "" || strBedingung2Kat != "" || strBedingung2Inhalt != "") {
            //alert("Wenn Sie diese Bedingungen nicht verwenden wollen, dann löschen Sie bitte die Felder!");
            //return;
            antwort = prompter.confirmEx("Suche / Ersetze", "Erweiterte Bedingungen löschen?", "Ja", "Nein", "", "", "");
            if (antwort == 0) {
                //Felder löschen:
                document.getElementById("idBedingung1").value = "";
                document.getElementById("idBedingung2Kat").value = "";
                document.getElementById("idBedingung2Inhalt").value = "";
                //Bedingungen jetzt ausblenden:
                document.getElementById("idGroupboxBedingungen").hidden = true;
                document.getElementById("idButtonWeitere").label = "Weitere Bedingungen";
                zeigeWeitereBedingungen = false;
            } else {
                return;
            }
        } else {
            //weitere Bedingungen wieder unsichtbar machen:
            document.getElementById("idGroupboxBedingungen").hidden = true;
            document.getElementById("idButtonWeitere").label = "Weitere Bedingungen";
            zeigeWeitereBedingungen = false;
        }
    }
    window.sizeToContent();
}

function pruefeBedingung2() {
    var strKat = document.getElementById("idBedingung2Kat").value,
        strInhalt = document.getElementById("idBedingung2Inhalt").value,
        regexBed2 = false,
        strTag,
        n = 0,
        gefunden = false;
    if (true == document.getElementById("idCheckboxBedingungen2").checked) {
        regexBed2 = new RegExp(strInhalt, caseFlag);
    }
    //wenn nicht ausgefüllt, dann keine Prüfung und true
    //wenn ausgefüllt: Prüfung
    if (strKat != "" && strInhalt != "") {
        do {
            strTag = application.activeWindow.title.findTag(strKat, n, true, true, false);
            //alert(strTag);
            if (regexBed2) {
                if (regexBed2.test(application.activeWindow.title.currentField)) {
                    gefunden = true;
                    break;
                }
            } else {
                if (application.activeWindow.title.find(strInhalt, bcaseSensitive, true, bwholeWord) == true) {
                    gefunden = true;
                    break;
                }
            }
            n += 1;
        } while (strTag != "");
        return gefunden;
    }
    //wenn die felder nicht ausgefüllt wurden, dann true:
    return true;
}

//----------------------------------------------------------------

//----------- Fehlerdatei -----------------------------
function getSpecialPath(theDirName, theRelativePath) {
    //gibt den Pfad als String aus
    var nsIProperties = Components.interfaces.nsIProperties,
        dirService = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(nsIProperties),
        theFile = dirService.get(theDirName, Components.interfaces.nsILocalFile);
    theFile.appendRelativePath(theRelativePath);
    return theFile.path;
}

function getSpecialDirectory(name) {
    //gibt ein Object zurück
    var nsIProperties = Components.interfaces.nsIProperties,
        dirService = Components.classes["@mozilla.org/file/directory_service;1"]
                            .getService(nsIProperties);
    return dirService.get(name, Components.interfaces.nsIFile);
}

function fehlerDateiAnlegen() {
    //Verzeichnis Listen wird angelegt:
    var theDir = getSpecialDirectory("ProfD"),
        theFileOutput,
        theRelativePath;
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
    theFileOutput = utility.newFileOutput();
    strDatumHeute = datumHeute();
    //relativer Pfad + Dateiname:
    theRelativePath = "listen\\" + strDatumHeute + "_Fehler.txt";
    //Datei wird angelegt:
    theFileOutput.createSpecial("ProfD", theRelativePath);
    //listenPfadFehler als String:
    listenPfadFehler = theFileOutput.getSpecialPath("ProfD", theRelativePath);
    //alert(listenPfadFehler);
    theFileOutput.write(strfehlerMeldungen, strfehlerMeldungen.length);

    //am Ende Fehlerdatei schließen:
    theFileOutput.close();
    theFileOutput = null;
}

function protokollDateiAnlegen() {
    //Verzeichnis Listen wird angelegt:
    var theDir = getSpecialDirectory("ProfD"),
        theFileOutput;
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
    theFileOutput = utility.newFileOutput();
    strDatumHeute = datumHeute();
    //relativer Pfad + Dateiname:
    protokollDatei = strDatumHeute + "_Protokoll.txt";
    //Datei wird angelegt:
    theFileOutput.createSpecial("ProfD", "listen\\" + protokollDatei);
    theFileOutput.setTruncate(false);
    theFileOutput.write("So sahen die Datensätze VOR der Bearbeitung aus:\r\n\r\n");
    theFileOutput.close();

    //listenPfadProtokoll als String, wird gebraucht zum späteren Öffnen der Datei:
    listenPfadProtokoll = theFileOutput.getSpecialPath("ProfD", "listen\\" + protokollDatei);
}

function protokollDateiSchreiben(strTitle) {
    var theFileOutput = utility.newFileOutput();
    theFileOutput.createSpecial("ProfD", "\\listen\\" + protokollDatei);
    theFileOutput.setTruncate(false);
    theFileOutput.write(strTitle + "\r\n-----------------------------------------------------------------------------\r\n");
    theFileOutput.close();
}

function fehlerDateiOeffnen() {
    application.shellExecute(listenPfadFehler, 5, "open", "");
}
function protokollDateiOeffnen() {
    application.shellExecute(listenPfadProtokoll, 5, "open", "");
}



function datumHeute() {
    //das Datum und die Uhrzeit wird Bestandteil des Dateinamens
    var jetzt = new Date(),
        format = function (t) {
            if (t < 10) {
                return "0" + t;
            }
            return t;
        },
        jahr = format(jetzt.getFullYear()),
        monat = format(jetzt.getMonth() + 1),
        strTag = format(jetzt.getDate()),
        stunde = format(jetzt.getHours()),
        minute = format(jetzt.getMinutes()),
        sekunde = format(jetzt.getSeconds());

    //Dateiname:
    return jahr + "_" + monat + strTag + stunde + minute + sekunde;
}
//--------------------------------------------
function resetAllErsetzen() {
    var antwort = prompter.confirmEx("Suche / Ersetze", "Wollen Sie wirklich alle Felder löschen?", "Ja", "Nein", "", "", ""),
        alleTextboxen,
        alleCheckboxen,
        i;
    if (antwort == 1) {
        return;
    }
    alleTextboxen = document.getElementsByAttribute("name", "textboxTab1");
    for (i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    alleCheckboxen = document.getElementsByAttribute("name", "checkbox");
    for (i = 0; i < alleCheckboxen.length; i += 1) {
        alleCheckboxen[i].checked = false;
    }
    resetAlles();
}

function resetAllZufuegen() {
    var antwort = prompter.confirmEx("Suche / Ersetze", "Wollen Sie wirklich alle Felder löschen?", "Ja", "Nein", "", "", ""),
        alleTextboxen,
        i;
    if (antwort == 1) {
        return;
    }
    alleTextboxen = document.getElementsByAttribute("name", "textboxTab2");
    for (i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    resetAlles();
}

function resetAllLoeschen() {
    var antwort = prompter.confirmEx("Suche / Ersetze", "Wollen Sie wirklich alle Felder löschen?", "Ja", "Nein", "", "", ""),
        alleTextboxen,
        i;
    if (antwort == 1) {
        return;
    }

    alleTextboxen = document.getElementsByAttribute("name", "textboxTab3");
    for (i in alleTextboxen) {
        alleTextboxen[i].value = "";
    }
    resetAlles();
}
function resetAlles() {
    verbergeSchlussmeldung(true);
    strErsetze = "";
    strSuche = "";
    wennKat = "";
    wennText = "";
    dannKat = "";
    dannText = "";
    loescheKat = "";
    bFehler = false;
    strfehlerMeldungen = "";
    document.getElementById("idButtonDateiFehler").hidden = true;
}

function verbergeSchlussmeldung(bVerberge) {
    document.getElementById("idGroupboxSchlussmeldung").hidden = bVerberge;
    window.sizeToContent();
}

