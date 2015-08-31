/***************************************************************************************************************
 *	MAB2_download.js
 *
 *	This file contains the utility script for downloading a record and optionally processing it for a local 
 *	system. Adapted from the original script for Libero.
 *
 *	It will do the following:
 *
 *	1.) download a record to a certain file and/or copy it to the clipboard.
 *	2.) preprocess the download file (remove first two lines, perform character conversion)
 *	3.) optionally invoke a converter program
 *
 *  The following settings must be done to make this script work correctly, using the options dialog:
 *
 *	- The download format; one of three preset format, or a user defined format.
 *  - Specify if downloads are appended to the download file, or overwriting the file.
 *  - Specify if a line separator is to be used between downloaded records (CR\LF combination).
 *  - Specify if the downloaded record will be copied to the clipboard.
 *  - Set the download URL for the download file; it MUST be a file:// URL, eg.
 *      Please note the syntax and make sure that special characters are correctly URL encoded
 *		file:///c:/documente%20und%Einstellungen/hofmann/theFile		// a path with spaces
 *		file://///servername/theFile									// a UNC path
 *		file://///servername/theFile%25COMPUTERNAME%25.txt				// a UNC name with environment variable
 *
 *  - The absolute path to the converter. This is just a native file path, eg:
 *			c:\programme\libero\converter.exe
 *			\\server\converter.exe
 *  - Specify if the converter is to be called. 
 *
 *	All settings are retrieved from the user preferences file. It the settings do not yet exist, the options
 *	dialog is presented.
 *
 *	Libero special:
 *	When the environment variables LIBERO_DWLURL and LIBERO_CONVERTER exist, it is not possible to edit these 
 *	fields in the options dialog. They are also not stored in the user preferences file.
 *
 *************************************************************************************************************** 
 *  $Header$	
 *
 *  $Log$
 *  Revision 1.2  2006/06/08 13:43:31  bouwmeef
 *  No full presentation anymore when the script is run in a short presentation screen.
 *  Thas was to circumvent a bug anyway.
 *
 *  Revision 1.1  2006/02/27 10:47:26  bouwmeef
 *  Renamed libero.js to MAB2_download.js
 *  Implemented "Libero Special".
 *
 *
 *	Original libero.js log:
 *
 *	Revision 1.13 2005/12/01 17:00		götz
 *  special character conversion of characters which cannot be decomposed added:
 * 		MAB-Subfieldtrenner (134)
 *
 *  Revision 1.12  2005/11/09 12:30     götz
 *  special character conversion of characters which cannot be decomposed added:
 *		TURK i -> i
 * 		Ain and Hamzah -> Apostroph(')
 *
 *  Revision 1.11  2005/09/14 10:30     götz
 *  special character conversion of characters which cannot be decomposed added:
 *  	LATIN CAPITAL LETTER L WITH STROKE -> L 
 *  	LATIN SMALL LETTER L WITH STROKE-> L
 *  	LATIN CAPITAL LETTER D WITH STROKE -> D
 *  	LATIN SMALL LETTER d WITH STROKE -> d
 *  	LATIN SMALL LETTER e WITH DIARESIS
 *  	LATIN SMALL LETTER i WITH DIARESIS
 *  	LATIN SMALL LETTER Y WITH DIARESIS
 *  	LATIN CAPITAL LETTER E WITH DIARESIS
 *
 *  Revision 1.10  2005/09/12 15:00:05  hofmann
 *	added "Disketten-MAB" Header to output
 *	
 *	Revision 1.9  2005/09/12 09:21:54  hofmann
 *	fixed bug with character conversion, which only converted first occurrence of special characters
 *	
 *	Revision 1.8  2005/08/05 10:54:27  hofmann
 *	added character conversion for characters that can not be simply decomposed
 *	fixed some stupid bugs
 *	
 *	Revision 1.7  2005/08/05 09:07:05  hofmann
 *	removal of empty lines (with dot) at end of record
 *	changed conversion to CP850 so it keeps base characters
 *	unconvertable characters will no longer be replaced by question marks but completely skipped
 *	conversion for MAB delimiter and non-sorting-mark
 *	
 *	Revision 1.6  2005/08/03 12:53:53  hofmann
 *	split up the first line into two after position 24
 *	throw away last line
 *	use new GUI handler
 *	
 *	Revision 1.5  2005/07/22 10:25:43  hofmann
 *	fixed file creation bug
 *	
 *	Revision 1.4  2005/07/22 09:27:02  hofmann
 *	Be a bit more verbose in error conditions
 *	
 *	Revision 1.3  2005/07/19 14:44:09  hofmann
 *	removed superfluous component
 *	
 *	Revision 1.2  2005/07/19 14:43:11  hofmann
 *	general postprocessing (remove first two lines)
 *	added character conversion stuff (composing, conversion to CP850)
 *	some bug fixes for file creation, etc
 *	
 *	Revision 1.1  2005/07/15 13:51:02  hofmann
 *	*** empty log message ***
 *
 ***************************************************************************************************************
 */

/*
	the following array is used to convert characters, which can not be simply decomposed
	add your special characters as required
*/

var charConv =	new Array();
charConv[String.fromCharCode(0x0131)] = "i";     // Türk. i -> i
charConv[String.fromCharCode(0x02BF)] = String.fromCharCode(0x0027); //Ain -> Apostroph (')
charConv[String.fromCharCode(0x02BE)] = String.fromCharCode(0x0027); //Hamzah -> Apostroph (')
charConv[String.fromCharCode(0x0152)] = "OE";	// Œ -> OE
charConv[String.fromCharCode(0x0153)] = "oe";	// œ -> oe
charConv[String.fromCharCode(0x0141)] = "L";  // LATIN CAPITAL LETTER L WITH STROKE -> L
charConv[String.fromCharCode(0x0142)] = "l";  // LATIN SMALL LETTER L WITH STROKE-> L
charConv[String.fromCharCode(0x0110)] = "D";  // LATIN CAPITAL LETTER D WITH STROKE -> D 
charConv[String.fromCharCode(0x0111)] = "d";  // LATIN SMALL LETTER d WITH STROKE -> d
charConv[String.fromCharCode(0x0065, 0x034F, 0x0308)] = String.fromCharCode(0x00EB); // LATIN SMALL LETTER e WITH DIARESIS
charConv[String.fromCharCode(0x0069, 0x034F, 0x0308)] = String.fromCharCode(0x00EF); // LATIN SMALL LETTER i WITH DIARESIS
charConv[String.fromCharCode(0x0079, 0x034F, 0x0308)] = String.fromCharCode(0x00FF); // LATIN SMALL LETTER Y WITH DIARESIS
charConv[String.fromCharCode(0x0045, 0x034F, 0x0308)] = String.fromCharCode(0x00CB); // LATIN CAPITAL LETTER E WITH DIARESIS
charConv[String.fromCharCode(0x001F)] = "$";	//Subfieldtrenner -> $
 
var downloadFormat	= "MAX";	// the download format added to the download command
var lineSeparator	= "\r\n"; 	// what we use as line separator in the output
var recordSeparator	= "";
var copyToClipboard	= false;	// copy the downloaded data to the clipboard
var appendDownload	= true;		// append downloads to existing file, or overwrite the file
var runConverter	= true;
var theConverter	= null;
var theDownloadURL	= "";



const prefDownloadURL 		= "ibw.libero.downloadURL";		// the WinIBW preference used for the downloadURL
const prefConverter			= "ibw.libero.converter";		// the WinIBW preference used for the converter
const prefDownloadFormat	= "ibw.libero.format";
const prefOtherFormat		= "ibw.libero.otherformat";
const prefDownloadAppend	= "ibw.libero.append";
const prefDownloadSeparator	= "ibw.libero.separator";
const prefCopyToClipboard	= "ibw.libero.copytoclipboard";
const prefRunConverter		= "ibw.libero.runconverter";

const envDownloadURL = "LIBERO_DWLURL";				// the ENVIRONMENT variable used for the downloadURL
const envConverter = "LIBERO_CONVERTER";			// the ENVIRONMENT variable used for the libero converter

const theEnv = Components.classes["@mozilla.org/process/environment;1"]
					.getService(Components.interfaces.nsIEnvironment);
/*const theIOService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
const thePrefs = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefBranch);
*/
var theUnicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
						.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
theUnicodeConverter.charset = "IBM850"

var ibwUConv = Components.classes["@oclcpica.nl/ibwuconv;1"]
						.createInstance(Components.interfaces.nsIIBWUConv);

// yes, sometimes we show a message
function showMessage(theMsg)
{
	application.messageBox("MAB2 Download", theMsg, "error-icon");
}

/*
  just to make sure we can do something
*/
function checkPreConditions(dummyParamToHideThisFunctionInWinIBW)
{
	// we require to be in a short or full presentation
	var scrId = application.activeWindow.getVariable("scr");
	
	if (scrId != "7A" && scrId != "8A") {
		showMessage("Dieses Skript kann nur aus einer Voll- oder Kurzanzeige heraus aufgerufen werden!");
		return false;
	}
	
	return true;
}

/* 
	read the settings from the preferences file
*/
function getPreferences(bFirstTime)
{
	try {
		theDownloadURL	 = expandEnvironmentVariables(getDownloadURL(null));
		appendDownload	 = thePrefs.getBoolPref(prefDownloadAppend);
		runConverter	 = thePrefs.getBoolPref(prefRunConverter);
		if (runConverter) {
			theConverter = getConverter(null);
		}
		copyToClipboard	 = thePrefs.getBoolPref(prefCopyToClipboard);
		var iFormat	 	 = thePrefs.getIntPref(prefDownloadFormat);
		var sOtherFormat = thePrefs.getCharPref(prefOtherFormat);
		if      (iFormat == 0) downloadFormat = "MAX"; 
		else if (iFormat == 1) downloadFormat = "MAX#";
		else if (iFormat == 2) downloadFormat = "MAX*";
		else if (iFormat == 3) downloadFormat = sOtherFormat;
		var bSeparator	= thePrefs.getBoolPref(prefDownloadSeparator);
		recordSeparator	= bSeparator ? "\r\n" : "";
	} catch(e) {
		// when there is a problem reading the preferences, show the options
		// dialog and try again. Do this only once, allowing the user to press
		// escape.
		if (bFirstTime) {
			// show the settings dialog:
			MAB2_download_dlg();
			// and try again:
			return getPreferences(false);
		}
		else { return false; }
	}
	return true;
}

/*
   Function to get the download URL
   It will try the following in sequence; if nothing succeeds, null is returned
   1. retrieve from environment variable
   2. retrieve from WinIBW preference
   The environment variable has precedence (Libero special).
*/
function getDownloadURL(dummyParamToHideThisFunctionInWinIBW)
{
	var sDownloadURL = "";

	if (theEnv.exists(envDownloadURL)) {
		return theEnv.get(envDownloadURL);
	}

	try {
		sDownloadURL = thePrefs.getCharPref("ibw.libero.downloadURL");
	}
	catch (e) {}

	return sDownloadURL;
}

/*
   Function to get the converter path
   It will try the following in sequence; if nothing succeeds, null is returned
   1. retrieve from environment variable
   2. retrieve from WinIBW preference
   The environment variable has precedence (Libero special).
*/
function getConverter(dummyParamToHideThisFunctionInWinIBW)
{
	var theConverter = null;

	try {
		theConverter = thePrefs.getCharPref(prefConverter);
		if (theConverter == "") {
			throw null;
		}
	}
	
	catch (e) {
		// try if we find it in the environment
		if (theEnv.exists(envConverter)) {
			theConverter = theEnv.get(envConverter);
			// we don't save as preference in this case
		}
	}
	
	// if we come here, we should have a converterPath
	try {
		// create an nsILocalFile for the converter
		var file = Components.classes["@mozilla.org/file/local;1"]
						.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(theConverter);
		
		if (!file.exists() || !file.isExecutable()) {
			// argh, seems to be an invalid setting
			throw null;
		}
	}
	
	catch (e2) {
		// ok, something is wrotten with the file
		// if our preference is a user-preference, we try to delete it
		var theConverterFile = null;
		if (thePrefs.prefHasUserValue(prefConverter)) {
			thePrefs.clearUserPref(prefConverter);
			// try again, this time the user should be prompted again
			theConverterFile = getConverter(null);
		}
		if (theConverterFile == null) {
			showMessage("Der Pfad zum Libero Konverter is ungültig.\nBitte überprüfen Sie Ihre Einstellungen.");
		}
		
		return theConverterFile; // we either have a valid one now, or we give up
	}
	
	return file;
}


/* 
simple helper function to expand environment variables
variables not found will be replaced by an empty string
*/
function expandEnvironmentVariables(theURL)
{
	if (theURL == null) return null;
	// our URL is url-encoded; a % will be represented as %25
	var theMatches = theURL.split(/(%25.*?)%25/g);
	
	if (theMatches == null) {
		// nothing to do
		return theURL;
	}
	
	for (var i = 0; i < theMatches.length; i++) {
		if (theMatches[i].search(/^%25/) == 0) {
			// looks like an environment variable
			theMatches[i] = theEnv.get(theMatches[i].substr(3));
		}
	}
	
	return theMatches.join("");
}

/* perform character conversion
   converting to plain CP850 doesn't seem good enough, we want to keep the base characters of diacritical
   combination that cannot be converted to CP850
   we also replace "++" with 0xCE and "::" with 0xAA but after conversion 
*/
function convert2CP850(theLine) {
	var retVal = "";
	
	// do some pre-character-conversion
	for (var search in charConv) {
		while (theLine.indexOf(search) > -1) {
			theLine = theLine.replace(search, charConv[search]);
		}
	}

	// we convert character by character
	for (var i = 0; i < theLine.length; i++) {
		var theChar = theLine.charAt(i);
		if (theChar == '?') {
			// ? is special, just copy it to output
			retVal += theChar;
		} else {
			// ok, let's try to convert it
			var theNewChar = "?";
			while (theNewChar == '?') {
				try {
					theNewChar = theUnicodeConverter.ConvertFromUnicode(theChar);
				}
				catch (e) {
					theNewChar = '?';
				}
				
				// theNewChar is either still a '?' or a valid converted char
				// if it is a '?', modify theChar and try again
				if (theNewChar == '?') {
					var decomposedChar = ibwUConv.UTF16Decompose(theChar);
					if (decomposedChar.length < 2) {
						// no chance, give up
						theNewChar = "";
						break;
					}
					
					// there is a chance to get it right, strip off last character
					decomposedChar = decomposedChar.substr(0, decomposedChar.length - 1);
					
					// now compose back and try again
					theChar = ibwUConv.UTF16Compose(decomposedChar);
				}
			}
			// if we come here, theNewChar will either be a converted character or an 
			// empty string; append it to the output
			retVal += theNewChar;
		}
	}
	
	//we should have the converted string in retVal now
	// perform substitution of the Delimiter now, i.e. "++" -> 0xCE
	retVal = retVal.replace(/\+\+/g, String.fromCharCode(0xCE));
	// substitution of non-sorting-mark, i.e. "::" -> 0xAA
	retVal = retVal.replace(/::/g, String.fromCharCode(0xAA));
	return retVal;
}


/* do some post-processing of the downloaded file*/
function postprocessDownload(theTempURL, theFileURL) {
	var bError = false;

	// first create a channel
	var theChannel = theIOService.newChannel(theTempURL, null, null);
	
	// get an input stream
	var theInputStream = theChannel.open();
	
	// get an scriptable input stream
	var theScriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
												.createInstance(Components.interfaces.nsIScriptableInputStream);

	theScriptableStream.init(theInputStream);
	// now get a line Input stream
	var theWorker = theInputStream.QueryInterface(Components.interfaces.nsILineInputStream);
	
	var theLine = "";
	var bContinue = true;
	
	// read (and skip the first two lines)
	for (var i = 0; i < 2; i++) {
		var result = { value: null };
		bContinue = theWorker.readLine(result);
		theLine = "";
	}
	
	// create an array to store the record
	var rec = new Array();
	
	// read the record line by line
	// convert from utf-8 to unicode

	while (bContinue) {
		bContinue = theWorker.readLine(result)
		if (result.value) {
			try {
				rec[rec.length] = ibwUConv.UTF8Compose(result.value);
			}
			catch (a) {
				showMessage(a);
				rec[rec.length] = "";
				bError = true;
			}
		}
	}
	
	// close the input and clean up a bit
	theScriptableStream.close();
	theWorker = null;
	theScriptableStream = null;
	theInputStream = null;
	
	// perform conversion to IBM CP850
	for (i = 0; i < rec.length; i++) {
		try {
			//theLine = theUnicodeConverter.ConvertFromUnicode(rec[i]);
			theLine = convert2CP850(rec[i]);
			rec[i] = theLine;
		}
		catch (b) {
			showMessage(b);
			rec[i] = "";
			bError = true;
		}
	}
	
	// get and remove the first read line
	var firstLine = rec.shift();

	// get the fist 24 characters
	var newFirstLine = firstLine.substr(0, 24);
	
	// put the Disketten-MAB header in-front
	newFirstLine = '### ' + newFirstLine;

	// get the characters after position 24
	var newSecondLine = firstLine.substring(24);

	// put the two entries as separate lines in front
	rec.unshift(newFirstLine, newSecondLine);
	
	// throw away trailing lines only containing whitespace or whitespace with a dot	
	var theRegex = /^\s*\.?\s*$/;
	for (i = (rec.length - 1); (i >= 0) && theRegex.test(rec[i]); i--) {
		rec.pop();
	}
		
	// try to get a file channel
	var theChannel = theIOService.newChannel(theFileURL, null, null);
	var fileChannel = theChannel.QueryInterface(Components.interfaces.nsIFileChannel);
	var theFileOutputStream = Components.classes['@mozilla.org/network/file-output-stream;1']
									.createInstance(Components.interfaces.nsIFileOutputStream);
	var theFile = fileChannel.file.clone();
	//theFileOutputStream.init(theFile, 0x2a, 0, 0);
	if (appendDownload) 
		theFileOutputStream.init(theFile, 0x10 | 0x04, 0, 0);
	else
		theFileOutputStream.init(theFile, 0x20 | 0x04, 0, 0);
	theLine = rec.join(lineSeparator);
	theLine.concat(lineSeparator, recordSeparator);
	theFileOutputStream.write(theLine, theLine.length);
	theFileOutputStream.write(lineSeparator, lineSeparator.length);
	theFileOutputStream.write(recordSeparator, recordSeparator.length);
	theFileOutputStream.close();
	if (copyToClipboard) 
		application.activeWindow.clipboard = theLine;
	return !bError;
}

/*
	This is our GUI handler; it will be automatically called by WinIBW to determine
	if the GUI for the script should be enabled or not.
*/
function __downloadToLibero()
{
	// we require to be in a short or full presentation
	var scrId = application.activeWindow.getVariable("scr");
	
	if (scrId != "7A" && scrId != "8A") {
		return false;
	}
	return true;
}

/*
	the only function visible from WinIBW and thus the main script
*/
function downloadToLibero()
{
	// check pre-conditions
	if (!checkPreConditions(null)) {
		return;
	}

	// get the temporary download url:
	var theTempURL = null;
	
	// get the DownloadURL
	var theDownloadFile = null;
	
	// get the settings from the preferences:
	if (getPreferences(true) == false) {
		return;
	}

	var scrId = application.activeWindow.getVariable("scr");

	// now we try to get a nsIFile from the download URL
	// we do it this way, because now our environment variables are expanded

	try {
		var conv = Components.classes["@mozilla.org/network/protocol;1?name=file"]
						.createInstance(Components.interfaces.nsIFileProtocolHandler);	
		theDownloadFile = conv.getFileFromURLSpec(theDownloadURL);
		if (theDownloadFile == null) {
			throw "Die URL ist keine gültige File-URL.";
		}

		if (!appendDownload && theDownloadFile.exists())
			theDownloadFile.remove(false);
		
		if (!theDownloadFile.exists())
			theDownloadFile.create(theDownloadFile.NORMAL_FILE_TYPE, 0666);
		
		if (!theDownloadFile.exists() || !theDownloadFile.isWritable()) {
			throw "Die Download-Datei konnte nicht erzeugt werden oder ist schreibgeschützt.";
		}

		var theTempFile = theDownloadFile.clone();
		theTempFile.createUnique(theDownloadFile.NORMAL_FILE_TYPE, 0666);
		theTempURL = conv.getURLSpecFromFile(theTempFile);
	}
	
	catch (e) {
		// hm, no chance if this failed
		showMessage('Die download URL "' + theDownloadURL + '" hat einen ungültigen Pfad oder kann nicht erzeugt werden:\n' + e);
		return;
	}

	// if we come here we should have the following valid objects:
	//		theDownloadURL		string
	//		theDownloadFile		nsIFile
	//		theTempFile         nsIFile
	//		theConverter		nsILocalFile
	
	// start the real work
	try {
		// first save the original download location
		var theOrigDownloadURL = application.getProfileString("winibw.filelocation", "download", "");
		//application.writeProfileString("winibw.filelocation", "download", theDownloadURL);
		application.writeProfileString("winibw.filelocation", "download", theTempURL);
		
		// send a download command
		application.activeWindow.command("\\dow " + downloadFormat, false);
		sStatus = application.activeWindow.status;
		if ((sStatus == "OK") || (sStatus == "")) {
			// we should have a download in our download file, now
			
			// do some post-processing
			if (!postprocessDownload(theTempURL, theDownloadURL)) {
				// most likely character conversion problem
				throw("Die Daten konnten nicht korrekt konvertiert werden.");
			}

			if (runConverter) {
				// create a nsIProcess
				var process = Components.classes["@mozilla.org/process/util;1"]
		                             .createInstance(Components.interfaces.nsIProcess);
				process.init(theConverter);
			
				// we do not pass any arguments and wait until the process has finished
				process.run(true, new Array(), 0);
			
				if (process.exitValue != 0) {
					// I assume that only an exitValue of 0 indicates success
					showMessage("Der Libero-Konverter hat den folgenden Fehler zurückgegeben: " + process.exitValue);
				}
			}
		} else {
			showMessage("Der Download ist fehlgeschlagen.");
		}
	}
	catch (e2) {
		showMessage("Eine Ausnahme ist aufgetreten:\n" + e2);
	}
	finally {
		// what ever happens, restore the default download location
		application.writeProfileString("winibw.filelocation", "download", theOrigDownloadURL);
		if (theTempFile.exists()) theTempFile.remove(false);
		if (scrId == "7A") {
			application.activeWindow.simulateIBWKey("FR"); //Enter
		}
	}
}

function MAB2_download_dlg()
{
	open_xul_dialog("chrome://ibw/content/xul/MAB2_download_dialog.xul", null);
}

function MAB2_download_datei_loesschen()
{
	var theDownloadURL = getDownloadURL(null);
	try {
		if (theDownloadURL == "") { throw(0); }
	
		// expand environment variables
		theDownloadURL = expandEnvironmentVariables(theDownloadURL);
	
		var conv = Components.classes["@mozilla.org/network/protocol;1?name=file"]
								.createInstance(Components.interfaces.nsIFileProtocolHandler);
		var file = conv.getFileFromURLSpec(theDownloadURL);
	
		if (!file.exists()) { throw(0); }
		var prompter = utility.newPrompter();
		if (prompter.confirm("Download", "Download Datei \"" + theDownloadURL + "\" löschen?")) {
			file.remove(false);
		}
	}
	catch(e) {
		showMessage("Download Datei nicht gefunden.");
	}
}