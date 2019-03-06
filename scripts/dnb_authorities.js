//Skripte f�r Normdaten

/*

2011-02-11 gr Uebersetzer: Fehlerkorrektur, Variable fm angepasst und fm_abfr gel�scht, da Bedingungen nicht immer logisch
2012-02-27 gr Tn_Tp: entfernt, da in GND nicht mehr ben�tigt
2012-03-05 gr neu: GNDmbxKonf, f�r externe Nutzer
2012-11-06 gr __relCodeVergabe: RelaCodes-Dateipfad flexibel gemacht (entw. ttlcopy oder defaulte\relationscodes)
2014-03-28 ba relCodeVergabe in relaCodeVergabe umbenannt, da Script mit altem Namen nicht korrekt geladen wurde ?!
--> F�r Veteilung an Verb�nde Umbenennung wieder r�ckg�ngig gemacht!
2017-11-23 gr Ber�cksichtigung von bereits vorhandenem $v (s. Email Hachmann/Diedrichs (GBV) vom 6.12.2016)
 */

//-------------------------------------------------------------------------------------------------------------------------------

//Skripte f�r alle Normdaten (Test-Update)

//********************************************************************


function GNDmbx() {
  /*--------------------------------------------------------------------------------------------------------
  Die Funktion f�gt in einem Editschirm ein Feld 901 mit aktuellem Datum gefolgt von einem vordefiniertem String ein. Die gespeicherte Userkennung kann entweder durch GNDmbxKonf (in externen Umgebungen) oder durch dnb_einstellungen_dialog.js/xul (DNB-intern) ge�ndert werden

  Verwendete Unterfunktionen:
  __makeDate
  __getProfVal
  __gndMsg
  __gndError

  Historie:
  2010-05-01 Stefan Grund        : erstellt
  2011-04-01 Bernd Althaus    : 3. �bergabeparameter bei __getProfVal entfernt
  --------------------------------------------------------------------------------------------------------*/

  var boxtit = "Mailbox f�r GND-Satz erfassen";
  var typ = application.activeWindow.materialCode;
  var typErlaubt = "Tb Tf Tg Tn Tp Ts Tu";

  if ((!application.activeWindow.title) || (typErlaubt.indexOf(typ) == -1)) {
    __gndError(boxtit, "Diese Funktion kann nur in einem GND-Satz (" + typErlaubt + ") im Eingabe- oder Korrekturmodus verwendet werden!");
    return false;
  }

  var prompTxt = "Bitte geben Sie Ihre GND-Mailbox-Absenderkennung ein:";
  var absdr = __getProfVal(boxtit, "GNDsender", prompTxt);

  if ((absdr == null) || (absdr == "")) {
    __gndError(boxtit, "Es ist keine Eingabe erfolgt. \n\n Die Funktion wird abgebrochen!");
  } else {
    application.activeWindow.title.endOfBuffer(false);
    application.activeWindow.title.insertText("901 $z" + __makeDate() + "$ba-" + absdr + " e-$a");
  }

  application.activeWindow.title.charLeft(2, false);

}

function GNDmbxKonf() {
  /*--------------------------------------------------------------------------------------------------------
  Die Funktion dient zur nachtr�glichen �nderungsm�glichkeit der Profileigenschaft GNDsender (f�r externe Anwender, in DNB wird
  stattdessen dnb_einstellungen_dialog.js/xul verwendet)

  verwendete Unterfunktion: __getProfVal

  Historie:
  2012-02-29 Stefan Grund        : erstellt

  --------------------------------------------------------------------------------------------------------*/

  __getProfVal("GND-Mailboxabsender", "GNDsender", "Bitte geben Sie den gew�nschten GND-Mailboxabsender ein:", "korr");

}

//********************************************************************
function GNDLoeschen() {
  /*--------------------------------------------------------------------------------------------------------
  normLoeschen ()

  Die Funktion f�gt �nderungscodierung und "GESPERRT" in Normdatens�tze ein

  typ       = Materialart
  af_kat    = Feld, in der die Ansetzungsform steht
  z         = Anzahl der Schritte vom Zeilenanfang, die zur Eingabe von GESPERRT zur�ckgelegt werden m�ssen
  gesp      = PND mit ***, SWD mit !!!

  Verwendete Unterfunktionen: __gndError(), __geheZuKat()

  Historie:
  2010-04-01 Stefan Grund        : erstellt
  2011-02-02 Stefan Grund   : Anpassungen f�r GND
  --------------------------------------------------------------------------------------------------------*/

  var boxTit = "Normdatensatz l�schen";
  var satz = application.activeWindow.copyTitle();
  var typ = application.activeWindow.materialCode;
  var typ_erlaubt = "Tb Tf Tg Tn Tp Ts Tu";

  if (application.activeWindow.getVariable("scr") != "8A") {
    __gndError(boxTit, "Es liegt kein Datensatz in Vollanzeige vor!");
    return;
  }

  if (typ_erlaubt.indexOf(typ) == -1) {
    __gndError(boxTit, "Nur Normdatens�tze (Materialarten " + typ_erlaubt + ") k�nnen mit dieser Funktion bearbeitet werden!");
    return;
  }

  if (satz.indexOf("!!!GESPERRT!!!") > -1) {
    __gndError(boxTit, "Datensatz ist bereits gesperrt!");
    return;
  }

  if (satz.indexOf("\n010 ") > -1) {
    __gndError(boxTit, "Es ist bereits eine �nderungscodierung vorhanden!");
    return;
  }

  //welche Entit�t/Ansetzungsfeld?
  af_kat = satz.match(/\n1[0135][01] /);
  af_kat = af_kat[0].substr(1, 3);

  application.activeWindow.command("k", false);
  application.activeWindow.title.insertText("010 d\n");
  __geheZuKat(af_kat, "", true);
  application.activeWindow.title.startOfField(false);
  application.activeWindow.title.charRight(4, false);
  application.activeWindow.title.insertText("!!!GESPERRT!!!");
  application.activeWindow.simulateIBWKey("FR");
}

//-----------------------------------------------
var global = {};
global.gndLinkkeep = {};
//-----------------------------------------------

function __GNDLink() {
  /*--------------------------------------------------------------------------------------------------------

  Die interne Funktion pr�ft, ob ein Editfenster ge�ffnet ist. (Wird vor der Funktion GNDLink ausgef�hrt!)

  Verwendete Unterfunktionen: __gndError, __gndPrompter, __relCodeVergabeIntern, __gndMsg

  Historie:
  2010-08-01 Stefan Grund        : erstellt
  --------------------------------------------------------------------------------------------------------*/

  return (application.activeWindow.title != null);
}

function GNDLink() {
  /*--------------------------------------------------------------------------------------------------------
  Erstellt Verkn�pfungen innerhalb der GND in den Relationsfeldern (5XX)

  Historie:
  2010-08-01 Stefan Grund        : erstellt, Uebersetzung der VB-Version
  2010-11-29 gr: Fehlerkorrektur (bei Schlie�en des Ergebnisfensters ohne �bernahme wurde immer Ind. c vergeben statt der vorher ausgew�hlten)
  2011-02-22 gr: Anpassung: Mengenbegrenzung bei Affiliationen erh�ht, exakte Phrasensuche m�glich gemacht
  2011-11-22 gr: Anpassung auf GND-Anforderungen, Umbenennung von PNDLink nach GNDLink
  2017-05-29 gr: Ber�cksichtigung von bereits vorhandenem $v (s. Email Hachmann/Diedrichs (GBV) vom 6.12.2016, in der prod. WinIBW aktiv seit 21.11.17)
  --------------------------------------------------------------------------------------------------------*/

  var tag;
  var matArt;
  var inh; //Inhalt des aktuellen Felds
  var fldtmp; // Kategorie und Inhalt im Pica-Zeichensatz
  var strtmp; // Feldinhalt im latin1 - Zeichensatz
  var strlen; // L�nge des Feldes
  var strcmd; // Such-Kommando
  var waittxt; // Warnungstext f�r //Weiter//
  var strstatus; // Status nach Suche
  var strsize; // Size nach Suche
  var deskriptor; // Deskriptor f�r 315
  var PPN; // gefundene PPN
  var winid; // id of edit screen
  var swinid; // id of search window
  var tmpid; // id of actual window
  var exist_a; // true, wenn schon Deskriptor a existiert
  var trunk = ""; // wird mit "?" gef�llt, falls Suchbegriff defaultm��ig trunkiert werden soll
  var relCode = ""; //RelCode (entweder bereits vorhanden oder durch Aufruf von relCodeVergabeIntern belegt)
  var relPos; //Position des RelCodes im String, falls schon vorhanden
  var bemerkung = ""; //wird belegt, falls eine Bemerkung mit $v an einen bereits vorhandenen RelCode angeschlossen ist
  var boxtit = "Relationierungsskript";
  var exact = false;

  if (!application.activeWindow.title) {
    __gndError(boxtit, "Dieses Skript kann nur im Korrektur- oder Erfassungsmodus verwendet werden!");
    return false;
  }

  winid = application.activeWindow.windowID;
  tag = application.activeWindow.title.tag;
  inh = application.activeWindow.title.currentField;
  //Materialart ermitteln, �ber 005, weil bei Neuaufnahmen materialCode noch nicht zur Verf�gung steht
  matArt = application.activeWindow.title.findTag("005", 0, false, false, false).substr(0, 2);

  if (matArt == "") {
    __gndError(boxtit, "Die Funktion kann erst nach Erfassen einer Materialart in 005 aufgerufen werden!");
    return;
  }

  //Test ob Anfuehrungsstriche enthalten - wenn ja, wird Begriff sp�ter als Phrase/untrunkiert gesucht
  if (inh.indexOf('"') > -1) {
    exact = true;
  }
  //Belegung verschiedener Variablen je nach Materialart des Datensatzes und zu bearbeitender Kategorie
  //Suchanfragen k�nnen in Verb�nden anders lauten, Unterscheidung zB nach Caption des Fensters:
  //"if (application.activeWindow.getVariable("system").indexOf("ZENTRALKATALOG") == -1 ){ "
  //etc.
  //??? Suchanfragen m�ssen ggfs. noch angepasst werden, wenn GND-Indexierung steht. Es sollten nur f�r das jeweilige Relationierungs-
  //Feld g�ltige Entit�ten zur Auswahl angeboten werden
  var strcmd1,
  strcmd2,
  pruef_zwang,
  set_zu_gross;
  switch (tag) {
    //Person
  case "500":
    boxtit = "Relationierung Person";
    strcmd1 = "rec n;f per ";
    strcmd2 = " and bbg tp#";
    pruef_zwang = "true";
    set_zu_gross = 100;
    break;
    //K�rperschaft
  case "510":
    boxtit = "Relationierung K�rperschaft";
    if (exact) {
      strcmd1 = "rec n;f ksk ";
    } else {
      strcmd1 = "rec n;f kor ";
    }
    strcmd2 = " and bbg tb#";
    pruef_zwang = "true";
    set_zu_gross = 1000;
    break;
    //Kongress
  case "511":
    boxtit = "Relationierung Kongress";
    //Wenn Suchbegriff in Anfuehrungsstrichen -> Phrasensuche, sonst wortweise (default)
    if (exact) {
      strcmd1 = "rec n;f ksk ";
    } else {
      strcmd1 = "rec n;f kor ";
    }
    strcmd2 = " and bbg tf#";
    pruef_zwang = "true";
    set_zu_gross = 1000;
    break;
    //Werk
  case "530":
    boxtit = "Relationierung Werk";
    //Wenn Suchbegriff in Anfuehrungsstrichen -> Phrasensuche, sonst wortweise (default)
    if (exact) {
      strcmd1 = "rec n;f sp ";
    } else {
      strcmd1 = "rec n;f sw ";
    }
    if (inh.substr(4, 3) == "uwk") {
      strcmd1 = "rec n;f ";
    }
    strcmd2 = " and bbg tu#";
    pruef_zwang = "true";
    set_zu_gross = 1000;
    break;
    //Sachbegriff
  case "550":
    boxtit = "Relationierung Sachbegriff";
    //Wenn Suchbegriff in Anfuehrungsstrichen -> Phrasensuche, sonst wortweise (default)
    if ((exact) || (matArt == "Tp")) {
      strcmd1 = "rec n;f sp ";
    } else {
      strcmd1 = "rec n;f sw ";
    }
    strcmd2 = " and bbg ts#";
    pruef_zwang = "true";
    set_zu_gross = 1000;
    break;
    //Geographica
  case "551":
    boxtit = "Relationierung Geographicum";
    //Bei Geographica wird immer als Phrase gesucht, daher braucht "exact" nicht abgefragt zu werden
    strcmd1 = "rec n;f sp \u0022";
    if (matArt == "Tp") {
      strcmd2 = "?\u0022 not sn [0123456789]? and bbg tg#";
    } else {
      strcmd2 = "\u0022 and bbg tg#";
    }
    pruef_zwang = "true";
    set_zu_gross = 1000;
    break;
  default:
    __gndError(boxtit, "Dieses Skript kann nur Relationierungsfelder (5XX) bearbeiten.");
    return false;
  } //Ende switch

  //wenn Feld nur aus Tag ohne Blank besteht
  if (inh.length < 4) {
    application.activeWindow.title.startOfField(false);
    application.activeWindow.title.endOfField(false);
    application.activeWindow.title.insertText(" ");
  }
  application.activeWindow.title.startOfField(false);
  application.activeWindow.title.charRight(4, false);
  application.activeWindow.title.endOfField(true);
  strtmp = application.activeWindow.title.selection;

  //ist RelCode schon vorhanden?  Wenn ja, aus Suchbegriff strtmp raus und RelCode (ohne $4) einlesen
  relPos = strtmp.indexOf("$4");
  if (relPos > -1) {
    relCode = strtmp.substr(relPos + 2);
    strtmp = strtmp.substr(0, relPos);
    //folgt noch ein $v auf den RelCode?
    bemPos = relCode.indexOf("$v");
    if (bemPos > -1) {
      bemerkung = relCode.substr(bemPos);
      relCode = relCode.substr(0, bemPos);
    }

  }

  if (strtmp == "") {
    strtmp = __gndPrompter(boxtit, "Das Feld enth�lt keinen Suchbegriff! Bitte geben Sie einen zum Feld " + tag + " passenden Suchbegriff ein:", "");

    if (strtmp == "") {
      return;
    }

  }
  strcmd = strcmd1 + strtmp + strcmd2;

  //Abfrage / Pr�fung des relCodes
  relCode = __relCodeVergabeIntern(matArt + tag, relCode);

  if (!relCode) {
    __gndError(boxtit, "Die Relationierung wurde abgebrochen!");
    return;
  }

  application.activeWindow.command(strcmd, true);
  strstatus = application.activeWindow.status;
  newid = application.activeWindow.windowID;
  if (strstatus == "NOHITS") {
    application.activeWindow.closeWindow();
    __gndError(boxtit, "Keine Treffer! Bitte �berpr�fen Sie noch einmal den Suchstring\n"
       + "    *** " + strcmd + " ***\n\n"
       + "M�glicherweise liegt ein Schreibfehler vor.");
    application.activeWindow.title.insertText(strtmp + "$4" + relCode + bemerkung);
    return false;
  }

  //Notwendig ???
  if (strstatus != "OK") {
    application.activeWindow.closeWindow();
    __gndError("Es ist ein unerwarteter Fehler aufgetreten:\n\n" + strstatus);
    return false;
  }

  if (application.activeWindow.getVariable("scr") == "GN") {
    application.activeWindow.simulateIBWKey("FR");
  }

  setsz = application.activeWindow.getVariable("P3GSZ");

  /* Nicht mehr notwendig
  if (setsz > set_zu_gross) {
  application.activeWindow.closeWindow();
  __gndError(boxtit,"Die Suche ergab insgesamt "
  + setsz + " Treffer.\n"
  + "Bitte schr�nken Sie den Suchbegriff ein, um die Treffermenge "
  + "zu reduzieren");
  return;
  }
   */
  //Jetzt eigentlich immer Pr�fzwang, Bedingung wird aber ersteinmal behalten, da sich das vielleicht doch noch mal wieder �ndern wird
  if (pruef_zwang == "true") {
    msgtxt1 = "Die Suche \u0022" + strcmd + "\u0022 ergab insgesamt " + setsz + " Treffer.\n";
    if (pruef_zwang == "true" && setsz == 1) {
      msgtxt2 = "Meinten Sie diesen Normdatensatz? \n"
         + "Wenn Sie ihn zur Verkn�pfung verwenden wollen, ";
    } else {
      msgtxt2 = "Bitte suchen Sie den entsprechenden Normdatensatz aus,\n"
         + "den Sie zur Verkn�pfung verwenden wollen, und ";
    }

    msgtxt3 = "aktivieren Sie dann die Funktion 'GNDLinkCont'.\n\n"
       + "Sollten Sie keinen entsprechenden Normdatensatz vorfinden,\n"
       + "so schlie�en Sie einfach das aktuelle Fenster.";

    //__gndMsg(boxtit,msgtxt1 + msgtxt2 + msgtxt3);
    application.activeWindow.appendMessage(msgtxt1, 3);
    application.activeWindow.appendMessage(msgtxt2, 3);
    application.activeWindow.appendMessage(msgtxt3, 3);

    application.activateWindow(winid);
    application.activeWindow.title.insertText(strtmp + "$4" + relCode + bemerkung);
    application.activeWindow.title.startOfField(false);
    application.activeWindow.title.charRight(4, false);
    application.activateWindow(newid);

    global.gndLinkkeep.winid = winid;
    global.gndLinkkeep.newid = newid;
    global.gndLinkkeep.relCode = "$4" + relCode + bemerkung;
    return true;
  }

  PPN = application.activeWindow.getVariable("P3GPP");
  application.activeWindow.closeWindow();

  application.activeWindow.title.insertText("!" + PPN + "!$4" + relCode + bemerkung);

  return true;

}

function __GNDLinkCont()
/*--------------------------------------------------------------------------------------------------------

Die interne Funktion pr�ft vor Ausf�hrung der Funktion gndLinkCont, der Fortsetzung von Funktion gndLink,
ob eine neue WindowID vorhanden ist.

Verwendete Unterfunktionen: keine

Historie:
2010-08-01 Stefan Grund        : erstellt
--------------------------------------------------------------------------------------------------------*/

{
  if (!global.gndLinkkeep.hasOwnProperty("newid")) {
    return false;
  }
}

function GNDLinkCont() {
  /*--------------------------------------------------------------------------------------------------------

  Die Funktion setzt die Erstellung von Verkn�pfungen in der GND fort.

  Verwendete Unterfunktionen: __gndError

  Historie:
  0000-00-00     HeBIS    : erstellt
  2010-09-03  S. Grund : messageBoxHeader angepasst
  2012-01-24  S. Grund  : Anpassungen f�r GND
  --------------------------------------------------------------------------------------------------------*/

  var PPN;
  messageBoxHeader = "GNDLink fortsetzen";
  if (global.gndLinkkeep.newid != application.activeWindow.windowID) {
    __gndError("falsche Fortsetzung", "error-icon");
    application.activateWindow(global.gndLinkkeep.winid);
    return;
  }

  PPN = application.activeWindow.getVariable("P3GPP");
  application.activeWindow.closeWindow();

  application.activateWindow(global.gndLinkkeep.winid);
  application.activeWindow.title.find(global.gndLinkkeep.fldtmp, true, false, false);
  application.activeWindow.title.startOfField(false);
  application.activeWindow.title.wordRight(1, false);
  application.activeWindow.title.endOfField(true);

  application.activeWindow.title.insertText("!" + PPN + "!" + global.gndLinkkeep.relCode);

  global.gndLinkkeep = {};

  return true;

}

//Meldungen f�r GND-Skripte, wg. Kompabilit�t aus Orig.-HeBIS-Datei �bernommen
function __gndError(boxtit, meldetext) {
  /*--------------------------------------------------------------------------------------------------------
  __gndError(meldetext) ()

  Die interne Funktion ruft ein PopUp-Fenster fuer Fehlermeldungen auf.
  Mit dem Parameter meldetext wird der Text der Fehlermeldung �bergeben.
  Meldungen f�r PND-Skript pndLink, wg. Kompabilit�t aus Orig.-HeBIS-Datei �bernommen.

  Verwendete Unterfunktionen: keine

  Historie:
  0000-00-00     HeBIS   : erstellt
  --------------------------------------------------------------------------------------------------------*/

  application.messageBox(boxtit, meldetext, "error-icon");
}

function __gndMsg(boxtit, meldetext) {
  /*--------------------------------------------------------------------------------------------------------

  Die interne Funktion ruft ein PopUp-Fenster fuer Meldungen auf.
  Mit dem Parameter meldetext wird der Text der Meldung �bergeben.
  Meldungen f�r PND-Skript pndLink, wg. Kompabilit�t aus Orig.-HeBIS-Datei �bernommen.

  Verwendete Unterfunktionen: keine

  Historie:
  0000-00-00     HeBIS   : erstellt
  --------------------------------------------------------------------------------------------------------*/

  application.messageBox(boxtit, meldetext, "alert-icon");
}

//----gndLink-Scripte--Ende--------------------------

//Funktionen f�r SWD

function GNDDDCdatum() {
  /*--------------------------------------------------------------------------------------------------------

  Funktion f�r die IE: Tagesdatum wird am Ende des Feldes, in dem 'sich der Cursor befindet,
  in 083 oder 089 in $g eingef�gt (Anforderung Karg / K�hn / Scheven)

  Verwendete Unterfunktionen: __gndError()

  Historie:
  2010-04-01 Stefan Grund        : erstellt
  2012-01    Stefan Grund   : Anpassungen fuer GND
  --------------------------------------------------------------------------------------------------------*/

  boxtit = "Tagesdatum der Pr�fung zu DDC-Notation hinzuf�gen";

  if (!application.activeWindow.title) {
    __gndError(boxtit, "Diese Funktion kann nur aus einem Eingabe- oder Korrekturbildschirm aufgerufen werden!");
    return;
  }

  var kat = application.activeWindow.title.tag;

  if (("083 089".indexOf(kat) < 0) || (kat == "")) {
    __gndError(boxtit, "Diese Funktion kann nur in den Feldern 083 oder 089 genutzt werden.");
    return;
  }

  application.activeWindow.title.endOfField(false);
  application.activeWindow.title.insertText("$g" + __makeDate());

}

//----------------------------------------------------------------------------------------
function GNDDDC() {
  /*--------------------------------------------------------------------------------------------------------

  Diese Funktion f�r die IE, entspricht dem CrissCross-Skript CrissX:
  Wenn 083 noch nicht vorhanden, wird es mit Tagesdatum in $t eingef�gt (Anforderung Karg / K�hn / Scheven)

  Verwendete Unterfunktionen: __gndError(), __geheZuKat()

  Historie:
  2010-05-01 Stefan Grund        : erstellt
  2012-01    Stefan Grund   : Anpassungen fuer GND
  2016-06-22 Stefan Grund   : alle GND-Enit�ten (au�er Tn) und Tc erlaubt
  --------------------------------------------------------------------------------------------------------*/

  var boxtit = "DDC-Notation hinzuf�gen";
  var matErlaubt = "Tb Tc Tf Tg Tp Ts Tu"; //Erlaubte Materialarten
  var matVorh = application.activeWindow.materialCode; //Im Satz vorhandene Materialart

  if ("8A MI".indexOf(application.activeWindow.getVariable("scr")) < 0) {
    __gndError(boxtit, "Funktion kann nur aus Vollanzeige oder Korrekturanzeige eines Datensatzes aufgerufen werden!");
    return false;
  }

  if (matErlaubt.indexOf(matVorh) > -1) {

    //Befindet sich Bildschirm im Korrekturmodus? Falls nein, "k"
    if (!application.activeWindow.title) {
      application.activeWindow.command("k", false);
    }

    //Keine Pr�fung, ob 083 bereits vorhanden, da manchmal Mehrfacheingabe
    __geheZuKat("083", "", false);
    application.activeWindow.title.startOfField(false);
    application.activeWindow.title.insertText("083 $d$t" + __makeDate() + "\n");
    application.activeWindow.title.lineUp(1, false);
    application.activeWindow.title.startOfField(false);
    application.activeWindow.title.charRight(4, false);

  } else {
    __gndError(boxtit, "Falsche Satzart: " + application.activeWindow.materialCode + "\n\nNur " + matErlaubt + " sind erlaubt.");
  }
}

function Uebersetzer() {
  /*--------------------------------------------------------------------------------------------------------

  Erstellt einen GND-Tp4-Satz.

  Verwendete Unterfunktionen: __gndError, __prompterPruef, __geheZuKat, __feldTest

  Historie:
  2010-09-03   S. Grund     : erstellt
  2011-02-11   gr: Korrektur, Variable fm angepasst und fm_abfr gel�scht, da Bedingungen nicht immer logisch
  2011-10-18   gr: Umstellung auf GND
  2012-04-30   gr: "012 v" entfernt, da dies nur noch von der Online-Routine gesetzt werden soll (Anforderung FA/AfS, Mail Fr. Klein vom 30.4.12)
  2013-05-24   gr: Der Inhalt von Feld 692 wird jetzt mit "�bers. von: " eingeleitet (ILT-3108)
  2014-07-03   gr: Anpassung f�r RDA-Umstellung (040/667 rda erg�nzt)
  2014-10-28   gr: Anpassung: 667 rda wieder rausgenommen (ILT-3741)
  2017-09-11   gr: Datenformat�nderung: 692 -> 672 (ILT-5198)
  --------------------------------------------------------------------------------------------------------*/

  // ---

  //dim fm_uebers(2)
  var boxtit = "Erfassung von �bersetzerInnen";
  var mat = application.activeWindow.materialCode;
  var fm = ""; //Geschlecht der Person
  var pers = ""; //Variable f�r den Namen
  var or_spr = ""; // Originalsprache, aus der �bersetzt wird
  var fm_uebers = [];

  //Wenn sich ein PND-Satz im Korrekturstatus befindet, wird dieser zum �bersetzer
  //Wenn sich kein Satz im Korrekturstatus befindet, wird ein neuer Satz erstellt, da die Variable neu nie "false" wird
  if (application.activeWindow.title) {

    if (mat.substr(0, 1) == "T") {

      if ("np".indexOf(mat.substr(1, 1)) > -1) {

        var neu = false;

        if ((__feldTest("550", "", "04061414X", "") == "i") || (__feldTest("550", "", "944106285", "") == "i")) {
          __gndError(boxtit, "Person ist bereits als �bersetzerIn gekennzeichnet!");
          return;
        }

        //Geschlechtsangabe bereits vorhanden?
        fm = application.activeWindow.title.findTag("375", 0, false, false, false);
        if (fm != "") {
          fm = fm.substr(0, 1);
        }

      } else {
        __gndError(boxtit, "Es handelt sich nicht um einen Personensatz!");
        return;
      }
    } else {
      //Wenn aktueller Datensatz eine TA im Edit-Modus ist, wird der Name aus der Kategorie �bernommen,
      //in der sich der Cursor befindet. Es muss sich dabei aber um eine 30XX-Kategorie handeln
      if (application.activeWindow.title.tag.substr(0, 2) != "30") {
        __gndError(boxtit, "Der Cursor befindet sich nicht in einer Personennamenkategorie (30XX).");
        return;
      }
      pers = application.activeWindow.title.currentField.substr(5);
      application.activeWindow.title.startOfField(false);
      application.activeWindow.title.charRight(5, false);
      application.activeWindow.title.deleteToEndOfLine();
      znr = application.activeWindow.title.currentLineNumber;
      //Sprache aus der TA �bernehmen, um sie sp�ter in den PND-Satz einf�gen zu k�nnen
      kat1500 = __katEinlesen("1500");
      if (kat1500.length > 0) {
        or_spr_pos = kat1500[0].indexOf("/3");
        if (or_spr_pos > 0) {
          or_spr = kat1500[0].substr(or_spr_pos + 2, 3);
        }
      }
      application.activeWindow.title.startOfBuffer(false);
      application.activeWindow.title.lineDown(znr - 1, false);
      application.activeWindow.title.endOfField(false);
      //application.newWindow();
    }
  }

  if (fm == "") {
    //Variablen f�r InputBox belegen
    strTxt = pers + "\n\nWeiblich oder m�nnlich? \nBitte geben Sie ein:\n\n" +
      "f \t-> f�r weiblich\n" +
      "m \t-> f�r m�nnlich";
    werte = "f,m";
    dflt = "";

    fm = __prompterPruef(boxtit, strTxt, werte, dflt);

    //Wenn der zur�ckgegebene Wert "Abbruch"
    if (fm == "" || fm == null) {
      __gndMsg(boxtit, "Funktion abgebrochen!");
      return;
    }

  }

  fm_uebers[1] = "375 " + fm;
  switch (fm) {
  case "f":
    fm_uebers[2] = "550 !944106285!";
    break;
  case "m":
    fm_uebers[2] = "550 !04061414X!";
    break;
  }
  fm_uebers[2] = fm_uebers[2] + "$4berc";
  //Variable f�r Datensatz
  or_spr = or_spr + "\n";
  pnd = "005 Tp3\n" +
    "008 \n" +
    "011 f\n" +
    "040 $erda\n" +
    "043 \n" +
    "100 " + pers + "\n" +
    "548 $c$4datw\n" +
    fm_uebers[1] + "\n" +
    fm_uebers[2] + "\n" +
    "377 " + or_spr +
    "672 �bers. von: ";

  //wenn es sich um einen neu zu erfassenden Datensatz handelt
  if (neu != false) {
    application.activeWindow.command("e n", true);
    application.activeWindow.title.insertText(pnd);
    application.activeWindow.title.findTag("008", 0, false, true, false);
    application.activeWindow.title.endOfField(false);
  } else { //kein neu zu erfassender Datensatz, vorhandener wird stattdessen korrigiert
    /* Nutzungskennzeichen vorhanden?
    k012 = __geheZuKat("012","",true);
    if (k012.indexOf("012 ") == 0) {  //Feld bereits vorhanden
    if (k012.indexOf("v") == -1) {  //Inhalt noch nicht vorhanden
    application.activeWindow.title.insertText("v");
    }
    } else {  //Feld noch gar nicht vorhanden
    application.activeWindow.title.insertText("\n012 /v");
    } */
    //Feld 040 mit $erda vorhanden?
    if (__feldTest("040", "", "$erda", false) == "fnw") {
      __geheZuKat("040", "", true);
      //da sich 040 direkt nach einem gesperrten Feld (035) befindet, klappt das �bliche Einf�gen von Text nicht, daher anderes Verfahren
      application.activeWindow.title.lineDown(1, false);
      application.activeWindow.title.startOfField(false);
      application.activeWindow.title.insertText("040 $erda\n");
    }
    //548 $4datw vorhanden?
    if (__feldTest("548", "", "$4datw", false) == "fnw") {
      __geheZuKat("548", "", true);
      application.activeWindow.title.insertText("\n548 $c$4datw");
    }
    // 672 vorhanden?
    if (__feldTest("672", "", "", false) == "fnw") {
      __geheZuKat("672", "", true);
      application.activeWindow.title.insertText("\n672 �bers. von: ");
    }
    // Geschlechtsangabe schon vorhanden? (Geschlecht wurde sonst oben abgefragt)
    if (__feldTest("375", "", "", false) == "fnw") {
      __geheZuKat("375", "w", true);
      application.activeWindow.title.insertText("\n" + fm_uebers[1]);
    }
    // �bersetzerIn-Vkn zur SWD
    __geheZuKat("550", "", true);
    application.activeWindow.title.insertText("\n" + fm_uebers[2]);

  }

}

function Tb3_Tb1() {
  /*--------------------------------------------------------------------------------------------------------
  Tb3_Tb1 ()

  Verwendete Unterfunktionen: __gndError, __dnbUpdMatStatus

  Historie:
  2010-XX-XX     : erstellt
  --------------------------------------------------------------------------------------------------------*/

  var boxtit = "GND-Katalogisierungslevel hochsetzen";
  var typErlaubt = "Tb Tf Tg Tn Tp Ts Tu";

  if (application.activeWindow.getVariable("scr") != "8A") {
    __gndError(boxtit, "Die Funktion kann nur aus der Vollanzeige aufgerufen werden!");
    return false;
  }

  if (typErlaubt.indexOf(application.activeWindow.materialCode) == -1) {
    __gndError(boxtit, "Diese Funktion kann nur in einem GND-Satz (" + typErlaubt + ") verwendet werden!");
    return false;
  }
  application.activeWindow.command("k", false);
  __dnbUpdMatStatus(1);
  application.activeWindow.simulateIBWKey("FR");

}

function VollstNF() {
  /*--------------------------------------------------------------------------------------------------------


  Die Funktion f�gt in in einem Editschirm eines Personennamensatzes ein "400 $4navo" ein bzw. nur $4navo, wenn
  Cursor in bereits vorhandenem 400

  Verwendete Unterfunktionen: __isEditScreen

  Historie:
  2010-05-01    ??: erstellt
  2011-10-18    S. Grund: Umstellung auf GND
  2012-03-01    S. Grund: Anpassungen; 400 wird entweder mit Code neu hinzugef�gt oder, falls Cursor in vorhandener 400,  nur Code
  --------------------------------------------------------------------------------------------------------*/

  var mat = application.activeWindow.materialCode;
  var funcname = "Vollst�ndige Namensform";

  if (("Tn Tp".indexOf(mat.substr(0, 2)) > -1) && (application.activeWindow.title)) {
    if (application.activeWindow.title.tag == "400") {
      application.activeWindow.title.endOfField(false);
      application.activeWindow.title.insertText("$4navo");
    } else {
      __geheZuKat("400", "", false);
      application.activeWindow.title.insertText("400 $4navo\n");
      application.activeWindow.title.lineUp(1, false);
      application.activeWindow.title.startOfField(false);
      application.activeWindow.title.charRight(4, false);
    }

  } else {
    __gndError(funcname, "Diese Funktion kann nur im Korrekturmodus eines Personennamensatzes aufgerufen werden!");
    return false;
  }

}

function normUmlenkungVerlierer() {

  var boxtit = "Datensatz umlenken";

  qidn = application.activeWindow.getVariable("P3GPP");
  application.writeProfileString("dnbUser", "qidn", qidn);
  __gndMsg(boxtit, "Verlierersatz wurde festgelegt (IDN : " + qidn + "). Jetzt normUmlenk vom Gewinnersatz aus starten!");

}

function normUmlenkungTest() {
  /*--------------------------------------------------------------------------------------------------------
  normUmlenkung ()

  Skript �bernimmt f�r das Umlenkverfahren unterschiedliche Felder aus einem Quell- in einen Zielsatz; manche automatisch, manche mit Nachfragen

  Verwendete Unterfunktionen:

  Historie:
  2010-12 Stefan Grund        : erstellt
  2011-02-22  gr  Bearbeitung des Mailboxtextes eingef�gt, �briggebl. Zeilenvorschub \r in inh gel�scht
  2011-05-11   gr  von 011 und 012 werden jetzt nicht alle, sondern nur noch zus�tzliche Codes �bernommen
  2011-05-11   gr  Mailboxtexte, die vom Quellsatz in den Zielsatz �bernommen werden, werden im Quellsatz automatisch gel�scht
  --------------------------------------------------------------------------------------------------------*/

  var boxtit = "Datensatz umlenken";

  //IDN des Quellsatzes wurde durch normUmlenkungVerlierer festgelegt
  qidn = application.getProfileString("dnbUser", "qidn", "");

  if (qidn == "") {
    __gndError(boxtit, "Erst mit normUmlenkungVerlier den Verlierersatz festlegen!");
    return;
  }

  //Einlesen des Zielsatzes (als Zielsatz wird der Datensatz genutzt, der in der WinIBW aktiv ist)
  //zidn = __getProfVal(boxtit,"zidn","Bitte die IDN des Gewinners eingeben:","korr")
  zidn = application.activeWindow.getVariable("P3GPP");

  if (qidn == zidn) {
    __gndError(boxtit, "Der ausgew�hlte *Verliersatz* (" + qidn + ") ist mit dem *Gewinnersatz* (" + zidn + ") identisch. Abbruch!");
    return;
  }

  //Aufruf des Verlierersatzes
  application.activeWindow.command("f idn " + qidn, false);
  qmat = application.activeWindow.materialCode;
  var titq = application.activeWindow.copyTitle();
  qarr = titq.split("\n");

  //Aufruf des Gewinnersatzes
  application.activeWindow.command("f idn " + zidn, false);
  zmat = application.activeWindow.materialCode;
  var titz = application.activeWindow.copyTitle();

  //Pr�fungen
  if (titq.indexOf("\n010 u") > -1) {
    __gndError(boxtit, "Im *Verlierersatz* ist bereits eine Umlenkmarkierung vorhanden!");
    return;
  }

  if (titz.indexOf("\n010 u") > -1) {
    __gndError(boxtit, "Im *Gewinnersatz* ist eine Umlenkmarkierung vorhanden!");
    return;
  }

  if ((qmat == "Tp") && (zmat == "Tn")) {
    __gndError(boxtit, "Ein Tn-Satz kann nicht auf einen Tp-Satz umgelenkt werden!");
    return;
  }

  //Verlierersatz darf nicht SWD-Teilbestand sein, wenn es der Gewinnersatz nicht ist
  var qswd = titq.search(/\n011 \S*?s/);
  var zswd = titz.search(/\n011 \S*?s/);

  //Ermittlung des Erfassungsjahrs + 4stellige Erweiterung
  var rexp = /:(\d\d)-(\d\d)-(\d\d) �nderung/;
  var arr = rexp.exec(titq);
  if (arr[3] > 80) {
    jahr = "19" + arr[3];
  } else {
    jahr = "20" + arr[3];
  }
  var qeindat = jahr + arr[2] + arr[1];
  arr = rexp.exec(titz);
  if (arr[3] > 80) {
    jahr = "19" + arr[3];
  } else {
    jahr = "20" + arr[3];
  }
  var zeindat = jahr + arr[2] + arr[1];

  if ((qswd > -1) && (zswd == -1)) {
    __gndError(boxtit, "Der *Verlierersatz* geh�rt zum Teilbestand SWD, der *Gewinnersatz* nicht. Eine Umlenkung ist daher nicht m�glich!");
    return;
  }

  //Pr�fung auf �lter/j�nger, nicht relevant
  // - wenn Verlierersatz Tn, aber Gewinnersatz Tp,
  // - wenn Gewinnersatz SWD, Verlierersatz aber nicht
  if ((((qswd > -1) && (zswd > -1)) || ((qswd == -1) && (zswd == -1))) && (qeindat < zeindat)) {
    if ((qmat == zmat) || ((qmat != "Tn") && (zmat != "Tp"))) {
      __gndError(boxtit, "Der *Verlierersatz* ist �lter als der *Gewinnersatz*. Eine Umlenkung ist daher nicht m�glich!");
      return;
    }
  }

  //Festlegen der Gruppe von Feldern, die gleich behandelt werden k�nnen
  var abweich = []; //Array f�r Zeilen des Quellsatzes, die im Zielsatz nicht vorhanden sind
  var qmbx_loesch = []; //Array f�r Mailboxtexte des Quellsatzes, die in den Zielsatz �bernommen und daher im Quellsatz automatisch gel�scht werden k�nnen
  //Definition von Feldern, die nie �bernommen werden
  var f_nie = "Eing 005 020 026 027 |m| 169 903 |e| 903 |r| ";
  //Definition von Feldern, die immer �bernommen werden
  var f_immer = "011 012 100 200 ";
  //Definition nicht wiederholbarer Felder
  var f_nw = "009 011 012 013 014 021 022 100 101 |a| 101 |c| 101 |d| 101 |e| 101 |z| 120 121 |a| 121 |c| 121 |d| 121 |e| 140 141 |a| 141 |c| 141 |d| 141 |e| 145 |b| 145 |c| 145 |d| 145 |g| 145 |h| 145 |p| 150 160 300 |a| 300 |b| 300 |c| 300 |d| 300 |e| 310 |c| 310 |d| 310 |f| 310 |q| 310 |t| 310 |u| 310 |w| 310 |z| 315 |a| 320 |m| 321 |m| 322 |m| 808 |a| 808 |b| 808 |c| 808 |d| 808 |e| 810 811 812 813 815 900";
  //womit Anh�ngen, wenn m�glich
  var anh_sk = "009 300 811 812 815 320 321 322 "; //Semikolon
  var anh_sl = "011 012 "; //Slash
  var anh_sb = "101 121 141 145 300 310 315 "; //Semikolon Blank
  //Definition wiederholbarer Felder - ist das notwendig? reichen nicht die nicht-wiederholbaren oben?
  //var f_w = "023 151 155 200 325 |r| 410 |a| 410 |c| 250 255 325 440 450 485 819"
  //Ausnahme: 150, wenn nicht �bernommen nach 250. Unten explizit ausf�hren


  //Test: welche Felder + Inhalt des Quellsatzes sind im Zielsatz nicht vorhanden?
  for (var i = 0; i < qarr.length; i++) {
    if (titz.indexOf(qarr[i]) == -1) {
      abweich.push(qarr[i]);
    }
  }

  application.activeWindow.command("k", false);
  for (var h = 0; h < abweich.length; h++) {
    //Tag festlegen, tagb inkl. Blank, indp inkl. Pipes
    if (abweich[h].indexOf("|") == -1) {
      tag = abweich[h].substr(0, 3);
      tagb = abweich[h].substr(0, 4);
      ind = "";
      indp = "";
      inh = abweich[h].substr(4);
    } else {
      tag = abweich[h].substr(0, 3);
      tagb = abweich[h].substr(0, 4);
      ind = abweich[h].substr(5, 1)
        indp = abweich[h].substr(4, 3)
        inh = abweich[h].substr(7);
    }

    //Beim Einlesen des Inhalts befindet sich noch ein \r am Ende der Zeile, das muss raus
    inh = inh.replace(/\r/, "");

    //Feld in der Gruppe der nie zu �bernehmenden? Wenn ja, n�chster
    if (f_nie.indexOf(tagb + indp) > -1) {
      continue;
    }

    //Wenn nicht in der Gruppe der nicht-wdh. kann Feld einfach eingef�gt werden
    if (f_nw.indexOf(tagb + indp) == -1) {
      //Soll Feld �berhaupt �bernommen werden? Nur weiter wenn ja, sonst continue --> gibt es auch welche , die immer �bernommen werden sollen? AfS fragen
      if ((f_immer.indexOf(tagb + indp) > -1) || (__gndConfirm(boxtit, "Wollen Sie das neue Feld/den neuen Feldinhalt in den Zieldatensatz �bernehmen?\n\n" + abweich[h]))) {
        __geheZuKat(tag, ind, false);
        application.overwriteMode = false;
        application.activeWindow.title.insertText(tagb + indp + inh + "\n");
        //Wenn Mailbox in Zielsatz �bernommen wird, soll es automatisch aus Quellsatz gel�scht werden, daher hier Abspeichern f�r sp�teres Suche/Ersetzen
        if (tag == "901") {
          qmbx_loesch.push(tagb + indp + inh + "\n");
        }
      } else { // Feld soll nicht �bernommen werden
        continue;
      }
    }

    //Feld in der Gruppe der nicht-wiederholbaren?
    if (f_nw.indexOf(tagb + indp) > -1) {
      //Feld schon vorhanden?  Wenn nicht, einfache �bernahme. Bei 011 u. 012 keine Nachfrage
      if (titz.indexOf("\n" + tagb + indp) == -1) {
        if ("011012".indexOf(tag) > -1) {
          uebern = "true";
        } else {
          uebern = __gndConfirm(boxtit, "Wollen Sie das neue Feld/den neuen Feldinhalt in den Zieldatensatz �bernehmen?\n\n" + abweich[h]);
        }

        if (uebern == "true") {
          __geheZuKat(tag, ind, false);
          application.overwriteMode = false;
          application.activeWindow.title.insertText(tagb + indp + inh + "\n");
        } else { // Feld soll nicht �bernommen werden
          continue;
        }

      } else { //wenn Feld vorhanden, Nachfrage, au�er bei 100 und denen die immer �bernommen werden sollen
        if (tag == "100") {
          aktion = "k";
        } else if (f_immer.indexOf(tagb + indp) > -1) {
          aktion = "a";
        } else {
          boxTxt = "Abweichendes Quellfeld:\n " + tagb + indp + inh + "\nSoll dieses Feld im Zielsatz\n\na\t -> angeh�ngt werden\ne\t -> das Zielfeld ersetzen?\nk\t -> in den Datensatz kopiert werden f�r Pr�fung vor dem Abschicken?";
          aktion = __prompterPruef(boxtit, boxTxt, "a,e,k", "");
        }
        if (aktion == "a") {
          if (anh_sk.indexOf(tag.substr(0, 3)) > -1) {
            __geheZuKat(tag, ind, true);
            application.overwriteMode = false;
            application.activeWindow.title.insertText(";" + inh);
          } else if (anh_sl.indexOf(tag.substr(0, 3)) > -1) { //Slash muss gar nicht hinzugef�gt werden, weil Anfangstrenner
            __geheZuKat(tag, ind, true);
            //Pruefen, ob Inhalte schon vorhanden
            qinh_einzeln = inh.split("/");
            zinh = application.activeWindow.title.currentField;
            for (var i = 0; i < qinh_einzeln.length; i++) {
              if (zinh.indexOf(qinh_einzeln[i]) == -1) {
                application.overwriteMode = false;
                application.activeWindow.title.insertText("/" + qinh_einzeln[i]);
              }
            }
          } else if (anh_sb.indexOf(tag.substr(0, 3)) > -1) {
            __geheZuKat(tag, ind, true);
            application.overwriteMode = false;
            application.activeWindow.title.insertText("; " + inh);
          } // und wenn ein Feld nicht angeh�ngt werden kann???
        } else if (aktion == "e") {
          __geheZuKat(tag, ind, true);
          application.activeWindow.title.deleteLine(1);
          application.overwriteMode = false;
          application.activeWindow.title.insertText(tagb + indp + inh + "\n");
        } else if (aktion == "k") {
          __geheZuKat(tag, ind, false);
          application.overwriteMode = false;
          application.activeWindow.title.insertText(tagb + indp + inh + "   !!!Pr�fen!!!\n");
        } else if (aktion == "") {
          continue;
        }
      }
    }

  }
  // Umlenkmarkierung in Verlierer einf�gen, falls Mailboxfeld 901 vorhanden, zur Korrektur/zum L�schen anzeigen
  application.activeWindow.command("f idn " + qidn, true)
  application.activeWindow.command("k", false);
  __geheZuKat("010", "", false);
  application.activeWindow.title.insertText("010 u\n");
  __geheZuKat("892", "", false);
  application.activeWindow.title.insertText("892 !" + zidn + "! *Umlenkung durch Umlenkskript\n");

  //Sonderfall Mailbox im Verlierersatz: soll zur Bearbeitung angezeigt werden
  //n901 pr�fen, Text anzeigen, ge�nderter Text (kann auch leer sein) ersetzt den alten
  //vorher bereits in den Zielsatz �bernommene qbx-Text l�schen, da die nie erhalten bleiben sollen
  for (var i = 0; i < qmbx_loesch.length; i++) {
    application.activeWindow.title.replaceAll(qmbx_loesch[i], "", false, false);
  }

  mbx = __katEinlesen("901");
  if (mbx.length > 0) {
    for (var i = 0; i < mbx.length; i++) {
      //Kardinalzahl der Mailbox
      kard = i + 1;
      mbx_neu = __gndPrompter(boxtit, kard + ". Mailboxtext", mbx[i]);
      application.activeWindow.title.startOfBuffer(false);
      application.activeWindow.title.replaceAll(mbx[i], mbx_neu, false, false)
    }
  }

  application.activeWindow.simulateIBWKey("FR");
  titq = application.activeWindow.copyTitle();
  application.activeWindow.clipboard = qidn;
  application.activeWindow.closeWindow();
  __gndMsg(boxtit, "Der Verlierersatz wurde folgenderma�en bearbeitet und abgespeichert. Seine IDN " + qidn + " befindet sich im Kopierspeicher zum erneuten Aufruf bei Bedarf.\n\n" + titq);
  //L�schen der Verlierersatz-IDN aus Profil
  application.writeProfileString("dnbUser", "qidn", "");
  //__dnbMeldung(boxtit,"Dies ist der Verlierersatz mit eingef�gter Umlenkmarkierung. Hinter diesem Fenster befindet sich der Gewinnersatz, ebenfalls noch im Korrekturstatus");
  //application.height("555");
  //Fenster kleiner machen, damit man das andere, das den Zielsatz im Korrkturstatus zeigt, sieht
}

function relCodeVergabe() {
  /*--------------------------------------------------------------------------------------------------
  Direkter Aufruf durch User in einem Datensatz. Bereitet die �bergabe von matTag an
  __relCodeVergabeIntern(matTag) vor und schreibt den zur�ckgegebenen Code dann an das Ende
  des Feldes, in dem sich der Cursor befindet

  Verwendete Unterfunktionen: __gndError, __relCodeVergabeIntern, __gndMsg

  2011-10-20  gr  : Erstellung
  --------------------------------------------------------------------------------------------------*/

  var boxtit = "Auswahl der Relationscodes"
    //Materialart ermitteln, �ber 005, weil bei Neuaufnahmen materialCode noch nicht zur Verf�gung steht
    var matArt = application.activeWindow.title.findTag("005", 0, false, false, false).substr(0, 2);
  var relCode = "";
  if ((matArt.substr(0, 1) != "T") || (!application.activeWindow.title)) {
    __gndError(boxtit, "Funktion kann nur in einem Eingabebildschirm eines Normdatensatzes aufgerufen werden!");
    return false;
  }
  tag = application.activeWindow.title.tag;
  inh = application.activeWindow.title.currentField;
  matTag = matArt.substr(0, 2) + tag;

  application.activeWindow.title.endOfField(false);

  //ist RelCode schon vorhanden?  Wenn ja, ohne $4 einlesen
  relPos = inh.indexOf("$4");
  if (relPos > -1) {
    relCode = inh.substr(relPos + 2);
    application.activeWindow.title.startOfField(false);
    application.activeWindow.title.charRight(relPos, false)
    application.activeWindow.title.endOfField(true);
  }

  code = __relCodeVergabeIntern(matTag, relCode);

  if (code) {
    //Positivmeldung soll nur erfolgen, wenn ein bereits eingegebener Code gepr�ft wurde
    if (relCode != "") {
      __gndMsg(boxtit, "OK!\nDer Code f�r die Beziehung\n\n" + relCode + "\n\nkann im Feld " + tag + " vergeben werden.");
    }
    application.activeWindow.title.insertText("$4" + code);
  } else {
    application.activeWindow.title.endOfField(false);
    application.activeWindow.title.insertText("???");
  }

}

function __relCodeVergabeIntern(matTag, relCode) {
  /*-------------------------------------------------------------------------------------------------------------
  Skript zur Vergabe bzw. Pr�fung der Relationscodes. Liest Datei im WinIBW-Programm-Verzeichnis aus, in der in einer Tabelle in Spalte 1 die Codes und
  in Spalte 2 die Materialart und das Feld, in dem der Code vorkommen kann, als Kombination (zB "Tp510") stehen.

  Vorhandene Unterfunktionen: __gndError, __prompterPruef

  2011-10-20  S. Grund  : Erstellung
  2012-03-06  S. Grund  : Anpassung f�r Popups, wenn mehr Codes als 35
  2012-11-06  S. Grund  : RelaCodes-Dateipfad flexibel gemacht (entw. ttlcopy oder defaulte\relationscodes)
  -------------------------------------------------------------------------------------------------------------*/

  var boxtit1 = "Auswahl des Codes f�r die Beziehung";
  var boxtit2 = "Pr�fung des Codes f�r die Beziehung";
  var tag = matTag.substr(2);
  var matArt = matTag.substr(0, 2);
  var datIn = utility.newFileInput();
  relaCodes = new Array();
  var frage1 = "";
  var frage2 = "";
  var frage2a = "";
  var frage3 = "";
  var wertePruef = "";
  var w = ""; //Variable, falls "weiter" f�r weitere Relationscodes notwendig


  if (!(datIn.openSpecial("BinDir", "\\ttlcopy\\relaCodes" + tag.substr(0, 1) + "xx.txt"))) {
    if (!(datIn.openSpecial("BinDir", "\\defaults\\relationscodes\\relaCodes" + tag.substr(0, 1) + "xx.txt"))) {
      __gndError(boxtit1, "Die Datei relaCodes" + matTag.substr(2, 1) + "xx.txt ist weder in \\defaults\\relationscodes\\relaCodes noch in \\ttlcopy vorhanden!");
      return false;
    }
  }
  //var datTest = datIn.openSpecial("BinDir","\\defaults\\relationscodes\\relaCodes" + tag.substr(0,1) + "xx.txt");

  //if(datTest == 1) {  //wenn Datei vorhanden, jede Zeile durchgehen und nach �bergebener matTag-Kombination suchen
  while (!datIn.isEOF()) {
    zeile = datIn.readLine();
    if (zeile.indexOf(matTag) > -1) {
      zeileArr = zeile.split("\t");
      relaCodes.push(zeileArr[0] + "  :  " + zeileArr[1]);
    }
  }
  //} else {
  //__gndError(boxtit1, "Datei \\defaults\\relationscodes\\relaCodes" + matTag.substr(2,1) + "xx.txt ist im WinIBW-Verzeichnis nicht vorhanden!");
  //return false;
  //}

  if (relaCodes.length == 0) {
    __gndError(boxtit1, "In der Materialart " + matArt + " sind im Feld " + tag + " keine Codes f�r eine Beziehung vorgesehen!");
    return false;
  }

  frage1 = "Welcher Code f�r die Beziehung ($4) soll vergeben werden? Im Feld " + tag + " eines " + matArt + "-Satzes sind m�glich:\n\n";
  i = 0;
  //Erzeugung der Liste der m�glichen Codes + Beschreibung f�r die Inputbox
  for (var codes in relaCodes) {
    if (i < 35) {
      frage2 += (i + 1) + "  -->  " + relaCodes[i] + "\n";
      //Codes (ohne Beschreibung) und laufende Nummern werden auch in wertePruef-Variable geschrieben, damit sp�ter die Nutzereingabe gepr�ft werden kann
    } else {
      frage2a += (i + 1) + "  -->  " + relaCodes[i] + "\n";
    }

    wertePruef += (i + 1) + " " + relaCodes[i].substr(0, 4) + " ";
    i++;
  }
  frage2 += "\n";

  if (frage2a) {
    frage2 += "--> F�r weitere Codes \u0022w\u0022 eingeben! <--\n";
    frage2a += "\n";
    w = "w";
  }

  //falls bereits relCode �bergeben wurde, wird er gepr�ft
  if (relCode != "") {
    if (wertePruef.indexOf(relCode) == -1) {
      __gndError(boxtit2, "Der Code f�r die Beziehung\n\n" + relCode + "\n\nkann im Feld " + tag + " nicht vergeben werden!"),
      relCode = "";
    } else {
      return relCode;
    }
  }

  if (relCode == "") {
    frage3 = "Bitte geben Sie zur Auswahl die laufende Nummer oder den Code an."
      ausw = __prompterPruef(boxtit1, frage1 + frage2 + frage3, "\n" + wertePruef + "\n" + w, "");

    if (ausw == "w" && frage2a) {
      ausw = __prompterPruef(boxtit1, frage1 + frage2a + frage3, "\n" + wertePruef + "\n", "");
    }

    //Abbruch
    if ((ausw == null) || (ausw == "") || ausw == "w") {
      return false;
      //Angabe einer laufenden Nummern
    } else if (ausw.length < 3) {
      return relaCodes[(ausw - 1)].substr(0, 4);
      //Angabe des Codes direkt
    } else {
      return ausw;
    }

  }

  return;

}

function __gndPrompter(ttl, txt, dflt) {
  /*--------------------------------------------------------------------------------------------------------
  __gndPrompter(ttl,txt,dflt)

  Die interne Funktion oeffnet eine Input-Box und gibt den eingegebenen Wert zur�ck.
  Mit Parameter ttl kann der Text fuer die Titelzeile der Eingabebox uebergeben werden.
  Parameter txt enthaelt den Text der Input-Box und mit dflt kann ein Default-Wert definiert werden.

  Historie:
  2010-08-09 Stefan Grund        : erstellt
  --------------------------------------------------------------------------------------------------------*/
  var prompter = utility.newPrompter();
  var msg;

  msg = prompter.prompt(ttl, txt, dflt, null, null);
  if (msg == 1)
    msg = prompter.getEditValue();
  else
    msg = null;

  return msg;

}

function __gndConfirm(boxtit, meldungstext) {
  /*--------------------------------------------------------------------------------------------------------
  __dnbConfirm(boxtit,meldungstext) boolean

  Die interne Funktion ruft ein PopUp-Fenster mit den Buttons OK und Abbrechen auf.
  Mit dem Parameter boxtit kann man den Titel des Fensters mitgeben, mit Parameter meldungstext den Text.
  Die Funktion liefert true zur�ck, wenn OK angeklickt wurde, false bei Abbrechen.

  Historie:
  2010-08-09 Bernd Althaus        : erstellt
  --------------------------------------------------------------------------------------------------------*/

  var prompter = utility.newPrompter();
  return (prompter.confirm(boxtit, meldungstext));
}

function GND670date() {

  /*--------------------------------------------------------------------------------------------------------
  Die Funktion f�gt ein Feld 670 mit aktuellem Tagesdatum und http:\\... in einen GND-Datensatz ein

  Historie:
  ????-??-?? Bernd Althaus        : erstellt
  2013-06-23 Stefan Grund            : Bedingungen ge�ndert; Materialart wird jetzt direkt �ber 005 abgefragt, damit auch neu erfasste Datens�tze bearbeitet werden k�nnen
  --------------------------------------------------------------------------------------------------------*/

  var boxtit = "Internetquelle f�r GND-Satz erfassen";
  var typ = __katEinlesen("005");
  if (typ.length > 0) {
    typtest = typ[0].substr(4, 2);
  } else {
    typtest = "xyz";
  }
  var jetzt = new Date();
  var datum = new Array();
  var strDate;
  var typErlaubt = "Tb Tf Tg Tn Tp Ts Tu";
  if (typErlaubt.indexOf(typtest) == -1) {
    __gndError(boxtit, "Diese Funktion kann nur in einem GND-Satz (" + typErlaubt + ") in der Vollanzeige oder dem Eingabe- oder Korrekturmodus verwendet werden!");
    return false;
  }

  datum[0] = jetzt.getDate();
  datum[1] = jetzt.getMonth() + 1;
  datum[2] = jetzt.getFullYear();
  //Tag und Monat immer zweistellig
  for (i = 0; i < 2; i++) {
    datum[i] = datum[i].toString();
    if (datum[i].length == 1) {
      datum[i] = "0" + datum[i]
    }
  }
  strDate = datum[0] + "." + datum[1] + "." + datum[2]

    if (!application.activeWindow.title) {
      application.activeWindow.command("k", false);
    }

    application.activeWindow.title.endOfBuffer(false);
  application.activeWindow.title.insertText("670 $bStand: " + strDate + "$u");

}