// Datei:		zdb_scripte_intern.js

// globals
var alt_ppn;

var zdb_updateURL = application.getProfileString('ibw.updateservice', 'url', '');
if (-1 != zdb_updateURL.indexOf('zeitschriftendatenbank')) {
    application.writeProfileString('ibw.updateservice', 'url', 'http://winibw-repo.sbb.berlin/winibw/37');
}

/**
 * checks if a user script file is already configured . If not a file is created and path configured
 * this function is called on startup
 * */
__enableUserScriptFile();
function __enableUserScriptFile() {
    var loadandSave = application.getProfileString("ibw.userscript.location", "loadandSave", "");
    if (loadandSave == "") {
        var language = application.getProfileString("ibw.userscript", "language", "JS").toLowerCase();
        var theOutput = utility.newFileOutput();
        var fileOutput = theOutput.createSpecial("ProfD", "winibw." + language);
        theOutput.close();
    }
}
/**
 * zählt Exemplardatensätze
 *
 * @return array|null
 */
function __exemplareAnzahl() {
    var regexpExe;
    var format = __zdbGetFormat();
    var strTitle = application.activeWindow.getVariable("P3CLIP");
    switch (format) {
        case "D": regexpExe = /\n(70[0-9][0-9])/g;
            break;
        case "P": regexpExe = /\n(208@)/g;
    }
    var alleExe = new Array();
    alleExe = strTitle.match(regexpExe);
    //application.messageBox("", alleExe, "message-icon");
    return (!alleExe) ? false : alleExe;
}

//--------------------------------------------------------------------------------------------------------
//name:		__zdbGetParallel
//description:	Liefert ein Objekt über die Parallelausgaben zurueck
//user:	  	all users
//author: 		Carsten Klee
//date:		2014-03-24
//--------------------------------------------------------------------------------------------------------

function __zdbGetParallel() {
    var scr = __zdbCheckScreen(["MT", "8A"], "Parallelausgabe");
    if (false == scr) return false;
    var tag, content, regex, matches,
        contents = [],
        i = 0,
        vortext = /Online|Druck/,
        parallel = {};

    if (application.activeWindow.getVariable("P3GDB").match(/P|PA/i)) {
        tag = "039D";
        regex = new RegExp(delimiterReg + "a([^" + delimiterReg + "]*)(?:" + delimiterReg + "n([^" + delimiterReg + "]*))?" + delimiterReg + "9([^" + delimiterReg + "]*)");
    }
    else if (application.activeWindow.getVariable("P3GDB").match(/D|DA/i)) {
        tag = "4243";
        regex = /([^!]*)!([^!]*)/;
    }

    if ("MT" == scr) {
        while ((content = application.activeWindow.title.findTag(tag, i, false, false, false)) != "") {
            contents[i] = content;
            content = "";
            i++;
        }
    }
    else ("8A" == scr)
    {
        while ((content = application.activeWindow.findTagContent(tag, i, false)) != "") {
            // workaround since findTagContent has errors
            content = content.replace(/^\s+|\s?\n$/g, '');
            contents[i] = content;
            content = "";
            i++;
        }
    }

    for (var x = 0; x < contents.length; x++) {
        if (vortext.test(contents[x])) {
            matches = regex.exec(contents[x]);
            if (matches[3]) {
                parallel[x] = { votext: matches[2], idn: matches[3] };
            } else {
                parallel[x] = { votext: matches[1], idn: matches[2] };
            }
        }
    }
    return (parallel[0]) ? parallel : false;
}



function zdbFIDcsv() {
    const params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
        .createInstance(Components.interfaces.nsIDialogParamBlock);
    params.SetNumberStrings(5);
    params.SetString(0, "pa");
    open_xul_dialog("chrome://ibw/content/xul/ZDB_FID_dialog.xul", null, params);
    // on cancel
    if (params.GetString(1) == "cancel") {
        return;
    }

    var csv = new CSV();
    var file = params.GetString(1);
    csv.delimiter = params.GetString(2);
    var start = parseInt(params.GetString(3));
    var zdbid = parseInt(params.GetString(4));
    zdbid = zdbid - 1;
    params = null;
    var lineArray;
    var zdbids = new Array();

    // load file object
    var theFileInput = utility.newFileInput();
    if (!theFileInput.open(file)) {
        alert("Datei " + file + " wurde nicht gefunden.");
        return false;
    }
    var prompter = utility.newPrompter();
    if (prompter.confirm("Set erstellen", "Erstelle ein Set anhand der Datei " + file + ". Melde mich wieder, wenn ich fertig bin.")) {
        // read the start line
        var aLine = "";
        var i = 1;
        var x = 0;
        while ((aLine = theFileInput.readLine()) != null) {
            if ("" == aLine) continue;
            if (start <= i) {
                lineArray = csv.__csvToArray(aLine);
                zdbids[x] = lineArray[zdbid];
                x++;
            }
            i++;
        }
        theFileInput.close();

        application.activeWindow.command("del s0", false);
        var parallel = new Array();
        for (var y = 0; y < zdbids.length; y++) {
            application.activeWindow.command("f zdb " + zdbids[y], false);
            var tinumber = application.activeWindow.getVariable("P3GTI");
            application.activeWindow.command("sav " + tinumber, false);
            if (parallel = __zdbGetParallel()) {

                for (var o in parallel) {
                    application.activeWindow.command("f idn " + parallel[o].idn, false);
                    var tinumber = application.activeWindow.getVariable("P3GTI");
                    application.activeWindow.command("sav " + tinumber, false);
                }
            }
        }
        application.activeWindow.command("s s0", false);
        if (prompter.confirm("Set erstellt", "Fertig! Habe Set erstellt. Soll das Excel-Skript zum Download geöffnet werden?")) {
            var xulFeatures = "centerscreen, chrome, close, titlebar,modal=no,dependent=yes, dialog=yes";
            open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul", xulFeatures, params);
        }
    }
    else {
        prompter.alert("Abbruch", "Habe Vorgang abgebrochen.")
    }

}

function zdbFIDset() {
    var currentSet = application.activeWindow.getVariable("P3GSE");
    var setSize = application.activeWindow.getVariable("P3GSZ");
    var prompter = utility.newPrompter();
    //Ergänzung GBV: Wenn in Set0 ausgeführt, wird das Exceltool aufgerufen.
    if (currentSet == 0) {
        open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul");
        return;
    }
    if (prompter.confirm("Set erstellen", "Erstelle ein Set anhand des Sets " + currentSet + " mit " + setSize + " Titeln. Melde mich wieder, wenn ich fertig bin.")) {
        application.activeWindow.command("del s0", false);
        var parallel = new Array();
        var i = 1;
        do {

            application.activeWindow.command("s s" + currentSet + " " + i, false);
            var tinumber = application.activeWindow.getVariable("P3GTI");
            application.activeWindow.command("sav " + tinumber, false);
            if (parallel = __zdbGetParallel()) {
                for (var o in parallel) {
                    application.activeWindow.command("f idn " + parallel[o].idn, false);
                    tinumber = application.activeWindow.getVariable("P3GTI");
                    application.activeWindow.command("sav " + tinumber, false);
                }
            }
            i++;

        } while (i <= setSize)

        application.activeWindow.command("s s0", false);
        if (prompter.confirm("Set erstellt", "Fertig! Habe Set erstellt. Soll das Excel-Skript zum Download geöffnet werden?")) {
            open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul");
        }
    }
    else {
        prompter.alert("Abbruch", "Habe Vorgang abgebrochen.")
    }

}

function csvBatchTitel() {
    var csv = new CSV();
    csv.__csvBatchTitle = function () {
        var codes = "";
        var fields = new Array("0600", "0601");
        var values = new Array(csv.code, csv.isil);
        application.activeWindow.command("k", false);
        for (var f in fields) {
            // we don't want empty fields
            if (fields[f] != "") {
                //	check if field alredy exists
                if ((codes = application.activeWindow.title.findTag(fields[f], 0, false, true, false)) == false) {
                    //		move cursor to the end of the buffer
                    application.activeWindow.title.endOfBuffer(false);
                    //		insert a new field with the params value
                    application.activeWindow.title.insertText(fields[f] + " " + values[f] + "\n");
                    //	field does already exist
                }
                else {
                    var codeFalse = 0;
                    // check field  if code is already in it
                    var code = codes.split(";");
                    for (var y in code) {
                        if (code[y].replace(/^\s+/, '').replace(/\s+$/, '') == values[f].replace(/^\s+/, '').replace(/\s+$/, '')) { // replace leading an following whitespaces
                            csv.__csvLOG("Zeichenkette " + values[f] + " war schon im Feld " + fields[f] + " vorhanden.");
                            codeFalse = 1;
                        }
                    }
                    // if code is not already in field
                    if (codeFalse == 0) {
                        application.activeWindow.title.endOfField(false);
                        //		insert params value

                        application.activeWindow.title.insertText(";" + values[f]);
                    }
                }
            }
            else {
                //do nothing
            }
        }
        //			save buffer
        return csv.__csvSaveBuffer(true, "hinzugefuegt " + values[f]);
    }

    csv.__csvSetProperties(csv.__csvBatchTitle, ["", "ZDB-ID"], 'ZDB-ID', 'zdb', false, "ZDB_LOG.txt");
    try {
        csv.__csvConfig();
        csv.__csvBatch();
    }
    catch (e) {
        csv.__csvError(e);
    }
}

//--------------------------------------------------------------------------------------------------------
//name:		csvBatchExemplar
// is called by:	__csvBatchCSV
// calls:		__csvLOG
//description:	writes typical data to the local section of ZDB records
//user:	  	internal
//input: 		Array line: the data to write to the title section
//			Array config: the semantic of each tupel of the Array
//			Array params: some extra params for handling the csv file
//return:		Integer 1 if record was updated, 0 if an error occurred
//author: 		Carsten Klee
//date:		2012-03-28
//version:		1.2
//status:		testing
//--------------------------------------------------------------------------------------------------------
function csvBatchExemplar() {
    var csv = new CSV();
    csv.__csvBatchExemplar = function () {

        //	create field 7120 content
        // start volume
        var v = (csv.line['Band Beginn'] == "" || !csv.line['Band Beginn']) ? "" : "/v" + csv.line['Band Beginn'];
        var v2 = (csv.line['Band Beginn'] == "" || !csv.line['Band Beginn']) ? "" : csv.line['Band Beginn'];

        var b2trenner = (csv.line['Band Beginn'] == "" || !csv.line['Band Beginn']) ? "" : ".";

        // issue start
        var h = (csv.line['Heft Beginn'] == "" || !csv.line['Heft Beginn']) ? "" : "," + csv.line['Heft Beginn'];

        // start year
        var b = (csv.line['Jahr Beginn'] == "" || !csv.line['Jahr Beginn']) ? "" : "/b" + csv.line['Jahr Beginn'];
        var b2 = (csv.line['Jahr Beginn'] == "" || !csv.line['Jahr Beginn']) ? "" : csv.line['Jahr Beginn'];

        // volume end
        var V = (csv.line['Band Ende'] == "" || !csv.line['Band Ende']) ? "" : "/V" + csv.line['Band Ende'];
        var V2 = (csv.line['Band Ende'] == "" || !csv.line['Band Ende']) ? "" : csv.line['Band Ende'];

        var E2trenner = (csv.line['Band Ende'] == "" || !csv.line['Band Ende']) ? "" : ".";

        // issue end
        var H = (csv.line['Heft Ende'] == "" || !csv.line['Heft Ende']) ? "" : "," + csv.line['Heft Ende'];

        // year end
        var E = (csv.line['Jahr Ende'] == "" || !csv.line['Jahr Ende']) ? "" : "/E" + csv.line['Jahr Ende'];
        var E2 = (csv.line['Jahr Ende'] == "" || !csv.line['Jahr Ende']) ? "" : csv.line['Jahr Ende'];

        if ((csv.line['Band Ende'] == "" || !csv.line['Band Ende']) && (csv.line['Jahr Ende'] == "" || !csv.line['Jahr Ende'])) {
            V = "-";
        }

        var bestandsangaben = v + b + V + E;
        var bestandsangaben2 = v2 + b2trenner + b2 + h + " - " + V2 + E2trenner + E2 + H;

        var movingWall = false;
        var mw7140 = "";
        var mw8032 = "";
        if (csv.line['Moving Wall'] && csv.line['Moving Wall'] != '') {
            movingWall = csv.line['Moving Wall'].toString();
            var mwTeile = movingWall.match(/([+-])(\d)([YVMDI])/);
            mw7140 = "\n7140 " + mwTeile[1] + mwTeile[3] + "00" + mwTeile[2];
            switch (mwTeile[3]) {
                case "Y": var entity = "Jahre";
                    break;
                case "V": var entity = "Jahrgänge";
                    break;
                case "M": var entity = "Monate";
                    break;
                case "D": var entity = "Tage";
                    break;
                case "I": var entity = "Hefte";
                    break;
            }
            mw8032 = " [" + mwTeile[1] + mwTeile[2] + " " + entity + "]";
        }


        //	create value for field 7135
        var lizenz = "";
        switch (csv.code) {
            case "nl": lizenz = "=x Nationallizenz";
                break;
            case "ad": lizenz = "=x DFG-geförderte Allianz-Lizenz";
                break;
            case "al": lizenz = "=x Allianz-Lizenz";
                break;
            case "nk": lizenz = "=x Nationalkonsortium";
                break;
            case "": lizenz = "";
                break;
            default: lizenz = "";
        }


        application.activeWindow.command("show d", false);
        // Sichert Inhalt des Zwischenspeichers, da dieser sonst durch copyTitle() überschrieben würde

        try {
            var clipboard = application.activeWindow.clipboard;
        } catch (e) {
            // do nothing
        }
        // Kopiert Titel
        var kopie = application.activeWindow.copyTitle();
        application.activeWindow.clipboard = clipboard;
        //Schleife von 1 bis 99, da max. 99 Exemplare pro Bibliothek erfasst werden können
        for (var i = 1; i <= 99; i++) {
            var vergleich = 7000 + i;
            if (kopie.indexOf(vergleich) == -1) {
                var eingabe = vergleich + " x\n4800 " + csv.eigene_bibliothek + "\n7120 " + bestandsangaben + "\n7135 =u " + csv.line['URL'] + lizenz + mw7140 + "\n8032 " + bestandsangaben2 + mw8032 + "\n";
                if ('' !== csv.text) eingabe += "8034 " + csv.text + "\n";
                // Exemplarsatz anlegen und befüllen
                application.activeWindow.command("e e" + i, false);
                if (application.activeWindow.status != "ERROR") {
                    application.activeWindow.title.startOfBuffer(false);
                    application.activeWindow.title.insertText(eingabe);
                }
                //save buffer
                return csv.__csvSaveBuffer(true, eingabe);
            }
        }
    }
    csv.__csvSetCallback(csv.__csvBatchExemplar);
    try {
        csv.__csvConfig();
        csv.__csvBatch();
    }
    catch (e) {
        csv.__csvError("csvBatchExemplar:" + e);
    }
}

function excelTabelle() {
    var xulFeatures = "centerscreen, chrome, close, titlebar,modal=no,dependent=yes, dialog=yes";
    open_xul_dialog("chrome://ibw/content/xul/k10_excelTabelle_dialog.xul", xulFeatures);
}

function ZDBWinIBWInfo() {
    application.shellExecute("http://www.zeitschriftendatenbank.de/erschliessung/winibw", 5, "open", "");
}

function WinIBWSupport() {
    application.shellExecute("mailto:zdb-winibw@sbb.spk-berlin.de?subject=[WinIBW 3.7.0] ", 5, "open", "");
}

function zdbformat() {
    var strkat, re;
    if (!application.activeWindow.title) {
        application.shellExecute("https://www.zeitschriftendatenbank.de/erschliessung/zdb-format/", 5, "open", "");
    }
    else {
        strkat = application.activeWindow.title.tag;
        re = new RegExp("480.|482[02]|6700|7...|8[0-5]..|^...$");
        if (re.test(strkat)) {
            application.shellExecute("http://www.zeitschriftendatenbank.de/erschliessung/zdb-format/" + strkat, 5, "open", "");
        } else {
            application.shellExecute("http://www.zeitschriftendatenbank.de/fileadmin/user_upload/ZDB/pdf/zdbformat/" + strkat + ".pdf", 5, "open", "");
        }
    }
}

function sucheErsetze() {
    var xulFeatures = "centerscreen, chrome, close, titlebar,resizable, modal=no, dependent=yes, dialog=no";
    open_xul_dialog("chrome://ibw/content/xul/gbv_sucheErsetze_dialog.xul", xulFeatures);
}

/**
* Scherer Birgit, BSZ
* 10.04.2012
*/
function tf_vollenden() {
    var katString;
    var temp;
    var pos = 0;
    var strCounter = 0;
    var windstat;


    // String der Kat. 111 auslesen
    katString = application.activeWindow.title.findTag("111", 0, false, false, true);


    // Merker alt_ppn auf '0' setzen. Naeheres siehe tf_vollenden_fortsetzen().
    alt_ppn = 0;


    //-------------------------------------------
    // Behandlung von $d (Datum)
    //-------------------------------------------

    temp = katString;  // Urspruenglichen Kategoriestring in temp einspeichern


    // String $d bis Ende
    pos = temp.indexOf(delimiter + "d");
    if ((pos > 0) && (temp.length > pos + 2)) {
        temp = temp.substring(pos + 2);
    }

    //** Eine Jahreszahl muss vorhanden sein. Deshalb die unsaubere Programmierung. **

    // Falls $c vorhanden, dann nur den Inhalt *bis* $c verwenden
    var pos1 = temp.indexOf(delimiter + "c");
    var pos2 = temp.indexOf(delimiter + "g");

    // Den kleineren (aber positiven) Wert verwenden.
    // Beachte: $c kommt immer vor $g (Reihenfolge)
    if (pos1 > 0) {
        pos = pos1;
    }
    else { // pos1 ist <= 0, nun pos2 pruefen
        if (pos2 > 0) {
            pos = pos2;
        }
    }

    // Nur wenn ein Positionswert gefunden wurde und.. s.u.
    if (pos > 0) {
        temp = temp.substring(0, pos);
        //..und der Datumsstring keinen Bindestrich enthaelt.
        if (temp.indexOf("-") <= 0) {
            temp = delimiter + "c" + temp;
        }
    }



    // Enthaelt das Ergebis zwei Jahreszahlen, getrennt durch Bindestrich,
    // ist der Zielwert durch $b zu trennen.
    if (temp.indexOf("-") > 0) {

        // Leerzeichen mehrfach durch nichts ersetzen, da es kein allg. replaceAll gibt.
        temp = temp.replace(" ", "");
        temp = temp.replace(" ", "");

        // Sonderfall: Kein Endedatum, String endet mit Bindestrich
        if (temp.charAt(temp.length - 1) == "-")
            temp = temp.replace("-", "");

        temp = temp.replace("-", delimiter + "b");
    }

    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n548 " + temp + delimiter + "datv");



    //-------------------------------------------
    // Behandlung der Veranstaltungsorte ($c)
    //-------------------------------------------

    var ppn = "";

    temp = katString;  // Urspruenglichen Kategoriestring in temp einspeichen


    //-- Erstes $c suchen und den String danach mit split aufteilen (in ein Orte-Array)

    pos = temp.indexOf(delimiter + "c");
    if ((pos > 0) && (temp.length > pos + 2)) {
        temp = temp.substring(pos + 2);

        //_showMessage("$c ist vorhanden");

        // Falls noch $g vorkommt
        pos = temp.indexOf(delimiter + "g");
        if (pos > 0) {
            temp = temp.substring(0, pos);
        }

        var ortArray = temp.split("; ");
        var anzOrte = ortArray.length;
        var ort;
        var winId;

        // Win-ID des aktiven Fensters (fuer die spaetere Reaktivierung)
        var edit_winId = application.activeWindow.windowID;

        // Array leeren
        search_winIdArray.length = 0;
        search_ortArray.length = 0;

        // Hochzaehlen, nur wenn Suchfenster fuer die Orte angezeigt sind.
        var ortSuchfensterZaehler = 0;
        var zusatzText = "";


        // Schleife ueber die Orte (gelistet im Editfenster)
        for (var i = 0; i < anzOrte; i++) {

            ort = ortArray[i];

            // Ggf. 'u.a.' aus Ortsnamen entfernen
            //ort = ort.replace(/u\.a\./, "");
            //ort = ort.replace(/u\.\sa\./, "");
            ort = ort.replace(/\s+u\.\s*a\./, "");


            //_showMessage("Ort (nach Bereinigung): " + ort, "vollenden()");  // TEST

            // Suchbefehl u. gleichzeitiges OEFFNEN eines neuen Fensters
            application.activeWindow.command("rec n;f kor " + ort + " and bbg tg* and ent gik", true);

            // Eintraege in die globalen Arrays einstellen
            winId = application.activeWindow.windowID;  // ID des Suchfensters
            search_winIdArray.push(winId);
            search_ortArray.push(ort);

            windstat = application.activeWindow.status;  // Fuer den Nohits-Fall

            // Bei Gleichheit der Variablen erscheint die Review-Anzeige.
            // Problem: Die Trefferanzahl kann dann nicht korrekt ausgelesen werden.
            // (Die Treffer erscheinen nicht auf einer Seite..).
            if (application.activeWindow.getVariable("P3GSZ") == application.activeWindow.getVariable("P3GSE"))
                strCounter = "viele";
            else
                strCounter = application.activeWindow.getVariable("P3GSZ");


            if (windstat == "NOHITS") {
                application.messageBox("", "Ortssuche ergab keinen Treffer, bitte prüfen Sie den Suchstring. Ort wird als reiner Text hinterlegt", "");

                application.activeWindow.closeWindow();  // Schliessen des Suchfensters
                application.activateWindow(edit_winId);  // Editfenster aktivieren
                application.activeWindow.title.insertText("\n551 " + ort + delimiter + "4ortv");

                // Eintraege aus den globalen Arrays entfernen.
                // (Relevant bei mehreren Orten/Suchfenstern.)
                search_winIdArray.pop();
                search_ortArray.pop();

                // Wechsel zu einem evtl. noch vorhandenen Suchfenster
                if (search_winIdArray.length > 0) {
                    application.activateWindow(search_winIdArray[search_winIdArray.length - 1])
                }
            }
            else { // Es gibt Treffer -> zwei Faelle
                if (strCounter == 1) {
                    // Fall 1: Genau ein Treffer
                    //application.messageBox("", "Treffer: " + strCounter, "");

                    ppn = application.activeWindow.getVariable("P3GPP");

                    application.activeWindow.closeWindow();  // Schliessen des Suchfensters
                    application.activateWindow(edit_winId);  // Editfenster aktivieren
                    application.activeWindow.title.insertText("\n551 !" + ppn + "!" + delimiter + "4ortv");

                    // Eintraege aus den globalen Arrays entfernen.
                    // (Relevant bei mehreren Orten/Suchfenstern.)
                    search_winIdArray.pop();
                    search_ortArray.pop();

                    // Wechsel zu einem evtl. noch vorhandenen Suchfenster
                    if (search_winIdArray.length > 0) {
                        application.activateWindow(search_winIdArray[search_winIdArray.length - 1])
                    }
                }
                else {
                    // Fall 2: strCounter ist groesser 1 (Anzeige eines Suchfensters).
                    // Die notwendigen Aktionen dieses Else-Zweiges werden in der
                    // Funktion 'vollenden_fortsetzen' abgearbeitet.

                    //application.messageBox("", "Treffer (strCounter): " + strCounter, "");  // TEST

                    //-- Vor den weiteren Aktionen erfolgt ein prophylaktischer
                    // Eintrag der Ortsvorgabe.
                    // Hintergrund: Wuerde der Nutzer das Suchfenster (fuer die Orte)
                    // einfach schliessen, so gaebe es ueberhaupt einen Eintrag.

                    // Zum Editfenster wechseln
                    application.activateWindow(edit_winId);
                    // Der prophylaktische Eintrag
                    application.activeWindow.title.insertText("\n551 " + ort + delimiter + "4ortv");
                    // Wiederaktivieren des Suchfensters
                    application.activateWindow(winId);


                    ortSuchfensterZaehler++;  // Hochzaehlen

                    // Zusatztext fuer die Message-Box (ab zwei Orten)
                    if (ortSuchfensterZaehler > 1) {
                        zusatzText = "Achtung, Suchfenster fuer den "
                            + ortSuchfensterZaehler + "-ten Ort\n\n";
                    }

                    application.messageBox("", zusatzText
                        + "Die Körperschaftensuche ergab " + strCounter
                        + " Treffer, bitte wählen Sie einen Satz aus aktivieren Sie"
                        + " dann die Funktion 'TF_Vollenden_Forsetzen'.\n"
                        + "Wenn Sie den passenden Ort nicht finden, können Sie in"
                        + " dem Fenster eine erneute Suche tätigen und dann erst die"
                        + " Funktion 'TF_Vollenden_Fortsetzen' ausführen", "");
                    // "Sollten Sie keinen entsprechenden Normdatensatz vorfinden,
                    //so schließen Sie einfach das aktuelle Fenster.", "");
                }
            }

        }  // end-for

    }

}

/**
* Scherer Birgit, BSZ
* 10.04.2012
*/
function tf_vollenden_fortsetzen() {
    var anzSuchfenster = search_winIdArray.length;  // Anzahl der geoeffneten Suchfenster
    var ppn;
    var winId;

    var flgWinId = true;
    var flg = true;
    var suchZeile;


    //-- Stets nur das letzte Suchfenster 'abarbeiten' (sofern es mehrere gibt).
    winId = search_winIdArray[anzSuchfenster - 1];  // ID des (letzten) Suchfensters

    //_showMessage("WINID: " + winId + " -- Ort: " + search_ortArray[anzSuchfenster-1]);

    try {
        flgWinId = application.activateWindow(winId);  // Fenster aktivieren (zur Sicherheit)
    } catch (e) {
        // Fehlerzweig zum Bereinigen/Reduzieren der Array.
        // Ursache: Haendisches Schliessen eine Suchfensters.

        //application.messageBox("", "Fehler mit WinID: " +winId +" " +search_ortArray[anzSuchfenster-1], "error_icon");

        if (search_winIdArray.length > 0) {
            search_winIdArray.pop();  // Array-Elemente entfernen
            search_ortArray.pop();
        }

        //_showMessage("Anz. Such-WinIDs (nachher 1): " +search_winIdArray.length, "vollenden_fortsetzen()");

        // Selbstaufruf, sofern noch Array-Elemente vorhanden sind
        if (search_winIdArray.length > 0) {
            tf_vollenden_fortsetzen();  // >>>>> Selbstaufruf der Funktion
        }

        return;  // >>>>> Funktion beenden (..sollte erfolgen)
    }



    //-- Start PPN auslesen --------------------
    //
    // Die PPN wird dem Suchfenster entnommen. Das ist soweit problemlos. Im Fall
    // von zwei Orten gibt es eine Unleidlichkeit, wenn im zweiten Suchfenster der
    // Cursor nicht bewegt wird, also der Auswahlbalken auf dem ersten Eintrag bleibt.
    // Dabei kommt es eben nicht zur Auswahl des ersten Eintrags, sondern es eird die
    // im ersten Suchfenster ausgewaehlte PPN herangezogen.
    // Deshalb wird ein Vergleich mit dem Merker 'alt_ppn' gemacht. Tritt nun der
    // oben beschriebene Fall ein, so wird per Enter-Kommando 'FR' ein Fenster ge-
    // oeffnet, das nur den einzelnen Eintrag enthaelt. Hier laesst sich die PPN nun
    // sauber auslesen.
    // Die generelle Anwendung des Enter-Kommandos (Fensteroeffnung zur alleinigen
    // Anzeige eines Treffers) ist allerdings auch keine Loesung, da dies vom Nutzer
    // selbst ausgeloest werden kann. Folgt dann noch ein Enter-Kommando vom Programm
    // her, so wird der naechste Eintrag des Suchfensters gewaehlt (-> Fehlerfall).

    // PPN des gewaehlten Eintrags aus dem aktiven Suchfenster auslesen
    ppn = application.activeWindow.getVariable("P3GPP");

    //_showMessage(ppn + "\nCursor Position: " + application.activeWindow.getVariable("P3G!P") );

    xx = ppn;
    // Erst fuer das zweite Suchfenster verwenden
    if ((alt_ppn != 0) && (ppn == alt_ppn)) {
        //_showMessage("Im IF-Zweig -- alt_ppn: " + alt_ppn);
        // Enter-Befehl absetzen.
        // (Dies oeffnet ein Fenster, das nur den gewaehlten Eintrag anzeigt.)
        application.activeWindow.simulateIBWKey("FR");
        // Nochmals die PPN auslesen
        ppn = application.activeWindow.getVariable("P3GPP");
    }

    //_showMessage("alt_ppn: " + alt_ppn + "\n\n"   + "XX: " + xx + " -- PPN: " + ppn);
    //_showMessage("XX: " + xx + " -- PPN: " + ppn);

    alt_ppn = ppn;  // Merker belegen (alt_ppn ist eine glob. Variable)

    //-- Ende PPN auslesen --------------------------



    // Aktives Suchfenster schliessen
    application.activeWindow.closeWindow();


    //-- Zum Edit-Fenster wechseln, prophylaktischen Eintrag suchen u. ersetzen
    application.activateWindow(edit_winId);

    application.activeWindow.title.startOfBuffer(false);  // Ganz oba na ganna
    suchZeile = "551 " + search_ortArray[anzSuchfenster - 1] + delimiter + "4ortv";  // Suchzeile
    // Suche ausfuehren
    flg = application.activeWindow.title.find(suchZeile, false, false, false);

    if (flg) {
        //_showMessage("gefunden");
        application.activeWindow.title.deleteLine(1);  // Zeile loeschen
        //application.activeWindow.title.lineUp(1,false);

        //application.activeWindow.title.endOfBuffer(false);
        application.activeWindow.title.insertText("551 !" + ppn + "!" + delimiter + "4ortv\n");
    }
    else {
        _showMessage("Fehler Ortsnamenvorage: Keine Uebereinstimmung Array-Editfenster" + suchZeile);
    }


    // Letzte Array-Eintraege entfernen
    // (Darf erst an dieser Programmstelle vorgenommen werden).
    search_winIdArray.pop();
    search_ortArray.pop();


    // Wechsel zum naechsten Suchfenster (sofern vorhanden).
    // Das letzte wurde abgearbeitet und geschlossen. Nun wird das neue letzte
    // Suchfenster zur Abarbeitung aktiviert.
    if (search_winIdArray.length > 0) {
        //_showMessage("Anz. Such-WinIDs (nachher 2): " + search_winIdArray.length, "vollenden_fortsetzen()");
        winId = search_winIdArray[search_winIdArray.length - 1];

        // Die Try-Struktur wird benoetigt, wenn bei zwei Suchfenstern das
        // erst-geoeffnete haendich geschlossen wurde.
        try {
            flgWinId = application.activateWindow(winId);    // Suchfenster aktivieren

            // Im FEHLERFALL abarbeiten
            if (!flgWinId) {
                _showMessage("Fehler mit WinID (Restfenster): " + winId, "vollenden_fortsetzen");
                search_winIdArray.pop();  // WinID aus dem Array entfernen
                search_ortArray.pop();
            }
        } catch (e) {
            //_showMessage("Fehler mit WinID (Restfenster): " + winId , "vollenden_fortsetzen");
        }
    }

    return;
}

//--------------------------------------------------------------------------------------------------------
//name:		zdbGNDSkripte
//description:	öffnet die GND-Skript-Übersicht im Browser
//user:	  	all users
//input: 		none
//author: 		Carsten Klee
//date:		2012-11-12
//--------------------------------------------------------------------------------------------------------
function zdbGNDSkripte() {
    application.shellExecute("https://wiki.dnb.de/display/ILTIS/GND-WinIBW-Skripte+und+-Datenmasken", 5, "open", "");
}

function stapelJob() {
    var xulFeatures = "centerscreen, chrome, close, titlebar,resizable, modal=no, dependent=yes, dialog=no";
    open_xul_dialog("chrome://ibw/content/xul/ZDB_stapelJob_dialog.xul", xulFeatures);
}

function isil_online() {
    var strScreen = __zdbCheckScreen(['8A', 'MT', 'IT', 'MI'], 'ISIL Online');
    if (false == strScreen) return false;
    if ('Tw' != application.activeWindow.getVariable('P3VMC')) {
        return __zdbError('Die Funktion kann nur in Verbindung mit Tw-Sätzen genutzt werden.');
    }
    __zdbJSON(application.activeWindow.getVariable('P3GPP'));
    application.shellExecute('http://ld.zdb-services.de/resource/organisations/' + _rec['008H'][0]['e'][0], 5, 'open', '');
}

/**
* Inserts a subfield with content
*
* @param {string} field the field for the subfield
* @param {string} subfield the subfield tag
* @param {string} content the content of the subfield
* @param {string} pos optional: the subfield position 0 ... x
* @param {string} pos optional: the occurence of a repeatable field 0 ... x
*/
function __zdbInsertSubfield(field, subfield, content, pos, occ) {
    var data = '',
        splitted = [],
        splitter;
    if (typeof occ === 'undefined') {
        occ = 0;
    }
    if ('' == (data = application.activeWindow.title.findTag(field, occ, false, true, false))) {
        return false;
    }
    splitter = ('P' == __zdbGetFormat()) ? delimiter : '$';
    splitted = data.split(splitter);
    if (typeof pos === 'undefined') {
        splitted.push(subfield + content);
        if('a' != splitted[0][0]) {
            splitted[0] = 'a' + splitted[0];
        }
        splitted.sort();
        splitted[0] = splitted[0].substr(1);
    } else {
        splitted.splice(pos, 0, subfield + content);
    }
    application.activeWindow.title.insertText(splitted.join(splitter));
}
