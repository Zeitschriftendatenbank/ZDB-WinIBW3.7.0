//============================================================================
// kategorienBeschreibung.js
// Erstellt: GBV, Karen Hachmann 
//============================================================================
// 
//c:/programme/winibw30/profiles/<name> /user_pref.js


var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);
var bContentsChanged;
const utility = 
{
	newPrompter: function() {
         return Components.classes["@oclcpica.nl/scriptpromptutility;1"]
                                   .createInstance(Components.interfaces.IPromptUtilities);
   }
};
//----------------------------------------------------------------------------
//RDA Einführung: Ab April 2015 beginnen die Online-Schulungen
//Dafür wird der CBS-Rechner CBST3 zur Verfügung gestellt.
//Mit der nachfolgenden Prüfung kann man feststellen, ob die Anwender
//auf dem CBST3 arbeiten. Wenn pruefeRDAsystem() == true, dann sollen
//einige Katalogisierungsfunktionen RDA-gerecht ablaufen.
function pruefeRDAsystem(){
	var strSystem = application.activeWindow.getVariable("P3GSY");
	if (strSystem.indexOf("CBST3") >= 0){
		return true;
	} else {
		return false;
	}
}

//----------------------------------------------------------------------------
function onLoad()
{
	bContentsChanged = false;
	document.getElementById("idRadioQuelle").selectedIndex = application.getProfileInt("Onlinehilfe", "Thema", "");
}

//----------------------------------------------------------------------------
function onCancel()
{
	window.close();
}

function onAccept()
{
	var strSuche = strSuche = document.getElementById('idSuche').value;
	var hilfethema = document.getElementById("idRadioQuelle").selectedIndex;
	var lSuche = strSuche.length;
	//0 = Kommandos, 1 = Suchschlüssel, 2 = WinIBW3-Wiki, 3 = Katalogisierungsrichtlinie GBV, 4 = ZDBFormat
	switch(hilfethema) {
		case 0:
			if (lSuche > 0){
				application.activeWindow.command("\\hel " + strSuche, false);
				if(application.activeWindow.status=="OK"){
				}else {
					alert("Hilfe zur Kommandosyntax kann jetzt nicht aufgerufen werden! Bitte zuerst einloggen!")
					open_xul_dialog("chrome://ibw/content/xul/gbv_hilfe_dialog.xul", null);
				}
			}else{
				suchbegriffFehlt();
			}
			break;
		case 1:
			if (lSuche > 0){
				application.activeWindow.command("\\hel _index" + strSuche, false);
				if(application.activeWindow.status=="OK"){
					window.close();
				}else {
					alert("Hilfe zu Suchschlüsseln kann jetzt nicht aufgerufen werden! Bitte zuerst einloggen!")
					open_xul_dialog("chrome://ibw/content/xul/gbv_hilfe_dialog.xul", null);
				}
			}else{
				suchbegriffFehlt();
			}
			break;
		case 2:
			if (strSuche == ""){
				application.shellExecute ("http://www.gbv.de/wikis/cls/WinIBW3:Handbuch", 5, "open", "")
			}else {
				application.shellExecute ("http://www.gbv.de/wikis/cls/index.php?title=Spezial%3ASearch&search=WinIBW3%3A+" + 
					strSuche + "&fulltext=Suchen", 5, "open", "")
			}
			window.close();
			break;
		case 3:
			//Katalogisierungsrichtlinie RAK:
			var strURL = "http://www.gbv.de/bibliotheken/verbundbibliotheken/02Verbund/01Erschliessung/02Richtlinien/01KatRicht/";
			if (pruefeRDAsystem() == true){
				//Katalogisierungsrichtlinie RDA:
				strURL = "http://www.gbv.de/bibliotheken/verbundbibliotheken/02Verbund/01Erschliessung/02Richtlinien/02KatRichtRDA/";
			}
			//Länge der Kategorie: 0 = ohne Kategorie, 4 = Titel, 3 = Normdaten
			switch(lSuche){
			case 0:
				application.shellExecute (strURL + "inhalt.shtml", 5, "open", "");
				window.close();
				break;
			case 4:
				application.shellExecute (strURL + strSuche + ".pdf", 5, "open", "");
				window.close();
				break;
			case 3:
				application.shellExecute (strURL + "norm/" + strSuche + ".pdf", 5, "open", "");
				window.close();
				break;
			default: 
				alert("Bitte geben Sie eine 4-stellige Titelkategorie\n oder eine 3-stellige Normdatenkategorie ein!");
				break;
			}
			break;
		case 4:
			if(lSuche == 0){
				application.shellExecute ("http://www.zeitschriftendatenbank.de/zdbformat/", 5, "open", "");
				window.close();
			}
			else if (lSuche == 3 || lSuche == 4){
				var re = new RegExp("480.|482[02]|6700|7...|8[0-5]..");
				if(re.test(strSuche)) {
					application.shellExecute ("http://www.zeitschriftendatenbank.de/erschliessung/arbeitsunterlagen/zdbformat/" + strSuche, 5, "open", "");
				} else {
					application.shellExecute ("http://www.zeitschriftendatenbank.de/fileadmin/user_upload/ZDB/pdf/zdbformat/" + strSuche + ".pdf", 5, "open", "");
				}
				window.close();
			}
			else {alert("Bitte geben Sie eine 4-stellige Titelkategorie\n oder eine 3-stellige Normdatenkategorie ein!");
			}
			break;
	}
	//Zum guten Schluss wird die Auswahl für das nächste Mal gespeichert:
	application.writeProfileInt("Onlinehilfe", "Thema", hilfethema);
}

function suchbegriffFehlt()
{
	alert("Zu welchem Thema wünschen Sie Informationen? Bitte tragen Sie einen Suchbegriff ein!")
	open_xul_dialog("chrome://ibw/content/xul/gbv_hilfe_dialog.xul", null);
	document.getElementById("idSuche").focus();

}