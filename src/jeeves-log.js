/**
 * Jeeves, a simple JS generic genetic algorithm library, designed
 * to be (somewhat) Wooster-friendly. Right ho!
 * 
 * <small>
 * <b>copyright</b> 2011, e-UCM, Universidad Complutense de Madrid<br>
 * <b>license</b> GNU LGPL v3 or later; contact authors for other licenses<br>
 * </small>
 *
 * @author manuel.freire@fdi.ucm.es
 *
 * @fileOverview Simple logging for Jeeves
 */

/**
 * Log levels for internal log
 */
jv.logLevels = {
    /// @field @constant trace message
    DEBUG: 1,
    /// @field @constant normal message: default level
    INFO: 2,
    /// @field @constant warning, non fatal
    WARN: 3,
    /// @field @constant error, usually fatal
    ERROR: 4
}

/**
 * Current log level
 */
jv.logLevel = jv.logLevels.INFO

/**
 * Logging output element; should correspond to an element-id in the HTML
 * @example
 * &lt;div id="jvLog"&gt;&lt;/div&gt;
 */
jv.logElementId = 'jvLog'

/**
 * Logs a line to some kind of log; change to suit yourself
 */
jv.maxAlerts = 5
jv.log = function(line, level) {
    if (level < jv.logLevel) return;
    var le = document.getElementById(jv.logElementId);
    if (le != null) {
        var text = document.createTextNode(line)
        var p = document.createElement('p')
        p.appendChild(text)
        le.appendChild(p)
    } else {
        if (--jv.maxAlerts > 0) {
            alert(line)
        } else if (jv.maxAlerts == 0) {
            alert("Jeeves has exceeded its maximum alert quota;\n\
                no more alerts will be displayed. check the source\n\
                and alter jv.logElementId to log into an HTML element\n\
                instead")
        }    
    }
}

// logging-related helper functions
jv.debug = function(line) {jv.log(line, jv.logLevels.DEBUG)}
jv.info = function(line) {jv.log(line, jv.logLevels.INFO)}
jv.warn  = function(line) {jv.log(line, jv.logLevels.WARN)}
jv.error = function(line) {jv.log(line, jv.logLevels.ERROR)}
jv.isDebug = function() {return jv.logLevel <= jv.logLevels.DEBUG;}
