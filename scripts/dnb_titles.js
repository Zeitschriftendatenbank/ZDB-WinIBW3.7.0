function normTnNeu() {
//--------------------------------------------------------------------------------------------------------
//name:		normTnNeu
//replaces:		TnSatzAusTiteldaten
//description:	entering a new Tn record to PND database while entering or editing a title record to main database
//user:	  	L1.2, F1.2
//input: 		string by user
//return:		new Tn record linked to title record by filling field with new Tn record's IDN encased in exclamation marks
//author: 		Detlev Horst
//date:		2006-12-14
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------

var tnStr;												//inverted name of person entered as search term by user to appropriate field 3xxx and supposed to be header of one new PND data record
var tnPPN;												//variable storing the above's IDN encased in exclamation marks
	
application.activeWindow.title.startOfField(true);					//go to start of field and select	
application.activeWindow.title.wordRight(1, true);					//go one word right and select thus deselecting the field's tag

tnStr = application.activeWindow.title.selection;					//store selection to variable tnStr

application.activeWindow.command("e n", true);						//command to enter a new norm data record within a new window
application.activeWindow.title.insertText("005 Tn" + "\n" + 			//insert certain fields putting the variable into field 100
							"011 /f" + "\n" +
							"012 /xv" + "\n" +
							"100 " + tnStr);
application.activeWindow.simulateIBWKey("FR");   					//store the new record to the PND database

tnPPN = "!" + (application.activeWindow.getVariable("P3GPP")) + "!";			//store the new record's IDN to variable tnPPN

//application.messageBox("", tnStr + "\n" + tnPPN, "");				//message box to control the search term during programming
application.activeWindow.closeWindow();							//close the new window
application.activeWindow.title.insertText(tnPPN);					//insert variable tnPPN into the selection thus replacing it
}
function normTnNeuDEA() {
//--------------------------------------------------------------------------------------------------------
//name:		normTnNeuDEA
//replaces:		TnSatzAusTiteldatenDEA
//user:	  	DEA
//description:	entering a new Tn record to PND database while entering or editing a title or archival record to DEA database 
//author: 		Detlev Horst
//input:		string by user
//return:		new Tn record linked to DEA title or archival record
//date:		2006-12-14
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------

var tnStr;												//inverted name of person entered as search term by user to appropriate field 3xxx and supposed to be header of one new PND data record
var tnPPN;												//variable storing the above's IDN encased in exclamation marks
	
application.activeWindow.title.startOfField(true);					//go to start of field and select	
application.activeWindow.title.wordRight(1, true);					//go one word right and select thus deselecting the field's tag

tnStr = application.activeWindow.title.selection;					//store selection to variable tnStr

application.activeWindow.command("e n", true);						//command to enter a new norm data record within a new window
application.activeWindow.title.insertText("005 Tn" + "\n" + 			//insert certain fields partly regarding DEA needs putting  the variable into field 100
							"011 /f" + "\n" +
							"012 /xv" + "\n" +
							"100 " + tnStr + "\n" +
							"101 |d|nur zulaessig fuer den Bestand des Deutschen Exilarchivs (DEA), ZKA-Redaktion innerhalb des Kalliope-Verbundes");
application.activeWindow.simulateIBWKey("FR");   					//store the new record to the PND database

tnPPN = "!" + (application.activeWindow.getVariable("P3GPP")) + "!";			//store the new record's IDN to variable tnPPN

//application.messageBox("", tnStr + "\n" + tnPPN, "");				//message box to control the search term during programming
application.activeWindow.closeWindow();							//close the new window
application.activeWindow.title.insertText(tnPPN);					//insert variable tnPPN into the selection thus replacing it

}
function normTpNeu() {

//--------------------------------------------------------------------------------------------------------
//name:		normTpNeu
//replaces:		TpSatzAusTitel
//description:	entering a new Tp record to PND database while entering or editing a title record to main database,
//			should be combined with fHoleDN() 
//user:	  	L1.2, L2, F1.2, F2
//input: 		string by user
//return:		new Tp record mask containing inverted name heading 
//author: 		Detlev Horst
//date:		2006-12-15
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------
	
var tpStr;	//inverted name of person entered as search term by user to appropriate field 3xxx and supposed to be header of one new PND Tp record
	
application.activeWindow.title.startOfField(true);					//go to start of field and select	
application.activeWindow.title.wordRight(1, true);					//go one word right and select thus deselecting the field's tag

tpStr = application.activeWindow.title.selection;					//store selection to variable tpStr

application.activeWindow.command("e n", true);						//command to enter a new norm data record within a new window
application.activeWindow.title.insertText("005 Tp" + "\n" + 			//insert certain fields putting variable tpStr into field 100
							"011 /f" + "\n" +
							"012 /xv" + "\n" +
							"100 " + tpStr + "\n" +
							"101 " + "\n" +
							"200 " + "\n" +
							"300 |a| " + "\n" +
							"315 " + "\n" +
							"811 ");
application.activeWindow.title.findTag("101", 0, false, true, false);		//go to field 101 and place the cursor at its beginning
	
}
function normTpNeuDEA() {
//--------------------------------------------------------------------------------------------------------
//name:		normTpNeuDEA
//replaces:		TpSatzAusTitelDEA
//description:	entering a new Tp record to PND database while entering or editing an archival record to DEA database 
//user:	  	DEA
//input: 		string by user
//return:		new Tp record mask 
//author: 		Detlev Horst
//date:		2006-12-15
//version:		1.0.0.0
//--------------------------------------------------------------------------------------------------------
	
var tpStrDEA;	//inverted name of person entered as search term by user to appropriate field 3xxx and supposed to be header of one new PND Tp data record
	
application.activeWindow.title.startOfField(true);					//go to start of field and select	
application.activeWindow.title.wordRight(1, true);					//go one word right and select thus deselecting the field's tag

tpStrDEA = application.activeWindow.title.selection;					//store selection to variable tpStr

application.activeWindow.command("e n", true);						//command to enter a new norm data record within a new window
application.activeWindow.title.insertText("005 Tp" + "\n" + 			//insert certain fields putting variable tpStr into field 100
							"011 /z" + "\n" +
							"012 /z" + "\n" +
							"100 " + tpStrDEA + "\n" +
							"101 |a|Nachlass" + "\n" +
							"300 |b| " + "\n" +
							"310 |e|" + "\n" +
 							"310 |u|" + "\n" +
 							"310 |w|" + "\n" +
							"315 " + "\n" +
							"811 ");
application.activeWindow.title.findTag("300", 0, false, true, false);		//go to field 300 and place the cursor at its beginning
application.activeWindow.title.endOfField(false);					//go to end of field without selecting
	
}	
