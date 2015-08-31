// Datei: zdb_scripte_public.js
// WinIBW-Version ab 3.7

/**
* ZDB globale Variablen
*/
// auto Suchbox
var anfangsfenster;
// delimiter
var delimiter = '\u0192'; // Unterfeldzeichen "ƒ" = \u0192
var delimiterReg = '\u0192'; // regualr expression version Unterfeldzeichen "$" = \$
var charCode = 402; // Unterfeldzeichen "ƒ" = 402, Unterfeldzeichen "$" = 36
// message box 
var messageBoxHeader = "Header";
// JSON
var _rec;
// 7120
var fehlerin7120;
    
function zdb_ILTISseiten(){
    application.shellExecute ("http://support.ddb.de/iltis/inhalt.htm", 5, "open", "");
}

function zdb_BibliothekDefinieren(){
    open_xul_dialog("chrome://ibw/content/xul/ZDB_BibliothekDefinieren.xul", null);
}

function zdb_merkeZDB(){
    application.activeWindow.clipboard = __zdbGetZDB();
}

function zdb_MerkeIDN(){
    if(!__zdbCheckScreen(["8A","MT","IT"],"Merke IDN")) return false;
    var idn = application.activeWindow.getVariable("P3GPP");
    var idn_formatiert = "!" + idn + "!";
    application.activeWindow.clipboard = idn_formatiert;
}

function zdb_DigiConfig(){
    open_xul_dialog("chrome://ibw/content/xul/ZDB_DigitalisierungConfig.xul", null);
}

function zdb_Erscheinungsverlauf(){
    if(!__zdbCheckScreen(["MT","IT"],"Erscheinungsverlauf")) return;
    open_xul_dialog("chrome://ibw/content/xul/ZDB_Erscheinungsverlauf.xul", null);
}

function zdb_KennungWechseln(){
    var wert;
    if ((wert = application.activeWindow.caption) == "") {
        wert = "ZDB-Hauptbestand";
    }
    if (wert.indexOf("ZDB-Hauptbestand") >= 0 || wert.indexOf("ZDB-UEbungsbestand") >= 0) {
        open_xul_dialog("chrome://ibw/content/xul/ZDB_KennungWechseln.xul", null);
    } else {
        application.messageBox("KennungWechseln", "Die Funktion \"KennungWechseln\" kann nur im ZDB-Hauptbestand oder ZDB-Übungsbestand aufgerufen werden", "alert-icon");
        return;
    }
}

function zdb_ExemplarErfassen(){
    if(false == __zdbCheckScreen(["8A","7A","MT"],"ExemplarErfassen")) return false;
    var eigene_bibliothek =  application.getProfileString("zdb.userdata", "eigeneBibliothek", "");
    application.activeWindow.command("show d", false);
    // Sichert Inhalt des Zwischenspeichers, da dieser sonst durch copyTitle() überschrieben würde
    try{
        var clipboard = application.activeWindow.clipboard;
    } catch(e){
        // do nothing
    }
    // Kopiert Titel
    var kopie = application.activeWindow.copyTitle();
    application.activeWindow.clipboard = clipboard;
    //Schleife von 1 bis 99, da max. 99 Exemplare pro Bibliothek erfasst werden können
    for (var i = 1; i <= 99; i++) {
        var vergleich = 7000 + i;
        if (kopie.indexOf(vergleich) == -1) {
            var eingabe = vergleich + " x\n4800 " + eigene_bibliothek + "\n7100 \n7109 \n8031 \n8032 \n";
            // Definiert, wo Cursor im Titelbildschirm plaziert wird
            var zeile = 1;
            if (eigene_bibliothek) {
                zeile = 2;
            }
            // Exemplarsatz anlegen und befüllen
            application.activeWindow.command("e e" + i, false);
            if (application.activeWindow.status != "ERROR") {
                application.activeWindow.title.startOfBuffer(false);
                application.activeWindow.title.insertText(eingabe);
                application.activeWindow.title.startOfBuffer(false);
                application.activeWindow.title.lineDown(zeile, false);
                application.activeWindow.title.charRight(5, false);
                return;
            } else {
                return;
            }
        }
    }
}

function zdb_MailboxsatzAnlegen(){
    var ppn;
    application.overwriteMode = false;
    ppn = application.activeWindow.getVariable("P3GPP");
    application.activeWindow.command("ein t", false);
    if (application.activeWindow.status != "OK") {
        application.messageBox("MailboxsatzAnlegen", "Sie haben nicht die nötigen Berechtigungen, um einen Mailboxsatz anzulegen.", "alert-icon");
        return false;
    }
    application.activeWindow.title.insertText (
            "0500 am\n"
            + "8900 !" + ppn + "!\n"
            + "8901 \n"
            + "8902 ");
    application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.lineDown(2, false);
    application.activeWindow.title.charRight(5, false);
}

function zdb_AutomatischeSuchBox(){
    if(false == __zdbCheckScreen(["MT","IT"],"AutomatischeSuchBox")) return false;
    anfangsfenster = application.activeWindow.windowID; // globale Variable, die vom Skript HoleIDN verwendet wird
    open_xul_dialog("chrome://ibw/content/xul/ZDB_AutomatischeSuchBox.xul", null);
    return true;
}

function zdb_HoleIDN(){
    // Wurde vorab eine Suche mit dem Skript "Automatische Suchbox" ausgeführt?
    if (typeof anfangsfenster == "undefined") {
        application.messageBox("HoleIDN", "Vor Aufruf des Skriptes \"HoleIDN\" muss zunächst eine automatische Suche mit Hilfe des Skriptes \"AutomatischeSuchBox\" gestartet werden.", "alert-icon");
    } else {
        // Ist das aktive Fenster eine Trefferliste?
        if(false == __zdbCheckScreen(["7A","8A"],"HoleIDN")) return false;
        //  IDN des markierten Titels aus der Trefferliste ermitteln
        var idn = application.activeWindow.getVariable("P3GPP");
        // ID des aktiven Fensters ermitteln
        var fenster = application.activeWindow.windowID;
        // Falls das Bearbeitungsfenster ( = anfangsfenster) geschlossen wurde, gibt das System einen "uncaught exception"-Fehler aus. Um diesen abzufangen, wird mit TRY CATCH gearbeitet.
        try {
            // Zurück zum Anfangsfenster gehen
            application.activateWindow(anfangsfenster);
            // IDN einfügen
            application.activeWindow.title.insertText("!" + idn + "!");
            // Trefferliste schließen
            application.closeWindow(fenster);
        } catch(e) {
            application.messageBox("HoleIDN", "Das Bearbeitungsfenster, in welches die IDN eingefügt werden soll, ist nicht mehr geöffnet.", "alert-icon");
        }
    }
    return true;
}

//========================================
// Start ****** ZDB-Titelkopien ******
//========================================

function __zdbNormdatenKopie(){
    // Titelkopie auf zdb_titeldatenkopie.ttl setzen
    application.activeWindow.titleCopyFile = "resource:/ttlcopy/gnd_title.ttl";
    
    application.overwriteMode = false;
    var idn = application.activeWindow.getVariable("P3GPP");
    var typ = application.activeWindow.getVariable("P3VMC");
    application.activeWindow.command("show d", false);
    application.activeWindow.copyTitle();
    application.activeWindow.command("ein n", false);
    application.activeWindow.title.insertText(" *** Normdatenkopie *** \n");
    application.activeWindow.pasteTitle();
    application.activeWindow.title.endOfBuffer(false);
    
    if (typ == "Tb" || typ == "Tg") {
        application.activeWindow.title.insertText("??? !" + idn + "!");
    }
    //application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.findTag("005", 0, false, true, true);
    application.activeWindow.title.endOfField(false);
}

function __zdbTiteldatenKopie(){

    __zdbJSON();
    var _felder424X = __zdbFeld424XGet();

    // Überschrift und IDN einfügen
    application.overwriteMode = false;
    var idn = application.activeWindow.getVariable("P3GPP");
    application.activeWindow.command("show d", false);
    // Titelkopie auf zdb_titeldatenkopie.ttl setzen
    application.activeWindow.titleCopyFile = "resource:/ttlcopy/zdb_titeldatenkopie.ttl";
    application.activeWindow.copyTitle();
    application.activeWindow.command("ein t", false);
    application.activeWindow.title.insertText(" *** Titeldatenkopie *** \n");
    application.activeWindow.pasteTitle();
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("???? !" + idn + "!");
    application.activeWindow.clipboard = idn;

    // Ersetzungen in Kategorie 0600
    var codes0600;
    if("" != (codes0600 = application.activeWindow.title.findTag("0600", 0, false, true, true)))
    {
        var _codes0600 = codes0600.split(";");
        var _codes = __zdbArrayDiff(_codes0600, ["ee", "mg", "nw", "vt", "ra", "rb", "ru", "rg"]);
        if(0 < _codes.length) 
        {
             application.activeWindow.title.insertText(_codes.join(";"));
        }
        else
        {
            application.activeWindow.title.deleteLine(1);
        }
    }
    
    var feld4000 = __zdbTitelAnpassen();
    application.activeWindow.title.insertText(feld4000+"\n");
    
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n");
    __zdbFeld424XSet(_felder424X);
    //application.activeWindow.title.findTag("0500", 0, false, true, true);
    //application.activeWindow.title.endOfField(true);
    //application.activeWindow.title.insertText("xz");
}

function zdb_Datensatzkopie() {
    if(false == __zdbCheckScreen(["8A"],"Datensatzkopie")) return false;
    //Persönliche Einstellung des Titelkopie-Pfades ermitteln
    var titlecopyfileStandard = application.getProfileString("winibw.filelocation", "titlecopy", "");
    if (application.activeWindow.materialCode.charAt(0) == "T") {
        __zdbNormdatenKopie();
        } else {
        __zdbTiteldatenKopie();
    }
    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function zdb_Digitalisierung() {
    if(false == __zdbCheckScreen(["8A"],"Digitalisierung")) return false;
    // Prüfen, ob Titeldatensatz mit bibliographischer Gattung "A" aufgerufen, bei "T" oder "O" Fehlermeldung ausgeben
    var matCode = application.activeWindow.materialCode.charAt(0);
    if(matCode == "T" || matCode == "O") {
        application.messageBox("Digitalisierung", "Die Funktion kann nur für Titelsätze des Satztyps \"A\" verwendet werden.", "alert-icon");
        return false;
    }
    // Titelkopie auf zdb_titeldatenkopie_digi.ttl setzen
    var titlecopyfileStandard = application.getProfileString("winibw.filelocation", "titlecopy", "");
    var idn = application.activeWindow.getVariable("P3GPP");
    var showComment = " *** Titeldatenkopie Digitalisierung *** \n"
    if(!__zdbOnlineRessource("resource:/ttlcopy/zdb_titeldatenkopie_digi.ttl",showComment,["ld","dm"],true)) return false;
    
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n4256 Elektronische Reproduktion von!" + idn + "!\n");
    
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("4201 %Gesehen am ++");
    application.activeWindow.title.charLeft(1,false);
    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function zdb_Parallelausgabe(){
    if(false == __zdbCheckScreen(["8A"],"Parallelausgabe")) return false;
    // Prüfen, ob Titeldatensatz mit bibliographischer Gattung "A" aufgerufen, bei "T" oder "O" Fehlermeldung ausgeben
    var matCode = application.activeWindow.materialCode.charAt(0);
    if(matCode == "T" || matCode == "O") {
        application.messageBox("Digitalisierung", "Die Funktion kann nur für Titelsätze des Satztyps \"A\" verwendet werden.", "alert-icon");
        return false;
    }

    // Titelkopie auf zdb_titeldatenkopie_digi.ttl setzen
    var titlecopyfileStandard = application.getProfileString("winibw.filelocation", "titlecopy", "");
    var idn = application.activeWindow.getVariable("P3GPP");
    var showComment = " *** Titeldatenkopie Parallelausgabe *** \n"
    if(!__zdbOnlineRessource("resource:/ttlcopy/zdb_titeldatenkopie_parallel.ttl",showComment,[],false)) return false;

    // Kategorie 4234: anlegen und mit Text "4243 Erscheint auch als$nDruckausgabe![...IDN...]!" befüllen
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n4243 Erscheint auch als$nDruck-Ausgabe!" + idn + "!\n");

    // Kategorie 4213: individuell gefüllt oder leer ausgeben
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("4201 %Gesehen am ++");
    application.activeWindow.title.charLeft(1,false);
    
    //Wiederherstellen des ursprünglichen Pfades der Titelkopie-Datei:
    application.activeWindow.titleCopyFile = titlecopyfileStandard;
}

function __zdbOnlineRessource(copyFile,showComment,add0600,digi){
    // set gloabal variable _rec
    __zdbJSON();
    
    var _felder424X = __zdbFeld424XGet();

    // Titelaufnahme kopieren und neue Titelaufnahme anlegen
    application.overwriteMode = false;
    application.activeWindow.command("show d", false);
    application.activeWindow.titleCopyFile = copyFile;
    application.activeWindow.copyTitle();
    application.activeWindow.command("ein t", false);
    if(showComment != false) application.activeWindow.title.insertText(showComment);
    application.activeWindow.pasteTitle();

    
    // Kategorie 0500: Bibliographische Gattung/Status ändern
    var f0500 = application.activeWindow.title.findTag("0500", 0, false, true, true);
    f0500 = f0500.replace("A","O");
    f0500 = f0500.replace("v","x");
    application.activeWindow.title.insertText(f0500);
    
    if(!_rec["002C"]) application.activeWindow.title.insertText("\n0501 $btxt");
    if(!_rec["002D"]) application.activeWindow.title.insertText("\n0502 $bc");
    if(!_rec["002E"]) application.activeWindow.title.insertText("\n0503 $bcr");
    
    // Feld 0600
    add0600 = typeof add0600 !== 'undefined' ? add0600 : [];
    if(_rec['017A']) 
    {
        var _codes = __zdbArrayDiff(_rec['017A'][0]['a'], ["es", "ks", "sf", "sm", "mg", "mm", "nw", "ra", "rb", "rc", "rg", "ru", "ee", "vt"]);
        // join arrays
        _codes = _codes.concat(add0600);
        if(0 < _codes.length)
        {
            application.activeWindow.title.insertText("\n0600 "+ _codes.join(";"));
        }
    }
    else if(0 < add0600.length)
    {
        application.activeWindow.title.insertText("\n0600 "+ add0600.join(";"));
    }
    
    
    if(!_rec["010@"]) application.activeWindow.title.insertText("\n1500 ");
    if(digi)
    {
        application.activeWindow.title.insertText("\n1100 "+application.getProfileString("zdb.userdata.digiconfig", "1100", ""));
        application.activeWindow.title.insertText("\n1101 "+application.getProfileString("zdb.userdata.digiconfig", "1101", ""));
        application.activeWindow.title.insertText("\n2050 "+application.getProfileString("zdb.userdata.digiconfig", "2050", ""));
        application.activeWindow.title.insertText("\n2051 "+application.getProfileString("zdb.userdata.digiconfig", "2051", ""));
    }

    // Kategorie 2010,4215,4225 ändern
    var content,y;
    var fieldmap = {
        "2010": "2013 |p|",
        "4215": "4201 ",
        "4225": "4201 "
    };
    for(var m in fieldmap)
    {
        content = "";
        y = 0;
        while( (content = application.activeWindow.title.findTag(m, y, false, true, true)) !="")
        {
            application.activeWindow.title.deleteLine(1);
            application.activeWindow.title.insertText(fieldmap[m] + content + "\n");
            y++;
        }
    }
    
    y = 0;
    while("" != application.activeWindow.title.findTag("3100",y, false, true, true))
    {
        application.activeWindow.title.endOfField(false);
        application.activeWindow.title.insertText("$4aut");
        y++;
    }

    // neues Feld für Sekundärköperschaft 312X -> 311X
    content = "";
    y = 0;
    while( (content = application.activeWindow.title.findTag("312", y, false, true, true)) !="")
    {
        application.activeWindow.title.deleteLine(1);
        application.activeWindow.title.insertText("311" + y + " "+content + "$4isb");
        y++;
    }
    
    y = 0;
    while( (content = application.activeWindow.title.findTag("311", y, false, true, true)) !="")
    {
        if(!application.activeWindow.title.find("$4isb",false,true,false))
        {
            application.activeWindow.title.endOfField(false);
            application.activeWindow.title.insertText("$4isb\n");
        }
        y++;
    }

    var feld4000 = __zdbTitelAnpassen();
    application.activeWindow.title.insertText(feld4000+"\n");
    
    if(digi)
    {
        application.activeWindow.title.insertText("\n4030 "+application.getProfileString("zdb.userdata.digiconfig", "4030", ""));
        application.activeWindow.title.insertText("\n4085 "+application.getProfileString("zdb.userdata.digiconfig", "4085", ""));
        application.activeWindow.title.insertText("\n4190 "+application.getProfileString("zdb.userdata.digiconfig", "4190", ""));
    }
    // Kategorie 4212 mit neuem Vortext
    if(_rec['046C']) 
    {
        for(var c in _rec['046C'])
        {
            application.activeWindow.title.insertText("\n4212 Abweichender Titel: "+_rec['046C'][c]["a"][0]);
        }
    }
    if(digi)
    {
        application.activeWindow.title.insertText("\n4233 "+application.getProfileString("zdb.userdata.digiconfig", "4233", ""));
    }
    application.activeWindow.title.insertText("\n4251 \n");
    application.activeWindow.title.endOfBuffer(false);
    
    __zdbFeld424XSet(_felder424X);
    return true;
}

function __zdbTitelAnpassen()
{
    // Titel anpassen
    var feld4000 = application.activeWindow.title.findTag("4000",0, true, true, true);
    application.activeWindow.title.deleteLine(1);
    
    if(__zdbCheckSF("021A","e")) // Körperschaftsergänzungen vhd.
    {
        for(var e in _rec["021A"][0]["e"]) 
        {
            feld4000 = feld4000.replace(" // "+_rec["021A"][0]["e"][e],"");
        }
        
        if(!__zdbCheckSF("021A","h")) // Verfasserangabe nicht vhd.
        {
            feld4000 += " / "+_rec["021A"][0]["e"][0];
        }
    }
    
    if(__zdbCheckSF("021A","n")) // Materialbenennung vhd.
    {
        feld4000 = feld4000.replace(" [["+_rec["021A"][0]["n"][0]+"]]","");
    }
    
    return feld4000;
}

function __zdbFeld424XGet()
{
    // check if rda
    var rda;
    if(_rec["010E"]) rda = ("rda" == _rec["010E"][0]["e"][0]) ? true : false;
    
    // Verknüpfungsfelder einsammeln und auf verbale Form ändern
    var _felder424X = {
        "039B" : {p:"4241",c:[]},
        "039C" : {p:"4242",c:[]},
        "039D" : {p:"4243",c:[]},
        "039E" : {p:"4244",c:[]},
        "039S" : {p:"4245",c:[]}
    };
    
    var re = new RegExp("^.*--->.(.+)$"); // 2014 Sonderh. zu u. ab 2015 Forts. als Online-Ausg. ---> Lexware-Unternehmer-Wissen
    var _exp, match, code, expText;
    var text = "";
    // Online-Routine braucht dann nur noch s# oder f#
    var _code = {
        "s":"s#",
        "f":"f#"
    };
    
    for(var f in _felder424X) //  f = 039X
    {
        if(_rec[f]) // Feld 039X vorhanden
        {
            for(var e in _rec[f])
            {
                code = (__zdbCheckSF(f,"b",e)) ? _code[_rec[f][e]["b"][0]] : "";
                if(__zdbCheckSF(f,"a",e)) // Vortext vorhanden
                {
                    if("039E" != f || rda ) // kein Vortext für 4244 ohne rda
                    {
                        code += _rec[f][e]["a"][0];
                    }
                } 
                
                if(__zdbCheckSF(f,"8",e)) // Expansion vhd.
                {
                    _exp = __zdbParseExpansion(_rec[f][e][8][0]);
                    expText = __zdbExpansionToText(_exp); // Text with subfields $l and/or $t
                    _felder424X[f].c.push(code+expText); // $bf#Fortsetzung von$lVerantwortl$tTitel
                }
                else if(__zdbCheckSF(f,"r",e)) // something like 039E ƒbsƒr2014 Sonderh. zu u. ab 2015 Forts. als Online-Ausg. ---> Lexware-Unternehmer-Wissen
                {
                    if(match = _rec[f][e]["r"][0].match(re)[1])
                    {
                        _felder424X[f].c.push(code+"$t"+match);
                    }
                }
                else if(__zdbCheckSF(f,"t",e))
                {
                    text = code;
                    if(__zdbCheckSF(f,"n",e)) text += "$n"+_rec[f][e]["n"][0];
                    if(__zdbCheckSF(f,"l",e)) text += "$l"+_rec[f][e]["l"][0];
                    text += "$t"+_rec[f][e]["t"][0];
                    _felder424X[f].c.push(text);
                }
            }
        }
    }
    
    return _felder424X;
}

function __zdbFeld424XSet(_felder424X)
{
    var _lang = {
        "Dt":"Parallele Sprachausgabe$ndeutsch",
        "Fr":"Parallele Sprachausgabe$nfranzösisch",
        "En":"Parallele Sprachausgabe$nenglisch",
        "Sp":"Parallele Sprachausgabe$nspanisch",
    };
    var langpat = new RegExp("^(Dt|Fr|En|Sp)(?:[^$])+","i");
    var feld4248;
    var _repl = {
        "Digital. Ausg.": "Online-Ausgabe",
        "Online-Ausg.": "Online-Ausgabe"
    };
    var replpat = new RegExp("^(Digital\. Ausg\.|Online-Ausg\.)(?:[^$])+");
    var feld4243;
    var needFor3210 = false;
    for(var n in _felder424X)
    {
        for(var i in _felder424X[n]["c"])
        {
            if("4243" == _felder424X[n]['p']) { // spacial language relation field 4248
                if(langpat.test(_felder424X[n]["c"][i]))
                {
                    needFor3210 = true;
                    feld4248 = _felder424X[n]["c"][i].replace(langpat, function(m) {return _lang[m[0]+m[1]]; });
                    application.activeWindow.title.insertText("4248 "+ feld4248+" \n");
                }
                else
                {
                    feld4243 = _felder424X[n]["c"][i];
                    for(var r in _repl)
                    {
                        feld4243 = feld4243.replace(r,_repl[r]);
                    }
                    application.activeWindow.title.insertText(_felder424X[n]["p"]+ " Erscheint auch als$n"+ feld4243+" \n");
                }
            }
            else
            {
                application.activeWindow.title.insertText(_felder424X[n]["p"]+ " "+ _felder424X[n]["c"][i]+" \n");
            }
        }
        
    }
    
    if(needFor3210)
    {
        application.activeWindow.title.findTag2("4000",0, true, true, true);
        application.activeWindow.title.startOfField(false);
        application.activeWindow.title.insertText("3210 "+"\n");
    }
}
//========================================
// Ende ****** ZDB-Titelkopien ******
//========================================


// =======================================================================
// START ***** EZB *****
// =======================================================================
function __zdbDruckausgabe(dppn,ld){

    var arr = new Array();
    var eppn = application.activeWindow.getVariable("P3GPP");
    var regexp;
    var satz;

    application.activeWindow.command("f idn " + dppn, true);

    if (application.activeWindow.status != "OK") {
        __zdbError("Die über 4243 verlinkte Druckausgabe existiert nicht.");
        return false;
    }

//	DocType = 1. Zeichen im Feld 0500
    if (application.activeWindow.materialCode.charAt(0) != "A") {
        __zdbMsg("Record der 'Druckausgabe' hat Materialcode "
                    + application.activeWindow.materialCode);
        return false;
    }

    satz = __zdbGetRecord("D",false);
    if (false == satz)			return false;

    regexp = new RegExp("!" + eppn + "!","gm");
    arr = satz.match(regexp);
    if (arr == null) {
        application.activeWindow.command("k",false);
        if (application.activeWindow.status != "OK") {
            __zdbMSG("Sie sind nicht berechtigt, den Datensatz zu ändern.");
            return false;
        }
        var insText = (ld == true) ? "Digital. Ausg." : "Online-Ausg.";
        application.activeWindow.title.endOfBuffer(false);
        if(application.activeWindow.title.find("1505 $erda",false,false,false))
        {
            application.activeWindow.title.insertText("4243 Erscheint auch als$nOnline-Ausagabe!" + eppn + "!\n");
        }
        else
        {
            application.activeWindow.title.insertText("4243 "+insText+"!" + eppn + "!\n");
        }
        application.activeWindow.simulateIBWKey("FR");
        //	Korrektur ausgeführt, dann ist der Titel im diagn. Format
        //	sonst im Korrekturformat
        //application.messageBox("SCR", application.activeWindow.getVariable("scr"), "alert-icon");
        if (application.activeWindow.getVariable("scr") != "8A") {
            __zdbMsg("Die Korrektur des Titel ist fehlgeschlagen. Bitte holen"
                    + "Sie dies direkt über die WinIBW nach.");
            return false;
        }
    } else {
        application.messageBox("Test","Die Verknüpfung zur Internetausgabe im Feld 4243 ist schon vorhanden.", "alert-icon");
    }

//---Feld "2010" , zurückgeben
    arr = satz.match(/^2010 .*/gm);
    if (arr == null)			return false;

    arr[0] = arr[0].replace(/^2010 (.*)/,"$1");
    return arr[0].replace(/\*/,"");

}


function __EZBNota(maske){

    var DDC_EZB = {
        "000"  :["AK-AL","SQ-SU"],
        "004"  :["SQ-SU"],
        "010"  :["A"],
        "020"  :["AN"],
        "030"  :[""],
        "050"  :["A"],
        "060"  :["AK-AL"],
        "070"  :["AP"],
        "080"  :[""],
        "090"  :[""],
        "100"  :["CA-CI"],
        "130"  :["A"],
        "150"  :["CL-CZ"],
        "200"  :["B"],
        "220"  :["B"],
        "230"  :["B"],
        "290"  :["B"],
        "300"  :["Q","MN-MS"],
        "310"  :["Q"],
        "320"  :["MA-MM"],
        "330"  :["Q"],
        "333.7":["ZP"],
        "340"  :["P"],
        "350"  :["P"],
        "355"  :["MA-MM"],
        "360"  :["MN-MS","Q","A"],
        "370"  :["AK-AL","D"],
        "380"  :["Q","ZG"],
        "390"  :["LA-LC"],
        "400"  :["E"],
        "420"  :["H"],
        "430"  :["G"],
        "439"  :["G"],
        "440"  :["I"],
        "450"  :["I"],
        "460"  :["I"],
        "470"  :["F"],
        "480"  :["F"],
        "490"  :["E"],
        "491.8":["K"],
        "500"  :["TA-TD"],
        "510"  :["SA-SP"],
        "520"  :["U"],
        "530"  :["U"],
        "540"  :["V"],
        "550"  :["TE-TZ"],
        "560"  :["TE-TZ"],
        "570"  :["W"],
        "580"  :["W"],
        "590"  :["W"],
        "600"  :["ZG"],
        "610"  :["V","WW-YZ"],
        "620"  :["ZL","ZN","ZP"],
        "621.3":["ZN"],
        "624"  :["ZG","ZP"],
        "630"  :["ZA-ZE","WW-YZ"],
        "640"  :["ZA-ZE"],
        "650"  :["Q"],
        "660"  :["V","ZL"],
        "670"  :["ZL"],
        "690"  :["ZH-ZI"],
        "700"  :["LH-LO"],
        "710"  :["ZH-ZI"],
        "720"  :["ZH-ZI"],
        "730"  :["N"],
        "740"  :["LH-LO"],
        "741.5":["A"],
        "750"  :["LH-LO"],
        "760"  :["LH-LO"],
        "770"  :["LH-LO"],
        "780"  :["LP-LZ"],
        "790"  :["A"],
        "791"  :["LH-LO"],
        "792"  :["A"],
        "793"  :["ZX-ZY"],
        "796"  :["ZX-ZY"],
        "800"  :["E"],
        "810"  :["H"],
        "820"  :["H"],
        "830"  :["G"],
        "839"  :["G"],
        "840"  :["I"],
        "850"  :["I"],
        "860"  :["I"],
        "870"  :["F"],
        "880"  :["F"],
        "890"  :["K","E"],
        "891.8":["K"],
        "900"  :["N"],
        "910"  :["N","R"],
        "914.3":["N"],
        "920"  :["A","N"],
        "930"  :["LD-LG"],
        "940"  :["N"],
        "943"  :["N"],
        "950"  :["N"],
        "960"  :["N"],
        "970"  :["N"],
        "980"  :["N"],
        "990"  :["N"],
        "B"    :[""],
        "K"    :["A"],
        "S"    :[""]
    };
    if (maske == "")		return "";

    return DDC_EZB[maske];
}

function zdb_EZB_BibID(){
    //Anwender können BibID prüfen und ggf. korrigieren
    open_xul_dialog("chrome://ibw/content/xul/ZDB_EZBAccountDefinieren.xul", null);
}

function __checkEZBAccount(){
    if(application.getProfileString("zdb", "ezb.account", "") == "")
    {
        open_xul_dialog("chrome://ibw/content/xul/ZDB_EZBAccountDefinieren.xul", null);
    }
    var bibid = application.getProfileString("zdb", "ezb.account", "");
    if(bibid != "")
    {
        return bibid;
    }
    else
    {
        return false;
    }
}
//
// ZDB-Funktionen > EZB
//
//=============
function zdb_EZB(){
    //	Dokumenttyp  8A: Vollanzeige, 7A: Kurzliste
    if(false == __zdbCheckScreen(["7A","8A"],"EZB")) return false;
    
    var arr      = [];
    var _ezbnota = [];
    var _ezb     = [];
    var title, publisher, eissn, url;
    var ld = false;
    var dppn = false;
    var pissn = false;
    var volume1;
    var idx, jdx;
    var winsnap;
    var EZB_satz;
    var bibid = __checkEZBAccount();
    if(!bibid)
    {
        __zdbError("Sie müssen ein gültige EZB-bibid angeben.");
        return;
    }

//	url zur EZB
    var dbformUrl = "http://www.bibliothek.uni-regensburg.de/internal/ezeit/dbform.phtml?";
    var frontDoor = "http://www.bibliothek.uni-regensburg.de/ezeit/?";
    
    // set global variable _rec
    __zdbJSON();

//---Feld "4000" , Inhalt nach title
    title = _rec["021A"][0]["a"][0];
    idx                   = title.indexOf(" @");
    if (idx == 0)	title = title.substr(2);
    else if (idx > 0) {
        title = title.substr(idx+2) + ", " + title.substr(0,idx);
    }
    if(__zdbCheckSF("021A","e")) title += " / " + _rec["021A"][0]["e"][0];

    //---Feld "4005" , Inhalt an title anhängen
    if(_rec["021C"])
    {
        if(__zdbCheckSF("021C","r"))
        {
            title += ". "+_rec["021C"][0]["r"][0];
        }
        else
        {
            title += ". "+_rec["021C"][0]["a"][0];
        }
    }
    
    
//---Feld "4030" , Inhalt nach publisher
    publisher = (__zdbCheckSF("033A","n")) ? _rec["033A"][0]["n"][0] : ""; 

//---Feld "2010" , Inhalt nach eissn
    eissn = "";
    if(_rec["005A"])
    {
        eissn = _rec["005A"][0][0][0];
        eissn = eissn.replace('*','');
    }

    idx = eissn.indexOf(" ");
    if (idx >= 0)
    {
        eissn = eissn.substr(idx);
        eissn = eissn.replace('*','');
    }
//---URL-Feld "4085" , Inhalt nach url, mehrere aneinander
    url = "";
    if(_rec["009Q"])
    {
        url = _rec["009Q"][0]["u"][0];
    }
    else
    {
        __zdbError("Die URL (4085) fehlt.");
        return false;
    }

//---Feld "4025" , Inhalt nach volume1
    volume1 = "";
    if(_rec["031@"])
    {
        volume1 = _rec["031@"][0]["a"][0];
    }

//---Feld "5080" , Inhalt nach notation
    if(_rec["045U"])
    {
        for(var i in _rec["045U"][0]["e"]){
            // ruft ddc-ezb konkordanz
            _ezb = __EZBNota(_rec["045U"][0]["e"][i]);
            for(var x in _ezb) {
                _ezbnota.push(_ezb[x]);
            }
        }
        _ezbnota = __zdbArrayUnique(_ezbnota);
    }

//---Druckausgabe: reziproke Verknüpfung und Druck-ISSN
    var f0600 = application.activeWindow.findTagContent("0600",0,false);
    if("" != f0600) 
    {
        ld  = (f0600.match(/ld/g) != null) ? true : false; // code fuer layoutgetreue Digitalisierung?
    }
    if(_rec["039D"])
    {
        for(var d in _rec["039D"])
        {
            if(__zdbCheckSF("039D","n",d))
            {
                if(_rec["039D"][d]["n"][0] == "Druck-Ausgabe")
                {
                    if(__zdbCheckSF("039D","9",d))
                    {
                        dppn = _rec["039D"][d][9][0];
                        continue;
                    }
                }
            }
            else if(__zdbCheckSF("039D","a",d))
            {
                if(_rec["039D"][d]["a"][0] == "Druckausg.")
                {
                    dppn = _rec["039D"][d][9][0];
                    continue;
                }
            }
        }
    }
    if(dppn)
    {
        winsnap = application.windows.getWindowSnapshot();
        pissn   = __zdbDruckausgabe(dppn,ld);
        application.windows.restoreWindowSnapshot(winsnap);
    }

    if (false == pissn) {
        if (!__zdbYesNo("Eine reziproke Verknüpfung ist nicht möglich. Möchten Sie trotzdem fortfahren?")) {
            return false;
        }
        pissn = "";
    } else {
        pissn = (!pissn) ? '' : pissn.replace('*','');
    }


    EZB_satz =
        "title="     + escape(title)  + "&publisher="  + escape(publisher)
                     + "&eissn="      + eissn   + "&pissn="      + pissn
                     + "&zdb_id="     + _rec["006Z"][0][0][0]  + "&url="        + escape(url)
                     + "&volume1="    + escape(volume1);

    for(var i in _ezbnota){
        EZB_satz += "&notation[]=" + _ezbnota[i];
    }
    EZB_satz +=	"&charset=utf8";
    EZB_satz +=	"&bibid="+bibid;
    EZB_satz = EZB_satz.replace(/ /g,"%20");
    application.shellExecute(dbformUrl+EZB_satz,5,"open","");
//	4 bedeutet ja und nein; 6=ja 7=nein
    if (__zdbYesNo (
                "Falls nicht automatisch Ihr Browser mit der EZB-Darstellung\n"
            + "in den Vordergrund kommt, wechseln Sie bitte in den Browser\n"
            + "und kontrollieren die Übereinstimmung Ihrer Aufnahme mit dem\n"
            + "im Browser gezeigten Titel.\n\n"
            + "Ist die EZB-Aufnahme korrekt und soll die Frontdoor-url\n"
            + "eingetragen werden?") ) {
    //	Press the "Korrigieren" button
        application.activeWindow.command("k d", false);
        if (application.activeWindow.status != "OK") {
            __zdbMsg("Sie sind nicht berechtigt, den Datensatz zu ändern.");
            return false;
        }
    //	Go to end of buffer without expanding the selection
        application.activeWindow.title.endOfBuffer(false);
    //	EZB-Frontdoor einfügen
        application.activeWindow.title.insertText("4085 =u " + frontDoor);
        application.activeWindow.title.insertText(_rec["006Z"][0][0][0].substr(0,_rec["006Z"][0][0][0].length-2));
        application.activeWindow.title.insertText("=x F");
    //	Press the <ENTER> key
        application.activeWindow.simulateIBWKey("FR");

    //	Dokumenttyp  8A: korrekt, MT: Fehler
        if (application.activeWindow.getVariable("scr") != "8A") {
            __zdbMsg("Die Korrektur des Titel ist fehlgeschlagen. Bitte holen"
                    + "Sie dies direkt über die WInIBW nach.");
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
function __zdbGetRecord(format,extmode){

    var scr = __zdbCheckScreen(["7A","8A"],"Parallelausgabe");
    if(false == scr) return false;
    
    var satz = null;
    
    if ( (format != "P") && (format != "D") ) {
        __zdbError("Funktion getRecord mit falschem Format \"" + format
                    + "\"aufgerufen.\n"
                    + "Bitte wenden Sie sich an Ihre Systembetreuer.");
        return false;
    }
    if (scr == "7A") {
        if (!__zdbCheckKurztitelAuswahl())	return false;
    }
    application.activeWindow.command("show " + format, false);
    if (extmode) {
        satz = __zdbGetExpansionFromP3VTX();
    } else {
        satz = application.activeWindow.copyTitle();
        //satz = satz.replace(/\r/g,"");
    }
    if (scr == "7A")
        application.activeWindow.simulateIBWKey("FE");
    else 
    if (format == "P")
        application.activeWindow.command("show D",false);
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
function __zdbError(msgText){
    __zdbMsg(msgText,"e");
    return;
}

function __zdbYesNo(msgtxt){
    var prompter = utility.newPrompter();
    var button;
    button = prompter.confirmEx(messageBoxHeader,msgtxt,"Ja","Nein",null,null,null);
    //prompter = null;
    return !button;
}


function __zdbMsg(msgText,iconChar){
    var messageBoxHeader;
    var icon;
    switch (iconChar) {
        case "a":	icon = "alert-icon";
                    messageBoxHeader = "Achtung!"; // cs 15.07.10
                    break;
        case "e":	icon = "error-icon";
                    messageBoxHeader = "Fehler!"; // cs 15.07.10
                    break;
        case "q":	icon = "question-icon";
                    messageBoxHeader = "Frage:"; // cs 15.07.10
                    break;
        default: 	icon = "message-icon";
                    messageBoxHeader = "Meldung!"; // cs 15.07.10
                    break;
    }
        application.messageBox(messageBoxHeader,msgText,icon);
        return;
}


function __zdbCheckKurztitelAuswahl() {

    application.activeWindow.simulateIBWKey("FR");
    if (__zdbYesNo("Sie haben das Skript aus der Kurztitelliste aufgerufen.\n"
                + "Zur Sicherheit:\n\n"
                + "Ist dies der gewünschte Datensatz?"))		return true;
    //application.activeWindow.simulateIBWKey("FE");
    return false;
}


function __zdbGetExpansionFromP3VTX(){
    satz = application.activeWindow.getVariable("P3VTX");
    satz = satz.replace("<ISBD><TABLE>","");
    satz = satz.replace("<\/TABLE>","");
    satz = satz.replace(/<BR>/g,"\n");
    satz = satz.replace(/^$/gm,"");
    satz = satz.replace(/^Eingabe:.*$/gm,"");
    satz = satz.replace(/^Mailbox:.*$/gm,"");
    satz = satz.replace(/<a[^<]*>/g,"");
    satz = satz.replace(/<\/a>/g,"");
    satz = satz.replace(/\r/g, "\n");
    satz = satz.replace(/\u001b./g,""); // replace /n (Zeilenumbruch) entfernt,
    // weil hier die $8 Expansion durch Zeilenbruch abgetrennt wurde
    return __zdbUnescapeHtml(satz);
}
/**
 * Replaces HTML escaped chars to unescaped
 * @param {string} text with html escaped chars
 * @return {string} text with unescaped chars
 */ 
function __zdbUnescapeHtml(text){
    var map = {
        '&amp;' : '&',
        '&lt;' : '<',
        '&gt;': '>',
        '&quot;' : '"',
        '&#039;' : "'",
        '&nbsp;' : " "
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&nbsp;/g, function(m) { return map[m]; });
}

function __zdbArrayUnique(a){
    var r = new Array();
    o:for(var i = 0, n = a.length; i < n; i++)
    {
            for(var x = 0, y = r.length; x < y; x++)
            {
                if(r[x]==a[i]) continue o;
            }
            r[r.length] = a[i];
    }
    return r;
}

/**
* Liest ZDBID aus Vollanzeige oder Editiermodus
* @param {string} idn optional
* @return {string}|{bool} ZDBID or false
*/ 
function __zdbGetZDB(idn) {
    var zdbid;
    idn = typeof idn !== 'undefined' ? idn : false;
    if(idn) // get zdb id of a different title in a work window
    {
        var myWindowId = __zdbOpenWorkWindow();
        application.activeWindow.commandLine("\zoe idn "+idn);
    }
    //var strScreen = application.activeWindow.getVariable("scr");
    var strScreen = __zdbCheckScreen(["8A","MT","IT"],"Merke ZDBID");
    if(false == strScreen) return false;
    // set the right category
    var map = {
        "D" : "2110",
        "DA" : "2110",
        "P" : "007G"
    };
    var format = application.activeWindow.getVariable("P3GPR");
    var cat = map[format];
    
    if("P" != format)
    {
        // Korrekturmodus
        if (strScreen == "MT" || strScreen == "IT")
        {
            zdbid = application.activeWindow.title.findTag(cat,0,false,false,true);
        }
        else 
        {
            zdbid = application.activeWindow.findTagContent(cat,0,false);
        }
    }
    else
    {
        var _field;
        // Korrekturmodus
        if (strScreen == "MT" || strScreen == "IT")
        {
            _field = __parseField(application.activeWindow.title.findTag(cat,0,true,false,true));
            zdbid = _field[cat][0];
        }
        else 
        {
            _field = __parseField(application.activeWindow.findTagContent(cat,0,true));
            zdbid = _field[cat][0];
        }
    }
    
    if(idn) // close work window and return to old
    {
        __zdbCloseWorkWindow(myWindowId);
    }
    return zdbid;
}
/**
* opens a new window for temporary works
*/ 
function __zdbOpenWorkWindow(){
    var myWindowId = application.activeWindow.windowID;
    application.newWindow();
    return myWindowId;
}
/**
* closes the window for temporary works and return to the old one
*/ 
function __zdbCloseWorkWindow(myWindowId){
    if(myWindowId == null) return false;
    application.activeWindow.close();
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
*/
function __zdbParseExpansion(exp){
    var matches;
    var split;
    var _exp = {};
    matches = exp.match(/^(?:--[^-]+--)(.+)?:\s(?:\[)?([^\]]+)(?:\])?$/);
    //Normdaten
    if(matches[1])
    {
        _exp.norm = {};
        split = matches[1].split("$");
        for(var i = 0; i < split.length; i++)
        {
            if(0 == i)
            {
                _exp.norm.a = split[i];
            }
            else
            {
                _exp.norm[split[i][0]] = split[i].slice(1);
            }
        }
    }
    // Titel
    _exp.tit = matches[2];
    return _exp;
}

/**
* Expansion object to RDA fields
* @param {object} object created from __zdbParseExpansion()
* @return {string} RDA fields
*/ 
function __zdbExpansionToText(e){
    var text = "";
    if(e.norm)
    {
        text = "$l"+e.norm.a;
    }
    return text += "$t"+e.tit;
}

/**
* Liest ein Feldinhalt in ein Object
* Bsp.:
* 039E ƒbfƒaFortsetzung vonƒ9942987667ƒ8--Cbvz--Deutsche Zentralbücherei für Blinde zu Leipzig: DZB-Nachrichten
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
* 017A ƒaeeƒamgƒanw wird zu
* {
*   "017A":
*   {
*       "a": ["ee","mg","nw"]
*   }
* }
* Zugriff: obj['017A']['a'][0] --> "ee"
* Zugriff: obj['017A']['a'][1] --> "mg"
*/
function __zdbParseField(field){
    var _field = {};
    var arr = field.match(/^([^\s]+)\s(.+)/);
    var split = arr[2].split(delimiter);
    var subfield = {};
    for(var x = 1; x < split.length; x++)
    {
        if(subfield[split[x][0]])
        {
            subfield[split[x][0]].push(split[x].slice(1));
        }
        else
        {
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
function __zdbJSON(idn){
    _rec = {};
    idn = typeof idn !== 'undefined' ? idn : false;
    
    // save format
    var format = application.activeWindow.getVariable("P3GPR");
    
    if(idn) // get zdb id of a different title in a work window
    {
        var myWindowId = __zdbOpenWorkWindow();
        application.activeWindow.command("\zoe idn "+idn,false);
    }

    if("P" != format) application.activeWindow.command("s p",false);
    
    var line, tmp, key;
    var rec = __zdbGetExpansionFromP3VTX();
    
    // get array of lines
    var arrLines = rec.match(/(.+)/gm);
    
    // for each line
    for(var i in arrLines)
    {
        _line = __zdbParseField(arrLines[i]);
        
        // key is the category
        for(var key in _line)
        {
            // if key already exists
            if(key in _rec)
            {
                _rec[key].push(_line[key]);
            }
            else // key does not exist
            {
                // always create an array
                _rec[key] = [_line[key]];
            }
        }
    }
    
    // back to source format
    if("P" != format) application.activeWindow.command("s "+format,false);
    
    if(idn) // close work window and return to old
    {
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
function __zdbCheckScreen(options,header,message){
    
    var map = {
        "8A" : "Vollanzeige",
        "7A" : "Trefferliste",
        "MT" : "Editiermodus",
        "IT" : "Titelneuaufnahme",
        "IE" : "Exemplarneuaufnahme",
        "00" : "Loginmaske",
        "GN" : "Setansicht",
        "SC" : "Indexansicht",
        "FI" : "Datenbankinfo",
        "FS" : "Bestandsauswahl"
    };
    var strScreen = application.activeWindow.getVariable("scr");
    var opt = options.join('#');
    if(opt.indexOf(strScreen) < 0)
    {
        var arr = [];
        for(var e in map)
        {
            if(opt.indexOf(e) > -1) arr.push(map[e]);
        }
        var list = arr.join(", ");
        message = typeof message !== 'undefined' ? message : "Die Funktion kann nur aus "+ list +" aufgerufen werden.";
        application.messageBox(header,message, "alert-icon");
        return false;
    }
    return strScreen;
}

function __zdbArrayDiff(a1, a2){
    for (var i = 0; i < a2.length; i++) {
        for(var y = 0; y < a1.length; y++)
        {
            if (a2[i] === a1[y])
            {
                a1.splice(y,1);
            }
        }
    }
    return a1;
}

/**
* Check if subfield exists
* @return {bool}
*/ 
function __zdbCheckSF(kat,sf,i){
    i = typeof i !== 'undefined' ? i : 0;
    if(!_rec[kat]) return false;
    if(!_rec[kat][i][sf]) return false;
    return true;
}