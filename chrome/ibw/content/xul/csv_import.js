//============================================================================
// datenmasken_dialog.js
//
// Maintenance dialog for Datenmasken (GBV / BSZ specific).
// Dialog is implemented in datenmasken_dialog.xul, and called from
// scripts/datenmasken.js.
//
// Anpassung GBV: Wir speichern die Datenmasken nicht in .../defaults/datenmasken
//               sondern direkt unterhalb des WinIBW3-Verzeichnisses
//============================================================================



var application = Components.classes["@oclcpica.nl/kitabapplication;1"]
					.getService(Components.interfaces.IApplication);

var currentFilename = "";
var bContentsChanged;
var dialogTitle = "";
var theFileName = "";
var currentIndex = 0;

// get params from open_xul_dialog()
var params = this.arguments[0].QueryInterface(Components.interfaces.nsIDialogParamBlock);


const utility =
{
	newFileInput: function() {
		return Components.classes["@oclcpica.nl/scriptinputfile;1"]
					.createInstance(Components.interfaces.IInputTextFile);
	},
	newFileOutput: function() {
		return Components.classes["@oclcpica.nl/scriptoutputfile;1"]
					.createInstance(Components.interfaces.IOutputTextFile);
	},
	newPrompter: function() {
		return Components.classes["@oclcpica.nl/scriptpromptutility;1"]
					.createInstance(Components.interfaces.IPromptUtilities);
	}
};

//----------------------------------------------------------------------------
function getSpecialDirectory(name)
{
	const nsIProperties = Components.interfaces.nsIProperties;
    var dirService = Components.classes["@mozilla.org/file/directory_service;1"]
    					.getService(nsIProperties);

    return dirService.get(name, Components.interfaces.nsIFile);
}

//----------------------------------------------------------------------------
function loadFileByName()
{
try {
	var theList = document.getElementById('idFileListMenu');
	document.getElementById('idFileEdit').value = theFileContent;
	theFileInput.close();
	theFileInput = null;
	currentFilename = theList.value;
	document.getElementById('idSaveMsg').value = " ";
    } catch(e) { alert('loadFileByName: '+ e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function onLoad()
{
    try {
        var dirs = ['datenmasken', 'csv'],
        i = 0;
        for (var x = 0; x < dirs.length; x += 1) {
            var arNames = [];
            // Get the user's files:
            theDir = getSpecialDirectory("ProfD");

            theDir.append(dirs[x]);
            if (theDir.exists()) {
                theDirEnum = theDir.directoryEntries;
                while (theDirEnum.hasMoreElements()) {
                    var theItem = theDirEnum.getNext();
                    var theFile = theItem.QueryInterface(Components.interfaces.nsIFile);
                    if (theFile.isFile()) {
                        for (found = false, i = 0; (i < arNames.length) && !found; i++) {
                            found = (arNames[i] == theFile.leafName);
                        }
                        if (!found) arNames.push(theFile.leafName);
                    }
                }
            }
            arNames.sort();
            var theFileList = document.getElementById("idFileList" + x);
            //update FileListMenu with removing all old stofs
            while (theFileList.firstChild) { theFileList.removeChild(theFileList.firstChild); }
            for (i = 0; i < arNames.length; i++) {
                var theEle = document.createElement("menuitem");
                theEle.setAttribute("label", arNames[i]);
                theEle.setAttribute("value", arNames[i]);
                theFileList.appendChild(theEle);
                if (arNames[i] == currentFilename) {
                    currentIndex = i;
                }
            }

            document.getElementById("idFileListMenu" + x).selectedIndex = currentIndex;
            //loadFileByName();
            arNames = null;
        }



    } catch (e) { alert('LoadFiles: ' + e.name + ': ' + e.message); }
}

//----------------------------------------------------------------------------
function onAccept()
{
	params.SetString(1, document.getElementById('idFileListMenu0').value);
	params.SetString(2, document.getElementById('idFileListMenu1').value);
	params.SetString(3, document.getElementById('separator').value);
	if(document.getElementById('idCheckboxTest').checked) {
        params.SetInt(4, 1);
    }
    var norm = (document.getElementById('idCheckboxNorm').checked) ? ' n' : '';
	params.SetString(5,norm);
    params.SetInt(6, parseInt(document.getElementById('counter').value));
}

//----------------------------------------------------------------------------
function onCancel()
{
	params.SetString(1, "cancel");
}
