// Datei:           zdb_scripte_feld7120.js
// Autor:           Johann Rolschewski, Wenke Röper, Carsten Klee (ZDB)
// =======================================================================
// START ***** FELD 7120 *****
// =======================================================================
// Unterfunktionen:
//  __Feldauf7120()
//  __Klammern7120()
//  __Vor7120()
//  __Bindestrich7120()
//  __Punkt71204024()
//  __Gleich7120()
//  __Komma71204024()
//  __Ziffer7120()
//  __Musterjahr7120()
// =======================================================================

var fehlerin7120;

function zdb_Feld7120() {
    if(false == __zdbCheckScreen(["IE","IT","ME","MT"],"Feld7120")) return false;
    __feld7120(true,true,false);
}

function __feld7120(displayError,write,direct) {

    // Globale Fehlervariable
    fehlerin7120 = "";
    var inhalt8032;
    var feldnummer;
    if(false == direct) // lese aktuelles Feld
    {
        feldnummer = application.activeWindow.title.tag;
        if(feldnummer != "8032"){
            // Skriptabbruch, falls Aufruf aus falschem Feld erfolgt
            application.messageBox("Feld7120", "Die Funktion darf nicht für das Feld " + feldnummer + " aufgerufen werden.", "alert-icon");
            return;
        }
        feld8032 = application.activeWindow.title.currentField;
        feldnummer = "7120";
    }
    else // nehme direkten input
    {
        feld8032 = direct;
        feldnummer = feld8032.substring(0, 4);
        if(feldnummer != '8032' && feldnummer != '4025') {
            feldnummer = '8032';
            feld8032 = '8032 ' + feld8032;
        }
    }
    // Feldinhalt ermitteln
    var inhalt8032 = feld8032.substring(5, feld8032.length);
    var inhalt7120 = __Feldauf7120(inhalt8032);
    if (fehlerin7120 != "")
    {
        if(displayError) application.messageBox("Feld7120", fehlerin7120, "alert-icon");
    }
    if(write)
    {
        // Feld ausgeben
        application.activeWindow.title.startOfField(false);
        application.activeWindow.title.insertText(feldnummer + ' ' + inhalt7120 + "\n");
    }
    else
    {
        return inhalt7120;
    }
}


function __Feldauf7120(inhalt8032){

    // '==================================================
    // ' Auswertung von Heftnummern für Feld 4024
    // '   Komma7120 --> Komma71204024
    // '   Punkt7120 --> Punkt71204024
    // '==================================================
    var inhalt7120 = [],
        teil;

    // Nummernzeichen und Inhalt weglassen
    inhalt8032 = inhalt8032.replace(/#[^#]*#/gi, "");
    // Texte entfernen
    inhalt8032 = inhalt8032.replace(/SS/g, "");
    inhalt8032 = inhalt8032.replace(/WS/g, "");
    inhalt8032 = inhalt8032.replace(/Nr\./g, "");
    inhalt8032 = inhalt8032.replace(/u\./g, ",");
    inhalt8032 = inhalt8032.replace(/nachgewiesen/gi, "");
    inhalt8032 = inhalt8032.replace(/\.Danachabbestellt/gi, "");

    // Teile 8032 in Blöcke auf
    var blocks = inhalt8032.split(';');

    // für jeden Block
    for (var b = 0; b < blocks.length; b += 1) {
        teil = '';
        // Klammern entfernen
        blocks[b] = __Klammern7120(blocks[b]);

        // Start- und Endgruppe erstellen
        blocks[b] = __Bindestrich7120(blocks[b]);

        // Startgruppe
        blocks[b].start = __Vor7120(blocks[b].start);
        if('' == blocks[b].start) {
           delete blocks[b];
           continue;
        }
        blocks[b].start = __Punkt71204024(blocks[b].start, 'start');
        if(blocks[b].start.band != '') {
            blocks[b].start.band = '/v' + blocks[b].start.band;
        }
        if(blocks[b].start.jahr != '') {
            blocks[b].start.jahr = '/b' + blocks[b].start.jahr;
        }
        teil = blocks[b].start.band + blocks[b].start.jahr;

        // Endgruppe
        if(blocks[b].end) {
            if(blocks[b].end == '-') {
                teil += blocks[b].end;
            } else {
                blocks[b].end = __Vor7120(blocks[b].end);
                blocks[b].end = __Punkt71204024(blocks[b].end, 'end');
                if(blocks[b].end != '-') {
                    if(blocks[b].end.band != '') {
                        blocks[b].end.band = '/V' + blocks[b].end.band;
                    }
                    if(blocks[b].end.jahr != '') {
                        blocks[b].end.jahr = '/E' + blocks[b].end.jahr;
                    }
                    blocks[b].end = blocks[b].end.band + blocks[b].end.jahr;
                }
                teil += blocks[b].end;
            }
        }
        inhalt7120.push(teil.replace(/\s/g, ""));

    }

    return inhalt7120.join('; ');
}


function __Klammern7120(feld) {
    // Runde Klammern und Inhalt weglassen
    feld = feld.replace(/\([^)]*\)/g, "");
    // Geschweifte Klammern und Inhalt weglassen
    feld = feld.replace(/\{[^}]*\}/gi, "");


    // Muster = 4 Ziffern oder 4 Ziffern, Schrägstrich, 2 Ziffern
    // Eckige Klammern mit Inhalt Fragezeichen weglassen
    feld = feld.replace(/(\[[^\]]*?\?\])/gi, "");

    //Texte in Klammern entfernen z.b. [Band 1]. -> [1.]
    feld = feld.replace(/(\[)(\D*)([0-9\/.]+)(\D*)(\])/g, "$1$3$5");

    // Eckige Klammern mit Nummern und Slash zulassen
    feld = feld.replace(/(\[)(\d+(:?\/?\d+)?\.?)*?(\])/g, "$2");

    // restliche eckige Klammern löschen
    feld = feld.replace(/\[[^\]]+?\]/, "");

    return feld;
}


function __Vor7120(feld) {
    // Vom Anfang her alles vor 1. Ziffer löschen
    // Erstes Zeichen ermitteln
    var first = feld.substring(0,1);
    // Wenn erstes Zeichen keine Zahl und auch kein Leerzeichen ist, wird es gelöscht
    while (isNaN(first) || first == " ") {
        feld = feld.substring(1,feld.length);
        first = feld.substring(0,1);
    }
    return feld;

}


function __Bindestrich7120(feld) {

    // Bindestrich mit Leerzeichen durch ~ ersetzen

    var hilfsfeld = feld;
    var kommada = false;
    var bindestrich7120 = "";
    var len = hilfsfeld.length;
    // "ff." am Ende durch "-" ersetzen, sofern Inhalt länger als 3 Zeichen lang
    if (len > 3 && hilfsfeld.substring(len - 3, len) == "ff.") {
        hilfsfeld = hilfsfeld.substring(0, len - 3) + "-";
        len = hilfsfeld.length;
    }
    // Bindestrich ohne Komma davor durch "~" ersetzen
    for (var i = 0; i <= len; i++) {
        var zeichen = hilfsfeld.substring(i, i + 1);
        if (zeichen == ";") {
            kommada = false;
        }
        if (zeichen == ",") {
            kommada = true;
        }
        if (zeichen == "-" && kommada == false) {
            bindestrich7120 = bindestrich7120 + "~";
        } else {
            bindestrich7120 = bindestrich7120 + zeichen;
        }
    }
    // Bindestrich mit Leerzeichen durch "~" ersetzen
    bindestrich7120 = bindestrich7120.replace(/\s-\s?|-\s/g, "~");
    bindestrich7120 = bindestrich7120.replace(/~$/, "~-");

    var start_end_split = bindestrich7120.split("~", 2);
    var start_end = {};
    start_end.start = '';
    start_end.end = '';
    if(1 < start_end_split.length) {
        start_end.end = start_end_split[1].replace(/^\s+|\s+$/g,'');
    }
    start_end.start = start_end_split[0].replace(/^\s+|\s+$/g,'');

    return start_end;

}

function __Punkt71204024(feld, startEnd) {
    // Unterfunktion zu Feld7120 -> Feldauf7120
    // Aufgaben:
    //  - Entfernen von "zu", "F.", "S.", "Ser.", "Trim." mit jeweils zugehörigem Vortext
    //  - Teilen und speichern von Band und Jahr in einzelnen variablen

    // Ziffer, Punkt, Ziffer bzw. Ziffer Punkt Leerzeichen Ziffer wird ersetzt durch Ziffer*Ziffer
    feld = feld.replace(/([0-9])\.\s{0,1}([0-9])/g, "$1*$2");
    // bzw. Ziffer Punkt Leerzeichen (Fall: Band.[?] -> Band. -> Band*) // cs 02.11.2010
    //inhalt8032 = inhalt8032.replace(/([0-9])\.\s{0,1}([0-9]){0,1}/g, "$1*$2");
    var band_jahr = {};
    band_jahr.band = '';
    band_jahr.jahr = '';
    var len = feld.length;
    if (feld == "") {
        band_jahr.band = "";
        band_jahr.jahr = "";
    } else {
        var posi = feld.indexOf("zu");
        if (posi > -1 && posi < len) {
            feld = feld.substring(posi + 2, len);
        }
        posi = feld.indexOf("F.");
        if (posi > -1 && posi < len) {
            feld = feld.substring(posi + 2, len);
        }
        posi = feld.indexOf("S.");
        if (posi > -1 && posi < len) {
            feld = feld.substring(posi + 2, len);
        }
        posi = feld.indexOf("Ser.");
        if (posi > -1 && posi < len) {
            feld = feld.substring(posi + 4, len);
        }
        posi = feld.indexOf("Trim.");
        if (posi > -1 && posi < len) {
            feld = feld.substring(posi + 5, len);
        }
        // Trennen von Band und Jahr -> Speichern in zwei getrennten Variablen
        posi = feld.indexOf("*");

        if (posi == -1) {
            band_jahr.jahr = feld;
        } else if (posi == len) {
            band_jahr.band = feld;
        } else {
            band_jahr.band = feld.substring(0, posi);
            band_jahr.jahr = feld.substring(posi + 1, len);
        }
        if (band_jahr.band != "") {
            band_jahr.band = __Gleich7120(band_jahr.band);
        }
        if (band_jahr.band != "") {
            band_jahr.band = __Komma71204024(band_jahr.band);
        }
        if (band_jahr.band != "") {
            band_jahr.band = __Ziffer7120(band_jahr.band);
        }
        if (band_jahr.jahr != "") {
            band_jahr.jahr = __Gleich7120(band_jahr.jahr);
        }
        if (band_jahr.jahr != "") {
            band_jahr.jahr = __Komma71204024(band_jahr.jahr);
        }
        if (band_jahr.jahr != "") {
            band_jahr.jahr = __Ziffer7120(band_jahr.jahr);
        }
        if ("" == band_jahr.band && (isNaN(band_jahr.jahr.substring(0,4)) || band_jahr.jahr.length < 4)) {
            band_jahr.band = band_jahr.jahr;
            band_jahr.jahr = "";
        }
        // Prüfungen an den Zahlen
        if (band_jahr.jahr != "") {
            band_jahr.jahr = __Musterjahr7120(band_jahr.jahr, startEnd);
        }
    }

    return band_jahr;
}


function __Gleich7120(feld) {
    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: Alles hinter Gleichheitszeichen bis Zeilenende entfernen

    var posi = feld.indexOf("=");
    if (posi > -1 ) {
        feld = feld.substring(0, posi);
    }
    return feld.replace(/^\s+|\s+$/g, '');

}


function __Komma71204024(feld) {
    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: Feld bei Komma abschneiden
    var posi = feld.indexOf(",");
    if (posi > -1 ) {
        feld = feld.substring(0, posi);
    }
    return feld;
}


function __Ziffer7120(feld) {
    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: Falsche Zeichen (~ *) entfernen
    var falschezeichen = "";
    var zeich = "";
    var ziffern7120 = "";
    for (i = 0; i < feld.length; i++) {

        zeich = feld.substring(i, i + 1);

        if (zeich == "~") {
            zeich = "-";
        }
        if (zeich == "*") {
            zeich = ".";
        }
        if (isNaN(zeich)) {
            //if (zeich == "/" && i > 0) {
            // edit: z.B. 1-4/5; vorher 4/5; jetzt 1-4/5

            if (zeich.match(/[\/\-]/) && i > 0) {

                ziffern7120 = ziffern7120 + zeich;
            } else {
                falschezeichen = falschezeichen + zeich;
            }
        } else {
            ziffern7120 = ziffern7120 + zeich;

        }
    }
    if (falschezeichen != "") {
        fehlerin7120 = fehlerin7120 + "Ungültige Zeichen werden weggelassen: " + falschezeichen + "\n";
    }

    return ziffern7120;

}


function __Musterjahr7120(feld, startEnd) {

    if(/\//.test(feld)) {
        var jahre = /^(\d{4})\/(\d{4}|\d{2})$/.exec(feld);
        if(null == jahre) {
            fehlerin7120 = fehlerin7120 + "Falsche Jahreszahl wird weggelassen: " + feld + "\n";
            return feld = '';
        }

        /*if('start' == startEnd) {
            fehlerin7120 = fehlerin7120 + "Startgruppe: weitere Jahre werden weggelassen: " + jahre[2] + "\n";
            feld = jahre[1];
        } else if(2 == jahre[2].length) {
            fehlerin7120 = fehlerin7120 + "Endgruppe: weitere Jahre werden weggelassen: " + jahre[1] + "\n";
            feld = jahre[1].substring(0,2) + jahre[2];
        } else {
            fehlerin7120 = fehlerin7120 + "Endgruppe: weitere Jahre werden weggelassen: " + jahre[1] + "\n";
            feld = jahre[2];
        }*/

    } else if(feld.length !== 4) {
        fehlerin7120 = fehlerin7120 + "Falsche Jahreszahl wird weggelassen: " + feld + "\n";
        return feld = '';
    }

    return feld;
}

// =======================================================================
// ENDE ***** FELD 7120 *****
// =======================================================================
