/*************************************************************************************************
 * 
 *	This file contains the standard WinIBW script functions for creating records
 *
 *************************************************************************************************
 *************************************************************************************************
 *	$Header$
 *	
 *	$Log$
 *	Revision 1.10  2005/05/12 13:46:03  bouwmeester
 *	Changes from Mireille
 *	
 *	Revision 1.8  2005/04/11 10:32:33  bouwmeester
 *	Corrected a typo in the list of tags for Monographs
 *	
 *	Revision 1.7  2005/03/18 10:16:40  hofmann
 *	security checks in standard scripts, to make sure title object is non-null
 *	
 *	Revision 1.6  2004/12/13 14:20:22  bouwmeester
 *	Fixed in the create routine:
 *	- no unnecesary switch of Coded Data
 *	- leave Novice Mode off (as in WinIBW2)
 *	- open a new window only when already editing
 *	
 *	Revision 1.5  2004/11/12 16:26:36  hofmann
 *	added missing records
 *	
 *	Revision 1.4  2004/11/12 12:12:56  hofmann
 *	support for printing that also works with script or vice versa; still needs quite some cleanup
 *	
 *	Revision 1.3  2004/11/11 13:19:50  hofmann
 *	fix for UninversalXPConnect privileges
 *	
 *	Revision 1.2  2004/11/11 07:53:38  hofmann
 *	fix for codedData and noviceMode proptery in scritping model
 *	
 *	Revision 1.1  2004/11/11 07:16:33  hofmann
 *	base implementation of standard create scripts
 *      
 *      Revision 2.1 2005/05/03 MTE
 *      add new material : Atlas, Audiovisuel, Electronique, Multimedia
 *      Journal became Periodique
 *	
 *	
 **************************************************************************************************	
 */

const typeAtlas =	"Ka";
const contAtlas =	"008 $aKax\n" +
						"010 ##$a\n"  +
						"200 1#$a@ $bDocument cartographique\n" +
						"205 ##$a\n"  +
						"206 ##$a\n"  +
						"210 ##$a\n"  +
						"215 ##$a\n"  +
						"225 ##$a@\n"  +
						"300 ##$a\n"  +
						"305 ##$a\n"  +
						"320 ##$a\n"  +
						"410 ##$t\n"  +
						"700 #1$a\n"  +
						"701 #1$a\n"  +
						"702 #1$a\n"  +
						"710 02$a"
						;



const typeAudiovisuel =	"Ba";
const contAudiovisuel =	"008 $aBax\n" +


						"010 ##$a\n"  +
						"071 01 $a\n"  +
						"200 1#$a@  $bImages animées\n" +
						"205 ##$a\n"  +
						"210 ##$a\n"  +
						"215 ##$a\n"  +
						"225 ##$a@\n"  +
						"300 ##$a\n"  +
						"305 ##$a\n"  +
						"320 ##$a\n"  +
						"410 ##$t@\n"  +
						"700 #1$a\n"  +
						"701 #1$a\n"  +
						"702 #1$a";



const typeElectronique =	"Oa";
const contElectronique =	"008 $aOax\n" +


						"010 ##$a\n"  +
						"200 1#$a@   $bRessource électronique\n" +
						"210 ##$a\n"  +
						"215 ##$a\n"  +
						"225 ##$a@\n"  +
						"230 ##$a\n"  +
						"300 ##$a\n"  +
						"304 ##$a\n"  +
						"305 ##$a\n"  +
						"320 ##$a\n"  +
						"336 ##$a\n"  +
						"337 ##$a\n"  +
						"410 ##$t@\n"  +
						"700 #1$a\n"  +
						"701 #1$a\n"  +
						"856 4#$q $u\n"  +
						"702 #1$a";

const typeMonograph =	"Aa";
const contMonograph =	"008 $aAax\n" +


						"010 ##$a\n"  +
						"200 1#$a@ $bTexte imprimé\n" +
						"205 ##$a\n"  +
						"210 ##$a\n"  +
						"215 ##$a\n"  +
						"225 ##$a@\n"  +
						"300 ##$a\n"  +
						"305 ##$a\n"  +
						"320 ##$a\n"  +
						"410 ##$t@\n"  +
						"700 #1$a\n"  +
						"701 #1$a\n"  +
						"702 #1$a";


const typeMultimedia =	"Za";
const contMultimedia =	"008 $aZax\n" +


						"010 ##$a\n"  +
						"200 1#$a@  $bMultimédia multisupport\n" +
						"205 ##$a\n"  +
						"210 ##$a\n"  +
						"215 ##$a\n"  +
						"215 ##$a\n"  +
						"225 ##$a@\n"  +
						"300 ##$a\n"  +
						"305 ##$a\n"  +
						"320 ##$a\n"  +
						"410 ##$t@\n"  +
						"700 #1$a\n"  +
						"701 #1$a\n"  +
						"702 #1$a";




const typePartition	=	"Ma";
const contPartition =	"008 $aMax\n"	+
						"010 ##$a\n"	+
						"013 ##$aM-\n"	+
						"071 3#$a\n"	+
						"200 1#$a@ $bMusique imprimée\n"	+
						"205 ##$a\n"	+
						"208 ##$a\n"	+
						"210 ##$a\n"	+
						"215 ##$a\n"	+
						"225 ##$a@\n"	+
						"300 ##$a\n"	+
						"305 ##$a\n"	+
						"320 ##$a\n"	+
						"410 ##$t@\n"	+
						"500 ##$a@\n"	+
						"700 #1$a\n"	+
						"701 #1$a\n"	+
						"702 #1$a\n";
						
const typePeriodique	=	"Ab";
const contPeriodique   =	"008 $aAbx\n"	+
						"011 ##$a\n"	+
						"200 1#$a@  $bTexte imprimé\n"	+
						"207 #0$a\n"	+
						"210 ##$a\n"	+
						"215 ##$c\n"	+
						"326 ##$a\n"	+
						"410 ##$t@\n"	+
						"421 ##$t@\n"	+
						"422 ##$t@\n"	+
						"423 ##$t@\n"	+
						"430 ##$t@\n"	+
						"436 ##$t@\n"	+
						"437 ##$t@\n"	+
						"440 ##$t@\n"	+
						"446 ##$t@\n"	+
						"447 ##$t@\n"	+
						"451 ##$t@\n"	+
						"452 ##$t@\n"	+
						"453 ##$t@\n"	+
						"454 ##$t@\n"	+
						"510 ##$a@\n"	+
						"512 ##$a@\n"	+
						"517 ##$a@\n"	+
						"530 0#$a@\n"	+
						"532 ##$a@\n"	+
						"675 ##$a\n"	+
						"676 ##$a\n"	+
						"710 02$a@\n"	+	
						"711 02$a@\n"	+
						"712 02$a@\n";

const typeSonore	=	"Ga";
const contSonore	=	"008 $aGax\n"	+
						"010 ##$a\n"	+
						"013 ##$a\n"	+
						"071 3#$a\n"	+
						"200 1#$a@  $bEnregistrement sonore\n"	+
						"205 ##$a\n"	+
						"210 ##$a\n"	+
						"215 ##$a\n"	+
						"225 ##$a@\n"	+
						"300 ##$a\n"	+
						"305 ##$a\n"	+
						"320 ##$a\n"	+
						"322 ##$a\n"	+
						"323 ##$a\n"	+
						"410 ##$t@\n"	+
						"700 #1$a\n"	+
						"701 #1$a\n"	+
						"702 #1$a\n";


function doCreate(type, content) {
	var bCodedData = application.activeWindow.codedData;
	var bNoviceMode = application.activeWindow.noviceMode;
	var bEditing = application.activeWindow.title;
	
	application.activeWindow.codedData = false;
	application.activeWindow.noviceMode = false;
	
	// Open a new window when already editing
	application.activeWindow.command("\\inv 1", bEditing);

	if ((application.activeWindow.status == "OK") && (application.activeWindow.title != null)) {
		application.activeWindow.title.insertText(content);
		// switch CodedData on once to force docType
		application.activeWindow.materialCode = type;
		// application.activeWindow.codedData = true;
		if (bCodedData) {
			application.activeWindow.codedData = true;
		}
		// application.activeWindow.noviceMode = bNoviceMode;
		application.activeWindow.title.endOfField(false);
	}
}

function picaCreateAtlas() {
	doCreate(typeAtlas, contAtlas);
}

function picaCreateAudiovisuel() {
	doCreate(typeAudiovisuel, contAudiovisuel);
}

function picaCreateElectronique() {
	doCreate(typeElectronique, contElectronique);
}

function picaCreateMonograph() {
	doCreate(typeMonograph, contMonograph);
}

function picaCreateMultimedia() {
	doCreate(typeMultimedia, contMultimedia);
}

function picaCreatePartition() {
	doCreate(typePartition, contPartition);
}

function picaCreatePeriodique() {
	doCreate(typePeriodique, contPeriodique);
}

function picaCreateSonore() {
	doCreate(typeSonore, contSonore);
}