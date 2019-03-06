function SET(logFilename, format, eigeneBibliothek) {
    this.format           = format || 'd';
    this.setSize          = application.activeWindow.getVariable("P3GSZ");
    this.next             = 1;
    this.current          = 1;
    this.next_ex          = 0;
    this.current_ex       = 0;
    this.eigeneBibliothek = eigeneBibliothek || false;
    this.logger           = new LOGGER(logFilename);
}

SET.prototype = {
    nextTit:
        function () {
            this.current = this.next;
            if (this.current <= this.setSize) {
                application.activeWindow.command("\\too " + this.format + " " + this.current, false);
                this.ex_numbers();
                this.next += 1;
                return this.current;
            }
            return false;
        },
    edit:
        function (ex) {
            var exe = ex || '';
            application.activeWindow.command("\\mut " + this.format + " " + exe, false);
            var src = application.activeWindow.getVariable("src");
            if ('MEMT'.indexOf(src) == -1) {
                throw new Error(this.getMessages());
            }
            return application.activeWindow.title;
        },
    nextEx:
        function (eigeneBibliothek) {
            this.eigeneBibliothek = eigeneBibliothek || this.eigeneBibliothek;
            if (!this.eigeneBibliothek) {
                throw new Error('PPN der eigenen Bibliothek ist nicht definiert');
            }
            if (!this.alleExe) {
                return false;
            }
            this.current_ex = this.next_ex;
            if (this.current_ex < this.alleExe.length) {
                this.exNum = this.alleExe[this.current_ex].substring(3, 5),
                    ex = this.edit('e' + this.exNum);
                this.next_ex += 1;
                if (!this.test_eigene(ex, this.eigeneBibliothek)) {
                    application.activeWindow.simulateIBWKey('FR'); // exit Exemplar
                    return this.nextEx();
                }
                return ex;
            }
            return false;
        },
    test_eigene:
        function (ex, eigeneBibliothek) {
            this.eigeneBibliothek = eigeneBibliothek;
            var kat, i;
            switch (this.format) {
            case 'd':
                kat = '4800';
                break;
            case 'p':
                kat = '247C';
                break;
            }
            ex.findTag(kat, 0, false, true, false);
            var idn = /\!(.+)\!/.exec(ex.selection);
            if (this.eigeneBibliothek.constructor == Array) {
                for (i = 0; i < this.eigeneBibliothek.length; i += 1) {
                    if (this.eigeneBibliothek[i] == idn[1]) {
                        return true;
                    }
                }
                return false;
            }
            if (this.eigeneBibliothek.indexOf(idn[1]) == -1) {
                return false;
            }
            return true;
        },
    ex_numbers:
        function () {
            this.next_ex = 0;
            this.current_ex = 0;
            var regexpExe,
                strTitle =  application.activeWindow.getVariable("P3CLIP");
            switch (this.format) {
            case "d":
                regexpExe = /\n(70[0-9][0-9])/g;
                break;
            case "p":
                regexpExe = /\n(208@)/g;
                break;
            }
            this.alleExe = [];
            this.alleExe = strTitle.match(regexpExe);
        },
    getMessages:
        function () {
            var messageText = "",
                i;
            if (application.activeWindow.messages.count > 0) {
                for (i = 0; i < application.activeWindow.messages.count; i += 1) {
                    messageText += application.activeWindow.messages.item(i).text + ";";
                }
            } else {
                return '';
            }
            return messageText;
        },
    save:
        function (save, message) {
            message = message || false;
            save = save || true;
            if (save == false) {
                // return undone but write error to a log file
                application.activeWindow.simulateIBWKey("FE");
            } else {
                application.activeWindow.simulateIBWKey("FR");
            }

            var status = application.activeWindow.status,
                cbsMessage = this.getMessages();
            
            if(status == 'OK') {
                if(message) {
                    message = status + "\t" + cbsMessage + "\t" + message;
                }
            } else {
                // an error occured
                //return undone but write error to a log file
                application.activeWindow.simulateIBWKey("FE");
                message = status + "\t" + cbsMessage;
            }
            
            if(message) {
                this.logger.log(message);
            }
        },
};

function LOGGER (fileName, path, delimiter) {
    this.setLogFile(fileName, path);
    this.delimiter = delimiter || "\t";
}

LOGGER.prototype = {
    setLogFile:
        function (fileName, path) {
            this.fileName        = fileName || 'LOG';
            this.path            = path     || 'listen';
            this.theRelativePath = this.path + "\\" + this.fileName;
            var nsIProperties    = Components.interfaces.nsIProperties,
                dirService       = Components.classes["@mozilla.org/file/directory_service;1"]
                                        .getService(nsIProperties),
                theDir           = dirService.get("ProfD", Components.interfaces.nsIFile);
            if (theDir) {
                theDir.append(this.path);
                if (!theDir.exists()) {
                    theDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0600);
                    if (!theDir.exists()) {
                        return false;
                    }
                }
            }
        },
    log:
        function (message) {
            this.out = utility.newFileOutput();
            this.out.createSpecial("ProfD", this.theRelativePath);
            var simpleDate = new Date(),
                idn = application.activeWindow.getVariable("P3GPP");
            this.out.writeLine(simpleDate + this.delimiter + idn + this.delimiter + message);
            this.out.close();
        }
};