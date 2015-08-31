/* \zoe ppn 000089605 OR ppn 000089613 OR ppn 000089621 OR ppn 000089648 OR ppn 000089656  OR ppn 000089664 OR ppn 000089672
*/
var application = Components.classes["@oclcpica.nl/kitabapplication;1"].getService(Components.interfaces.IApplication);
var theURLCheck = Components.classes["@oclcpica.nl/urlchecker;1"].createInstance(Components.interfaces.IURLChecker);

var bSetProcessing = false;
var setName = null;
var setSize = 1;
var curRecord = 1;

var	nrRecsUpdated = 0;
var nrRecsUpdateFailed = 0;
var nrRecsUnmodified = 0;
var	nrRecsReallyProcessed = 0;
var nrRecsFailed = 0;
var nrRecsWithURL = 0;
var nrRecsWithoutURL = 0;
var failedRecords = new Array();

function logMessage( msg )
{
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                           .getService(Components.interfaces.nsIConsoleService);

    if ( consoleService ) {
		consoleService.logStringMessage(msg);
    }
}

function searchFailedRecords()
{
	var theCommand = "\\zoe ppn ";
	theCommand += failedRecords.join(" | ppn ");
	var bNewWindow = document.getElementById("openInNewWindow").checked;
	application.activeWindow.command(theCommand, bNewWindow);
	var theDialog = document.getElementById("idDialog");
	theDialog.cancelDialog();
}

function addToFailedRecords()
{
	var ppn = application.activeWindow.getVariable("P3GPP");
	failedRecords[failedRecords.length] = ppn;
}

function displayStatistics()
{
	var theDlgHeader = document.getElementById("dlgHeader");
	
	theDlgHeader.setAttribute("title", "URL checking completed");
	theDlgHeader.setAttribute("description", "processed " + setSize + ' records');

	document.getElementById("vboxTree").collapsed = true;
	document.getElementById("vboxResults").collapsed = false;
	
	if (failedRecords.length > 0) {
		document.getElementById("vboxSearchPPNs").collapsed = false;
	}
	
	document.getElementById("nrRecsProcessed").value = setSize;
	document.getElementById("nrURLsOK").value = document.getElementById("urlWorking").value;
	document.getElementById("nrRecsFailed").value = nrRecsFailed;
	document.getElementById("nrURLsBroken").value = document.getElementById("urlBroken").value;
	document.getElementById("nrRecsReallyProcessed").value = nrRecsReallyProcessed;
	document.getElementById("nrRecsWithURL").value = nrRecsWithURL;
	document.getElementById("nrRecsUpdated").value = nrRecsUpdated;
	document.getElementById("nrRecsWithoutURL").value = nrRecsWithoutURL;
	document.getElementById("nrRecsUnmodified").value = nrRecsUnmodified;
	document.getElementById("nrRecsUpdateFailed").value = nrRecsUpdateFailed;
}

function updateProgress()
{
	try {
		var nrTotals = 0;
		var soFar = 0;

		if (bSetProcessing) {
			nrTotals = setSize;
			soFar = curRecord;
			
			// we estimate a progress for the URLs
			var partOfCurrentRecord = 1 - (document.getElementById("urlSoFar").value / document.getElementById("urlTotal").value);
			soFar -= partOfCurrentRecord;
		} else {
			nrTotals = document.getElementById("urlTotal").value;	
			soFar = document.getElementById("urlSoFar").value;
		}
		
		var thePercentage = Math.round((soFar * 100) / nrTotals);
		document.getElementById("progress").setAttribute('value', thePercentage);
	}
	catch (e) {}
}

const gObserver = {
	// this doesn't have real XPCOM observer semantics
	observe: function(subject, topic, data) {
		if (topic == "processingComplete") {
			if (bSetProcessing) {
				var bUpdated = theURLCheck.updateRecord(application.activeWindow.title);
				nrRecsReallyProcessed++;
				updateProgress();
				if (subject == null) {
					nrRecsWithoutURL++;
				} else {
					nrRecsWithURL++;
				}
				
				if (bUpdated) {
					application.activeWindow.simulateIBWKey("FR");
					if (application.activeWindow.status == "OK") {
						nrRecsUpdated++;
					} else {
						addToFailedRecords();
						nrRecsUpdateFailed++;
						if (application.activeWindow.title) {
							// don't leave a title edit control hanging around
							application.activeWindow.simulateIBWKey("FE");						
						}
					}
				} else {
					nrRecsUnmodified++;
					application.activeWindow.simulateIBWKey("FE");
				}
						
				if (curRecord < setSize) {
					// we are not yet ready
					// switch to next record
					curRecord++;
					window.setTimeout(processRecordsInSet, 0);
				} else {
					// we are ready
					var theDialog = document.getElementById("idDialog");
					var theButton = theDialog.getButton("cancel");
					theButton.label = "OK";
					window.setTimeout(displayStatistics, 0);
				}
			} else {
				var theDialog = document.getElementById("idDialog");
				var theButton = theDialog.getButton("accept");
				theButton.disabled = false;
			}
		} else if (topic == "urlProcessed") {
			var soFarEle = document.getElementById("urlSoFar");
			var soFar = parseInt(soFarEle.value);
			soFarEle.value = ++soFar;

			var grandTotalEle = document.getElementById("urlGrandTotal");
			var grandTotal = parseInt(grandTotalEle.value);
			grandTotalEle.value = ++grandTotal;

			updateProgress();
			
			if (data == "OK") {
				var okEle = document.getElementById("urlWorking");
				var ok = parseInt(okEle.value);
				okEle.value = ++ok;
			} else {
				var nokEle = document.getElementById("urlBroken");
				var nok = parseInt(nokEle.value);
				nokEle.value = ++nok;
			}
		}
	}
};

function setDialogTitleAndDescription()
{
	var theDlgHeader = document.getElementById("dlgHeader");
	var ppn = application.activeWindow.getVariable("P3GPP");
	
	theDlgHeader.setAttribute("title", "Checking URLs of PPN: " + ppn);
	theDlgHeader.setAttribute("description", "processing record " + curRecord + '/' + setSize);
}

function editRecord() {
	// if we still have a title in front of us, cancel it (should never happen)
	if (application.activeWindow.title) {
		application.activeWindow.simulateIBWKey("FE");
	}

	if (curRecord > setSize) {
		// should never happen
		return false;
	}
	
	// ok, now let's edit the record
	application.activeWindow.command('\\mut ' + setName + ' ' + curRecord, false);
	
	// return if this was successful or not
	var bSuccess = (application.activeWindow.title != null);
	if (!bSuccess) {
		nrRecsFailed++;
	}
	
	setDialogTitleAndDescription();
	
	return bSuccess;
}

function getURLfromTag(theTag)
{
	const theRegex = /^856 [4#]..*?\$u([^$]*).*/;
	if (!theTag.match(theRegex)) {
		return null;
	}
	var theURL = theRegex.exec(theTag);
	return theURL[1];
}

function performURLChecking()
{
	var urlsToCheck = 0;
	var occ = 0;
	var theTag = "";

	var soFarEle = document.getElementById("urlSoFar");
	soFarEle.value = "0";

	theTag = application.activeWindow.title.findTag("856", occ, true, true, false);

	while (theTag != "") {
		var theURL = getURLfromTag(theTag);
		if (theURL != null && theURL != "") {
			theURLCheck.addItem(occ, theURL, theTag);
			urlsToCheck++;
		}
		occ++;
		theTag = application.activeWindow.title.findTag("856", occ, true, false, false);
	}

	if (urlsToCheck == 0) {
		// nothing to do
		if (bSetProcessing) {
			// we are processing a set; tell the observer that we are ready and return
			gObserver.observe(null, "processingComplete", "processingComplete");
			return;
		} else {
			// we are in interactive mode; display a message
			var theDialog = document.getElementById("idDialog");
			application.messageBox("URLChecker", "The record does not contain any URLs processible by the URLChecker", "message-icon");
			theDialog.cancelDialog();
			return;
		}
	}
	
	var theTree = document.getElementById("ResultTree");
	theTree.view = theURLCheck.QueryInterface(Components.interfaces.nsITreeView);
	document.getElementById("urlTotal").value = urlsToCheck;
	theURLCheck.startProcessing(gObserver);
}

function processRecordsInSet()
{
	// we can not use a loop due to our asynchronous handling
	// first reset the URLChecker object and detach the view
	var theTree = document.getElementById("ResultTree");
	theTree.view = null;
	theURLCheck.reset();
	
	// put the record in edit mode, we need to use a loop here
	while (curRecord <= setSize && !editRecord()) {
		curRecord++;
	}
	
	// if we don't have a title here, we have to give up
	if (!application.activeWindow.title) {
		return;
	}
	
	performURLChecking();
}

//---------------------------------------------------
function onLoad()
{
	// first disable the OK button
	var theDialog = document.getElementById("idDialog");
	var theButton = theDialog.getButton("accept");
	theButton.disabled = true;
	curRecord = 1;
	
	if (window.arguments != null) {
		// hey we are processing a set
		theButton.collapsed = true; // hide the OK Button
		bSetProcessing = true;
		setName = "S" + application.activeWindow.getVariable("P3GSE");
		setSize = application.activeWindow.getVariable("P3GSZ");
		// go into full presentation once to avoid short presentation continuously
		application.activeWindow.command('\\too ' + setName + ' ' + curRecord, false);
		window.setTimeout(processRecordsInSet, 0);
	} else {
		bSetProcessing = false;
		setName = null;
		setSize = 1;
		theButton.label = "Update record";
		setDialogTitleAndDescription();
		window.setTimeout(performURLChecking, 0);
	}
}


//---------------------------------------------------
function onAccept()
{
	theURLCheck.updateRecord(application.activeWindow.title);
}

//---------------------------------------------------
function onCancel()
{
	//alert("onCancel");
}

