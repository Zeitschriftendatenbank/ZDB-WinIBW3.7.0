//Datei:	datenmasken.js
//Autor:	Karen Hachmann, GBV
//Datum:	September 2005
//Änderung: September 2009, neu: Ko
//			02.2012: Anpassungen für GND
//			11.2012: Bei den Datenmasken wird jetzt 0500 / 005 in der ganzen Datei gesucht.
//			06.2013: Carsten Klee angepasst für ZDB
//			06.2015: Carsten Klee angepasst für ZDB

function Datenmasken_bearbeiten()
{
    open_xul_dialog("chrome://ibw/content/xul/gbv_datenmasken_dialog.xul", null);
}

function __DatenmaskeEinfuegen(maskenNr)
{
    var theFileInput = utility.newFileInput();
    var thePrompter = utility.newPrompter();
    var antwort, dasKommando = "", kommandoTitel, kommandoNorm;
    var strSystem;
    var theLine;
    var titel;
        fileName= "\\datenmasken\\" + maskenNr + ".txt";

    //Kommandos zum Eingeben von Titeln und Normdaten
    kommandoTitel = "\\inv 1";
    kommandoNorm = "\\inv 2";

    // Datenmaskendatei im Verzeichnis profiles\<user>\datenmasken oeffnen:
    if (!theFileInput.openSpecial("ProfD", fileName)) {
        if (!theFileInput.openSpecial("BinDir", fileName)) {
            application.messageBox("Exemplar anhängen","Datei für Datenmaske " + fileName + 
                " wurde nicht gefunden.", "error-icon");
            return;
        }
    }
    // 15.11.12: 0500 / 005 wird im ganzen Datensatz gesucht:
    var datenmaskenZeile = "";
    for (titel = ""; !theFileInput.isEOF(); ) {
        datenmaskenZeile = theFileInput.readLine() + "\n";
        if (datenmaskenZeile.substr(0,4) == "0500"){
            dasKommando = kommandoTitel;
        }
        if (datenmaskenZeile.substr(0,4) == "005 "){
            dasKommando = kommandoNorm;
        }
        titel += datenmaskenZeile;
    }
    theFileInput.close();
    var editing = (application.activeWindow.title != null);
    
    strSystem = application.activeWindow.getVariable("system");
    if (strSystem == "ACQ" || strSystem == "OUS"|| strSystem == "OWC"){
        //wir sind im LBS:
        dasKommando  = "\\inv";
    } else {
        //wir sind im CBS:
        //wenn kein Editierschirm und Materialart / Kommando noch unbekannt:
        if (!editing && dasKommando == "") {
            //wenn weder 0500 noch 005 vorkommt, muss er Benutzer nun entscheiden:
            antwort = thePrompter.select("Feld 0500 / 005 fehlt in Datenmaske", "Wollen Sie Titel- oder Normdaten erfassen?", "Titeldaten\nNormdaten");
            if (!antwort) {
                // Benutzer hat den Dialog abgebrochen:
                return;
            }
            if (antwort == "Titeldaten") {
                dasKommando = kommandoTitel
            } else if (antwort == "Normdaten") {
                dasKommando = kommandoNorm
            }
        }
    }

    if (dasKommando == "") {
        // The data is inserted in the edit window at the cursor position.
        // The "++" is not removed (as in maskeEinfuegen), because the data already present 
        // might contain this.
        application.activeWindow.title.insertText(titel);
        return;
    }		
    
    //wenn editing = true, dann wird das Kommando in neuem Fenster ausgeführt
    application.activeWindow.command(dasKommando, editing);
    
    // Eingeben oder Abbruch, falls kein titleedit vorliegt:
    if (application.activeWindow.title) {
        __maskeEinfuegen(titel);
    } else {
        application.messageBox("Fehler", "Datenmaske kann jetzt nicht eingefügt werden!", "error-icon");
        return;
    }
}

function __maskeEinfuegen(titel)
{
    //Datenmaske einfügen:
    application.activeWindow.title.insertText(titel);
    application.activeWindow.title.startOfBuffer(false);
    var suchePlus = application.activeWindow.title.find("++", false, false, true);

    if (suchePlus == true){
        //Entfernen der Plusse, der Cursor bleibt hier stehen:
        application.activeWindow.title.deleteSelection();
    }
}

function Datenmaske1()
{
    __DatenmaskeEinfuegen("maske01");
}
function Datenmaske2()
{
    __DatenmaskeEinfuegen("maske02");
}
function Datenmaske3()
{
    __DatenmaskeEinfuegen("maske03");
}
function Datenmaske4()
{
    __DatenmaskeEinfuegen("maske04");
}
function Datenmaske5()
{
    __DatenmaskeEinfuegen("maske05");
}
function Datenmaske6()
{
    __DatenmaskeEinfuegen("maske06");
}
function DatenmaskeAdxz()
{
    __DatenmaskeEinfuegen("maskeAdxz");
}
function DatenmaskeOdxz()
{
    __DatenmaskeEinfuegen("maskeOdxz");
}
// Neu GND seit 2012.02:

function DatenmaskeTb()
{
    __DatenmaskeEinfuegen("maskeTb");
}
function DatenmaskeTbkurz()
{
    __DatenmaskeEinfuegen("maskeTbkurz");
}
function DatenmaskeTc()
{
/*---------------------------------------------------------------------------------

2011-11-24	 gr	 Angepasst für GND

---------------------------------------------------------------------------------*/
    var boxtit = "Datenmaske Tc (CrossKonkordanz)";
    var strSWDIDN = application.activeWindow.getVariable("P3GPP");
    var strMat = application.activeWindow.materialCode;
    var tag065 = __katEinlesen("065");

    if (("Ts Tg").indexOf(strMat) == -1) {
        __gndError(boxtit,"Skript kann nur aus einem Ts- oder Tg-Satz ausgelöst werden!");
        return(false);
    }
    __DatenmaskeEinfuegen("maskeTc");
    //übernommenen Ländercode einfügen	
    if (tag065 != "") {
        var str065 = tag065[0].substr(4);
        application.activeWindow.title.startOfBuffer(false);
        application.activeWindow.title.findTag("065", 0, false, true, false);
        application.activeWindow.title.endOfField(false);
        application.activeWindow.title.insertText(str065);
    }

    //übernommene IDN einfügen
    application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.findTag("190", 0, false, true, false);
    application.activeWindow.title.endOfField(true);
    application.activeWindow.title.insertText("!" + strSWDIDN + "!");

    //zur weiteren Bearbeitung nach 011 gehen
    application.activeWindow.title.startOfBuffer(false);
    application.activeWindow.title.findTag("011", 0, false, true, false);
    application.activeWindow.title.endOfField(true);
}
function DatenmaskeTf()
{
    __DatenmaskeEinfuegen("maskeTf");
}
function DatenmaskeTg()
{
    __DatenmaskeEinfuegen("maskeTg");
}
function DatenmaskeTp()
{
    __DatenmaskeEinfuegen("maskeTp");
}
function DatenmaskeTpdiss()
{
    __DatenmaskeEinfuegen("maskeTpdiss");
}
function DatenmaskeTs()
{
    __DatenmaskeEinfuegen("maskeTs");
}
function DatenmaskeTs3e()
{
    __DatenmaskeEinfuegen("maskeTs3e");
}
function DatenmaskeTu()
{
    __DatenmaskeEinfuegen("maskeTu");
}
function DatenmaskeTndiss()
{
    __DatenmaskeEinfuegen("Tndiss");
}
function DatenmaskeTn()
{
    __DatenmaskeEinfuegen("maskeTn");
}
function DatenmaskeTcx()
{
    __DatenmaskeEinfuegen("maskeTcx");
}
//-------------------------------------
function DatenmaskenAlle()
{
    // neu seit Version WinIBW3.3: Auswahlliste zum Anwenden aller Datenmasken (Standard und eigene):
    open_xul_dialog("chrome://ibw/content/xul/moreDatenmasken_dialog.xul", null);
}

/**
* Diese Funktion kann mit einem Nutzerscript genutzt werden. Bsp:
* 
*  function maskeObxz(){
*    application.writeProfileString("zdb.userdata", "maske", "Obxz");
*    application.callStdScriptFunction("zdb_nutzerMaske");
*    }
*/
function zdb_nutzerMaske() {
    var maskenNr = application.getProfileString("zdb.userdata", "maske", "");
    __DatenmaskeEinfuegen(maskenNr);
}