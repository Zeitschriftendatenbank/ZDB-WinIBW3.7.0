//allgemeine Skripte für #DNB-Extern

/*

2012-10-12 gr neu: zdbReziprok Fehlerkorrektur, Umbenennung in zdb_Reziprok (wie in Prä-GND-Zeiten)

*/

function __feldTest(kat,ind,inh,wdhb) {
/*--------------------------------------------------------------------------------------------------------
__feldTest(kat,ind,inh,wdhb)

Die interne Funktion testet, ob eine (wiederholbare) Kategorie mit einem bestimmten Indikator und Inhalt
vorhanden ist. Als Parameter kat muss die Kategoriebezeichnung übergeben werden. Optional kann auch ein
Indikator (ind) und ein bestimmter Kategorieinhalt (inh) als Parameter mitgegeben werden. Mit dem boolschen
Parameter wdhb kann angegeben werden, ob die Kategorie wiederholt gesucht werden soll.
Folgende Status können je nach Ergebnis zurückgegeben werden:

f  = Feld vorh. aber nicht mit Inhalt, Feld nicht wdhbar
fnw  = Feld vorh., aber nicht mit Inhalt, Feld wdhbar
fnw  = ganzes Feld nicht vorhanden
i  = Feld mit Inhalt vorhanden, oder, wenn kein Inhalt abgefragt, Feld überhaupt vorhanden


Historie:
2010-05-09 Stefan Grund		: erstellt
--------------------------------------------------------------------------------------------------------*/

  if (application.activeWindow.title) {
  application.activeWindow.title.startOfBuffer(false);
  }
  
feld_inh = __katEinlesen(kat);
  
  //Zuerst Prüfung ob Indikator -> alle mit falschem Indikator aus Array raus
  if (feld_inh.length > 0) {
    if (ind != "") {

      for (g = 0; g < feld_inh.length; g++) {
        if (feld_inh[g].substr(5,1) != ind) {
        feld_inh.splice(g,1);
        g--;
        }
      }  
    }
  }  

  if (feld_inh.length > 0) {
  
    //wenn kein Inhalt genannt, soll nur geprüft werden, ob das Feld überhaupt vorhanden ist (irrelevant ob wdhb oder nicht)
    if (inh == "") {
    return "i";
    }
   
    if (wdhb == true) {
  
      for (i = 0; i < feld_inh.length; i++) {
      
        if (feld_inh[i].indexOf(inh) > -1) { // Feld mit gesuchtem Inhalt vorhanden
        return "i";
        }
      }
	//wdhb. Feld vorhanden, aber ohne gesuchten Inhalt  
    return "fnw";   
    } else {  //für nicht wdhb. Felder
 
      if (feld_inh[0].indexOf(inh) > -1) {
      //Feld mit Inhalt vorh.
      
	  return "i";
      } else {
	  //Feld vorh., aber mit anderem Inhalt
      return "f";
      }
    }
 
  } else {
  //Feld gar nicht vorhanden
  return "fnw";
  }

}

function __geheZuKat(kat,ind,append) {
/*--------------------------------------------------------------------------------------------------------
__geheZuKat(kat,ind,append)

Die Funktion geht in einem Datensatz an die Stelle, an der eine bestimmte neue Kategorie/Indikator der
Reihenfolge nach eingefügt werden würde. Übergeben wird als Parameter kat die einzufügende Kategorie
und als ind der Indikator. 

'kat = übergebene einzufügende Kategorie
'ind = übergebener Indikator
'append = true -> ans Ende eines vorhandenen Felds (das erste Vorkommen oder, wenn nicht vorhanden, genau ein Feld davor ans Ende), sonst: Anfang des ersten Feldes oder dort, wo es stehen müsste
'-> append bei noch nicht vorhandenem, einzufügendem Feld immer auf false setzen
'kat_ind = Wert der Kategorie + Indikator
'ta_kat = geprüfte Kategorie der TA (Schleife)
'ta_kat_ind = geprüfte Kategorie der TA + Indikator 

Historie:
2010-01-09 Stefan Grund		: erstellt
2010-09-18 Bernd			: Definitionen ergaenzt

--------------------------------------------------------------------------------------------------------*/
 
var ta_kat_ind;  // Indikator des Feldes der TA, in dem die richtige Position gesucht wird
var kat_ind;     //
var ta_kat;      //Feld der TA, in dem die richtige Position gesucht wird (pro durgegangener Zeile)
//kat -> übergebenes Feld, dessen Postion gesucht werden soll
//ind -> übergebener Indikator des übergebenen Feldes, dessen Postion gesucht werden soll  

application.activeWindow.title.startOfBuffer(false);

  do {

  application.activeWindow.title.lineDown(1, false);
  ta_kat = application.activeWindow.title.tag;
    //das gesuchte Feld wurde gefunden, Indikator ist vorhanden 
    if (ta_kat == kat && ind != "") {
    kat_ind = parseInt(kat) + parseInt(ind.charCodeAt(0));
    ta_kat_ind = parseInt(ta_kat) + parseInt(application.activeWindow.title.currentField.substr(5,1).charCodeAt(0));
      //Prüfung: gesuchte kat ungleich Kat der Zeile oder gesuchte Kat + Indikator größer gleich Kat + Indikator der Zeile
      if (ta_kat != kat || ta_kat_ind >= kat_ind) {
      break;
      }
    }
  } while (ta_kat <= kat && ta_kat != "");        //solange Kat der Zeile kleiner gleich gesuchter kat ist und man nicht am Ende eines Datensatzes ist (zu erkennen daran, dass keine Feldbezeichnung vorhanden ist) 
  
  application.activeWindow.title.startOfField(false);
  
// Cursor ist jetzt entweder im gesuchten Feld, falls vorhanden, oder im nächsthöheren Feld, falls nicht vorhanden 
  if (append == true) {
    //wenn Feld noch nicht vorhanden, ist der Cursor jetzt am Anfang des nächsthöheren Feldes -> muss eins hoch
    if (ta_kat > kat || ta_kat_ind > kat_ind || ta_kat == "") {
    application.activeWindow.title.lineUp(1,false)
    }
  application.activeWindow.title.endOfField(false);
  }
return application.activeWindow.title.currentField;
}

function __katEinlesen(gesKat) {
/*--------------------------------------------------------------------------------------------------------
__katEinlesen(gesKat)

Die Funktion liest alle Vorkommen einer Kategorie in ein Array ein und übergibt dieses Array an die
aufrufende Instanz. Als Parameter gesKat wird die Bezeichnung der gesuchten Kategorie mitgegeben.
Funktioniert sowohl im Editier- als auch im Anzeigebildschirm.
Besser interne Funktion?

Historie:
2008-10-09 Stefan Grund		: erstellt (Skript ursprgl. von H. Schneider (HeBIS))
2011-02-22  gr  Fehler bei mehrzeiligen Feldern beseitigt
--------------------------------------------------------------------------------------------------------*/
var inh,satzlaenge,pos,m,k,katInh;
var m = 1;
var z = 1;
katInh = new Array();

// Bei Normdatensätzen sind die Kategoriennummern nur 3stellig (Norm 0->2, Tit 0->3))

  if (application.activeWindow.materialCode.substring(0,1) == "T") {
  var katLaenge = 2;
  } else {
  var katLaenge = 3;
  }
  
//zum Testen var gesKat = "100";

  //Wenn nicht im Korrekturmodus
  if (!application.activeWindow.title) {
  var satz = application.activeWindow.copyTitle();
  // von Schneider (HeBIS)übernommen...
  satz = satz.replace(/\r/g,"");
  satz = satz + "\n\n";

  var pos = 1;
  
    do {
    var posx = satz.indexOf("\n",pos);
    inh = "";
    kat = satz.substr(pos,"5")

      if (kat.indexOf(gesKat) == 0) {
      katInh.push(satz.substring(pos,posx));
      }    
    
    
    pos = posx+1;
    } while (posx != -1)
  
  } else {
  
  application.activeWindow.title.endOfBuffer(false);
  
  y = parseInt(application.activeWindow.title.currentLineNumber) + 5;
  application.activeWindow.title.startOfBuffer(false);
  //Vgl. mit zeileAlt notwendig für mehrzeilige Felder
  var zeileAlt = "";
    for (i = 0;i < y;i++) {
    zeile = application.activeWindow.title.currentField;
        
      if ((application.activeWindow.title.tag == gesKat) && (zeile != zeileAlt)) {
      katInh.push(zeile);
      }
    zeileAlt = zeile;
    application.activeWindow.title.lineDown(1,false);
    }  
  }
  
return katInh;
}

//****************************************************************
function __makeDate() {
/*--------------------------------------------------------------------------------------------------------
__makeDate()

Die interne Funktion generiert ein Tagesdatum im Format JJJJ-MM-DD.
Mögliche Erweiterung: weitere Datumsformate

Historie:
2010-05-09 Stefan Grund		: erstellt
--------------------------------------------------------------------------------------------------------*/

var jetzt = new Date();
var datum = new Array();
datum[0] = jetzt.getDate();
datum[1] = jetzt.getMonth() + 1;
datum[2] = jetzt.getFullYear();

//Tag und Monat immer zweistellig
for (i=0;i < 2;i++) {
datum[i] = datum[i].toString();
  if (datum[i].length == 1) {
  datum[i] = "0" + datum[i]
  }
}

return datum[2] + "-" + datum[1] + "-" + datum[0];
}

function __getProfVal(boxtit,valname,prompTxt,art) {
/*--------------------------------------------------------------------------------------------------------
/*--------------------------------------------------------------------------------------------------------

Die interne Funktion speichert und liest Werte aus dem Benutzerprofil, die in der Datei user_pref.js 
unter der Variablen <userData.xyz> enthalten sind bzw. dort abgespeichert werden.
Mit dem Parameter valname kann der Name der Variablen angegeben werden. Der Parameter prompText enthält den 
Text der Input-Box, falls der Wert noch nicht existiert. Der Wert der Variablen wird zurückgegeben.

sect =         Section der Preferences (seit 01.04. fix: dnbUser)
valname =      Names des Wertes
prompTxt =     Anzeigetext
art =          Wozu soll die Funktion genutzt werden? "abfr" (default) oder "korr"? Beides impliziert Neuerfassung, wenn noch nicht vorh.

Historie:
2010-05-09 Stefan Grund		: erstellt
2011-04-01 Bernd Althaus	: Section der Preference festgelegt auf dnbUser, da häufig unterschiedliche Werte verwendet wurden!

--------------------------------------------------------------------------------------------------------*/

var sect="dnbUser";
var value = application.getProfileString(sect, valname, "");

  if (!value || art == "korr") {
  value = __dnbPrompter(boxtit,prompTxt,value);
  
    if (value != null) {
    application.writeProfileString(sect, valname, value);
    }
  }

return value;
}

function __dnbPrompter(ttl,txt,dflt) {
/*--------------------------------------------------------------------------------------------------------
__dnbPrompter(ttl,txt,dflt) 

Die interne Funktion oeffnet eine Input-Box und gibt den eingegebenen Wert zurück.
Mit Parameter ttl kann der Text fuer die Titelzeile der Eingabebox uebergeben werden. 
Parameter txt enthaelt den Text der Input-Box und mit dflt kann ein Default-Wert definiert werden.

Historie:
2010-08-09 Stefan Grund		: erstellt
--------------------------------------------------------------------------------------------------------*/
var prompter = utility.newPrompter();
var msg;

	
msg = prompter.prompt(ttl,txt,dflt,null,null);
if (msg == 1)	msg = prompter.getEditValue();
else			msg = null;

return msg;

}	


function __prompterPruef(boxtit,strTxt,werte,dflt) {
/*--------------------------------------------------------------------------------------------------------
__prompterPruef(strtxt,boxtit,werte,dflt)

Die interne Funktion öffnet eine Input-Box und prüft die eingegebenen Werte.
Folgende Parameter können übergeben werden:

boxtit = Überschrift der InputBox
strTxt = Text, der in der InputBox angezeigt werden soll
werte = Werte, die möglich sind. Mit Kommata getrennt, z.B. 1,2,3..., a,b,c,
        Andere Eingaben werden als falsch betrachtet
dflt = Defaultwert für die InputBox, falls vorhanden

Historie:
2010-05-09 Stefan Grund		: erstellt
--------------------------------------------------------------------------------------------------------*/

var erg = "";
var antw = true;
wertePrf = werte.toLowerCase();

  do {
    if (antw == false) {
    boxTxt = '"' + erg + '"' + ": FALSCHE EINGABE! \n\n" + strTxt;
    } else {
    boxTxt = strTxt;
    }
  
    
  erg = __dnbPrompter(boxtit,boxTxt,dflt);
  
    if (erg == null) {
    break;
    } else {
    erg = erg.toLowerCase();
    } 
    
    if (wertePrf.indexOf(erg) > -1) { 
    antw = true
    } else {
    antw = false 
    }

  } while(antw != true);

return erg;
}

function __dnbUpdMatStatus(status) {
/*--------------------------------------------------------------------------------------------------------


Historie:
2010-08-09 Bernd Althaus		: erstellt
--------------------------------------------------------------------------------------------------------*/

		application.activeWindow.title.startOfBuffer(false);
		if ((!application.activeWindow.title.findTag("0500", 0, false, true, false)) && 
			(!application.activeWindow.title.findTag("005", 0, false, true, false))) {
				__gndError("Fehler","Feld mit Materialcode nicht vorhanden!");
		} else {
			application.activeWindow.title.startOfField(false);
			application.activeWindow.title.wordRight(1,false);
			application.activeWindow.title.charRight(2,false);
			application.activeWindow.title.charRight(1,true);
			application.activeWindow.title.deleteSelection(false);
			application.activeWindow.title.insertText(status);
		}	
		
}


function CKneu () {
/*---------------------------------------------------------------------------------

2011-11-24   gr   Angepasst für GND

---------------------------------------------------------------------------------*/

	boxtit = "CrossKonkordanz neu";
  strSWDIDN = application.activeWindow.getVariable("P3GPP");
  strMat = application.activeWindow.materialCode;
  tag065 = __katEinlesen("065");
  
    if (("Ts Tg").indexOf(strMat) == -1) {
    __gndError(boxtit,"Skript kann nur aus einem Ts- oder Tg-Satz ausgelöst werden!");
    return(false);
    } 
    
  DatenmaskeTcx();
  
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


function zdb_Reziprok() {
/**************************************************************
 
edits Hachmann, Grund, Klee
letzte Änderung 2012-12-05  Klee

/**************************************************************/
  
  // Skript muss bei reziprokem Verknuepfungsfeld aufgerufen werden und erzeugt an der Gegenaufnahme eine Verknüpfung.
	if (!application.activeWindow.title) 
	{
		application.messageBox("Reziprok", "Die Funktion kann nur aus dem Korrekturmodus aufgerufen werden.",  "alert-icon");
		return;
	}

	// Quell-ID-Nummer
	var quellID = application.activeWindow.getVariable("P3GPP");
	var felder = {
		"510 vorg":"510 !" + quellID + "!$4nach",
		"510 nach":"510 !" + quellID + "!$4vorg",
		"511 vorg":"511 !" + quellID + "!$4nach",
		"511 nach":"511 !" + quellID + "!$4vorg",
		"551 vorg":"551 !" + quellID + "!$4nach",
		"551 nach":"551 !" + quellID + "!$4vorg",
		"4244 f#":"4244 s#!" + quellID + "!",
		"4244 s#":"4244 f#!" + quellID + "!",
		"4244 z#":"4244 z#!" + quellID + "!",
		"4241":"4242 !" + quellID + "!",
		"4242":"4241 !" + quellID + "!",
		"4243":"4243 !" + quellID + "!"}

	// Aktuelle Feldnummer ermitteln
	var tag = application.activeWindow.title.tag;
	var tagcontent = application.activeWindow.title.currentField;
	// Prüfen, ob eine von Ausrufezeichen umschlossene IDN vorhanden ist
	var text = tagcontent.substring(tagcontent.indexOf("!"),tagcontent.lastIndexOf("!")+1); 
	var regExpPPN = /!(\d{8,9}[\d|x|X])!/;
	if (!regExpPPN.test(text)) {
		application.messageBox("Reziprok linken", "Es ist keine ID-Nummer zum Verlinken gefunden worden.", "error-icon");
		return;
	}
	application.activeWindow.title.startOfField(false);
	var reziFeld = "";
	//Unterschiede zw. GND- und Titelfeldern
	if (tag.length < 4)
	{
		//Relationscode ermitteln
		var code = tagcontent.substr(tagcontent.indexOf("$4")+2,4)
		var feldnr = tag + " " + code;
		reziFeld = felder[feldnr];
	} 
	else
	{
		var feldnr = tagcontent.match(/^\d{4,4}(\s[fsz]#)?/g);
		reziFeld = felder[feldnr[0]];
	}


	// Fehlermeldung bei falschem Feld
	if (reziFeld == "" || reziFeld == null || !reziFeld) {
		application.messageBox("Reziprok", "Die Funktion kann nicht aus dem Feld '" + tag + "' aufgerufen werden.",  "alert-icon");
		return;
	}

   // Datensatz speichern, wenn Status != OK Abbruch.
    application.activeWindow.simulateIBWKey ("FR");
	if (application.activeWindow.status != "OK"){
	  application.messageBox("Reziprok linken", "Bitte Fehler korrigieren und Funktion erneut ausführen", "error-icon");
	  return;
	}
	zielID = regExpPPN.exec(text);
	// Kommando abschicken und Ergebnis in gleichen Fenster anzeigen
	application.activeWindow.command("f idn " + zielID[1], false); // <=== Kommando in demselben Fenster

	  
    //Datensatz in der Vollanzeige prüfen. Wenn PPN noch nicht vorkommt, dann jetzt einfuegen:
    if (application.activeWindow.copyTitle().indexOf(quellID) == -1 ) 
	{
		// F7 (Korrektur" drücken)
		application.activeWindow.simulateIBWKey ("F7");
		application.activeWindow.title.endOfBuffer(false);
		application.activeWindow.title.insertText(reziFeld + "\n");
		var thePrompter = utility.newPrompter();
		if (thePrompter.confirmEx("reziprok Linken", "Datensatz jetzt speichern?", "Ja", "Nein", "", "", "") == 0) 
		{
			application.activeWindow.simulateIBWKey ("FR");
			if (application.activeWindow.status == "OK")
			{ 
				application.activeWindow.command("f idn " + quellID + " or " + zielID[1] + ";s k", false);    
			}
		}
	}
	else {
		application.messageBox("Reziprok", "Der Link zu " + quellID + " ist schon vorhanden!", "alert-icon");
	}
 
}