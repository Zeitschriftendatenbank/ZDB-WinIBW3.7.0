//###########################################################################################

//Skripte zur Navigation und Bearbeitung in und von von Datensätzen

//###########################################################################################

function katEinlesen(gesKat) {
/*
  '       satz            ' record Text
  '       satzlaenge      ' Laenge des Records
  '       pos             ' Position innerhlab des Textes
  '       inh             ' Inhalt einer Kategorie
  '       kat             ' Kategorie

'Funktion liest alle Vorkommen einer Kategorie in ein Array ein.
'Funktioniert sowohl im Editier- als auch im Anzeigebildschirm.
'Skript ursprgl. von H. Schneider (HeBIS), angepasst von 
'S. Grund, DNB, Feb 2008
'nach Java übersetzt Okt 2008
*/

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

// Fehlt: Bedingung Titel in Anzeigeform

var satz = application.activeWindow.copyTitle();
// von Schneider (HeBIS)übernommen...
satz = satz.replace(/\r/g,"");
satz = satz + "\n\n";

var pos = 1;
  
  do {
  var posx = satz.indexOf("\n",pos);
  inh = "";
  kat = satz.substr(pos,"5")
//  application.messageBox("","x"+kat+"x","");
//application.messageBox("",satz.indexOf(gesKat,pos),"");
    if (kat.indexOf(gesKat) == 0) {
//     kat == gesKat) {
//application.messageBox("","klappt","");
    katInh.push(satz.substring(pos,posx));
   // application.messageBox("","x"+katInh[0]+"x","") ;
    }    
    
    
  pos = posx+1;
  } while (posx != -1)
  
return katInh;
}


function geheZuKat(kat,ind,append) {
/*geht in einem Datensatz an die Stelle, an der ein bestimmtes neues Feld/Indikator der Reihenfolge nach eingefügt werden würde
'S Grund, 01/2009

'kat = übergebene einzufügende Kategorie
'ind = übergebener Indikator
'append = true -> ans Ende eines vorhandenen Felds (das erste Vorkommen oder, wenn nicht vorhanden, genau ein Feld davor ans Ende), sonst: Anfang des ersten Feldes oder dort, wo es stehen müsste
'kat_ind = Wert der Kategorie + Indikator
'ta_kat = geprüfte Kategorie der TA (Schleife)
'ta_kat_ind = geprüfte Kategorie der TA + Indikator */

application.activeWindow.title.startOfBuffer;

  do {

  application.activeWindow.title.lineDown(1, false);
  ta_kat = application.activeWindow.title.tag;
    if (ta_kat == kat && ind != "") {
    kat_ind = parseInt(kat) + parseInt(ind.charCodeAt(0));
    ta_kat_ind = parseInt(ta_kat) + parseInt(application.activeWindow.title.currentField.substr(5,1).charCodeAt(0));
      if (ta_kat != kat || ta_kat_ind > kat_ind) {
      break;
      }
    }
/*    if (ta_kat == "") {
    ta_kat = 10000;
    }*/
  } while (ta_kat <= kat && ta_kat != "");
  application.activeWindow.title.startOfField(false);

  if (append == "true") {
  application.activeWindow.title.lineUp(1, false);
  application.activeWindow.title.endOfField(false);
  return;
  }

}

function feldTest(feld,ind,inh,wdhb) {

/*zurückgebener Status:
f_nvorh = ganzes Feld nicht vorhanden
nvorh_nw = Feld vorh. aber nicht mit Inhalt, Feld nicht wdhbar
nvorh_w = Feld vorh., aber nicht mit Inhalt, Feld wdhbar
vorh = Feld mit Inhalt vorhanden, oder, wenn kein Inhalt abgefragt, Feld überhaupt vorhanden
*/



feld_inh = katEinlesen(feld);

application.messageBox("",feld_inh.length,"");
  
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
    return "vorh";
    }
   
    if (wdhb == true) {
  
      for (i = 0; i < feld_inh.length; i++) {
      
        if (feld_inh[i].indexOf(inh) > -1) { // Feld mit gesuchtem Inhalt schon vorhanden
        return "vorh";
        }
      }
	//wdhb. Feld vorhanden, aber ohne gesuchten Inhalt  
    return "nvorh_w";   
    } else {  //für nicht wdhb. Felder
 
      if (feld_inh[0].indexOf(inh) > -1) {
      //Feld mit Inhalt vorh.
	  return "vorh";
      } else {
	  //Feld vorh., aber mit anderem Inhalt
      return "nvorh_nw";
      }
    }
 
  } else {
  //Feld gar nicht vorhanden
  return "f_nvorh";
  }

}

//###########################################################################################

//Sonstige allgemeine Funktionen

//###########################################################################################


//****************************************************************
function __makeDate() {
//****************************************************************

/*gr, 2010-05
Funktion zum Generieren eines Tagesdatums. U.U. noch anpassen, wenn später andere Formate gewünscht
*/

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

function getProfVal(valname,prompTxt) {
//--------------------------------------------------------------------------------------------------------
//name:		getProfValue
//description:	retrieving or storing and retrieving a user's value from/to user_pref.js/userData.<xyz>
//user:	  	the function will be called by several other functions 
//input: 	string by user
//return:	the entry "user_pref("userData.<xyz>", "<user>");" in file user_pref.js
//author: 	Stefan Grund (based on getUserLoginTEST)
//date:		2010-05
//--------------------------------------------------------------------------------------------------------

var value = application.getProfileString("dnbUser", valname, "");

  if (!value) {
  value = __dnbPrompter("Abfrage", prompTxt);
  
    if (value == null) {
    __hebisError("Es ist keine Eingabe erfolgt. \n\n Die Funktion wird abgebrochen!");	
    } else {
    application.writeProfileString("dnbUser", valname, value);
    }
    
  }

return value;									
}

function holeIDN() {
//--------------------------------------------------------------------------------------------------------
//name:		holeIDN
//replaces:		HoleIDN
//description:	storing a record's IDN to a variable and inserting it into an other record (new or edited) to link them
//user:	  	all users with editing rights
//input: 		none
//return:		IDN encased in exclamation marks
//author: 		Detlev Horst
//date:		2006-12-18
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------

	/*PPN = Application.activeWindow.getVariable("P3GPP")
	Application.ActiveWindow.CloseWindow
	Application.ActiveWindow.Title.InsertText "!" & PPN & "!"*/	
	
	// Place the current PPN on the clipboard.
	application.activeWindow.clipboard =
		"!" + application.activeWindow.getVariable("P3GPP") + "!";
	// Close the active window.
	application.activeWindow.closeWindow();
	// Paste the contents of the clipboard into the title edit control
	application.activeWindow.title.insertText(application.activeWindow.clipboard);

}

function merkeIDN() {
		
//--------------------------------------------------------------------------------------------------------
//name:		merkeIDN
//replaces:		MerkeIDN
//description:	storing a record's IDN to the clipboard
//user:	  	all users 
//input: 		none
//return:		Clipboard contains IDN encased in exclamation marks
//author: 		Detlev Horst
//date:		2006-12-18
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------

	ppnStr = application.activeWindow.getVariable("P3GPP")
	application.activeWindow.clipboard = "!" + ppnStr + "!";

}

//###########################################################################################

//Funktionen zur Erzeugung und Prüfung von Meldungen, Nutzereingaben etc.

//###########################################################################################

function __dnbwarnung(boxtit,meldungstext)
{
	application.messageBox(boxtit, meldungstext, "alert-icon");
}
function __dnbError(boxtit,meldungstext)
{
	application.messageBox(boxtit, meldungstext, "error-icon");
}

function __dnbmeldung(boxtit,meldungstext)
{
	application.messageBox(boxtit, meldungstext, "message-icon");
}
function __dnbfrage(boxtit,meldungstext)
{
	application.messageBox(boxtit, meldungstext, "question-icon");
}


