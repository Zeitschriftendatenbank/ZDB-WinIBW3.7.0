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
function onLoad()
{
	bContentsChanged = false;
	richtlinie = application.getProfileString("Richtlinie", "Einrichtung", "");
	var radioindex = 1;
	switch(richtlinie){
		case "GBV":
			radioindex = 0;
			break;
		case "ZDBFormat":
			radioindex = 1;
			break;
		default:
			radioindex = 1;
	}
	document.getElementById("idRadioRichtlinie").selectedIndex = radioindex;
	document.getElementById("idAuswahlRichtlinie").value = "Ausgewählte Richtlinie: " + richtlinie;
}

//----------------------------------------------------------------------------
function onAccept()
{
	zeigeRichtlinie();
}

//----------------------------------------------------------------------------
function onCancel()
{
	window.close();
}

function richtlinieGBV()
{
	application.writeProfileString("Richtlinie", "Einrichtung", "GBV");
	document.getElementById("idAuswahlRichtlinie").value = "Ausgewählte Richtlinie: GBV";

}
function richtlinieZDB()
{
	application.writeProfileString("Richtlinie", "Einrichtung", "ZDBFormat");
	document.getElementById("idAuswahlRichtlinie").value = "Ausgewählte Richtlinie: ZDBFormat";

}
//-----------------------------------------------------------------------------
function zeigeRichtlinie()
{
	var strkat = document.getElementById('idKategorie').value;
	var laengeKat = strkat.length;
	var richtlinie = application.getProfileString("Richtlinie", "Einrichtung", "");

	if (laengeKat < 3 || laengeKat > 4) {
		alert("Bitte geben Sie eine 3- oder 4-stellige Kategorie ein!");
		//Wird erneut angezeigt:
		open_xul_dialog("chrome://ibw/content/xul/gbv_kategorie_dialog.xul", null);
		return;
	}

	switch(richtlinie) {
		case "ZDBFormat":
			//neue URL:
			application.shellExecute ("https://www.zeitschriftendatenbank.de/erschliessung/zdb-format/" + strkat, 5, "open", "");
			break;
		default:
		//wenn "GBV" oder nichts eingestellt ist, wird die GBV-Richtlinie verwendet
			switch(laengeKat){
				case 4:
					application.shellExecute ("http://www.gbv.de/vgm/info/mitglieder/02Verbund/01Erschliessung/02Richtlinien/01KatRicht/" + strkat + ".pdf", 5, "open", "");
					break;
				case 3:
					application.shellExecute ("http://www.gbv.de/vgm/info/mitglieder/02Verbund/01Erschliessung/02Richtlinien/01KatRicht/norm/" + strkat + ".pdf", 5, "open", "");
					break;
			}
	}
}