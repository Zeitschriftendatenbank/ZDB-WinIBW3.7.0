// Datei: zdb_scripte_public.js
// WinIBW-Version ab 3.7

/**
* ZDB globale Variablen
*/
// auto Suchbox
var anfangsfenster;
// delimiter
var delimiter = '\u0192'; // Unterfeldzeichen '?' = \u0192
var delimiterReg = '\u0192'; // regualr expression version Unterfeldzeichen '$' = \$
var charCode = 402; // Unterfeldzeichen '?' = 402, Unterfeldzeichen '$' = 36
// message box
var messageBoxHeader = 'Header';
// JSON
var _rec;


function zdb_ILTISseiten() {
    application.shellExecute('https://wiki.dnb.de/display/ILTIS/ILTIS-Handbuch', 5, 'open', '');
}

function zdb_BibliothekDefinieren() {
    open_xul_dialog('chrome://ibw/content/xul/ZDB_BibliothekDefinieren.xul', null);
}

function zdb_merkeZDB() {
    application.activeWindow.clipboard = __zdbGetZDB();
}

function zdb_MerkeIDN() {
    if (!__zdbCheckScreen(['8A', '7A', 'MT', 'IT'], 'Merke IDN')) return false;
    var idn = application.activeWindow.getVariable('P3GPP'),
        idn_formatiert = '!' + idn + '!';
    application.activeWindow.clipboard = idn_formatiert;
}

function zdb_DigiConfig() {
    open_xul_dialog('chrome://ibw/content/xul/ZDB_DigitalisierungConfig.xul', null);
}

function zdb_Erscheinungsverlauf() {
    if (!__zdbCheckScreen(['MT', 'IT'], 'Erscheinungsverlauf')) return;
    open_xul_dialog('chrome://ibw/content/xul/ZDB_Erscheinungsverlauf.xul', null);
}

function zdb_KennungWechseln() {
    var wert;
    if ((wert = application.activeWindow.caption) == '') {
        wert = 'ZDB-Hauptbestand';
    }
    if (wert.indexOf('ZDB-Hauptbestand') >= 0 || wert.indexOf('ZDB-Uebungsbestand') >= 0) {
        open_xul_dialog('chrome://ibw/content/xul/ZDB_KennungWechseln.xul', null);
    } else {
        application.messageBox('KennungWechseln', 'Die Funktion "KennungWechseln" kann nur im ZDB-Hauptbestand oder ZDB-Übungsbestand aufgerufen werden', 'alert-icon');
        return;
    }
}

function zdb_ExemplarErfassen() {
    if (false == __zdbCheckScreen(['8A', '7A', 'MT'], 'ExemplarErfassen')) return false;
    var eigene_bibliothek = application.getProfileString('zdb.userdata', 'eigeneBibliothek', '');

    var content = '4800 ' + eigene_bibliothek + "\n7100 \n7109 \n8031 \n8032 \n";
    var goToLine = function () {
        // Definiert, wo Cursor im Titelbildschirm plaziert wird
        var zeile = 1;
        if (eigene_bibliothek) {
            zeile = 2;
        }
        application.activeWindow.title.startOfBuffer(false);
        application.activeWindow.title.lineDown(zeile, false);
        application.activeWindow.title.charRight(5, false);
    };
    __zdbExemplarErfassen(content, goToLine);
}

/**
 * Kategorie 'EXXX x' wird automatisch befüllt
 * @param string content
 * @param function|undefined callback
 */
function __zdbExemplarErfassen(content, callback) {
    const exNum = __zdbEXXX();
    if (!__zdbCheckScreen(['MT', 'IE'])) {
        application.activeWindow.command('e ' + exNum, false);
    }
    // Exemplarsatz anlegen und befüllen
    application.activeWindow.title.insertText(exNum + " x\n" + content);
    if (typeof callback !== 'undefined') {
        callback();
    }
}

/**
 * Gibt ein Array von genutzten Exemplarnummern zurück
 * @returns array Genutzte Exemplarnummern
 */
function __zdbExemplarNummern() {
    application.activeWindow.command('show d', false);
    const record = application.activeWindow.getVariable('P3CLIP');
    const found = record.match(/\n(E\d\d\d)/g);
    found.sort();
    for (var i = 0; i < found.length; i += 1) {
        if ('0' == found[i][3]) {
            found[i] = found[i].substring(4);
        } else {
            found[i] = found[i].substring(3);
        }
    }
    return found;
}

function __zdbEXXX() {
    var record;
    if(__zdbCheckScreen(['MT'])){
        application.activeWindow.title.selectAll();
        record = application.activeWindow.title.selection;
        application.activeWindow.title.selectNone();
    } else {
        record = application.activeWindow.getVariable('P3CLIP');
    }
    for (var i = 1; i <= 999; i += 1) {
        num = "E" + ("000" + i).slice(-3);
        if ('' != record) {
            if (record.indexOf(num) == -1) {
                return num;
            }
        } else {
            if (!application.activeWindow.title.find("\n" + num, true, false, true)) {
                return num;
            }
        }
    }
}




function zdb_MailboxsatzAnlegen() {
    var ppn;
    application.overwriteMode = false;
    ppn = application.activeWindow.getVariable('P3GPP');
    application.activeWindow.command('ein t', false);
    if (application.activeWindow.status != 'OK') {
        application.messageBox('MailboxsatzAnlegen', 'Sie haben nicht die nötigen Berechtigungen, um einen Mailboxsatz anzulegen.', 'alert-icon');
        return false;
    }
    application.activeWindow.title.insertText(
        "0500 am\n"
        + '8900 !' + ppn + "!\n"
        + "8901 \n"
        + '8902 ');
    application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.lineDown(2, false);
    application.activeWindow.title.charRight(5, false);
}

function zdb_AutomatischeSuchBox() {
    if (false == __zdbCheckScreen(['MT', 'IT', 'IE'], 'AutomatischeSuchBox')) return false;
    anfangsfenster = application.activeWindow.windowID; // globale Variable, die vom Skript HoleIDN verwendet wird
    open_xul_dialog('chrome://ibw/content/xul/ZDB_AutomatischeSuchBox.xul', null);
    return true;
}

function zdb_HoleIDN() {
    // Wurde vorab eine Suche mit dem Skript 'Automatische Suchbox' ausgeführt?
    if (typeof anfangsfenster == 'undefined') {
        application.messageBox('HoleIDN', 'Vor Aufruf des Skriptes "HoleIDN" muss zunächst eine automatische Suche mit Hilfe des Skriptes "AutomatischeSuchBox" gestartet werden.', 'alert-icon');
    } else {
        // Ist das aktive Fenster eine Trefferliste?
        if (false == __zdbCheckScreen(['7A', '8A'], 'HoleIDN')) return false;
        //  IDN des markierten Titels aus der Trefferliste ermitteln
        var idn = application.activeWindow.getVariable('P3GPP');
        // ID des aktiven Fensters ermitteln
        var fenster = application.activeWindow.windowID;
        // Falls das Bearbeitungsfenster ( = anfangsfenster) geschlossen wurde, gibt das System einen 'uncaught exception'-Fehler aus. Um diesen abzufangen, wird mit TRY CATCH gearbeitet.
        try {
            // Zurück zum Anfangsfenster gehen
            application.activateWindow(anfangsfenster);
            // IDN einfügen
            application.activeWindow.title.insertText('!' + idn + '!');
            // Trefferliste schließen
            application.closeWindow(fenster);
        } catch (e) {
            application.messageBox('HoleIDN', 'Das Bearbeitungsfenster, in welches die IDN eingefügt werden soll, ist nicht mehr geöffnet.', 'alert-icon');
        }
    }
    return true;
}

//========================================
// Start ****** ZDB-Titelkopien ******
//========================================

function __zdbNormdatenKopie() {
    // Titelkopie auf zdb_titeldatenkopie.ttl setzen
    application.activeWindow.titleCopyFile = 'resource:/ttlcopy/gnd_title.ttl';

    application.overwriteMode = false;
    var idn = application.activeWindow.getVariable('P3GPP'),
        typ = application.activeWindow.getVariable('P3VMC');
    application.activeWindow.command('show d', false);
    application.activeWindow.copyTitle();
    application.activeWindow.command('ein n', false);
    application.activeWindow.title.insertText(" *** Normdatenkopie *** \n");
    application.activeWindow.pasteTitle();
    application.activeWindow.title.endOfBuffer(false);

    if (typ == 'Tb' || typ == 'Tg') {
        application.activeWindow.title.insertText('??? !' + idn + '!');
    }
    //application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.findTag('005', 0, false, true, true);
    application.activeWindow.title.endOfField(false);
}

function __zdbTiteldatenKopie() {

    __zdbJSON();

    // Überschrift und IDN einfügen
    application.overwriteMode = false;
    var idn = application.activeWindow.getVariable('P3GPP');
    application.activeWindow.command('show d', false);
    // Titelkopie auf zdb_titeldatenkopie.ttl setzen
    application.activeWindow.titleCopyFile = 'resource:/ttlcopy/zdb_titeldatenkopie.ttl';
    application.activeWindow.copyTitle();
    application.activeWindow.command('ein t', false);
    application.activeWindow.title.insertText(" *** Titeldatenkopie *** \n");
    application.activeWindow.pasteTitle();
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText('???? !' + idn + '!');
    application.activeWindow.clipboard = idn;

    if (!_rec['002C']) { // 0501 Inhaltstyp
        application.activeWindow.title.findTag('0500', 0, false, true, false);
        application.activeWindow.title.endOfField(false);
        application.activeWindow.title.insertText("\n0501 $btxt");
        _rec['002C'] = [{ 'b': ['txt'] }];
    }
    if (!_rec['002D']) { // 0502 Medientyp
        __zdbMediatype();
        application.activeWindow.title.insertText("\n0502 $b" + _rec['002D'][0]['b'][0]);
    }
    if (!_rec['002E']) { // 0503 Datenträgertyp
        __zdbDatentraeger();
        application.activeWindow.title.insertText("\n0503 $b" + _rec['002E'][0]['b'][0]);
    }
    // Ersetzungen in Kategorie 0600
    var codes0600;
    if ('' != (codes0600 = application.activeWindow.title.findTag('0600', 0, false, true, true))) {
        var _codes0600 = codes0600.split(';');
        var _codes = __zdbArrayDiff(_codes0600, ['ee', 'mg', 'nw', 'vt', 'ra', 'rb', 'ru', 'rg']);
        if (0 < _codes.length) {
            application.activeWindow.title.insertText(_codes.join(';'));
        }
        else {
            application.activeWindow.title.deleteLine(1);
        }
    }

    var feld4000 = __zdbTitelAnpassen();
    application.activeWindow.title.insertText(feld4000 + "\n");
    application.activeWindow.title.findTag('0500', 0, false, true, true);
    application.activeWindow.title.endOfField(false);
    application.activeWindow.title.insertText('xz');
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n");
    //__zdbFeld424XSet(_felder424X);
    //application.activeWindow.title.findTag('0500', 0, false, true, true);
    //application.activeWindow.title.endOfField(true);
    //application.activeWindow.title.insertText('xz');
}

/**
* Der Inhalt von 0503 ist abhängig von 0500 und 0502
*
* Die Funktion erwartet ein globales Objekt _rec
* Der Medientyp wird in _rec['002E'][0]['b'][0] geschrieben
**/
function __zdbDatentraeger() {
    var datentraegerMap = {
        'A': 'nc',
        'O': 'cr'
    };
    var datentraeger,
        gattung = _rec['002@'][0]['0'][0], // 0500
        gtt = gattung.substr(0, 1);
    if (!datentraegerMap[gtt]) {
        _rec['002E'] = [{ 'b': [_rec['002D'][0]['b'][0] + '?'] }];
        return;
    }
    _rec['002E'] = [{ 'b': [datentraegerMap[gtt]] }];
}

/**
* Der Inhalt von 0502 ist abhängig von 0500 und 0501
*
* Die Funktion erwartet ein globales Objekt _rec
* Der Medientyp wird in _rec['002D'][0]['b'][0] geschrieben
**/
function __zdbMediatype() {

    var mediamap = {
        'A': { 'def': 'n' },
        'C': { 'def': 'n' },
        'S': { 'prm': 's', 'tdi': 'v', 'snd': 's', 'spw': 's', 'def': 'c' },
        'O': { 'prm': 's', 'tdi': 'v', 'snd': 's', 'spw': 's', 'def': 'c' },
        'B': { 'prm': 's', 'tdi': 'v', 'snd': 's', 'spw': 's', 'def': 'z' },
        'E': { 'def': 'h' }
    },
        gattung = _rec['002@'][0]['0'][0], // 0500
        gtt = gattung.substr(0, 1),
        inhaltstyp = _rec['002C'][0]['b'][0]; // 0501

    if (!mediamap[gtt][inhaltstyp]) {
        _rec['002D'] = [{ 'b': [mediamap[gtt]['def']] }];
        return;
    }

    _rec['002D'] = [{ 'b': [mediamap[gtt][inhaltstyp]] }];
}

function zdb_Datensatzkopie() {
    if (false == __zdbCheckScreen(['8A'], 'Datensatzkopie')) return false;
    //Persönliche Einstellung des Titelkopie-Pfades ermitteln
    var titlecopyfileStandard = application.getProfileString('winibw.filelocation', 'titlecopy', '');
    if (application.activeWindow.materialCode.charAt(0) == 'T') {
        __zdbNormdatenKopie();
    } else {
        __zdbTiteldatenKopie();
    }
    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function zdb_Digitalisierung() {
    if (false == __zdbCheckScreen(['8A'], 'Digitalisierung')) return false;
    // Prüfen, ob Titeldatensatz mit bibliographischer Gattung 'A' aufgerufen, bei 'T' oder 'O' Fehlermeldung ausgeben
    var matCode = application.activeWindow.materialCode.charAt(0);
    if (matCode == 'T' || matCode == 'O') {
        application.messageBox('Digitalisierung', 'Die Funktion kann nur für Titelsätze des Satztyps "A" verwendet werden.', 'alert-icon');
        return false;
    }
    // Titelkopie auf zdb_titeldatenkopie_digi.ttl setzen
    var titlecopyfileStandard = application.getProfileString('winibw.filelocation', 'titlecopy', '');
    var idn = application.activeWindow.getVariable('P3GPP');
    var showComment = " *** Titeldatenkopie Digitalisierung *** \n"
    if (!__zdbOnlineRessource('resource:/ttlcopy/zdb_titeldatenkopie_digi.ttl', showComment, ['ld', 'dm'], true)) return false;

    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n4256 Elektronische Reproduktion von!" + idn + "!\n");

    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText('4201 Gesehen am ++');
    application.activeWindow.title.charLeft(1, false);
    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function zdb_Parallelausgabe() {
    if (false == __zdbCheckScreen(['8A'], 'Parallelausgabe')) return false;
    // Prüfen, ob Titeldatensatz mit bibliographischer Gattung 'A' aufgerufen, bei 'T' oder 'O' Fehlermeldung ausgeben
    var matCode = application.activeWindow.materialCode.charAt(0);
    if (matCode == 'T' || matCode == 'O') {
        application.messageBox('Digitalisierung', 'Die Funktion kann nur für Titelsätze des Satztyps "A" verwendet werden.', 'alert-icon');
        return false;
    }

    // Titelkopie auf zdb_titeldatenkopie_digi.ttl setzen
    var titlecopyfileStandard = application.getProfileString('winibw.filelocation', 'titlecopy', '');
    var idn = application.activeWindow.getVariable('P3GPP');
    var showComment = " *** Titeldatenkopie Parallelausgabe *** \n";
    if (!__zdbOnlineRessource('resource:/ttlcopy/zdb_titeldatenkopie_parallel.ttl', showComment, [], false)) return false;

    // Kategorie 4234: anlegen und mit Text '4243 Erscheint auch als$nDruckausgabe![...IDN...]!' befüllen
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n4243 Erscheint auch als$nDruck-Ausgabe!" + idn + "!\n");

    // Kategorie 4213: individuell gefüllt oder leer ausgeben
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText('4201 Gesehen am ++');
    application.activeWindow.title.charLeft(1, false);

    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function __zdbOnlineRessource(copyFile, showComment, add0600, digi) {
    // set global variable _rec
    __zdbJSON();

    var _felder424X = __zdbFeld424XGet();

    // Titelaufnahme kopieren und neue Titelaufnahme anlegen
    application.overwriteMode = false;
    application.activeWindow.command('show d', false);
    application.activeWindow.titleCopyFile = copyFile;
    application.activeWindow.copyTitle();
    application.activeWindow.command('ein t', false);
    if (showComment != false) application.activeWindow.title.insertText(showComment);
    application.activeWindow.pasteTitle();


    // Kategorie 0500: Bibliographische Gattung/Status ändern
    var f0500 = application.activeWindow.title.findTag('0500', 0, false, true, true);
    f0500 = f0500.replace('A', 'O');
    f0500 = f0500.replace('v', 'x');
    application.activeWindow.title.insertText(f0500);

    if (!_rec['002C']) application.activeWindow.title.insertText("\n0501 $btxt");
    // wird schon in zdb_titeldatenkopie_digi gemacht
    //if(!_rec['002D']) application.activeWindow.title.insertText("\n0502 $bc");
    //if(!_rec['002E']) application.activeWindow.title.insertText("\n0503 $bcr");

    // Feld 0600
    // Feld 600 must be deleted in ttlcopy
    add0600 = typeof add0600 !== 'undefined' ? add0600 : [];
    if (!add0600) { add0600 = []; }
    if (_rec['017A']) {
        var _codes = __zdbArrayDiff(_rec['017A'][0]['a'], ['es', 'ks', 'sf', 'sm', 'mg', 'mm', 'nw', 'ra', 'rb', 'rc', 'rg', 'ru', 'ee', 'vt']);
        // join arrays
        _codes = _codes.concat(add0600);

        if (0 < _codes.length) {
            application.activeWindow.title.insertText("\n0600 " + _codes.join(';'));
        }
    }
    else if (0 < add0600.length) {
        application.activeWindow.title.insertText("\n0600 " + add0600.join(';'));
    }


    if (!_rec['010@']) application.activeWindow.title.insertText("\n1500 ");

    if (typeof digi === 'object') {
        for (var x in digi) {
            if (!digi.hasOwnProperty(x)) { continue; }
            application.activeWindow.title.endOfBuffer(false);
            application.activeWindow.title.insertText(digi[x].kat + digi[x].cont + "\n");
        }
    } else if (digi !== false) {
        application.activeWindow.title.insertText("\n1101 " + application.getProfileString('zdb.userdata.digiconfig', '1101', ''));
    }

    // Kategorie 4215,4225 ändern
    var content, y;
    var fieldmap = {
        '4215': '4201 ',
        '4225': '4201 '
    };
    for (var m in fieldmap) {
        if (!fieldmap.hasOwnProperty(m)) { continue; }
        content = '';
        y = 0;
        while ((content = application.activeWindow.title.findTag(m, y, false, true, true)) != '') {
            application.activeWindow.title.deleteLine(1);
            application.activeWindow.title.insertText(fieldmap[m] + content + "\n");
            y++;
        }
    }

    /*y = 0;
    while('' != application.activeWindow.title.findTag('3100',y, false, true, true))
    {
        if(/\$aut/.test(application.activeWindow.title.selection))
        {
            application.activeWindow.title.endOfField(false);
            application.activeWindow.title.insertText('$4aut');
        }
        y++;
    }*/

    // neues Feld für Sekundärköperschaft 312X -> 311X
    content = '';
    y = 0;
    while ((content = application.activeWindow.title.findTag('312', y, false, true, true)) != '') {
        application.activeWindow.title.deleteLine(1);
        application.activeWindow.title.insertText('311' + y + ' ' + content + '$4isb');
        y++;
    }

    y = 0;
    while ('' != application.activeWindow.title.findTag('311', y, false, true, true)) {
        if (!/\$4isb/.test(application.activeWindow.title.selection)) {
            application.activeWindow.title.endOfField(false);
            application.activeWindow.title.insertText("$4isb\n");
        }
        y++;
    }

    var feld4000 = __zdbTitelAnpassen();
    application.activeWindow.title.insertText(feld4000 + "\n");

    if (digi === true) {
        application.activeWindow.title.insertText("\n2050 " + application.getProfileString('zdb.userdata.digiconfig', '2050', ''));
        application.activeWindow.title.insertText("\n2051 " + application.getProfileString('zdb.userdata.digiconfig', '2051', ''));
        application.activeWindow.title.insertText("\n4085 " + application.getProfileString('zdb.userdata.digiconfig', '4085', ''));
    }
    // Kategorie 4212 mit neuem Vortext
    if (_rec['046C']) {
        for (var c in _rec['046C']) {
            if (!_rec['046C'].hasOwnProperty(c)) { continue; }
            application.activeWindow.title.insertText("\n4212 Abweichender Titel: " + _rec['046C'][c]['a'][0]);
        }
    }
    if (digi === true) {
        application.activeWindow.title.insertText("\n4233 " + application.getProfileString('zdb.userdata.digiconfig', '4233', ''));
        application.activeWindow.title.insertText(feld4238());
    }
    application.activeWindow.title.insertText("\n");
    application.activeWindow.title.endOfBuffer(false);

    __zdbFeld424XSet(_felder424X);

    return true;
}

function feld4238() {
    var feld = "\n4238 ";
    feld += application.getProfileString('zdb.userdata.digiconfig', '4238a', '[Online-Ausgabe/CD-ROM-Ausgabe/Mikrofilm-Ausgabe]');
    feld += '$b' + application.getProfileString('zdb.userdata.digiconfig', '4238b', '[Reproduktionsort]');
    feld += '$c' + application.getProfileString('zdb.userdata.digiconfig', '4238c', '[Digitalisierende Institution]');
    feld += '$d' + application.getProfileString('zdb.userdata.digiconfig', '4238d', '[Erscheinungsdaten der Reproduktion (nicht normiert)]');
    feld += '$e' + application.getProfileString('zdb.userdata.digiconfig', '4238e', '[Umfangsangabe der Reproduktion]');
    feld += '$f' + application.getProfileString('zdb.userdata.digiconfig', '4238f', '[Ungezählter Gesamttitel der Reproduktion]');
    feld += '$g' + application.getProfileString('zdb.userdata.digiconfig', '4238g', '[Zählung der Reproduktion in Sortierform (JJJJ) - Anfang]');
    feld += '$h' + application.getProfileString('zdb.userdata.digiconfig', '4238h', '[Zählung der Reproduktion in Sortierform (JJJJ) - Ende]');
    feld += '$m' + application.getProfileString('zdb.userdata.digiconfig', '4238m', '[Zählung der reproduzierten Teile (Bände, Jahrgänge) in Vorlageform]');
    feld += '$n' + application.getProfileString('zdb.userdata.digiconfig', '4238n', '[Fußnote zur Reproduktion]');
    return feld;
}

function __zdbTitelAnpassen() {
    // Titel anpassen
    var feld4000 = application.activeWindow.title.findTag('4000', 0, true, true, true);
    application.activeWindow.title.deleteLine(1);

    if (__zdbCheckSF('021A', 'e')) // Körperschaftsergänzungen vhd.
    {
        for (var e in _rec['021A'][0]['e']) {
            if (!_rec['021A'][0]['e'].hasOwnProperty(e)) { continue; }
            feld4000 = feld4000.replace(' // ' + _rec['021A'][0]['e'][e], '');
        }

        if (!__zdbCheckSF('021A', 'h')) // Verfasserangabe nicht vhd.
        {
            feld4000 += ' / ' + _rec['021A'][0]['e'][0];
        }
    }

    if (__zdbCheckSF('021A', 'n')) // Materialbenennung vhd.
    {
        feld4000 = feld4000.replace(' [[' + _rec['021A'][0]['n'][0] + ']]', '');
    }

    return feld4000;
}

function __zdbFeld424XGet() {
    // check if rda
    /*var rda;
    if (_rec['010E']) {
        rda = ('rda' == _rec['010E'][0]['e'][0]) ? true : false;
    }*/

    // Verknüpfungsfelder einsammeln und auf verbale Form ändern
    var _felder424X = {
        '039B': { p: '4241', c: [] },
        '039C': { p: '4242', c: [] },
        '039D': { p: '4243', c: [] },
        '039E': { p: '4244', c: [] },
        '039X': { p: '4248', c: [] }
    };

    var re = new RegExp('^.*--->.(.+)$'); // 2014 Sonderh. zu u. ab 2015 Forts. als Online-Ausg. ---> Lexware-Unternehmer-Wissen
    var _exp, match, code, expText;
    var text = '';
    // Online-Routine braucht dann nur noch s# oder f#
    var _code = {
        's': 's#',
        'f': 'f#',
        'z': 'z#'
    };

    for (var f in _felder424X) //  f = 039.
    {
        if (!_felder424X.hasOwnProperty(f)) { continue; }
        if (_rec[f]) // Feld 039. vorhanden
        {
            for (var e in _rec[f]) // Wiederholungen
            {
                if (!_rec[f].hasOwnProperty(e)) { continue; }
                code = (__zdbCheckSF(f, 'b', e)) ? _code[_rec[f][e]['b'][0]] : '';
                if (__zdbCheckSF(f, 'a', e)) // Vortext vorhanden
                {
                    /*if('039E' != f || rda ) // kein Vortext für 4244 ohne rda
                    {
                        code += _rec[f][e]['a'][0];
                    }*/
                    code += _rec[f][e]['a'][0];
                } else { // kein Vortext
                    if ('039E' == f) // kein Vortext für 4244
                    {
                        if ('s#' == code) {
                            code += 'Fortgesetzt durch';
                        } else if ('f#' == code) {
                            code += 'Fortsetzung von';
                        }

                    }
                }

                if (__zdbCheckSF(f, '8', e)) // Expansion vhd.
                {
                    _exp = __zdbParseExpansion(_rec[f][e][8][0]);
                    expText = __zdbExpansionToText(_exp); // Text with subfields $l and/or $t
                    _felder424X[f].c.push(code + expText); // $bf#Fortsetzung von$lVerantwortl$tTitel
                }
                else if (__zdbCheckSF(f, 'r', e)) // something like 039E $bs$r2014 Sonderh. zu u. ab 2015 Forts. als Online-Ausg. ---> Lexware-Unternehmer-Wissen
                {
                    match = _rec[f][e]['r'][0].match(re);
                    if (match) {
                        _felder424X[f].c.push(code + '$t' + match[1]);
                    } else {
                        _felder424X[f].c.push(code + '$t' + _rec[f][e]['r'][0]);
                    }
                }
                else if (__zdbCheckSF(f, 't', e)) {
                    text = code;
                    if (__zdbCheckSF(f, 'n', e)) text += '$n' + _rec[f][e]['n'][0];
                    if (__zdbCheckSF(f, 'l', e)) text += '$l' + _rec[f][e]['l'][0];
                    text += '$t' + _rec[f][e]['t'][0];
                    _felder424X[f].c.push(text);
                }
            }
        }
    }

    return _felder424X;
}

function __zdbFeld424XSet(_felder424X) {
    var _lang = {
        'Dt': 'Parallele Sprachausgabe$ndeutsch',
        'Fr': 'Parallele Sprachausgabe$nfranzösisch',
        'En': 'Parallele Sprachausgabe$nenglisch',
        'Sp': 'Parallele Sprachausgabe$nspanisch',
    };
    var langpat = new RegExp('^(Dt|Fr|En|Sp)(?:[^$])+', 'i');
    var feld4248;
    var _repl = {
        'Digital. Ausg.': 'Online-Ausgabe',
        'Online-Ausg.': 'Online-Ausgabe'
    };
    //var replpat = new RegExp('^(Digital\. Ausg\.|Online-Ausg\.)(?:[^$])+');
    var feld4243;
    var needFor3210 = false;
    for (var n in _felder424X) {
        if (!_felder424X.hasOwnProperty(n)) { continue; }
        for (var i in _felder424X[n]['c']) {
            if (!_felder424X[n]['c'].hasOwnProperty(i)) { continue; }
            if ('4243' == _felder424X[n]['p']) { // spacial language relation field 4248
                if (langpat.test(_felder424X[n]['c'][i])) {
                    needFor3210 = true;
                    feld4248 = _felder424X[n]['c'][i].replace(langpat, function (m) { return _lang[m[0] + m[1]]; });
                    application.activeWindow.title.insertText('4248 ' + feld4248 + " \n");
                }
                else {
                    feld4243 = _felder424X[n]['c'][i];
                    for (var r in _repl) {
                        if (!_repl.hasOwnProperty(r)) { continue; }
                        feld4243 = feld4243.replace(r, _repl[r]);
                    }
                    application.activeWindow.title.insertText(_felder424X[n]['p'] + ' Erscheint auch als$n' + feld4243 + " \n");
                }
            }
            else {
                application.activeWindow.title.insertText(_felder424X[n]['p'] + ' ' + _felder424X[n]['c'][i] + " \n");
            }
        }

    }

    if (needFor3210) {
        application.activeWindow.title.findTag2('4000', 0, true, true, true);
        application.activeWindow.title.startOfField(false);
        application.activeWindow.title.insertText('3210 ' + "\n");
    }
}
//========================================
// Ende ****** ZDB-Titelkopien ******
//========================================


// =======================================================================
// START ***** EZB *****
// =======================================================================
function __zdbDruckausgabe(dppn) {

    var arr = [];
    var eppn = application.activeWindow.getVariable('P3GPP');
    var regexp;
    var satz;

    application.activeWindow.command('f idn ' + dppn, true);

    if (application.activeWindow.status != 'OK') {
        return __zdbError('Die über 4243 verlinkte Druckausgabe existiert nicht.');
    }

    //	DocType = 1. Zeichen im Feld 0500
    if (application.activeWindow.materialCode.charAt(0) != 'A') {
        __zdbMsg('Record der "Druckausgabe" hat Materialcode '
            + application.activeWindow.materialCode);
        return false;
    }

    satz = __zdbGetRecord('D', false);
    if (false == satz) {
        return false;
    }

    regexp = new RegExp('!' + eppn + '!', 'gm');
    arr = satz.match(regexp);
    if (arr == null) {
        application.activeWindow.command('k', false);
        if (application.activeWindow.status != 'OK') {
            __zdbMSG('Sie sind nicht berechtigt, den Datensatz zu ändern.');
            return false;
        }

        application.activeWindow.title.endOfBuffer(false);
        application.activeWindow.title.insertText('4243 Erscheint auch als$nOnline-Ausgabe!' + eppn + "!\n");

        application.activeWindow.simulateIBWKey('FR');
        //	Korrektur ausgeführt, dann ist der Titel im diagn. Format
        //	sonst im Korrekturformat
        //application.messageBox('SCR', application.activeWindow.getVariable('scr'), 'alert-icon');
        if (application.activeWindow.getVariable('scr') != '8A') {
            __zdbMsg('Die Korrektur des Titel ist fehlgeschlagen. Bitte holen'
                + 'Sie dies direkt über die WinIBW nach.');
            return false;
        }
    } else {
        application.messageBox('Test', 'Die Verknüpfung zur Internetausgabe im Feld 4243 ist schon vorhanden.', 'alert-icon');
    }
}


function __EZBNota(maske) {

    var DDC_EZB = {
        '000': ['AK-AL', 'SQ-SU'],
        '004': ['SQ-SU'],
        '010': ['A'],
        '020': ['AN'],
        '030': [''],
        '050': ['A'],
        '060': ['AK-AL'],
        '070': ['AP'],
        '080': [''],
        '090': [''],
        '100': ['CA-CK'],
        '130': ['A'],
        '150': ['CL-CZ'],
        '200': ['B'],
        '220': ['B'],
        '230': ['B'],
        '290': ['B'],
        '300': ['Q', 'MN-MS'],
        '310': ['Q'],
        '320': ['MA-MM'],
        '330': ['Q'],
        '333.7': ['AR'],
        '340': ['P'],
        '350': ['P'],
        '355': ['MX-MZ'],
        '360': ['MN-MS', 'Q', 'A'],
        '370': ['AK-AL', 'D'],
        '380': ['Q', 'ZG'],
        '390': ['LA-LC'],
        '400': ['E'],
        '420': ['H'],
        '430': ['G'],
        '439': ['G'],
        '440': ['I'],
        '450': ['I'],
        '460': ['I'],
        '470': ['F'],
        '480': ['F'],
        '490': ['E'],
        '491.8': ['K'],
        '500': ['TA-TD'],
        '510': ['SA-SP'],
        '520': ['U'],
        '530': ['U'],
        '540': ['V'],
        '550': ['TE-TZ'],
        '560': ['TE-TZ'],
        '570': ['W'],
        '580': ['W'],
        '590': ['W'],
        '600': ['ZG'],
        '610': ['WW-YZ', 'MT'],
        '615': ['V'],
        '620': ['ZL', 'ZN', 'ZP'],
        '621.042': ['ZP'],
        '621.3': ['ZN'],
        '624': ['ZG', 'ZP'],
        '630': ['ZA-ZE', 'WW-YZ'],
        '640': ['ZA-ZE'],
        '650': ['Q'],
        '660': ['V', 'ZL'],
        '660.6': ['W'],
        '664': ['V'],
        '670': ['ZL'],
        '690': ['ZH-ZI'],
        '700': ['LH-LO'],
        '710': ['ZH-ZI'],
        '720': ['ZH-ZI'],
        '730': ['N'],
        '740': ['LH-LO'],
        '741.5': ['A'],
        '750': ['LH-LO'],
        '760': ['LH-LO'],
        '770': ['LH-LO'],
        '780': ['LP-LZ'],
        '790': ['A'],
        '791': ['LH-LO'],
        '792': ['A'],
        '793': ['ZX-ZY'],
        '796': ['ZX-ZY'],
        '800': ['E'],
        '810': ['H'],
        '820': ['H'],
        '830': ['G'],
        '839': ['G'],
        '840': ['I'],
        '850': ['I'],
        '860': ['I'],
        '870': ['F'],
        '880': ['F'],
        '890': ['K', 'E'],
        '891.8': ['K'],
        '900': ['N'],
        '910': ['N', 'R'],
        '914.3': ['N'],
        '920': ['A', 'N'],
        '930': ['LD-LG'],
        '940': ['N'],
        '943': ['N'],
        '950': ['N'],
        '960': ['N'],
        '970': ['N'],
        '980': ['N'],
        '990': ['N'],
        'B': [''],
        'K': ['A'],
        'S': ['']
    };
    if (maske == '') return '';

    return DDC_EZB[maske];
}

function zdb_EZB_BibID() {
    //Anwender können BibID prüfen und ggf. korrigieren
    open_xul_dialog('chrome://ibw/content/xul/ZDB_EZBAccountDefinieren.xul', null);
}

function __checkEZBAccount() {
    if (application.getProfileString('zdb', 'ezb.account', '') == '') {
        open_xul_dialog('chrome://ibw/content/xul/ZDB_EZBAccountDefinieren.xul', null);
    }
    var bibid = application.getProfileString('zdb', 'ezb.account', '');
    if (bibid != '') {
        return bibid;
    }
    else {
        return false;
    }
}
//
// ZDB-Funktionen > EZB
//
//=============
function zdb_EZB() {
    //	Dokumenttyp  8A: Vollanzeige, 7A: Kurzliste
    if (false == __zdbCheckScreen(['7A', '8A'], 'EZB')) return false;
    if ('O' != application.activeWindow.getVariable('P3VMC').substr(0, 1)) {
        return __zdbError('Das Skript darf nur bei O-Aufnahmen aufgerufen werden.');
    }

    var _ezbnota = [],
        _ezb = [],
        title, publisher, eissn, url, urls, sprachen = [], indxISSN,
        dppn = false,
        pissn = '',
        first_volume, first_date, first_issue, last_issue, last_volume, last_date, idx, winsnap, EZB_satz,
        bibid = __checkEZBAccount();
    L = new LANG();
    if (!bibid) {
        return __zdbError('Sie müssen ein gültige EZB-bibid angeben.');
    }

    //	url zur EZB
    var dbformUrl = 'https://ezb.uni-regensburg.de/admin/newtitle.php?';
    var frontDoor = 'https://ezb.ur.de/?';

    // set global variable _rec
    __zdbJSON();

    //---Feld '4000' , Inhalt nach title
    title = _rec['021A'][0]['a'][0];
    idx = title.indexOf(' @');
    if (idx == 0) title = title.substr(2);
    else if (idx > 0) {
        title = title.substr(idx + 2) + ', ' + title.substr(0, idx);
    }

    //---Sprachen aus 1500
    for (var s = 0; s < _rec['010@'][0]['a'].length; s += 1) {
        sprachen.push(L.getCode(_rec['010@'][0]['a'][s]));
    }

    //---Feld '4005' , Inhalt an title anhängen
    if (_rec['021C']) {
        var unterreihe_bez = '',
            unterreihe_tit = '';
        for (var p in _rec['021C']) { // 4005 ist wiederholbar
            title += ' / ';
            unterreihe_bez = '',
                unterreihe_tit = '';
            if (!_rec['021C'].hasOwnProperty(p)) { continue; }
            if (__zdbCheckSF('021C', 'l', p)) {
                unterreihe_bez += _rec['021C'][p]['l'][0];
            }
            if (__zdbCheckSF('021C', 'a', p)) {
                if ('' != unterreihe_bez) {
                    unterreihe_tit += ", ";
                }
                unterreihe_tit += _rec['021C'][p]['a'][0];
                if (__zdbCheckSF('021C', 'd', p)) {
                    unterreihe_tit += ' : ' + _rec['021C'][p]['d'][0];
                }
            }
            title += unterreihe_bez + unterreihe_tit;
        }
    }
    if (_rec['032@']) {
        if (__zdbCheckSF('032@', 'a', 0)) {
            title += ' / ' + _rec['032@'][0]['a'][0];
        }
    }

    if (__zdbCheckSF('021A', 'e')) title += ' / ' + _rec['021A'][0]['e'][0];

    //---Feld '4030' , Inhalt nach publisher
    publisher = (__zdbCheckSF('033A', 'n')) ? _rec['033A'][0]['n'][0] : '';

    //---Feld '2010' , Inhalt nach eissn
    eissn = '';
    if (_rec['005A']) {
        if (_rec['005A'][0]['0']) { // E-ISSN vorhanden
            eissn = _rec['005A'][0]['0'][0];
        }
    }
    //---URL-Feld '4085' , Inhalt nach url, mehrere aneinander
    url = '';

    if (_rec['009Q']) {
        urls = [];
        for (var u = 0; u < _rec['009Q'].length; u += 1) {
            urls.push(_rec['009Q'][u]['u'][0]);
        }
        url = urls.join("\n");
    }
    else {
        return __zdbError('Die URL (4085) fehlt.');
    }

    //---Feld '4024' , Inhalt nach first_volume, first_issue, first_date
    first_volume = '';
    first_date = '';
    first_issue = '';
    last_issue = '';
    last_volume = '';
    last_date = '';
    if (_rec['031N']) {
        if (__zdbCheckSF('031N', 'd')) {
            first_volume = _rec['031N'][0]['d'][0];
        }
        if (__zdbCheckSF('031N', 'e')) {
            first_issue = _rec['031N'][0]['e'][0];
        }
        if (__zdbCheckSF('031N', 'j')) {
            first_date = _rec['031N'][0]['j'][0];
        }
        if (__zdbCheckSF('031N', 'o')) {
            last_issue = _rec['031N'][0]['o'].slice(-1);
        }
        if (__zdbCheckSF('031N', 'n')) {
            last_volume = _rec['031N'][0]['n'].slice(-1);
        }
        if (__zdbCheckSF('031N', 'k')) {
            last_date = _rec['031N'][0]['k'].slice(-1);
        }
    }
    else if (_rec['031@']) {
        if (__zdbCheckSF('031@', 'a')) {
            first_volume = _rec['031@'][0]['a'][0];
        }
    }

    //---Feld '5080' , Inhalt nach notation
    if (_rec['045U']) {
        for (var i in _rec['045U'][0]['e']) {
            if (!_rec['045U'][0]['e'].hasOwnProperty(i)) { continue; }
            // ruft ddc-ezb konkordanz
            _ezb = __EZBNota(_rec['045U'][0]['e'][i]);
            for (var x in _ezb) {
                if (!_ezb.hasOwnProperty(x)) { continue; }
                _ezbnota.push(_ezb[x]);
            }
        }
        _ezbnota = __zdbArrayUnique(_ezbnota);
    }

    // pissn über Verknüpfung ermitteln
    if (_rec['039D']) {
        for (var d in _rec['039D']) {
            if (!_rec['039D'].hasOwnProperty(d)) { continue; }
            if (__zdbCheckSF('039D', 'n', d, 'Druck-Ausgabe')) {
                if (__zdbCheckSF('039D', '9', d)) {
                    dppn = _rec['039D'][d]['9'][0];
                }
                if (__zdbCheckSF('039D', 'X', d)) {
                    pissn = _rec['039D'][d]['X'][0];
                    break;
                } else if (__zdbCheckSF('039D', '8', d)) {
                    indxISSN = _rec['039D'][d][8][0].indexOf('ISSN: ');
                    pissn = _rec['039D'][d][8][0].substring(indxISSN + 6, indxISSN + 15);
                    break;

                }
            }
        }
    }
    if (dppn) {
        winsnap = application.windows.getWindowSnapshot();
        if (!__zdbDruckausgabe(dppn)) {
            if (!__zdbYesNo('Eine reziproke Verknüpfung ist nicht möglich. Möchten Sie trotzdem fortfahren?')) {
                return false;
            }
        }
        application.windows.restoreWindowSnapshot(winsnap);
    } else {
        if (!__zdbYesNo('Eine reziproke Verknüpfung ist nicht möglich. Möchten Sie trotzdem fortfahren?')) {
            return false;
        }
    }


    EZB_satz =
        'title=' + escape(title) + '&publisher=' + escape(publisher)
        + '&eissn=' + eissn + '&pissn=' + pissn
        + '&zdb_id=' + _rec['006Z'][0][0][0] + '&url=' + escape(url)
        + '&first_volume=' + escape(first_volume)
        + '&first_date=' + escape(first_date)
        + '&first_issue=' + escape(first_issue)
        + '&last_issue=' + escape(last_issue)
        + '&last_volume=' + escape(last_volume)
        + '&last_date=' + escape(last_date);

    EZB_satz += '&languages[]=' + sprachen.join('&languages[]=');

    for (var i in _ezbnota) {
        if (!_ezbnota.hasOwnProperty(i)) { continue; }
        EZB_satz += '&notation[]=' + _ezbnota[i];
    }
    EZB_satz += '&charset=utf8';
    EZB_satz += '&bibid=' + bibid;
    EZB_satz = EZB_satz.replace(/ /g, '%20');
    application.shellExecute(dbformUrl + EZB_satz, 5, 'open', '');
    //	4 bedeutet ja und nein; 6=ja 7=nein
    if (__zdbYesNo(
        "Falls nicht automatisch Ihr Browser mit der EZB-Darstellung\n"
        + "in den Vordergrund kommt, wechseln Sie bitte in den Browser\n"
        + "und kontrollieren die Übereinstimmung Ihrer Aufnahme mit dem\n"
        + "im Browser gezeigten Titel.\n\n"
        + "Ist die EZB-Aufnahme korrekt und soll die Frontdoor-url\n"
        + 'eingetragen werden?')) {
        //	Press the 'Korrigieren' button
        application.activeWindow.command('k d', false);
        if (application.activeWindow.status != 'OK') {
            __zdbMsg('Sie sind nicht berechtigt, den Datensatz zu ändern.');
            return false;
        }
        //	Go to end of buffer without expanding the selection
        application.activeWindow.title.endOfBuffer(false);
        //	EZB-Frontdoor einfügen
        application.activeWindow.title.insertText('4085 =u ' + frontDoor + _rec['006Z'][0][0][0]);
        application.activeWindow.title.insertText('=x F');
        //	Press the <ENTER> key
        application.activeWindow.simulateIBWKey('FR');

        //	Dokumenttyp  8A: korrekt, MT: Fehler
        if (application.activeWindow.getVariable('scr') != '8A') {
            __zdbMsg('Die Korrektur des Titel ist fehlgeschlagen. Bitte holen'
                + 'Sie dies direkt über die WInIBW nach.');
            return false;
        }
    }
}

// =======================================================================
// ENDE ***** EZB *****
// =======================================================================

//--------------------------------------------------------------------------------------------------------
//name:		__zdbGetRecord
//calls:		__zdbCheckKurztitelAuswahl, __zdbGetExpansionFromP3VTX, __zdbError
//description:	returns title record in a desired format
//user:	  	internal
//input: 		string format, bool extmode
//return:		string satz: title record
//edited:		2011-12-16
//--------------------------------------------------------------------------------------------------------
function __zdbGetRecord(format, extmode) {

    var scr = __zdbCheckScreen(['7A', '8A'], 'Parallelausgabe');
    if (false == scr) return false;

    var satz = null;

    if ((format != 'P') && (format != 'D')) {
        return __zdbError('Funktion getRecord mit falschem Format "' + format
            + "\"aufgerufen.\n"
            + 'Bitte wenden Sie sich an Ihre Systembetreuer.');
    }
    if (scr == '7A') {
        if (!__zdbCheckKurztitelAuswahl()) return false;
    }
    application.activeWindow.command('show ' + format, false);
    if (extmode) {
        satz = __zdbGetExpansionFromP3VTX();
    } else {
        satz = application.activeWindow.copyTitle();
        //satz = satz.replace(/\r/g,'');
    }
    if (scr == '7A')
        application.activeWindow.simulateIBWKey('FE');
    else
        if (format == 'P')
            application.activeWindow.command('show D', false);
    satz = satz + "\n";
    return satz;
}

//--------------------------------------------------------------------------------------------------------
//name:		__zdbError
//calls:		__zdbMsg
//description:	simplifies __zdbMsg by setting the error msgicon
//user:	  	internal
//input: 		string msgText
//return:		void
//--------------------------------------------------------------------------------------------------------
function __zdbError(msgText) {
    __zdbMsg(msgText, 'e');
    return false;
}

function __zdbYesNo(msgtxt) {
    var prompter = utility.newPrompter();
    var button;
    button = prompter.confirmEx(messageBoxHeader, msgtxt, 'Ja', 'Nein', null, null, null);
    //prompter = null;
    return !button;
}


function __zdbMsg(msgText, iconChar) {
    var messageBoxHeader;
    var icon;
    switch (iconChar) {
        case 'a': icon = 'alert-icon';
            messageBoxHeader = 'Achtung!'; // cs 15.07.10
            break;
        case 'e': icon = 'error-icon';
            messageBoxHeader = 'Fehler!'; // cs 15.07.10
            break;
        case 'q': icon = 'question-icon';
            messageBoxHeader = 'Frage:'; // cs 15.07.10
            break;
        default: icon = 'message-icon';
            messageBoxHeader = 'Meldung!'; // cs 15.07.10
            break;
    }
    application.messageBox(messageBoxHeader, msgText, icon);
    return;
}


function __zdbCheckKurztitelAuswahl() {

    application.activeWindow.simulateIBWKey('FR');
    if (__zdbYesNo("Sie haben das Skript aus der Kurztitelliste aufgerufen.\n"
        + "Zur Sicherheit:\n\n"
        + 'Ist dies der gewünschte Datensatz?')) return true;
    //application.activeWindow.simulateIBWKey('FE');
    return false;
}

function __zdbGetExpansionFromP3VTX() {
    satz = application.activeWindow.getVariable('P3VTX');
    satz = satz.replace('<ISBD><TABLE>', '');
    satz = satz.replace('<\/TABLE>', '');
    satz = satz.replace(/<BR>/g, "\n");
    satz = satz.replace(/^$/gm, '');
    satz = satz.replace(/^Eingabe:.*$/gm, '');
    satz = satz.replace(/^Mailbox:.*$/gm, '');
    satz = satz.replace(/<a[^<]*>/g, '');
    satz = satz.replace(/<\/a>/g, '');
    satz = satz.replace(/\r/g, "\n");
    satz = satz.replace(/\u001b./g, ''); // replace /n (Zeilenumbruch) entfernt,
    // weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
    return __zdbUnescapeHtml(satz);
}
/**
 * Replaces HTML escaped chars to unescaped
 * @param {string} text with html escaped chars
 * @return {string} text with unescaped chars
 */
function __zdbUnescapeHtml(text) {
    var map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&nbsp;': " "
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&nbsp;/g, function (m) { return map[m]; });
}

function __zdbGetFormat() {
    var format = application.activeWindow.getVariable('P3GPR');
    if ('' == format) {
        format = application.activeWindow.getVariable('P3GDB');
    }

    return ('' != format) ? format.toUpperCase() : false;
}

/**
* Liest ZDBID aus Vollanzeige oder Editiermodus
* @param {string} idn optional
* @return {string}|{bool} ZDBID or false
*/
function __zdbGetZDB(idn) {
    var zdbid;
    idn = idn || false;
    if (idn) // get zdb id of a different title in a work window
    {
        var myWindowId = __zdbOpenWorkWindow();
        application.activeWindow.commandLine('\zoe idn ' + idn);
    }
    //var strScreen = application.activeWindow.getVariable('scr');
    var strScreen = __zdbCheckScreen(['8A', 'MT', 'IT'], 'Merke ZDBID');
    if (false == strScreen) return false;
    // set the right category
    var map = {
        'D': '2110',
        'DA': '2110',
        'P': '006Z'
    };
    var format = __zdbGetFormat();

    var cat = map[format];

    if ('P' != format) {
        // Korrekturmodus
        if (strScreen == 'MT' || strScreen == 'IT') {
            zdbid = application.activeWindow.title.findTag(cat, 0, false, false, true);
        }
        else {
            zdbid = application.activeWindow.findTagContent(cat, 0, false);

            // workaround since findTagContent has errors
            zdbid = zdbid.replace(/^\s+|\s?\n$/g, '');
        }
    }
    else // Format P
    {
        var _field;
        // Korrekturmodus
        if (strScreen == 'MT' || strScreen == 'IT') {
            _field = __zdbParseField(application.activeWindow.title.findTag(cat, 0, true, false, true));
            zdbid = _field[cat][0][0];
        }
        else {
            _field = __zdbParseField(application.activeWindow.findTagContent(cat, 0, true));
            zdbid = _field[cat][0][0];
        }
    }

    if (idn) // close work window and return to old
    {
        __zdbCloseWorkWindow(myWindowId);
    }

    return zdbid.replace(/(\r\n|\n|\r|\s)/gm, '');
}

/**
* opens a new window for temporary works
*/
function __zdbOpenWorkWindow() {
    var myWindowId = application.activeWindow.windowID;
    application.newWindow();
    return myWindowId;
}

/**
* closes the window for temporary works and return to the old one
*/
function __zdbCloseWorkWindow(myWindowId) {
    if (myWindowId == null) return false;
    application.activeWindow.closeWindow();
    application.activateWindow(myWindowId);
    return;
}

/**
* Liest Expansion in ein Object
*
* Bsp.: --Abvz--International Legal Center$xAllgemeine Unterteilung$gNew York, NY$BVerfasser: [????test]
* wird zu
* {
*   norm: {
*           a: "International Legal Center",
*           x: "Allgemeine Unterteilung",
*           g: "New York, NY",
*           B: "Verfasser"
*   },
*   tit: "????test"
* }
*
* weitere Tests:
* --Abvz--: Adreß- und Geschäftshandbuch für den k[öniglich] b[ayerischen] Markt Berchtesgaden und Berchtesgadener-Land
*
* --Abvz--International Legal Center$xAllgemeine Unterteilung$gNew York, NY$BVerfasser: Adreß- und Geschäftshandbuch für den k[öniglich] b[ayerischen] Markt Berchtesgaden und Berchtesgadener-Land
*
* --Abvz--International Legal Center$xAllgemeine Unterteilung$gNew York, NY$BVerfasser: [????test]
*
* --Abvz--: [????test]
*
* --Advz--Magyar Tudományos Akadémia$bTörténettudományi Osztály [Tb1]$BVerfasser: Értekezések a Történettudományi Osztály köréb?l
*/
function __zdbParseExpansion(exp) {

    var split;
    var _exp = {};
    var re = /(?:--[^-]+--)([^:]*)(?::\s(?:(?:\[(.+)\])|(?:(.+)))?)?/;
    var matches = re.exec(exp);
    if (matches) {
        // Titel nach :\s
        if (matches[2]) {
            _exp.tit = matches[2];
        } else {
            _exp.tit = matches[3];
        }
        //Normdaten
        if (matches[1]) {
            _exp.norm = {};
            split = matches[1].split('$');
            for (var i = 0; i < split.length; i++) {
                if (0 == i) {
                    _exp.norm.a = split[i];
                }
                else {
                    _exp.norm[split[i][0]] = split[i].slice(1);
                }
            }
        }
    }

    return _exp;
}

/**
* Expansion object to RDA fields
* @param {object} object created from __zdbParseExpansion()
* @return {string} RDA fields
*/
function __zdbExpansionToText(e) {
    var text = '';
    if (e.norm) {
        text = '$l' + e.norm.a;
    }
    return text += '$t' + e.tit;
}

/**
* Liest ein Feldinhalt in ein Object
* Bsp.:
* 039E $bf$aFortsetzung von$9942987667$8--Cbvz--Deutsche Zentralbücherei für Blinde zu Leipzig: DZB-Nachrichten
* wird zu
* {
*   "039E":
*   {
*      "b": ["f"],
*      "a": ["Fortsetzung von"],
*      "9": ["942987667"],
*      "8": ["--Cbvz--Deutsche Zentralbücherei für Blinde zu Leipzig: DZB-Nachrichten"]
*   }
* }
*
* Zugriff: obj['039E'][9][0] --> "942987667"
* Zugriff: obj['039E']['b'][0] --> "f"
*
* 017A $aee$amg$anw wird zu
* {
*   "017A":
*   {
*       "a": ["ee","mg","nw"]
*   }
* }
* Zugriff: obj['017A']['a'][0] --> "ee"
* Zugriff: obj['017A']['a'][1] --> "mg"
*/
function __zdbParseField(field) {
    var _field = {};
    var arr = field.match(/^([^\s]+)\s(.+)/);
    var split = arr[2].split(delimiter);
    var subfield = {};
    for (var x = 1; x < split.length; x++) {
        if (subfield[split[x][0]]) {
            subfield[split[x][0]].push(split[x].slice(1));
        }
        else {
            subfield[split[x][0]] = [split[x].slice(1)];
        }

    }
    _field[arr[1]] = subfield;
    return _field;
}


/**
* Sets the gloval variable _rec as an object of the (current|desired) title
* @param {string} idn optional the idn of the desired title
*/
function __zdbJSON(idn) {
    _rec = {};
    idn = idn || false;

    // save format
    var format = __zdbGetFormat();

    var myWindowId = application.activeWindow.windowID;

    if (idn) // get zdb id of a different title in a work window
    {
        application.disableScreenUpdate(true);
        __zdbOpenWorkWindow();
        application.activeWindow.command('f idn ' + idn, true);
    }

    if ('P' != __zdbGetFormat()) application.activeWindow.command('s p', false);

    var rec = __zdbGetExpansionFromP3VTX();


    // get array of lines
    var arrLines = rec.match(/(.+)/gm);

    // for each line
    for (var i = 0; i < arrLines.length; i += 1) {
        _line = __zdbParseField(arrLines[i]);

        // key is the category
        for (var key in _line) {
            if (_line.hasOwnProperty(key)) {
                // if key already exists
                if (_rec.hasOwnProperty(key)) {
                    _rec[key].push(_line[key]);
                }
                else // key does not exist
                {
                    // always create an array
                    _rec[key] = [_line[key]];
                }
            }
        }
    }

    _rec.katToString = function (kat) {
        var string = '',
            i;
        for (i = 0; i < this[kat].length; i++) {
            string += "\n" + kat + ' ';
            for (var sub in this[kat][i]) {
                for (var x = 0; x < this[kat][i][sub].length; x++) {
                    string += delimiter + sub + this[kat][i][sub][x];
                }
            }
        }
        return string;
    };

    if (idn) // close work window and return to old
    {
        __zdbCloseWorkWindow(myWindowId);
        application.disableScreenUpdate(false);
    }
    // back to source format
    if ('P' != format) application.activeWindow.command('s ' + format, false);

    if (application.activeWindow.windowID != myWindowId) {
        __zdbCloseWorkWindow(myWindowId);
    }
}

/**
* Checks weather screen variable is one of options
* pops up alert with message if not
* @param {array} options possible screen variables
* @param {string} header of popup
* @param {string} message optional
* @return {string}|{bool} screen variable or false
*/
function __zdbCheckScreen(options, header, message) {

    var map = {
        '8A': 'Vollanzeige',
        '7A': 'Trefferliste',
        'MT': 'Editiermodus',
        'IT': 'Titelneuaufnahme',
        'IE': 'Exemplarneuaufnahme',
        '00': 'Loginmaske',
        'GN': 'Setansicht',
        'SC': 'Indexansicht',
        'FI': 'Datenbankinfo',
        'FS': 'Bestandsauswahl',
        'MI': 'Norm-Korrekturmodus'
    };
    var strScreen = application.activeWindow.getVariable('scr');
    var opt = options.join('#');
    if (opt.indexOf(strScreen) < 0) {
        var arr = [];
        for (var e in map) {
            if (!map.hasOwnProperty(e)) { continue; }
            if (opt.indexOf(e) > -1) arr.push(map[e]);
        }
        var list = arr.join(', ');
        if (typeof header !== 'undefined') {
            message = message || 'Die Funktion kann nur aus ' + list + ' aufgerufen werden.';
            application.messageBox(header, message, 'alert-icon');
        }
        return false;
    }
    return strScreen;
}

function __zdbArrayDiff(a1, a2) {
    for (var i = 0; i < a2.length; i++) {
        for (var y = 0; y < a1.length; y++) {
            if (a2[i] === a1[y]) {
                a1.splice(y, 1);
            }
        }
    }
    return a1;
}

/**
* Check if subfield exists with specific content
* @return {bool}
*/
function __zdbCheckSF(kat, sf, i, c) {
    i = i || 0;
    c = c || false;
    if (!_rec[kat]) return false;
    if (!_rec[kat][i][sf]) return false;
    if (c) {
        for (var x in _rec[kat][i][sf]) {
            if (!_rec[kat][i][sf].hasOwnProperty(x)) { continue; }
            if (_rec[kat][i][sf][x] == c) return true;
        }
        return false;
    }
    return true;
}

__zdbArrayUnique = function (arr) {
    var r = [];
    o: for (var i = 0, n = arr.length; i < n; i++) {
        for (var x = 0, y = r.length; x < y; x++) {
            if (r[x] == arr[i]) continue o;
        }
        r[r.length] = arr[i];
    }
    return r;
}

function zdb_alleinbesitz() {
    var eigene_bibliothek = application.getProfileString('zdb.userdata', 'eigeneBibliothek', '');
    if ('' == eigene_bibliothek) {
        if (__zdbYesNo('Ihre Bibliothek ist noch nicht definiert. Wollen Sie ihre Bibliothek jetzt defnieren?')) {
            zdb_BibliothekDefinieren();
            eigene_bibliothek = application.getProfileString('zdb.userdata', 'eigeneBibliothek', '');
            if ('' == eigene_bibliothek) {
                return false;
            }
        }

    }

    var id = eigene_bibliothek.substring(1, eigene_bibliothek.length - 1),
        lenId = id.length,
        contingent = {
            0: '[123456789X]',
            1: '[023456789X]',
            2: '[013456789X]',
            3: '[012456789X]',
            4: '[012356789X]',
            5: '[012346789X]',
            6: '[012345789X]',
            7: '[012345689X]',
            8: '[012345679X]',
            9: '[012345678X]',
            X: '[0123456789]'
        },
        mutations = [],
        expression,
        command;

    for (var num = 0; num < lenId; num += 1) {
        expression = '';
        for (var pos = 0; pos < lenId; pos += 1) {
            if (pos == num) {
                expression += contingent[id[num]];
                break;
            } else if (0 == pos) {
                expression += '[0123456789]';
            } else {
                expression += '!'
            }
        }
        mutations.push(expression + '?');
    }

    command = mutations.join(' not bie ');

    application.activeWindow.command('f bie ' + id + ' not bie ' + command, false);
}

function zdb_idListe() {
    var set = new SET(),
        t,
        allezdb = [];
    while (t = set.nextTit()) {
        allezdb[t] = __zdbGetZDB();
    }
    application.activeWindow.clipboard = allezdb.join("\r\n");
    application.messageBox("ZDB-ID-Liste", "Alle ZDB-IDs wurden eingesammelt und in den " +
        "Zwischenspeicher geschrieben. \nSie können die ZDB-IDs jetzt mit dem Shortcut Strg+v " +
        "in eine Datei einfügen.", "message-icon");
}

function LANG() {
    this.codes = {
        'aar': 'aa', 'abk': 'ab', 'ave': 'ae', 'afr': 'af', 'aka': 'ak', 'amh': 'am', 'arg': 'an', 'ara': 'ar', 'asm': 'as', 'ava': 'av', 'aym': 'ay',
        'aze': 'az', 'bak': 'ba', 'bel': 'be', 'bul': 'bg', 'bih': 'bh', 'bis': 'bi', 'bam': 'bm', 'ben': 'bn', 'tib': 'bo', 'tib': 'bo', 'bre': 'br',
        'bos': 'bs', 'cat': 'ca', 'che': 'ce', 'cha': 'ch', 'cos': 'co', 'cre': 'cr', 'cze': 'cs', 'cze': 'cs', 'chu': 'cu', 'chv': 'cv', 'wel': 'cy',
        'wel': 'cy', 'dan': 'da', 'ger': 'de', 'ger': 'de', 'div': 'dv', 'dzo': 'dz', 'ewe': 'ee', 'gre': 'el', 'gre': 'el', 'eng': 'en', 'epo': 'eo',
        'spa': 'es', 'est': 'et', 'baq': 'eu', 'baq': 'eu', 'per': 'fa', 'per': 'fa', 'ful': 'ff', 'fin': 'fi', 'fij': 'fj', 'fao': 'fo', 'fre': 'fr',
        'fre': 'fr', 'fry': 'fy', 'gle': 'ga', 'gla': 'gd', 'glg': 'gl', 'grn': 'gn', 'guj': 'gu', 'glv': 'gv', 'hau': 'ha', 'heb': 'he', 'hin': 'hi',
        'hmo': 'ho', 'hrv': 'hr', 'hat': 'ht', 'hun': 'hu', 'arm': 'hy', 'arm': 'hy', 'her': 'hz', 'ina': 'ia', 'ind': 'id', 'ile': 'ie', 'ibo': 'ig',
        'iii': 'ii', 'ipk': 'ik', 'ido': 'io', 'ice': 'is', 'ice': 'is', 'ita': 'it', 'iku': 'iu', 'jpn': 'ja', 'jav': 'jv', 'geo': 'ka', 'geo': 'ka',
        'kon': 'kg', 'kik': 'ki', 'kua': 'kj', 'kaz': 'kk', 'kal': 'kl', 'khm': 'km', 'kan': 'kn', 'kor': 'ko', 'kau': 'kr', 'kas': 'ks', 'kur': 'ku',
        'kom': 'kv', 'cor': 'kw', 'kir': 'ky', 'lat': 'la', 'ltz': 'lb', 'lug': 'lg', 'lim': 'li', 'lin': 'ln', 'lao': 'lo', 'lit': 'lt', 'lub': 'lu',
        'lav': 'lv', 'mlg': 'mg', 'mah': 'mh', 'mao': 'mi', 'mao': 'mi', 'mac': 'mk', 'mac': 'mk', 'mal': 'ml', 'mon': 'mn', 'mar': 'mr', 'may': 'ms',
        'may': 'ms', 'mlt': 'mt', 'bur': 'my', 'bur': 'my', 'nau': 'na', 'nob': 'nb', 'nde': 'nd', 'nep': 'ne', 'ndo': 'ng', 'dut': 'nl', 'dut': 'nl',
        'nno': 'nn', 'nor': 'no', 'nbl': 'nr', 'nav': 'nv', 'nya': 'ny', 'oci': 'oc', 'oji': 'oj', 'orm': 'om', 'ori': 'or', 'oss': 'os', 'pan': 'pa',
        'pli': 'pi', 'pol': 'pl', 'pus': 'ps', 'por': 'pt', 'que': 'qu', 'roh': 'rm', 'run': 'rn', 'rum': 'ro', 'rum': 'ro', 'rus': 'ru', 'kin': 'rw',
        'san': 'sa', 'srd': 'sc', 'snd': 'sd', 'sme': 'se', 'sag': 'sg', 'sin': 'si', 'slo': 'sk', 'slo': 'sk', 'slv': 'sl', 'smo': 'sm', 'sna': 'sn',
        'som': 'so', 'alb': 'sq', 'alb': 'sq', 'srp': 'sr', 'ssw': 'ss', 'sot': 'st', 'sun': 'su', 'swe': 'sv', 'swa': 'sw', 'tam': 'ta', 'tel': 'te',
        'tgk': 'tg', 'tha': 'th', 'tir': 'ti', 'tuk': 'tk', 'tgl': 'tl', 'tsn': 'tn', 'ton': 'to', 'tur': 'tr', 'tso': 'ts', 'tat': 'tt', 'twi': 'tw',
        'tah': 'ty', 'uig': 'ug', 'ukr': 'uk', 'urd': 'ur', 'uzb': 'uz', 'ven': 've', 'vie': 'vi', 'vol': 'vo', 'wln': 'wa', 'wol': 'wo', 'xho': 'xh',
        'yid': 'yi', 'yor': 'yo', 'zha': 'za', 'chi': 'zh', 'chi': 'zh', 'zul': 'zu'
    };
};

LANG.prototype = {
    getCode: function (code) {
        var flip = {};
        code = code.toLowerCase();
        if (code.length == 2) {
            for (var key in this.codes) {
                flip[this.codes[key]] = key;
            }
        } else if (code.length == 3) {
            flip = this.codes;
        } else {
            return false;
        }
        if (flip.hasOwnProperty(code)) {
            return flip[code];
        }
        return false;
    }
};
