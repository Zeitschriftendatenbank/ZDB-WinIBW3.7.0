//--------------------------------------------------------------------------------------------------------
//name:		CSV
//description: Get acces on a csv file
//author: 	Carsten Klee ZDB
// see https://github.com/cKlee/WinIBW3/wiki/CSV for documentation and tutorial
//--------------------------------------------------------------------------------------------------------
function CSV() {

    this.callback = function () { };
    this.keys = [];
    this.id_key = "";
    this.searchindex = false;
    this.logFilename = "LOG_default.txt";
    this.eigene_bibliothek;
    this.csv = utility.newFileInput();
    this.path = "\csv\\";
    this.isOpen = false;
    this.csvFilename = false;
    this.logger;

    if ((application.activeWindow.getVariable("scr") == "") || ("#7A#8A#FI#".indexOf(application.activeWindow.getVariable("scr")) < 0)) {
        throw ("Sie müssen sich eingeloggt haben um mit diesem Skript arbeiten zu können.");
    }
}

CSV.prototype =
{
    __openCsv:
        function () {
            if (this.csvFilename == this.isOpen) {
                this.csv.close();
            };
            if (!this.csv.openSpecial("ProfD", this.path + this.csvFilename)) {
                throw "Datei " + this.csvFilename + " wurde nicht gefunden.";
            }
            this.isOpen = this.csvFilename;
        },
    __csvSetProperties:
        function (callback, keys, id_key, searchindex, eigene_bibliothek, logFilename) {
            this.callback = callback;
            this.keys = keys;
            this.id_key = id_key;
            this.searchindex = searchindex;
            this.eigene_bibliothek = eigene_bibliothek;
            this.logFilename = logFilename;
        },
    __csvSetEigeneBibliothek:
        function (eigene_bibliothek) {
            this.eigene_bibliothek = "!" + eigene_bibliothek + "!";
        },
    __csvGetHeader:
        function () {
            this.__openCsv();
            this.header = this.__csvToArray(this.csv.readLine());
            return this.header;
        },
    __csvAPI:
        function () {
            // on cancel
            if (this.csvFilename == false) return;
            this.__openCsv();
            // read the start line
            var aLine, idn, cbsMessage;
            var theStart = parseInt(this.startLine);

            // for each line of the csv file
            var row = 0;

            while ((aLine = this.csv.readLine()) != null) {
                row += 1;
                if (row > this.endLine) {
                    break;
                }
                // when aLine is empty memory error occours
                if (row >= theStart && aLine != "") {
                    // call CSVToArray() function

                    this.lineArray = this.__csvToArray(aLine);
                    this.line = {};
                    // for better acces write a simple array
                    for (var y = 0; y < this.keys.length; y++) {
                        this.line[this.keys[y]] = this.lineArray[y].toString();
                    }
                    if (!this.searchindex) {
                        this.callback();
                        continue;
                    }
                    application.activeWindow.setVariable("P3GPP", "");

                    // search for zdb-id
                    application.activeWindow.command("f " + this.searchindex + " " + this.line[this.id_key], false);

                    idn = application.activeWindow.getVariable("P3GPP");
                    cbsMessage = this.__csvGetMessages();

                    if ("" == idn || cbsMessage) {
                        this.__csvLOG("f " + this.searchindex + " " + this.line[this.id_key] + " " + cbsMessage + ';' + application.activeWindow.status);
                    }
                    else {
                        this.callback();
                    }
                }
            }
            this.csv.close();
        },
    __csvLOG:
        function (message) {
            if (typeof this.logger === "undefined") {
                this.logger = new LOGGER();
                this.logger.setLogFile(this.logFilename, "listen");
            }
            var d = new Date();
            var dateString = d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear().toString().substr(-2) + ' ' + d.getHours() + ':' + d.getMinutes() + ':';
            var seconds = d.getSeconds();
            seconds = seconds <= 9 ? '0' + seconds : seconds;
            this.logger.log(dateString + seconds + ';' + application.activeWindow.getVariable("P3GPP") + ';' + this.line[this.id_key] + ';' + message);
        },
    __csvSaveBuffer:
        function (save, message) {
            message = "\"" + message + "\"";
            var cbsMessage;
            if (application.activeWindow.status == "OK" && save == true) {
                application.activeWindow.simulateIBWKey("FR");
                cbsMessage = this.__csvGetMessages();
                if (cbsMessage) message = message + ";" + cbsMessage;
                if (application.activeWindow.getVariable("scr") != "8A") {
                    //	return undone but write error to a log file
                    this.__csvLOG("Datensatz kann nicht gespeichert werden;" + application.activeWindow.status + ";" + message);
                    application.activeWindow.simulateIBWKey("FE");
                    return false;
                }
                else {
                    this.__csvLOG("Datensatz wurde gespeichert;" + application.activeWindow.status + ";" + message);
                    return true;
                }
            }
            else if (save == false) {
                //	return undone but write error to a log file
                this.__csvLOG("Datensatz wurde verlassen und nicht gespeichert;" + application.activeWindow.status + ";" + message);
                application.activeWindow.simulateIBWKey("FE");
                return false;
            }
            else {
                //	return undone but write error to a log file
                this.__csvLOG("Datensatz kann nicht gespeichert werden;" + application.activeWindow.status + ";" + message);
                application.activeWindow.simulateIBWKey("FE");
                return false;
            }
        },
    __csvGetMessages:
        function () {
            var messageText = "";
            if (application.activeWindow.messages.count > 0) {
                for (var i = 0; i < application.activeWindow.messages.count; i++) {
                    messageText += application.activeWindow.messages.item(i).text + ";";
                }
            }
            else {
                return false;
            }
            return "\"" + messageText + "\"";
        },
    __csvToArray:
        function (strData, delimit) {
            const delimiter = delimit || this.delimiter;
            // in case last character of line is not the delimiter
            if (strData.substring(strData.length) != delimiter) {
                strData = strData + delimiter;
            }

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                    // Standard fields.
                    "([^\"\\" + delimiter + "\\r\\n]*))"
                ),
                "gi"
            );
            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;

            var strMatchedValue;

            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec(strData)) {

                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[1];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                /*if (
                    strMatchedDelimiter.length &&
                    (strMatchedDelimiter != this.delimiter)
                    )*/
                if (
                    strMatchedDelimiter.length
                ) {
                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push([]);
                }
                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[2]) {
                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[2].replace(
                        new RegExp("\"\"", "g"),
                        "\""
                    );
                } else {
                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[3];
                }
                // Now that we have our value string, let's add
                // it to the data array.
                arrData[arrData.length - 1].push(strMatchedValue);
            }
            // Return the parsed data.
            return (arrData);
        }
}; // end of class
