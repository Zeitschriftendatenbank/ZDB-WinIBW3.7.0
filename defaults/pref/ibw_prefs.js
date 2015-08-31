/*
 *	this file contains preferences for WinIBW
 */

// initial language
// currently supported are
//	"EN"	= english
//	"DU"	= german
//	"NE"	= dutch
//	"FR"	= french
// - defaults to "EN"
//pref("ibw.startup.language", "FR");

// the format used for cataloguing
// this is required for NoviceMode/CodedData handling
// defaults to 'D'
//pref("ibw.CodedData.CatFormat", "UNM");
//pref("ibw.CodedData.CatFormat", "M21");

// currently the format definition for NoviceMode/CodedData
// may contain duplicate fields.
// this should actually be handled in IDEFIX, but is unfortunately not.
// previous versions of WinIBW use the definition of the field seen last,
// we do the same but may warn about the fact, so the format can be fixed
//pref("ibw.CodedData.warnDuplicateField", false);

// the location of the images
// WinIBW will replace a path containing [images] with this location
//pref("ibw.images.path", "resource:/images");

// the text, WinIBW should place for undefined fields
// you need to keep this in synch with "ibw.images.path" when using an image
//pref("ibw.CodedData.noOp", "<img src='resource:/images/noop.gif'>");

// Command used to generate PPN hyperlinks
// - defaults to "\\zoe+\\12" if not specified
//pref("ibw.hyperlinks.PPNLink", "\\zoe+\\12");

// Specifies if WinIBW will create hyperlinks for PPNs
// if set to true, hyperlinks will be created for PPNs
// matching the PPNMatch.regex with a command
// of hyperlinks.PPNLink
// if set to false, WinIBW will not create PPN hyperlinks
// - defaults to true
//pref("ibw.hyperlinks.PPNMatch.create", true);

// Regular expression to identify PPN hyperlinks
// it must generate two Sub-Matches, the first is the string
// which will be displayed, the second will be used for the search term.
// Beware that the regex must take care of following characters as well
// *********************************************************************
// NOTE: the default value, i.e. if nothing is specified here,
//       corresponds to the behaviour of previous
//       versions of WinIBW.
//       However, we believe that this was wrong, as WinIBW also
//       created PPN hyerlinks for data like
//       <a href="?\rel+tt+\ppn+123048133;\too+k">!123048133!</a>
//       which resulted in:
//	 <a href="?\rel+tt+\ppn+123048133;\too+k"><A HREF="?\zoe+\12+123048133">
//       !123048133!</A></a>
//	 and caused WinIBW to execute the "\zoe ppn" command.
//       The currently set value, makes sure, PPN hyperlinks are not
//       generated, if the ppn is already placed in an hyperlink
//	 The currently set value is originally:
//	 "(!(\\d{8,10}[\\dxX])!)(?:\\s*)(?!</a).*"
// *********************************************************************
// - defaults to "(!(\\d{8,10}[\\dxX])!).*" if not specified
//pref("ibw.hyperlinks.PPNMatch.regex", "(!(\\d{8,10}[\\dxX])!)(?!</a).*");

// specify if the regular expression should ignore case
// - defaults to true
//pref("ibw.hyperlinks.PPNMatch.ignorecase", true);

// Regular expression for generating title word hyperlinks
// it must generate two Sub-Matches, the first is the string
// that will be clickable, the second is considered non-clickable
// - defaults to "([^ \r(),;&:\-./\[\]?]*)((?:&.+?;|[ \r(),;:\-./\[\]?])*)"
//pref("ibw.hyperlinks.TitleWord.regex", "([^ \r(),;&:\-./\[\]?]*)((?:&.+?;|[ \r(),;:\-./\[\]?])*)");

// specify if the regular expression should ignore case
// - defaults to false
//pref("ibw.hyperlinks.TitleWord.ignorecase", false);

// Regular expression for ISBD hyperlinks
// WinIBW receives something like <a href="?\zoe+IKT+%s">SOME TEXT</a> from CBS
// this regular expression is used to generate the correct hyperlinks
// The regular expression must generate two Sub-Matches:
// the first must be the "IKT", the second "SOME TEXT" from the sample above
// "SOME TEXT" will be processed by the "TitleWord"-Regex above
// - defaults to "<\\s*a\\s+href=\"\\?\\\\zoe\\+([^+]*)\\+%s\">([^<]*)</\\s*a[^>]*>"
//pref("ibw.hyperlinks.ISBD.regex", "<\\s*a\\s+href=\"\\?\\\\zoe\\+([^+]*)\\+%s\">([^<]*)</\\s*a[^>]*>");

// specify if the regular expression should ignore case
// - defaults to true
//pref("ibw.hyperlinks.ISBD.ignorecase", true);

// Regular expression for ISBD cleanup
// WinIBW will replace the part from the display that matches the regular expression
// with the value set in ibw.ISBD.stripg.replace
// - defaults to "<URL>.*</URL>"
//pref("ibw.ISBD.strip.regex", "<URL>.*</URL>");

// see above
// - defaults to ""
//pref("ibw.ISBD.strip.replace", "");


// specify if the regular expression should ignore case
// - defaults to true
//pref("ibw.ISBD.strip.ignorecase", true);


// strings to be injected in the <head> of the WinIBW templates
// we currently use this for character encoding and
// stylesheets
// NOTE: the elements are not inserted in their order appearing here,
//       but sorted alphabetically!
pref("ibw.inject.head.value.1", "\n<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"chrome://ibw/content/xul/general.css\">\n");
pref("ibw.inject.head.value.2", "\n<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"chrome://ibw/content/xul/pica.css\">\n");
pref("ibw.inject.head.value.3", "\n<link rel=\"stylesheet\" type=\"text/css\" media=\"print\" href=\"chrome://ibw/content/xul/print.css\">\n");
pref("ibw.inject.head.value.4", "\n<link rel=\"stylesheet\" type=\"text/css\" media=\"print\" href=\"chrome://ibw/content/xul/pica_print.css\">\n");
pref("ibw.inject.head.value.5", "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n");
pref("ibw.inject.head.value.6", "<script type=\"application/x-JavaScript\" src=\"chrome://ibw/content/xul/ibw_common.js\" ></script>\n");
pref("ibw.inject.head.value.7", "<script type=\"application/x-JavaScript\" src=\"chrome://ibw/content/xul/ibw_codeddata.js\" ></script>\n");
pref("ibw.inject.head.value.8", "<script type=\"application/x-JavaScript\" src=\"chrome://ibw/content/xul/colorHandling.js\" ></script>\n");

// Regular expression to find the insertion point for the injections mentioned above
// the regex must produce two Sub-Matches, the injections are inserted between the
// two submatches
// NOTE: the default expression is not correct for all possibilities in html,
//       it will however work for the current set of IBW templates
// - defaults to "(\\s*(?:(?:<!--)(?:.*?)(?:-->))*<head(?:.*?)>)(.*)"
pref("ibw.inject.head.regex", "(\\s*(?:(?:<!--)(?:.*?)(?:-->))*<head(?:.*?)>)(.*)");

// specify if the regex above should ignore case
// - defaults to "true"
pref("ibw.inject.head.ignorecase", true);

// Previous versions of WinIBW made expanded text in presentations italic
// This version can still do the same, however the approach of this
// version is to use cascading stylesheets
// If you want to have the old behaviour without stylesheets set this to "true"
// - defaults to false
//pref("ibw.display.MakeExpansionsItalic", false);


// **************************************************************************
// * SYNTAX COLORING for presentations
// **************************************************************************
// you have to add entry pairs of the following form
//
// pref("ibw.presentation.syntaxcolor.<FORMAT>.regex.<name>", "<REGEXP>");
// pref("ibw.presentation.syntaxcolor.<FORMAT>.format.<name>", "<REPLACE>");
//
// <FORMAT> is the presentation format you wish to define the regular expression for
// <REGEXP> is the regular expression; if matchted, it will be replaced by <REPLACE>
// <REPLACE> is the format string; use $0 to denote the matched text
// <name> is just a place holder; you must use the same <name> for a pair
// the pairs will be sorted on name, before the replacement begins
//
// WARNING: Note that the presentation may contain html elements, like
//          hyperlinks. Please make sure, not to generate invalid html.
/*
pref("ibw.presentation.syntaxcolor.UNM.regex.1", "([^\\$](?:\\$\\$)*)(\\$[^\\$ ])");
pref("ibw.presentation.syntaxcolor.UNM.format.1", '$1&#8206;<span class="presunm">$2</span>&#8236;');
pref("ibw.presentation.syntaxcolor.UNM.regex.2", "(.*?)(<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.UNM.format.2", '&#8206;$1&#8236;$2');
pref("ibw.presentation.syntaxcolor.UNMA.regex.1", "([^\\$](?:\\$\\$)*)(\\$[^\\$ ])");
pref("ibw.presentation.syntaxcolor.UNMA.format.1", '$1&#8206;<span class="presunm">$2</span>&#8236;');
pref("ibw.presentation.syntaxcolor.UNMA.regex.2", "(.*?)(<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.UNMA.format.2", '&#8206;$1&#8236;$2');
pref("ibw.presentation.syntaxcolor.USX.regex.1", "([^\\$](?:\\$\\$)*)(\\$[^\\$ ])");
pref("ibw.presentation.syntaxcolor.USX.format.1", '$1&#8206;<span class="presunm">$2</span>&#8236;');
pref("ibw.presentation.syntaxcolor.USU.regex.2", "(.*?)(<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.USU.format.2", '&#8206;$1&#8236;$2');
pref("ibw.presentation.syntaxcolor.M.regex.1", "\\$[^\\$ ]");
pref("ibw.presentation.syntaxcolor.M.format.1", '<span class="presunm">$0</span>');
pref("ibw.presentation.syntaxcolor.M21.regex.1", "\\$[^\\$ ]");
pref("ibw.presentation.syntaxcolor.M21.format.1", '<span class="presunm">$0</span>');



// settings for taglen
pref("ibw.taglen.D.title", "4");
pref("ibw.taglen.D.authority", "3");
pref("ibw.taglen.UNM.title", "3");
pref("ibw.taglen.UNM.authority", "3");
pref("ibw.taglen.M.title", "3");
pref("ibw.taglen.M.authority", "3");
pref("ibw.taglen.M21.title", "3");
pref("ibw.taglen.M21.authority", "3");
*/

pref("ibw.scriptExtensions.FileInput",				"FileInput");
pref("ibw.scriptExtensions.FileOutput",				"FileOutput");
pref("ibw.scriptExtensions.Prompter",				"Prompter");
pref("ibw.scriptExtension.FileInput.name",			"newFileInput");
pref("ibw.scriptExtension.FileInput.contract",		"@oclcpica.nl/scriptinputfile;1");
pref("ibw.scriptExtension.FileInput.interface",		"IInputTextFile");
pref("ibw.scriptExtension.FileOutput.name",			"newFileOutput");
pref("ibw.scriptExtension.FileOutput.contract",		"@oclcpica.nl/scriptoutputfile;1");
pref("ibw.scriptExtension.FileOutput.interface",	"IOutputTextFile");
pref("ibw.scriptExtension.Prompter.name",			"newPrompter");
pref("ibw.scriptExtension.Prompter.contract",		"@oclcpica.nl/scriptpromptutility;1");
pref("ibw.scriptExtension.Prompter.interface",		"IPromptUtilities");

// **************************************************************************
// * STYLES
// **************************************************************************
// The following section contains the style-classes that WinIBW will apply to
// several elements. You can use these in cascading style-sheets to adopt
// the presentations
// If you set the class to an empty string, WinIBW will not set a class

// class applied to expanded text in presentations
// will only be set if "ibw.display.MakeExpansionsItalic" = "false"
// - defaults to "ibw_expanded"
//pref("ibw.display.styles.classes.expansion", "ibw_expanded");

// class applied to ppn hyperlinks
// - defaults to "ibw_ppnlink"
//pref("ibw.display.styles.classes.ppnlink", "ibw_ppnlink");

// class applied to diagnostic elements
// - defaults to "ibw_diagnostic"
//pref("ibw.display.styles.classes.diagnostic", "ibw_diagnostic");

// the following entry will generate classes depending on the
// presentation format, the specified string is used as prefix
// so e.g. with the default you would get "ibw_format_da"
// for a da presentation
// - defaults to "ibw_format_"
//pref("ibw.display.styles.classes.format", "ibw_format_");

// class applied to <ISBD> elements
// - defaults to "ibw_isbd"
//pref("ibw.display.styles.classes.isbd", "ibw_isbd");

pref("capability.principal.codebaseTrusted.ibwxul1.id", "resource://");
pref("capability.principal.codebaseTrusted.ibwxul1.granted", "UniversalXPConnect");

// Preferences for the messages medium:
// 1 = show message in message bar
// 2 = show message in popup
// 255 = show message in all media available
// if one of the preferences is omitted the systems defaults to 255 for this preference,
// meaning: show all messages of this kind in all media available
//pref("winibw.messages.error",   3);
//pref("winibw.messages.alert",   3);
//pref("winibw.messages.message", 3);


// Preferences for the messages text
// The size is in pixels (default 11)
// style = [ regular | italic | bold | bolditalic ]
pref("winibw.messagebar.font.name",      "Arial");
pref("winibw.messagebar.font.size",      11);
pref("winibw.messagebar.font.color",     "#000000");
pref("winibw.messagebar.font.style",     "regular");
pref("winibw.messagebar.font.underline", false);
pref("winibw.messagebar.background",     "ButtonFace");
pref("winibw.messagebar.usebackground",  false);
// Preferences for the command bar
// The size is in pixels (default 15)
pref("winibw.commandbar.font.name",      "Arial Unicode MS");
pref("winibw.commandbar.font.size",      18);
pref("winibw.commandbar.font.size.default",      18);
pref("winibw.commandbar.font.color",     "#000000");
pref("winibw.commandbar.font.style",     "regular");
pref("winibw.commandbar.font.underline", false);
pref("winibw.commandbar.background",     "ButtonFace");
pref("winibw.commandbar.usebackground",  false);
// Preferences for the button bar
// The size is in pixels (default 12)
pref("winibw.buttonbar.font.name",      "Tahoma");
pref("winibw.buttonbar.font.size",      12);
pref("winibw.buttonbar.font.color",     "#000000");
pref("winibw.buttonbar.font.style",     "regular");
pref("winibw.buttonbar.font.underline", false);
pref("winibw.buttonbar.background",     "ButtonFace");
pref("winibw.buttonbar.usebackground",  false);
// Preferences for the presentation screen
// The size is in pixels (default 12)
pref("winibw.presentationscreen.font.name",      "Arial");
pref("winibw.presentationscreen.font.size",      12);
pref("winibw.presentationscreen.font.color",     "#000000");
pref("winibw.presentationscreen.font.style",     "regular");
pref("winibw.presentationscreen.font.underline", false);
pref("winibw.presentationscreen.background",     "#ffffcc");
pref("winibw.presentationscreen.usebackground",  false);
// Preferences for the duplicatepresentation screen
// The size is in pixels (default 12)
pref("winibw.deduplicationscreen.font.name",      "Arial");
pref("winibw.deduplicationscreen.font.size",      12);
pref("winibw.deduplicationscreen.equalcolor",     "#009000");
pref("winibw.deduplicationscreen.differentcolor", "#c00000");
pref("winibw.deduplicationscreen.font.style",     "regular");
pref("winibw.deduplicationscreen.background",     "#ffffcc");
pref("winibw.deduplicationscreen.usebackground",  false);
// Preferences for the presentation screen
// The size is in pixels (default 12)
pref("winibw.shortpresentationscreen.font.name",      "Arial");
pref("winibw.shortpresentationscreen.font.size",      12);
pref("winibw.shortpresentationscreen.font.color",     "#000000");
pref("winibw.shortpresentationscreen.font.style",     "regular");
pref("winibw.shortpresentationscreen.font.underline", false);
pref("winibw.shortpresentationscreen.background",     "#ffffcc");
pref("winibw.shortpresentationscreen.usebackground",  false);
// Preferences for the edit screen
// The size is in pixels (default 12)
pref("winibw.editscreen.font.name",      "Arial Unicode MS");
pref("winibw.editscreen.font.size",      12);
pref("winibw.editscreen.font.color",     "#000000");
pref("winibw.editscreen.font.style",     "regular");
pref("winibw.editscreen.font.underline", false);
pref("winibw.editscreen.background",     "#ffffff");
pref("winibw.editscreen.usebackground",  false);

pref("winibw.filelocation.titlecopy", "resource:/scripts/title.ttl");
pref("winibw.filelocation.downloadtoprinter",   false);
pref("winibw.display.checkseparateeditscreen", true);


//pref("capability.principal.codebaseTrusted.ibwxul2.id", "chrome://ibw/content/xul/test.xul");
//pref("capability.principal.codebaseTrusted.ibwxul2.granted", "UniversalXPConnect");

//pref("capability.principal.ibwxul3.id", "chrome://ibw");
//pref("capability.principal.ibwxul3.granted", "UniversalXPConnect");

pref("network.protocol-handler.expose.pica3", true);
pref("network.protocol-handler.expose.javascript", true);

/* we need to disable the frame-load-check
 * previously we pushed our JavaStack on several places but this prevents
 * the docshell from getting released */
pref("docshell.frameloadcheck.disabled", true);

// for trouble-shooting only
//pref("ibw.debug.forcepicacharset", true);

pref("ibw.codeddata.state.gen", true);


// ****************************************************************************************
// BIDI separator is used by the TitleEdit control. It is a format independant
// setting, i.e. it is used globally for all cataloguing formats. You have to
// make sure that it fits your needs.
//
// The BIDI separator is needed for constructs like (where small letters mean
// LTR text and capitals mean RTL text):
//
// tag $athe_tag_content$4THE_TAG_CONTENT$0THE_TAG_CONTENT
//
// The problem is, that "$4" and"$0" are interpretated as currency values. They
// will be reordered according to the BIDI analysis.
//
// The TitleEdit control uses the setting below as regular expression, to modify
// the BIDI analysis. The regular expression MUST generate EXCACTLY TWO submatches.
// The expression will be applied to each visible line of a tag in the TitleEdit control.
// The expression must not generate any gaps in the text.
// The TitleEdit control will treat the match of the first sub-match as "normal" text.
// The text of the second sub-match will be treated as "subfield separator".
// The text of the "subfield separator" will be forced to have BIDI level 0; Text after
// the "subfield separator" will be treated as if starting a new paragraph.
// If nothing is specified, the default expression "(.*)($)" will be used.
// *****************************************************************************************
//pref("ibw.BIDI.separator", "(.*)($)");
// this is the recommended for UNM format; it takes care of $$ as well
//pref("ibw.BIDI.separator", "((?:[^\\$]|(?:\\$\\$))*)($|(?:\\$$)|(?:\\$[^\\$]))");

// if this preference is set to false, WinIBW will not expand file:/[images] URLs when used in p3text elements
//pref("ibw.images.doExpansion", false);

// These settings control the caching of screens and templates: when false or absent, caching is active;
// when true, caching is disabled. Caching can be disabled for screens and templates separately.
//pref("ibw.noScreenCache", true);
//pref("ibw.noTemplateCache", true);
pref("ibw.noDataCache", false);

// Allow changing the charset when switching between LBS and CBS:
pref("ibw.noCharsetChange", false);

// Allowing switching on/off display command line history and set the display size when it is on
pref("ibw.cmdLineHistory.displaySize", 0);

// Use default script at initial when both load and save locations for userscript are not specified
//pref("ibw.userscript.location.loadandSave", "");
pref("ibw.updateservice.displayFailureUpdateServiceMessage", false);

pref("winibw.download.fromcommandline", true);

// Custom dictionaries are created with the [filebasename]_custom.txt convention:
// e.g. "resource:/wordlists/winibw_autocomp_du_custom.txt"
// The last option name is the language code in the title with code 1500, e.g.

pref("ibw.updateservice.url.oclc", "http://cbs.pica.nl:8080/winibw/update");

pref("winibw.diacritics.butid45000", "ʺ");
pref("winibw.diacritics.butid45001", "ƒ");
pref("winibw.diacritics.butid45002", "Ł");
pref("winibw.diacritics.butid45003", "Ø");
pref("winibw.diacritics.butid45004", "Đ");
pref("winibw.diacritics.butid45005", "Þ");
pref("winibw.diacritics.butid45006", "Æ");
pref("winibw.diacritics.butid45007", "Œ");
pref("winibw.diacritics.butid45008", "ʹ");
pref("winibw.diacritics.butid45009", "·");
pref("winibw.diacritics.butid45010", "♭");
pref("winibw.diacritics.butid45011", "®");
pref("winibw.diacritics.butid45012", "±");
pref("winibw.diacritics.butid45013", "Ơ");
pref("winibw.diacritics.butid45014", "Ư");
pref("winibw.diacritics.butid45015", "ʾ");
pref("winibw.diacritics.butid45016", "Å");
pref("winibw.diacritics.butid45017", "ʿ");
pref("winibw.diacritics.butid45018", "ł");
pref("winibw.diacritics.butid45019", "ø");
pref("winibw.diacritics.butid45020", "đ");
pref("winibw.diacritics.butid45021", "þ");
pref("winibw.diacritics.butid45022", "æ");
pref("winibw.diacritics.butid45023", "œ");
pref("winibw.diacritics.butid45024", "ı");
pref("winibw.diacritics.butid45025", "£");
pref("winibw.diacritics.butid45026", "ð");
pref("winibw.diacritics.butid45027", "α");
pref("winibw.diacritics.butid45028", "ơ");
pref("winibw.diacritics.butid45029", "ư");
pref("winibw.diacritics.butid45030", "ß");
pref("winibw.diacritics.butid45031", "å");
pref("winibw.diacritics.butid45032", "Ĳ");
pref("winibw.diacritics.butid45033", "Ä");
pref("winibw.diacritics.butid45034", "Ö");
pref("winibw.diacritics.butid45035", "Ü");
pref("winibw.diacritics.butid45036", "Ɔ");
pref("winibw.diacritics.butid45037", "Ǝ");
pref("winibw.diacritics.butid45038", "≠");
pref("winibw.diacritics.butid45039", "→");
pref("winibw.diacritics.butid45040", "≤");
pref("winibw.diacritics.butid45041", "∞");
pref("winibw.diacritics.butid45042", "∫");
pref("winibw.diacritics.butid45043", "×");
pref("winibw.diacritics.butid45044", "§");
pref("winibw.diacritics.butid45045", "√");
pref("winibw.diacritics.butid45046", "⇋");
pref("winibw.diacritics.butid45047", "≥");
pref("winibw.diacritics.butid45048", "ĳ");
pref("winibw.diacritics.butid45049", "ä");
pref("winibw.diacritics.butid45050", "ö");
pref("winibw.diacritics.butid45051", "ü");
pref("winibw.diacritics.butid45052", "ɔ");
pref("winibw.diacritics.butid45053", "ǝ");
pref("winibw.diacritics.butid45054", "¿");
pref("winibw.diacritics.butid45055", "¡");
pref("winibw.diacritics.butid45056", "β");
pref("winibw.diacritics.butid45057", "€");
pref("winibw.diacritics.butid45058", "γ");
pref("winibw.diacritics.butid45059", "π");
pref("winibw.diacritics.butid45060", "̉");
pref("winibw.diacritics.butid45061", "̀");
pref("winibw.diacritics.butid45062", "́");
pref("winibw.diacritics.butid45063", "̂");
pref("winibw.diacritics.butid45064", "̃");
pref("winibw.diacritics.butid45065", "̄");
pref("winibw.diacritics.butid45066", "̆");
pref("winibw.diacritics.butid45067", "̇");
pref("winibw.diacritics.butid45068", "̈");
pref("winibw.diacritics.butid45069", "̌");
pref("winibw.diacritics.butid45070", "°");
pref("winibw.diacritics.butid45071", "︠");
pref("winibw.diacritics.butid45072", "︡");
pref("winibw.diacritics.butid45073", "̓");
pref("winibw.diacritics.butid45074", "̋");
pref("winibw.diacritics.butid45075", "̐");
pref("winibw.diacritics.butid45076", "̧");
pref("winibw.diacritics.butid45077", "̨");
pref("winibw.diacritics.butid45078", "̣");
pref("winibw.diacritics.butid45079", "̤");
pref("winibw.diacritics.butid45080", "̥");
pref("winibw.diacritics.butid45081", "̳");
pref("winibw.diacritics.butid45082", "̱");
pref("winibw.diacritics.butid45083", "̦");
pref("winibw.diacritics.butid45084", "̜");
pref("winibw.diacritics.butid45085", "̮");
pref("winibw.diacritics.butid45086", "︣");
pref("winibw.diacritics.butid45087", "︢");
pref("winibw.diacritics.butid45088", "̕");
pref("winibw.diacritics.butid45089", "͏̈");

// disable the GSM function in WInIBW3
pref("winibw.hasGSM", false);

// Used for multiply table function, the default value is ""
pref("ibw.tableFunction.theCurrentTable", "");
pref("ibw.tableFunction.theCurrentBestMatchTable", "");

// Used for spell check, the deafult value is always disabled 
pref("winibw.editscreen.spellcheck_enabled", false);

// Tags that match will be made RTL, right to left text
pref("winibw.editscreen.RTLTagRE.NoScriptCode3", "([0-9A-Z_\\$@][0-9A-Z_\\$@][0-9A-Z_\\$@])\\.");
pref("winibw.editscreen.RTLTagRE.NoScriptCode4", "([0-9A-Z_\\$@][0-9A-Z_\\$@][0-9A-Z_\\$@][0-9A-Z_\\$@])\\.");
pref("winibw.editscreen.RTLTagRE.D4", "(\\d\\d\\d\\d \\[\\\\\\d\\d,[hf]\\w\\\\\\])");
pref("winibw.editscreen.RTLTagRE.D3", "(\\d\\d\\w \\[\\\\\\d\\d,[hf]\\w\\\\\\])");
pref("winibw.editscreen.RTLTagRE.PM", "(.*? .*?([^\\$]\\$)[6T]\\d\\d\\$[7U][hf]\\w)");

pref("winibw.features.editscreen.rtlTags", false);




