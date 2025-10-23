function __isilOPAC(bearbeiter) {
    var mailTo = [];
    var i;
    if (!__zdbCheckScreen(['8A'], 'Script OPAC')) {
        return false;
    }
    // set global variable _rec
    __zdbJSON();
    if ('Tw' != _rec['002@'][0]['0']) {
        __zdbError('Das Script kann nur auf Tw-Sätze angewendet werden.');
        return false;
    }

    var isil = _rec['008H'][0]['e'];

    _rec['OPAC_url'] = 'https://isil.staatsbibliothek-berlin.de/isil/' + isil;

    if (_rec['035B']) {
        mailTo[0] = (_rec['035B'][0]['k']) ? _rec['035B'][0]['k'][0] : "keine E-Mail-Adresse angegeben";
    }

    // GET the File opac_textbausteine.txt
    var theFileInput = utility.newFileInput();
    //var theLine;
    var fileName = "\\" + "opac_textbausteine.txt";
    if (!theFileInput.openSpecial("ProfD", fileName)) {
        application.messageBox("Datei suchen", "Datei " + fileName + " wurde nicht gefunden.", "error-icon");
        return;
    }
    var text = theFileInput.read(theFileInput.getAvailable());

    // LVR
    var lvrRegex = /###\sVAR\sBEGIN\s###([^#]+)###\sVAR\sEND\s###/m;
    var lvrtext = text.match(lvrRegex)[1];
    //__zdbError(lvrtext);
    var lvrs = eval('({' + lvrtext + '})');

    text = text.replace(/{003@ \$0}/g, application.activeWindow.getVariable("P3GPP"));

    // IFM
    if ('DE-MUS' == "" + isil[0].substr(0, 6)) {
        mailTo.push(decodeURIComponent(encodeURIComponent(lvrs['IFM-CC'])));
    }

    if (_rec['035I']) {
        var lvr = decodeURIComponent(encodeURIComponent(lvrs[_rec['035I'][0]['a'][0]]));
        text = text.replace(/{LVR}/g, lvr);
        // LVR-CC
        if (_rec['035I'][0]['a'].length > 0) {
        mailTo.push(decodeURIComponent(encodeURIComponent(lvrs[_rec['035I'][0]['a'][0] + '-CC'])));
        }
        //Verbund-CC
        if (_rec['035I'][0]['c'].length > 0) {
            mailTo.push(decodeURIComponent(encodeURIComponent(lvrs[_rec['035I'][0]['c'][0] + '-CC'])));
        }
        

        //__zdbError(lvr);

        // FLI
        var flis = {
            n: "Fernleihfähig? nein",
            e: "Fernleihfähig? ja, nur Kopie, elektronischer Versand an Endnutzer möglich",
            k: "Fernleihfähig? ja, nur Papierkopie an Endnutzer"
        };

        var fli = decodeURIComponent(encodeURIComponent(flis[_rec['035I'][0]['e']]));
        text = (0 < fli.length) ? text.replace(/{FLI}/g, fli) : "Fernleihindikator für Produkte nicht aussagekrätig. Bitte überdenken.";
    }

    // DBS-CC
    if (_rec['008H'][0]['b']) {
        mailTo.push(decodeURIComponent(encodeURIComponent(lvrs['DBS-CC'])));
    }

    // Primärerfassung
    if (!_rec['035E'][0]['e']) {
        _rec['035E'][0]['e'] = 'ZDB';
    } else {
        //Verbund-CC
        if (_rec['035E'][0]['d'].length > 0) {
            for (i = 0; i < _rec['035E'][0]['d'].length; i++) {
                if (_rec['035E'][0]['d'][i] + '-CC' in lvrs) {
                    mailTo.push(decodeURIComponent(encodeURIComponent(lvrs[_rec['035E'][0]['d'][i] + '-CC'])));
                }
            }
        }
    }

    // Get all Vars in text
    var getVarsRegEx = /{(....)\s\$(.)}/gm;

    // Associate Vars with data
    var results = {}, matches;
    while ((matches = getVarsRegEx.exec(text)) != null) {
        results[matches[0]] = '';
        if (_rec[matches[1]]) {
            if (_rec[matches[1]][0][matches[2]]) {
                results[matches[0]] = _rec[matches[1]][0][matches[2]];
            }
        }
    }

    // do replace Vars with data
    var re;
    for (var k in results) {
        if (results.hasOwnProperty(k)) {
            var repl = k.replace('$', '\\$');
            re = new RegExp(repl, "g");
            if ('string' != typeof results[k]) {
                results[k] = results[k].toString();
                results[k] = results[k].replace('#', '||');
            }
            text = text.replace(re, results[k]);
        }
    }

    // Get Mail
    var mailRegex = '### ' + bearbeiter + ' BEGIN ###([^#]+)### ' + bearbeiter + ' END ###';
    //__zdbError(mailRegex);
    mailRegex = new RegExp(mailRegex, 'm');

    var mailMatch = text.match(mailRegex);
    var mail = mailMatch ? mailMatch[1] : "";

    // Get blocks
    //var blockRegex = /###\sTEXT(..?)\sBEGIN\s###((?:.|\n)+?)###\sTEXT..?\sEND\s###/gm;
    var blockRegex = /###\sTEXT(..?)\sBEGIN\s###([^#]+?)###\sTEXT..?\sEND\s###/gm;
    var blockMatch;

    while ((blockMatch = blockRegex.exec(text)) != null) {
        mail = mail.replace('{TEXT' + blockMatch[1] + '}', blockMatch[2]);
    }

    // cleaning
    var cleanRegex = /^.+:[\t ]+\r\n/m;
    var cleanMatch;
    while ((cleanMatch = cleanRegex.exec(mail)) != null) {
        mail = mail.replace(cleanMatch[0], '');
    }
    mail = mail.replace('||', '#');

    // clipboard
    var uniqueMailTo = __zdbArrayUnique(mailTo);
    application.activeWindow.clipboard = uniqueMailTo.join("; ") + "\n" + mail;

    /*if(__zdbYesNo("Der Text wurde in die Zwischenablage kopiert. Soll eine neue Mail an " + mailTo + " erstellt werden?")) {
        application.shellExecute('mailto:' + mailTo + '?subject=' + isil, 5, 'open','');
    }*/

    // open browser
    application.shellExecute(_rec['OPAC_url'], 5, 'open', '');
    application.messageBox("ISIL OPAC", "Der Text wurde in die Zwischenablage kopiert", "message-icon");

}

function zdb_isilInactive() {
    OPAC();
    application.activeWindow.command('k', false);

    var datum = new Date(),
        fy = datum.getFullYear(),
        jahr = fy.toString(),
        monat = datum.getMonth() + 1,
        monat = ('0' + monat).slice(-2),
        feld_680 = '680 Löschung' + jahr + '-' + monat,
        feld_900 = '900 $aUngültig; Bibliothek/Einrichtung aufgelöst // aufgegangen in <ISIL der Zielbibliothek> // ergänzende Information zur Auflösung oder dem Verbleib',
        feld_805 = "805 I\n",
        feld_110 = '110 früher: ' + _rec['029A'][0]['a'][0] + "\n";
    var feld_005 = "\n005 Tw\n",
        feld_806 = '',
        feld_092 = '092 ',
        bik = '';

    // sigel
    if (_rec['008H'][0]['d']) {
        feld_092 += '$d' + _rec['008H'][0]['d'][0];
    }
    // isil
    feld_092 += '$e' + _rec['008H'][0]['e'][0] + "\n";

    // bik
    if (_rec['008H'][0]['a']) {
        bik = _rec['008H'][0]['a'][0];
        feld_680 += '; BIK war ' + bik + ', ILN ' + _rec['035E'][0]['c'][0] + '; Auftragsbestätigung: ...';
    }

    if (_rec['035D']) {
        for (var i = 0; i < _rec['035D'].length; i++) {
            feld_806 += '806 ';
            if (_rec['035D'][i]['a']) {
                feld_806 += _rec['035D'][i]['a'][0];
            }
            if (_rec['035D'][i]['b']) {
                feld_806 += '$b' + _rec['035D'][i]['b'][0];
            }
            feld_806 += "\n";
        }
    }

    application.activeWindow.title.endOfBuffer(false);

    application.activeWindow.title.insertText(feld_005 + feld_092 + feld_110 + feld_680 + "\n" + feld_805 + feld_806 + feld_900);
}

function zdb_set_bik() {
    var prompter = utility.newPrompter(),
        bik_in;
    if (prompter.prompt("BIK speichern", "Setze die zuletzt vergebene BIK ohne Prüfziffer", application.getProfileString('zdb.userdata', 'bik', ''), '', '')) {
        if (!(bik_in = prompter.getEditValue())) {
            return false;
        }
        application.writeProfileString('zdb.userdata', 'bik', '' + bik_in.substr(0, 6));
    }
}

function zdb_bik() {
    if (!__zdbCheckScreen(['MI'], 'BIK erstellen.')) return false;
    var win = application.activeWindow.windowID;
    //var win = __zdbOpenWorkWindow();
    var nextBIK = application.getProfileString('zdb.userdata', 'bik', '');
    if ('' == nextBIK) {
        __zdbError('Bitte zuerst die letzte BIK definieren.');
        return false;
    }
    //application.activeWindow.command('s d', false);
    do {
        application.activeWindow.command('r', false);
        nextBIK = (parseInt(nextBIK) + 1).toString().slice(-6);
        application.activeWindow.command('f bbg Tw and bik ' + nextBIK + '-?', false);
    } while ('8A' == application.activeWindow.getVariable('scr')
        && application.activeWindow.status != 'ERROR');

    //application.activateWindow(win);
    __zdbCloseWorkWindow(win);
    application.activeWindow.title.findTag2('092', 0, false, true, false);
    application.activeWindow.title.insertText(__zdbPruezibik(nextBIK));
    application.writeProfileString('zdb.userdata', 'bik', '' + nextBIK);
}

function Pruezibik() {
    var bik_in = inputBox('Prüfziffer-Berechnung', 'Bitte die sechstellige Grund-BIK eingeben', '');
    if (!bik_in) {
        return false;
    }
    if (bik_in.length != 6) {
        __zdbError('Die BIK muss aus genau 6 Ziffern bestehen');
        return false;
    }
    var bik = __zdbPruezibik(bik_in);
    application.activeWindow.clipboard = bik;
    __meldung("BIK " + bik + " wurde in die Zwischenablage kopiert.");
}

function __zdbPruezibik(bik_in) {
    var z1 = bik_in[5] * 2,
        z2 = bik_in[4] * 3,
        z3 = bik_in[3] * 4,
        z4 = bik_in[2] * 5,
        z5 = bik_in[1] * 6,
        z6 = bik_in[0] * 7;

    var sum = z1 + z2 + z3 + z4 + z5 + z6;
    var sum2 = Math.floor(sum / 11);
    var prue = sum - (sum2 * 11);
    if (prue == 10) {
        prue = 'X'
    }
    return bik_in + "-" + prue;
}

function isil_merkeISIL() {
    application.activeWindow.clipboard = __isilGetISIL();
}

/**
* Liest ISIL aus Vollanzeige oder Editiermodus
* @param {string} idn optional
* @return {string}|{bool} ZDBID or false
*/
function __isilGetISIL(idn) {
    idn = idn || false;
    if (idn) // get zdb id of a different title in a work window
    {
        var myWindowId = __zdbOpenWorkWindow();
        application.activeWindow.commandLine('\zoe idn ' + idn);
    }
    //var strScreen = application.activeWindow.getVariable('scr');
    var strScreen = __zdbCheckScreen(['8A', 'MI', 'IT'], 'Merke ISIL');
    if (false == strScreen) return false;
    // set the right category
    var isil,
        map = {
            'D': '092',
            'DA': '092',
            'P': '008H'
        },
        reg = new RegExp(/\$e(.{2,3}-[^\$]+)/),
        format = __zdbGetFormat(),
        _field;

    var cat = map[format];

    if ('P' != format) {
        // Korrekturmodus
        if (strScreen == 'MI' || strScreen == 'IT') {
            _field = application.activeWindow.title.findTag(cat, 0, false, false, true);
        }
        else {
            _field = application.activeWindow.findTagContent(cat, 0, false);
            // workaround since findTagContent has errors
            _field = _field.replace(/^\s+|\s?\n$/g, '');
        }
        if (reg.test(_field)) {
            isil = _field.match(reg)[1];
        } else {
            return;
        }
    }
    else // Format P
    {
        // Korrekturmodus
        if (strScreen == 'MI' || strScreen == 'IT') {
            _field = __zdbParseField(application.activeWindow.title.findTag(cat, 0, true, false, true));
        }
        else {
            _field = __zdbParseField(application.activeWindow.findTagContent(cat, 0, true));
        }
        // __zeigeEigenschaften(_field);
        isil = _field[cat]['e'][0];
    }


    if (idn) // close work window and return to old
    {
        __zdbCloseWorkWindow(myWindowId);
    }

    return isil.replace(/(\r\n|\n|\r|\s)/gm, '');
}

function isil_isilListe() {
    var set = new SET(),
        alleisil = [];
    while (set.nextTit()) {
        alleisil.push(__isilGetISIL());
    }
    application.activeWindow.clipboard = alleisil.join("\r\n");
    application.messageBox("ISIL-Liste", "Alle ISIL wurden eingesammelt und in den " +
        "Zwischenspeicher geschrieben. \nSie können die ISIL jetzt mit dem Shortcut Strg+v " +
        "in eine Datei einfügen.", "message-icon");
}