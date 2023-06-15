//ZDB Ergaenzung zu den Syntaxfarben.
//Nur diese Datei geht in das Update, nicht die Datei setup.js!!!
//
//Subfields: lila=990066

//
// D
//


//1. ILN, Bibliotheksangaben bei Exemplardaten
pref("ibw.presentation.syntaxcolor.D.regex.1", "(<[bB][rR]>)(70[0-9][0-9])");
pref("ibw.presentation.syntaxcolor.D.format.1", '$1<span style="font-weight:bold;color:CC3300">$2</span>');

//2. Tags werden fett
pref("ibw.presentation.syntaxcolor.D.regex.2", "(<[bB][rR]>)(\d{3,4})");
//pref("ibw.presentation.syntaxcolor.D.regex.2", "(\d{3,4}) ");
pref("ibw.presentation.syntaxcolor.D.format.2", '$1<span style="font-weight:bold;">$2</span>');


//3. Link von ISIL in 092$e zu ISIL online
pref("ibw.presentation.syntaxcolor.D.regex.3", "((092.+?\$e)([^\$<]{2,3}-[^\$<]+))");
pref("ibw.presentation.syntaxcolor.D.format.3", '$2<a href="http://ld.zdb-services.de/resource/organisations/$3">$3</a>');

//5. Hervorhebung der Vorzugsbenennungen in der GND (1XX, zusaetzlich eventuell 5XX bei Tu) + 7135
pref("ibw.presentation.syntaxcolor.D.regex.5", "(>[67][01357][0138]5?</[sS][pP][aA][nN]> )(.*?)(</[dD][iI][vV]>)");
pref("ibw.presentation.syntaxcolor.D.format.5", '$1<span>$2</span>');

//6. Dollar-Subfelder in Rot
pref("ibw.presentation.syntaxcolor.D.regex.6", "(\$[a-zA-Z0-9])");
pref("ibw.presentation.syntaxcolor.D.format.6", '<span style="font-weight:bold;color:CC3300;margin-left:2px">$0</span>');

//7. Erzeugung von anklickbaren Links in GDN-Kommentarfeldern, mehr als zwei URLs werden nicht anklickbar
pref("ibw.presentation.syntaxcolor.D.regex.7", '(\$u</[sS][pP][aA][nN]>)(http.*?)(<)');
pref("ibw.presentation.syntaxcolor.D.format.7", '$1<a href="$2">$2</a>$3');

// 8. 7135 Link
//pref("ibw.presentation.syntaxcolor.D.regex.8", "(7135.*=u )(http.*?)((<)|(=x ))");
pref("ibw.presentation.syntaxcolor.D.regex.8", "(7135.*?=u\s)(https?\:\/\/.*?)(=x\s.*?<|<)");
pref("ibw.presentation.syntaxcolor.D.format.8", '$1<a href="$2">$2</a>$3');

// 9. Istgleich-Subfelder in Rot
//pref("ibw.presentation.syntaxcolor.D.regex.9", "(=[a-z0-9]{1}\s)");
//pref("ibw.presentation.syntaxcolor.D.format.9", '<span style="font-weight:bold;color:CC3300">$0</span>');


//10/11. alles wird als LTR definiert (default)
pref("ibw.presentation.syntaxcolor.D.regex.10", " (.+)(<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.D.format.10", ' <span style="direction: ltr;">$1</span>$2');
pref("ibw.presentation.syntaxcolor.D.regex.11", "(\$T.*?&amp;&amp;)");
pref("ibw.presentation.syntaxcolor.D.format.11", '<span style="color:660099">$1</span>');

// 12. URLs in 4203
pref("ibw.presentation.syntaxcolor.D.regex.12", "(4203.*\s)(http[^<\s]+)(\s.*?<|<)");
pref("ibw.presentation.syntaxcolor.D.format.12", '$1<a href="$2">$2</a>$3');

//
// DA
//
pref("ibw.presentation.syntaxcolor.DA.regex.1", "(<[bB][rR]>)(\[\d{4} *\])(.*?)(<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.DA.format.1", '$1<span style="font-weight:bold;color:CC3300">$2 $3</span>$4');
pref("ibw.presentation.syntaxcolor.DA.regex.2", "(<[bB][rR]>)(70[0-9][1-9])");
pref("ibw.presentation.syntaxcolor.DA.format.2", '$1<span style="font-weight:bold;color:CC3300">$2</span>');
pref("ibw.presentation.syntaxcolor.DA.regex.3", "(<[bB][rR]>)(7[1-9]\d\d|8\d{3}|4800)");
pref("ibw.presentation.syntaxcolor.DA.format.3", '$1<span style="font-weight:bold">$2</span>');
pref("ibw.presentation.syntaxcolor.DA.regex.4", "(.*?)(?:<[bB][rR]>)");
pref("ibw.presentation.syntaxcolor.DA.format.4", '<div style="direction: ltr">$1</div>');
//5. Hervorhebung der Vorzugsbenennungen in der GND (1XX, zusaetzlich eventuell 5XX bei Tu)
pref("ibw.presentation.syntaxcolor.DA.regex.5", "(>[67][01357][0138]5?</[sS][pP][aA][nN]> )(.*?)(</[dD][iI][vV]>)");
pref("ibw.presentation.syntaxcolor.DA.format.5", '$1<span>$2</span>');
//6. Dollar-Subfelder in Rot
//pref("ibw.presentation.syntaxcolor.DA.regex.6", "(\$[a-zA-Z0-9])");
//pref("ibw.presentation.syntaxcolor.DA.format.6", '<span style="font-weight:bold;color:CC3300">$0</span>');
//7. Erzeugung von anklickbaren Links in GDN-Kommentarfeldern, mehr als zwei URLs werden nicht anklickbar
pref("ibw.presentation.syntaxcolor.DA.regex.7", '(\$u</[sS][pP][aA][nN]>)(http.*?)(<)');
pref("ibw.presentation.syntaxcolor.DA.format.7", '$1<a href="$2">$2</a>$3');
// 8. 7135 Link
//pref("ibw.presentation.syntaxcolor.DA.regex.8", "(7135.*=u )(http.*?)((<)|(=x ))");
pref("ibw.presentation.syntaxcolor.DA.regex.8", "(7135.*?=u\s)(https?\:\/\/.*?)(=x\s.*?<|<)");
pref("ibw.presentation.syntaxcolor.DA.format.8", '$1<a href="$2">$2</a>$3');
// 9. Istgleich-Subfelder in Rot
//pref("ibw.presentation.syntaxcolor.DA.regex.9", "(=[a-z0-9]+ )");
//pref("ibw.presentation.syntaxcolor.DA.format.9", '<span style="font-weight:bold;color:CC3300">$0</span>');

//
// P
//
pref("ibw.presentation.syntaxcolor.P.regex.level0", "(<[bB][rR]>)(0\d{2}[A-Z@])");
pref("ibw.presentation.syntaxcolor.P.format.level0", '$1<span style="font-weight:bold;color:008080">$2</span>');
pref("ibw.presentation.syntaxcolor.P.regex.level1", "(<[bB][rR]>)(1\d{2}[A-Z@])");
pref("ibw.presentation.syntaxcolor.P.format.level1", '$1<span style="font-weight:bold;color:000099">$2</span>');
pref("ibw.presentation.syntaxcolor.P.regex.exnr", "(<[bB][rR]>)(208@\\/\\d{2})");
pref("ibw.presentation.syntaxcolor.P.format.exnr", '$1<span style="font-weight:bold;color:CC3300">$2</span>');
pref("ibw.presentation.syntaxcolor.P.regex.level2", "(<[bB][rR]>)(2\d{2}[A-Z@])");
pref("ibw.presentation.syntaxcolor.P.format.level2", '$1<span style="font-weight:bold">$2</span>');
pref("ibw.presentation.syntaxcolor.P.regex.subfield", "(\xc6\x92[a-zA-Z0-9])");
pref("ibw.presentation.syntaxcolor.P.format.subfield", '<span style="font-weight:bold;color:CC3300">$0</span>');
pref("ibw.presentation.syntaxcolor.P.regex.subfield2", "(\u0192[a-zA-Z0-9])");
pref("ibw.presentation.syntaxcolor.P.format.subfield2", '<span style="font-weight:bold;color:CC3300">$0</span>');
//
// PA
//
pref("ibw.presentation.syntaxcolor.PA.regex.iln", "(<[bB][rR]>)(101@ )");
pref("ibw.presentation.syntaxcolor.PA.format.iln", '$1<span style="font-weight:bold">$2</span>');
pref("ibw.presentation.syntaxcolor.PA.regex.exnr", "(<[bB][rR]>)(208@\\/\\d{2})");
pref("ibw.presentation.syntaxcolor.PA.format.exnr", '$1<span style="font-weight:bold;color:CC3300">$2</span>');
pref("ibw.presentation.syntaxcolor.PA.regex.subfield", "(\xc6\x92[a-zA-Z0-9])");
pref("ibw.presentation.syntaxcolor.PA.format.subfield", '<span style="font-weight:bold;color:CC3300">$0</span>');
pref("ibw.presentation.syntaxcolor.PA.regex.subfield2", "(\u0192[a-zA-Z0-9])");
pref("ibw.presentation.syntaxcolor.PA.format.subfield2", '<span style="font-weight:bold;color:CC3300">$0</span>');

// ZDB hack gegen unnötige Scrollbalken bei großer Schrift
pref("ibw.inject.head.value.100", "\n<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"chrome://ibw/content/xul/zdb.css\">\n");
