// Datei:           zdb_scripte_feld7120.js
// Autor:           Johann Rolschewski, Wenke Röper, Carsten Klee (ZDB)
// =======================================================================
// START ***** FELD 7120 *****
// =======================================================================
// Das Script muss im Editierbildschirm aufgerufen werden im Feld 8032 oder 7121 oder 4025.
// Das Feld 7120 (oder 4026) wird erzeugt und über dem Feld ausgegeben.
// Unterfunktionen:
//  __Feldauf7120()
//  __Klammern7120()
//  __Vor7120()
//  __Bindestrich7120()
//  __Tilde7120()
//  __Punkt71204024()
//  __Gleich7120()
//  __Komma71204024()
//  __Ziffer7120()
//  __Musterjahr7120()
// =======================================================================


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
        // Feld markieren, in dem der Cursor steht
        application.activeWindow.title.startOfField(false);
        application.activeWindow.title.endOfField(true);
        var feld8032 = application.activeWindow.title.selection;
        // Feldnummer ermitteln
        feldnummer = feld8032.substring(0, 4);
        // In Abhängigkeit der Feldnummer, wird festgelegt, welches Feld zu erzeugen ist (7120 oder 4025)
        if(feldnummer == "8032" || feldnummer == "7120")
        {
            feldnummer = "7120";
        }
        else
        {
        // Skriptabbruch, falls Aufruf aus falschem Feld erfolgt
            application.messageBox("Feld7120", "Die Funktion darf nicht für das Feld " + feldnummer + " aufgerufen werden.", "alert-icon");
            return;
        }
    }
    else // nehme direkten input
    {
        feld8032 = direct;
        feldnummer = feld8032.substring(0, 4);
    }
    // Feldinhalt ermitteln
    var inhalt8032 = feld8032.substring(5, feld8032.length);
    var inhalt7120 = __Feldauf7120(inhalt8032, feldnummer);
    if (fehlerin7120 != "")
    {
        if(displayError) application.messageBox("Feld7120", fehlerin7120, "alert-icon");
    }
    if(write)
    {
        // Feld ausgeben
        application.activeWindow.title.startOfField(false);
        application.activeWindow.title.insertText("\n");
        application.activeWindow.title.lineUp(1, false);
        application.activeWindow.title.insertText(feldnummer + " " + inhalt7120);
    }
    else
    {
        return inhalt7120;
    }
}


function __Feldauf7120(inhalt8032, feldnummer){

    // '==================================================
    // ' Auswertung von Heftnummern für Feld 4024
    // '   Komma7120 --> Komma71204024
    // '   Punkt7120 --> Punkt71204024
    // '==================================================

    pos = new Array();
    feld = new Array();
    var temp_felder = new Array();
    var temp_felder2 = new Array();
    var temp_felder3 = new Array();
    var teil1;
    var teil2;
    var band1;
    var jahr1;
    var band2;
    var jahr2;
    var hilfsfeld = inhalt8032;
    var inhalt7120 = "";

    // Klammern und Rautezeichen (#) entfernen
    hilfsfeld = __Klammern7120(hilfsfeld);

    // Vortexte löschen
    hilfsfeld = __Vor7120(hilfsfeld);

    // Ziffer, Punkt, Ziffer bzw. Ziffer Punkt Leerzeichen Ziffer wird ersetzt durch Ziffer*Ziffer 
    hilfsfeld = hilfsfeld.replace(/([0-9])\.\s{0,1}([0-9])/g, "$1*$2");
    // bzw. Ziffer Punkt Leerzeichen (Fall: Band.[?] -> Band. -> Band*) // cs 02.11.2010
    //hilfsfeld = hilfsfeld.replace(/([0-9])\.\s{0,1}([0-9]){0,1}/g, "$1*$2");
    // Bindestrich mit Leerzeichen durch ~ ersetzen
    hilfsfeld = __Bindestrich7120(hilfsfeld);

    // Leerzeichen und Texte entfernen
    hilfsfeld = hilfsfeld.replace(/\s/g, "");
    hilfsfeld = hilfsfeld.replace(/SS/g, "");
    hilfsfeld = hilfsfeld.replace(/WS/g, "");
    hilfsfeld = hilfsfeld.replace(/Nr\./g, "");
    hilfsfeld = hilfsfeld.replace(/u\./g, ",");
    hilfsfeld = hilfsfeld.replace(/nachgewiesen/gi, "");
    hilfsfeld = hilfsfeld.replace(/\.Danachabbestellt/gi, "");

    // Ermitteln, ob und an welchen Stellen Semikola vorkommen
    var j = 0;
    var posi = 2;
    pos[0] = 0;
    while (posi > -1) {
        posi = hilfsfeld.indexOf(";", posi);
        if (posi > -1) {
            j++;
            posi++
            pos[j] = posi;
        }
    }
    j++;
    pos[j] = hilfsfeld.length + 2;

    for (var i = 0; i < j; i++) {
        feld[i] = hilfsfeld.substring(pos[i], pos[i+1] - 1);
        temp_felder = __Tilde7120(feld[i], "", "");
        teil1 = temp_felder[0];
        teil2 = temp_felder[1];
        band1 = "";
        jahr1 = "";
        heft1 = "";
        band2 = "";
        jahr2 = "";
        heft2 = "";
        temp_felder2 = __Punkt71204024(teil1, band1, jahr1, heft1);
        band1 = temp_felder2[0];
        jahr1 = temp_felder2[1];
        heft1 = temp_felder2[2];
        if (teil2 != "-") {
            temp_felder3 = __Punkt71204024(teil2, band2, jahr2, heft2);
            band2 = temp_felder3[0];
            jahr2 = temp_felder3[1];
            heft2 = temp_felder3[2];
        }
        if (inhalt7120 != "" && (band1 || jahr1 || band2 || jahr2 != "")) {
            inhalt7120 = inhalt7120 + "; ";
        }

        if (feldnummer == "7120") {
        // Feld 7120 aufbauen
            if (band1 != "") {
                inhalt7120 = inhalt7120 + "\/v" + band1;
            }
            if (jahr1 != "") {
                inhalt7120 = inhalt7120 + "\/b" + jahr1;
            }
            if (band2 != "") {
                inhalt7120 = inhalt7120 + "\/V" + band2;
            }
            if (jahr2 != "") {
                inhalt7120 = inhalt7120 + "\/E" + jahr2;
            }
        } else {
        // Feld 4024 aufbauen
          if (heft1 != "") {
                inhalt7120 = inhalt7120 + "\/a" + heft1;
            }
            if (jahr1 != "") {
                inhalt7120 = inhalt7120 + "\/b" + jahr1;
            }
            else if (band1 != "") {
                inhalt7120 = inhalt7120 + "\/v" + band1;
            }

            if (heft2 != "") {
                inhalt7120 = inhalt7120 + "\/A" + heft2;
            }
            if (jahr2 != "") {
                inhalt7120 = inhalt7120 + "\/E" + jahr2;
            }
            else if (band2 != "") {
                inhalt7120 = inhalt7120 + "\/V" + band2;
            }
        }
        
        if (teil2 == "-") {
            inhalt7120 = inhalt7120 + "-";
        }
    }
    return inhalt7120;

    //inhalt7120 = hilfsfeld
    //return inhalt7120;

}


function __Klammern7120(feld) {

    var klammern7120 = feld;

    // Runde Klammern und Inhalt weglassen
    klammern7120 = klammern7120.replace(/\([^)]*\)/gi, "");
    // Geschweifte Klammern und Inhalt weglassen
    klammern7120 = klammern7120.replace(/\{[^}]*\}/gi, "");
    // Nummernzeichen und Inhalt weglassen
    klammern7120 = klammern7120.replace(/#[^#]*#/gi, "");

    // Muster = 4 Ziffern oder 4 Ziffern, Schrägstrich, 2 Ziffern
    // Eckige Klammern mit Inhalt Fragezeichen weglassen
    klammern7120 = klammern7120.replace(/(\[\?\])/gi, "");
    // Eckige Klammern mit Inhalt: Muster, Semikolon weglassen
    //klammern7120 = klammern7120.replace(/\[\d{4}];|\[\d{4}\/\d\d];/gi, ";");
    // Eckige Klammern mit Inhalt: Muster, Bindestrich, Blank weglassen
    klammern7120 = klammern7120.replace(/\[\d{4}]- |\[\d{4}\/\d\d]- /, " -");
    // Eckige Klammern mit Inhalt: Muster am Feldende weglassen
    //klammern7120 = klammern7120.replace(/\[\d{4}]$|\[\d{4}\/\d\d]$/, "");

    // Eckige Klammern entfernen
    klammern7120 = klammern7120.replace(/\[/gi, "");
    klammern7120 = klammern7120.replace(/\]/gi, "");

    return klammern7120;
}


function __Vor7120(feld) {

    // Vom Anfang her alles vor 1. Ziffer löschen

    var vor7120 = feld;
    var len = vor7120.length;
    // Erstes Zeichen ermitteln
    var first = vor7120.substring(0,1);
    // Wenn erstes Zeichen keine Zahl und auch kein Leerzeichen ist, wird es gelöscht
    while (isNaN(first) || first == " ") {
        vor7120 = vor7120.substring(1,len);
        first = vor7120.substring(0,1);
    }
    return vor7120;

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
    bindestrich7120 = bindestrich7120.replace(/\s-\s/g, "~");
    bindestrich7120 = bindestrich7120.replace(/\s-/g, "~");
    bindestrich7120 = bindestrich7120.replace(/-\s/g, "~");
    len = bindestrich7120.length;
    if (bindestrich7120.substring(len - 1, len) == "-") {
        bindestrich7120 = bindestrich7120.substring(0, len - 1) + "~";
    }
    return bindestrich7120;

}


function __Tilde7120(feld, teil1, teil2) {

    // Unterfunktion zu Feld7120 -> Feldauf7120
    // Aufgabe: Feld bei Tilde in Teil1 und Teil2 zerlegen

    var posi = feld.indexOf("~");
    if (posi == -1) {
        teil1 = feld;
        teil2 = "";
    } else if (posi == feld.length - 1) {
        teil1 = feld.substring(0, feld.length - 1);
        teil2 = "-";
    } else {
        teil1 = feld.substring(0, posi);
        teil2 = feld.substring(posi + 1, feld.length);
    }
    var felder = new Array(teil1, teil2);
    return felder;

}


function __Punkt71204024(feld, band, jahr, heft) {

    // Unterfunktion zu Feld7120 -> Feldauf7120
    // Aufgaben:
    //  - Entfernen von "zu", "F.", "S.", "Ser.", "Trim." mit jeweils zugehörigem Vortext
    //  - Teilen und speichern von Band und Jahr in einzelnen variablen

    var len = feld.length;
    if (feld == "") {
        band = "";
        jahr = "";
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
            jahr = feld;
        } else if (posi == len) {
            band = feld;
        } else {
            band = feld.substring(0, posi);
            jahr = feld.substring(posi + 1, len);
        }

        if (band != "") {
            band = __Gleich7120(band);
        }
        if (band != "") {
            var temp = __Komma71204024(band, heft);
            band = temp[0];
            heft = temp[1];
        }
        if (band != "") {
            band = __Ziffer7120(band);
        }
        if (jahr != "") {
            jahr = __Gleich7120(jahr);
        }
        if (jahr != "") {
            var temp = __Komma71204024(jahr, heft);
            jahr = temp[0];
            heft = temp[1];
        }
        if (jahr != "") {
            jahr = __Ziffer7120(jahr);
        }
        if (heft != "") {
            heft = __Ziffer7120(heft);
        }
        if (band == "" && (isNaN(jahr.substring(0,4)) || jahr.length < 4)) {
            band = jahr;
            jahr = "";
        }
        // Prüfungen an den Zahlen
        if (jahr != "") {
            jahr = __Musterjahr7120(jahr);
        }
    }
    var felder = new Array(band, jahr, heft);

    return felder;

}


function __Gleich7120(feld) {

    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: Alles hinter Gleichheitszeichen bis Zeilenende entfernen

    var posi = feld.indexOf("=");
    if (posi > -1 ) {
        feld = feld.substring(0, posi);
    }
    return feld;

}


function __Komma71204024(feld, heft) {

    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: Feld bei Komma abschneiden
    var posi = feld.indexOf(",");
    if (posi > -1 ) {
        heft = feld.substring(posi + 1, feld.length);
        feld = feld.substring(0, posi);
    }
    var return_vars = new Array(feld, heft);
    return return_vars;

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
                ziffern7120 = ""
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


function __Musterjahr7120(feld) {

    // Unterfunktion zu Feld7120 -> Feldauf7120 -> Punkt7120
    // Aufgaben: verschiedene Zahlenprüfungen

    var musterjahr = feld;
    // RegEx-Muster = zzzz/zzzz oder zzzz/zz oder zzzz/z oder zzzz
    var suche = /\d{4}\/\d{4}|\d{4}\/\d{2}|\d{4}\/\d{1}|\d{4}/;
    var ergebnis = suche.exec(musterjahr);
    if (ergebnis == null || (feld.length == 8 || feld.length > 9)) {
        fehlerin7120 = fehlerin7120 + "Falsche Jahreszahl wird weggelassen: " + musterjahr + "\n";
        musterjahr = "";
    }
    return musterjahr;
}

// =======================================================================
// ENDE ***** FELD 7120 *****
// =======================================================================