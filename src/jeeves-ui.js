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
 * @fileOverview UI-related functions; requires Protovis and jQuery
 */

/**
 * Names of default Jeeves UI tabs
 */
jv.uiTabNames = {
    /// @field @constant
    MAIN: 'main', 
    /// @field @constant
    CONV: 'conv', 
    /// @field @constant
    ANSW: 'answ', 
    /// @field @constant
    LOG: 'log'
};

/**
 * Constructs a control
 * 
 * @constructor
 * @param {string} id
 * @param {string} label
 * @param {string} vlabel
 * @param {*} data stored & used by subclass
 */
jv.UIControl = function(id, label, vlabel, data) {
    this.id = id
    this.label = label
    this.data = data
    this.control = {}
    this.valueLabel = jQuery(
        "<span class='jv-control-vlabel'>" + vlabel + "</span>\n")
    /// actual element
    this.element = jQuery(
        "<div>\n"+
        "  <div class='jv-control-label'>"+label+"</div>\n"+
        "  <div class='jv-control-container'></div>\n"+
        "</div>\n")
    this.element.find(".jv-control-label").append(this.valueLabel)
}

/**
 * Constructs a slider control
 * 
 * @param {string} id
 * @param {string} label
 * @param {string} vlabel
 * @param {*} data - see jQuery-UI slider init args for details
 * @extends {jv.UIControl}
 * @constructor
 */
jv.SliderControl = function(id, label, vlabel, data, labelLo, labelHi) {    
    jv.UIControl.call(this, id, label, vlabel, data)
    var vl = this.valueLabel
    var slide = function(event, ui) { jQuery(vl).text(ui.value) }
    data.slide = slide
    this.control = jQuery("<div id='"+id+"'></div>\n")
        .slider(data);
    this.element.find(".jv-control-container")
        .append(this.control)
        .append("<span class='jv-slider-low'>"+labelLo+"</span>")
        .append("<span class='jv-slider-high'>"+labelHi+"</span>");        
}

/**
 * Constructs a default Jeeves UI
 * Requires jQuery to work. UIs are totally optional
 * 
 * @constructor
 * @param {string} uiElementId id of div element where UI should be created
 * @param {{main: {string}, conv: {string}, answ: {string}, log: {log}}} 
 *    tabLabels (@see jv.uiTabNames)
 *    used to title the tabs of the UI. Controls get their own labels.
 * @param {{start: {string}, stop: {string}}}
 *    buttonLabels for the states of the launch-GA button
 * @param {Array.<{jv.UIControl}>} controls array
 * @param {function()} createGA creates GA to launch (using controls)
 * @param {function()} whenFinished called when the progress bar completes,
 *    after the main plot has been displayed
 */
jv.UI = function(uiElementId, tabLabels, buttonLabels, controls, 
    createGA, whenFinished) {    
        
    /// dom element with UI
    this.uiElement = {}
    /// each of the (@see jv.uiTabNames) tabs
    this.tabs = {}
    /// {jv.GA} GA
    this.ga = {}
    /// {number} ms time for a single GA iteration; adjusted every iteration
    this.runTime = 20
    /// {boolean} state
    this.working = false
    /// {start: {string}, stop: {string}} buttonLabels
    this.buttonLabels = buttonLabels
    /// {function()} createGA
    this.createGA = createGA
    /// {function()} whenFinished
    this.whenFinished = whenFinished
    /// dom element with button
    this.button = {}
    /// dom element with progressbar
    this.progress = {}
    /// dom element with convergence plot
    this.convergence = {}
    /// dom element with graphical depiction of answer
    this.answer = {}    
    
    // builds UI
    var tabElement = jQuery("<ul>")
    var tabDivsElement = jQuery("<div>")
    this.uiElement = jQuery('#'+uiElementId)
                        .append(tabElement)
                        .append(tabDivsElement)
    var UI = this; // for local closure goodness
    
    // builds tabs
    var buildTab = function(tabId) {
        return jQuery("<li><a href='#jv-tabs-" 
            + tabId + "-" + uiElementId +"'>" + 
            tabLabels[tabId] + "</a></li>");
    }    
    this.tabs = {}
    this.tabDivs = {}
    for (var name in jv.uiTabNames) {
        var tab = jv.uiTabNames[name]
        var element = buildTab(tab)
        this.tabs[tab] = element
        this.tabDivs[tab] = jQuery("<div id='jv-tabs-"+
            tab + "-" + uiElementId +"'></div>")
        tabElement.append(element)
        tabDivsElement.append(this.tabDivs[tab])
    }    
    this.uiElement.tabs()
     
    // builds controls
    for (var j=0; j<controls.length; j++) {
        this.tabDivs[jv.uiTabNames.MAIN].append(controls[j].element)
    }
    this.tabDivs[jv.uiTabNames.MAIN].append(
        "<div>\n"+
        "  <div class='jv-control-label'>\n"+
        "    <button id='jv-button-"+uiElementId+"'>"+
            buttonLabels['start']+"</button>\n"+
        "  </div>\n"+
        "  <div class='jv-control-container'>\n" +
        "    <div id='jv-progress-"+uiElementId+"'></div>\n"+
        "  </div>\n"+
        "</div>"); 
    this.button = jQuery("#jv-button-"+uiElementId)
    this.progress = jQuery("#jv-progress-"+uiElementId)
    this.tabDivs[jv.uiTabNames.CONV].append(
        "<div id='jv-plot-conv-"+uiElementId+"' class='jv-plot'></div>\n");
    this.convergence = jQuery("#jv-plot-conv-"+uiElementId);
    this.tabDivs[jv.uiTabNames.ANSW].append(
        "<div id='jv-plot-answ-"+uiElementId+"' class='jv-plot'></div>\n");
    this.answer = jQuery("#jv-plot-answ-"+uiElementId);
    // FIXME - log should be per-UI, not shared
    this.tabDivs[jv.uiTabNames.LOG].append("<div id='jvLog'></div>\n");
        
    var updater = function() {        
        var v = UI.progress.progressbar("value")
        if (v < 100 && UI.working) {
            UI.progress.progressbar("value", v+1)
            if (UI.ga.runTime > UI.runTime) UI.runTime = UI.ga.runTime * 1.2
            else if (UI.ga.runTime < UI.runTime) UI.runTime = UI.ga.runTime * 0.8
            window.setTimeout(function(){UI.ga.run( updater )}, UI.runTime)
        }
    }
    
    var complete = function() {
        jv.info("Best: " 
            + UI.ga.bestChromosome.pretty(UI.ga.bestChromosome.data))
        jv.plot(300, 200, UI.ga.plotData, "jv-plot-conv-"+uiElementId, 0)
        UI.whenFinished.call(UI)
        UI.button.button("option", "label", buttonLabels['start'])
        UI.working = false        
    }    
    
    // configure button (if stopped, creates & starts GA; otherwise, stops GA)
    this.button.button()
    this.button.click(function() {
        if ( ! UI.working) {
            UI.ga = UI.createGA.call(UI)
            UI.working = true
            UI.progress.progressbar("value", 0)
            UI.button.button("option", "label", buttonLabels['stop'])
            UI.ga.populate();
            window.setTimeout(function(){ UI.ga.run( updater ) },10)                        
        } else {
            complete()
            UI.working = false
            UI.progress.progressbar("value", 0)
            UI.button.button("option", "label", buttonLabels['start'])
        }
    })
    
    // configure progressbar (reflects current progress)
    this.progress.progressbar({ complete: complete })
}

/**
 * Plots x,y generation data.
 * Requires ProtoVis to work;
 * 
 * @param {Array.<{x: {number}, y: {number}}>} data
 *     an array of x: generation, y: fitness datapoints
 * @param {number} w : width in pixels of drawing area to generate
 * @param {number} h : height in pixels of drawing area to generate
 * @param {string} elementId: id of HTML element where this will be rendered
 * @param {number} [minY] minimum Y for scaling purposes, calculated otherwise
 * @param {number} [maxY] maximum Y for scaling purposes, calculated otherwise
 */
jv.plot = function(w, h, data, elementId, minY, maxY) {

    minY = (typeof minY === "undefined") ?
        pv.min(data, function(d) {return d.y}) : minY;
    maxY = (typeof maxY === "undefined") ?
        pv.max(data, function(d) {return d.y}) : maxY;
    var x = pv.Scale.linear(data, function(d) {return d.x}).range(0, w),
        y = pv.Scale.linear(minY, maxY).range(0, h);

    /* The root panel. */
    var vis = new pv.Panel()
        .canvas(elementId)
        .width(w)
        .height(h)
        .bottom(20)
        .left(30)
        .right(10)
        .top(5);

    /* X-axis ticks. */
    vis.add(pv.Rule)
        .data(x.ticks())
        .visible(function(d) {return d > 0})
        .left(x)
        .strokeStyle("#eee")
      .add(pv.Rule)
        .bottom(-5)
        .height(5)
        .strokeStyle("#000")
      .anchor("bottom").add(pv.Label)
        .text(x.tickFormat);

    /* Y-axis ticks. */
    vis.add(pv.Rule)
        .data(y.ticks())
        .bottom(y)
        .strokeStyle(function(d) {return d ? "#eee" : "#000"})
      .anchor("left").add(pv.Label)
        .text(y.tickFormat);

    /* The line. */
    vis.add(pv.Line)
        .data(data)
        .interpolate("step-after")
        .left(function(d) {return x(d.x)})
        .bottom(function(d) {return y(d.y)})
        .lineWidth(3);

    vis.render()
}
