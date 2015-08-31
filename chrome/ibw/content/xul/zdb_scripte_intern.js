// Datei:		zdb_scripte_intern.js

/**
 * zählt Exemplardatensätze
 * 
 * @return int|null
 */ 
function __exemplareAnzahl(){
    var strTitle =  application.activeWindow.copyTitle();
    var regexpExe = /\n(70[0-9][0-9])/g;
    var alleExe = new Array();
    alleExe = strTitle.match(regexpExe);
    //application.messageBox("", alleExe.length, "message-icon");
    return (!alleExe) ? null : alleExe.length;
}

/**
* iteriert durch Exemplare und ruft für jedes Exemplar eine Funktion auf
*/
function __iterateExemplare(callback){
    var exCount = __exemplareAnzahl();
    for(var i = 1; i <= exCount; i++)
    {
        callback(i);
    }
}

//--------------------------------------------------------------------------------------------------------
//name:		__zdbGetParallel
//description:	Liefert ein Objekt über die Parallelausgaben zurueck
//user:	  	all users
//author: 		Carsten Klee
//date:		2014-03-24
//--------------------------------------------------------------------------------------------------------

function __zdbGetParallel(){
    var scr = __zdbCheckScreen(["MT","8A"],"Parallelausgabe");
    if(false == scr) return false;
    var tag, content,regex,matches;
    var contents = new Array();
    var i = 0;
    var vortext = /Online-Ausg|Druckaus/;
    var parallel = new Object();

    if(application.activeWindow.getVariable("P3GDB").match(/P|PA/i))
    {
        tag = "039D";
        regex = new RegExp(delimiterReg+"a([^"+delimiterReg+"]*)"+delimiterReg+"9([^"+delimiterReg+"]*)");
    }
    else if(application.activeWindow.getVariable("P3GDB").match(/D|DA/i))
    {
        tag = "4243";
        regex = /([^!]*)!([^!]*)/;
    }
    
    if("MT" == scr)
    {
        while((content = application.activeWindow.title.findTag(tag,i,false,false,false)) != "")
        {
            contents[i] = content;
            content = "";
            i++;
        }
    }
    else("8A" == scr)
    {
        while((content = application.activeWindow.findTagContent(tag,i,false)) != "")
        {
            contents[i] = content;
            content = "";
            i++;
        }
    }
    
    for(var x = 0; x < contents.length; x++)
    {
        if(vortext.test(contents[x]))
        {
            matches = regex.exec(contents[x]);
            parallel[x] = {votext:matches[1],idn:matches[2]};
        }
    }
    return (parallel[0]) ? parallel : false;
}

//--------------------------------------------------------------------------------------------------------
//name:		__zeigeEigenschaften
//replaces:		zeigeEigenschaften
//description:	listing a objects properties
//user:	  	developers
//input: 		the object
//return:		messageBox with all properties
//author: 		Carsten Klee
//date:		2011-06-24
//version:		1.0.0.1
//--------------------------------------------------------------------------------------------------------

function __zeigeEigenschaften(object){
    var Namen = new Array();
    var namen = "";
    var type;
    // make a properties list for the prompter
    //for(var name in object) namen += name + "\n";
    for(var name in object) Namen.push(name);
    
    // get out if objects count zero prperties
    if (Namen.length == 0)
    {
        application.messageBox("Länge des Objekts", "Das Objekt hat " + Namen.length + " Eigenschaften.", false);
        return;
    }
    Namen.sort();
    namen = Namen.join("\n");

    // initialize the prompter
    var thePrompter = utility.newPrompter();
    thePrompter.setDebug(true); // only for debugging
    
    // get the selection as string
    var theAnswer = thePrompter.select("Eigenschaften von " + object, "Zeige Eigenschaften von", namen);
    // return if nothing have been selected
    if (!theAnswer) {
        return;	
    } else {
        // eval the answer as an object
        var newObject = eval(object[theAnswer]);
        type = typeof newObject;
        application.messageBox("Typ des Objects", type, false);
        if(type == "object"){
            __zeigeEigenschaften(newObject);
        }
        try {
            if(type == "function")
            {
                application.messageBox("Eigenschaften",newObject.toString() + "\nWeitere Eigenschaften anzeigen?",false);
                __zeigeEigenschaften(newObject);
                return;
            }
            else // strings, integers
            {
                application.messageBox("Eigenschaften", newObject.toString(), false);
            }
        }
        catch(exception)
        {
            application.messageBox("Fehler",exception,false);
        } 
        finally
        {
            return;
        }
    }
}

function zdbFIDcsv(){
    const params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
    .createInstance(Components.interfaces.nsIDialogParamBlock);
    params.SetNumberStrings(5);
    params.SetString(0,"pa");
    open_xul_dialog("chrome://ibw/content/xul/ZDB_FID_dialog.xul", null,params);
    // on cancel
    if(params.GetString(1) == "cancel") {
        return;
    }
    
    var csv = new CSV();
    var file = params.GetString(1);
    csv.delimiter = params.GetString(2);
    var start = parseInt(params.GetString(3));
    var zdbid = parseInt(params.GetString(4));
    zdbid = zdbid-1;
    params = null;
    var lineArray;
    var zdbids = new Array();
    
    // load file object
    var theFileInput = utility.newFileInput();
    if (!theFileInput.open(file))
    {
      alert("Datei " + file + " wurde nicht gefunden.");
      return false;
    }
    var prompter = utility.newPrompter();
    if(prompter.confirm("Set erstellen","Erstelle ein Set anhand der Datei " + file+ ". Melde mich wieder, wenn ich fertig bin."))
    {
        // read the start line
        var aLine = "";
        var i = 1;
        var x = 0;
        while( (aLine = theFileInput.readLine()) != null)
        {
            if("" == aLine) continue;
            if(start <= i)
            {
                lineArray = csv.__csvToArray(aLine);
                zdbids[x] = lineArray[zdbid];
                x++;
            }
            i++;
        }
        theFileInput.close();
        
        application.activeWindow.command("del s0",false);
        var parallel = new Array();
        for(var y = 0; y < zdbids.length; y++)
        {
            application.activeWindow.command("f zdb " + zdbids[y],false);
            var tinumber = application.activeWindow.getVariable("P3GTI");
            application.activeWindow.command("sav " + tinumber,false);
            if(parallel = __zdbGetParallel())
            {
            
                for(var o in parallel)
                {
                    application.activeWindow.command("f idn " + parallel[o].idn,false);
                    var tinumber = application.activeWindow.getVariable("P3GTI");
                    application.activeWindow.command("sav " + tinumber,false);
                }
            }
        }
        application.activeWindow.command("s s0",false);
        if(prompter.confirm("Set erstellt","Fertig! Habe Set erstellt. Soll das Excel-Skript zum Download geöffnet werden?"))
        {
            var xulFeatures = "centerscreen, chrome, close, titlebar,modal=no,dependent=yes, dialog=yes";
            open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul", xulFeatures,params);
        }
    }
    else
    {
        prompter.alert("Abbruch","Habe Vorgang abgebrochen.")
    }
    
}

function zdbFIDset(){
    var currentSet = application.activeWindow.getVariable("P3GSE");
    var setSize = application.activeWindow.getVariable("P3GSZ");
    var prompter = utility.newPrompter();
    //Ergänzung GBV: Wenn in Set0 ausgeführt, wird das Exceltool aufgerufen.
    if (currentSet == 0){
        open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul");
        return;
    }    
    if(prompter.confirm("Set erstellen","Erstelle ein Set anhand des Sets " + currentSet + " mit " + setSize + " Titeln. Melde mich wieder, wenn ich fertig bin."))
    {
        application.activeWindow.command("del s0",false);
        var parallel = new Array();
        i = 1;
        do {
            
            application.activeWindow.command("s s" + currentSet + " " + i,false);
            var tinumber = application.activeWindow.getVariable("P3GTI");
            application.activeWindow.command("sav " + tinumber,false);
            if(parallel = __zdbGetParallel())
            {
                for(var o in parallel)
                {
                    application.activeWindow.command("f idn " + parallel[o].idn,false);
                    var tinumber = application.activeWindow.getVariable("P3GTI");
                    application.activeWindow.command("sav " + tinumber,false);
                }
            }
            i++;
            
        } while (i <= setSize)
        
        application.activeWindow.command("s s0",false);
        if(prompter.confirm("Set erstellt","Fertig! Habe Set erstellt. Soll das Excel-Skript zum Download geöffnet werden?"))
        {
            open_xul_dialog("chrome://ibw/content/xul/ZDB_excelFID_dialog.xul");
        }
    }
    else
    {
        prompter.alert("Abbruch","Habe Vorgang abgebrochen.")
    }
    
}

function csvBatchTitel(){
    var csv = new CSV();
    csv.__csvBatchTitle = function ()
    {
        var codes = "";
        var fields = new Array("0600","0601");
        var values = new Array(csv.code,csv.isil);
        application.activeWindow.command("k", false);
        for(var f in fields){
            // we don't want empty fields
            if(fields[f] != "") 
            {
                //	check if field alredy exists
                    if((codes = application.activeWindow.title.findTag(fields[f], 0, false, true, false)) == false)
                    {
                //		move cursor to the end of the buffer
                        application.activeWindow.title.endOfBuffer(false);
                //		insert a new field with the params value
                        application.activeWindow.title.insertText(fields[f] + " " + values[f] + "\n");
                //	field does already exist		
                    }
                    else
                    {
                        var codeFalse = 0;
                        // check field  if code is already in it
                        var code = codes.split(";");
                        for(var y in code){
                            if(code[y].replace (/^\s+/, '').replace (/\s+$/, '') == values[f].replace (/^\s+/, '').replace (/\s+$/, '')){ // replace leading an following whitespaces
                                csv.__csvLOG("Zeichenkette " + values[f] + " war schon im Feld " + fields[f] + " vorhanden.");
                                codeFalse = 1;
                            }
                        }
                        // if code is not already in field
                        if(codeFalse == 0) {
                            application.activeWindow.title.endOfField(false);
                        //		insert params value
                                    
                            application.activeWindow.title.insertText(";" + values[f]);
                        }
                    }
            } 
            else
            {
                //do nothing
            }
        }
        //			save buffer		
            return csv.__csvSaveBuffer(true,"hinzugefuegt " + values[f]);
    }
    
    csv.__csvSetProperties(csv.__csvBatchTitle,["","ZDB-ID"],'ZDB-ID','zdb',false,"ZDB_LOG.txt");
    try
    {
        csv.__csvConfig();
        csv.__csvBatch();
    } 
    catch(e)
    {
        csv.__csvError(e);
    }
}

function excelTabelle(){
    var xulFeatures = "centerscreen, chrome, close, titlebar,modal=no,dependent=yes, dialog=yes";
    open_xul_dialog("chrome://ibw/content/xul/gbv_excelTabelle_dialog.xul", xulFeatures);
}

function ZDBWinIBWInfo(){
    application.shellExecute ("http://www.zeitschriftendatenbank.de/erschliessung/winibw/winibw-3/", 5, "open", "");
}

function WinIBWSupport(){
    application.shellExecute ("mailto:zdb-winibw@sbb.spk-berlin.de?subject=[WinIBW 3.7.0] ", 5, "open", "");
}

function zdbformat(){
    if (!application.activeWindow.title)
    {
        application.shellExecute ("http://www.zeitschriftendatenbank.de/erschliessung/arbeitsunterlagen/zdbformat/", 5, "open", "");
    }
    else
    {
        var strkat = application.activeWindow.title.tag;
        application.shellExecute ("http://www.zeitschriftendatenbank.de/erschliessung/arbeitsunterlagen/zdbformat/" + strkat + "/", 5, "open", "");
    }
}

function sucheErsetze(){
    var xulFeatures = "centerscreen, chrome, close, titlebar,resizable, modal=no, dependent=yes, dialog=no";
    open_xul_dialog("chrome://ibw/content/xul/gbv_sucheErsetze_dialog.xul", xulFeatures);
}

/**
* Scherer Birgit, BSZ
* 10.04.2012
*/
function tf_vollenden()
{
    var katString;
    var temp;	
    var pos=0;
    var strCounter=0;
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
    pos = temp.indexOf(delimiter+"d");
    if ((pos > 0) && (temp.length > pos+2)) {
        temp = temp.substring(pos+2);
    }
    
    //** Eine Jahreszahl muss vorhanden sein. Deshalb die unsaubere Programmierung. **
    
    // Falls $c vorhanden, dann nur den Inhalt *bis* $c verwenden
    var pos1 = temp.indexOf(delimiter+"c");
    var pos2 = temp.indexOf(delimiter+"g");
    
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
        temp = temp.substring(0,pos);
        //..und der Datumsstring keinen Bindestrich enthaelt.
        if (temp.indexOf("-") <= 0) {
            temp = delimiter+"c" + temp;
        }
    }
    
    
    
    // Enthaelt das Ergebis zwei Jahreszahlen, getrennt durch Bindestrich,
    // ist der Zielwert durch $b zu trennen.
    if (temp.indexOf("-") > 0) {
        
        // Leerzeichen mehrfach durch nichts ersetzen, da es kein allg. replaceAll gibt.
        temp = temp.replace(" ", "");
        temp = temp.replace(" ", "");
        
        // Sonderfall: Kein Endedatum, String endet mit Bindestrich
        if (temp.charAt(temp.length-1) == "-")
            temp = temp.replace("-" , "");
        
        temp = temp.replace("-", delimiter+"b");
    }
        
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("\n548 " + temp + delimiter+"datv");
    
        
    
    //-------------------------------------------
    // Behandlung der Veranstaltungsorte ($c)
    //-------------------------------------------
        
    var ppn="";
        
    temp = katString;  // Urspruenglichen Kategoriestring in temp einspeichen
    
        
    //-- Erstes $c suchen und den String danach mit split aufteilen (in ein Orte-Array)
    
    pos = temp.indexOf(delimiter+"c");
    if ((pos > 0) && (temp.length > pos+2)) {
        temp = temp.substring(pos+2);
        
        //_showMessage("$c ist vorhanden");
        
        // Falls noch $g vorkommt
        pos = temp.indexOf(delimiter+"g");
        if (pos > 0) {
            temp = temp.substring(0,pos);
        }

        var ortArray = temp.split("; ");
        var anzOrte = ortArray.length;
        var ort;
        var winId;

        // Win-ID des aktiven Fensters (fuer die spaetere Reaktivierung)
        edit_winId = application.activeWindow.windowID;

        // Array leeren
        search_winIdArray.length = 0;
        search_ortArray.length = 0;
        
        // Hochzaehlen, nur wenn Suchfenster fuer die Orte angezeigt sind.
        var ortSuchfensterZaehler = 0;  
        var zusatzText = "";
        
        
        // Schleife ueber die Orte (gelistet im Editfenster)
        for (var i=0; i<anzOrte; i++) {
            
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
            search_winIdArray.push( winId );
            search_ortArray.push( ort );
            
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
                application.activeWindow.title.insertText("\n551 " + ort + delimiter+"4ortv");
                
                // Eintraege aus den globalen Arrays entfernen.
                // (Relevant bei mehreren Orten/Suchfenstern.)
                search_winIdArray.pop();
                search_ortArray.pop();
                
                // Wechsel zu einem evtl. noch vorhandenen Suchfenster
                if (search_winIdArray.length > 0) {
                    application.activateWindow( search_winIdArray[search_winIdArray.length-1] )
                }				
            }			
            else { // Es gibt Treffer -> zwei Faelle
                if (strCounter == 1) {
                    // Fall 1: Genau ein Treffer
                    //application.messageBox("", "Treffer: " + strCounter, "");
                    
                    ppn = application.activeWindow.getVariable("P3GPP");
                    
                    application.activeWindow.closeWindow();  // Schliessen des Suchfensters
                    application.activateWindow(edit_winId);  // Editfenster aktivieren
                    application.activeWindow.title.insertText("\n551 !" + ppn + "!"+delimiter+"4ortv");								
                    
                    // Eintraege aus den globalen Arrays entfernen.
                    // (Relevant bei mehreren Orten/Suchfenstern.)
                    search_winIdArray.pop();
                    search_ortArray.pop();
                    
                    // Wechsel zu einem evtl. noch vorhandenen Suchfenster
                    if (search_winIdArray.length > 0) {
                        application.activateWindow( search_winIdArray[search_winIdArray.length-1] )
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
                    application.activeWindow.title.insertText("\n551 " + ort + delimiter+"4ortv");
                        // Wiederaktivieren des Suchfensters
                    application.activateWindow( winId );
                    
                    
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
function tf_vollenden_fortsetzen()
{
    var anzSuchfenster = search_winIdArray.length;  // Anzahl der geoeffneten Suchfenster
    var ppn;
    var winId;
    
    var flgWinId = true;
    var flg = true;
    var suchZeile;


    //-- Stets nur das letzte Suchfenster 'abarbeiten' (sofern es mehrere gibt).		
    winId = search_winIdArray[anzSuchfenster-1];  // ID des (letzten) Suchfensters
    
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
    suchZeile = "551 " + search_ortArray[anzSuchfenster-1] + delimiter+"4ortv";  // Suchzeile
        // Suche ausfuehren
    flg = application.activeWindow.title.find(suchZeile,false,false,false);

    if (flg) {
        //_showMessage("gefunden");
        application.activeWindow.title.deleteLine(1);  // Zeile loeschen
        //application.activeWindow.title.lineUp(1,false);
        
        //application.activeWindow.title.endOfBuffer(false);
        application.activeWindow.title.insertText("551 !" + ppn + "!"+delimiter+"4ortv\n");
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
        winId = search_winIdArray[ search_winIdArray.length-1 ];
        
        // Die Try-Struktur wird benoetigt, wenn bei zwei Suchfenstern das
        // erst-geoeffnete haendich geschlossen wurde.
        try {
            flgWinId = application.activateWindow(winId);    // Suchfenster aktivieren	
        
            // Im FEHLERFALL abarbeiten
            if (! flgWinId) {
                _showMessage("Fehler mit WinID (Restfenster): " + winId , "vollenden_fortsetzen");
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
function zdbGNDSkripte()
{
    application.shellExecute ("https://wiki.dnb.de/display/ILTIS/GND-WinIBW-Skripte+und+-Datenmasken", 5, "open", "");
}