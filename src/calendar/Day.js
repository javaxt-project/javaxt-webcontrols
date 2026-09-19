if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.calendar) javaxt.dhtml.calendar={};

//******************************************************************************
//**  Day View
//*****************************************************************************/
/**
 *   Used to render a day
 *
 ******************************************************************************/

javaxt.dhtml.calendar.Day = function(parent, config) {
    this.className = "javaxt.dhtml.calendar.Day";

    var me = this;
    var defaultConfig = {

      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {

        },

      /** Day names or abbreviations to use in the column headers
       */
        dayNames : [],

      /** Number of days to render in the view */
        days: 1,


      /** Date to render
       */
        date: new Date(),


      /** Instance of an EventStore
       */
        eventStore: null,

      /** Amount of time, in milliseconds, to wait before a mousedown is
       *  treated as a "hold" instead of a "click"
       */
        holdDelay: 500,

      /** If true, enables debug logging to the console */
        debug: false
    };


  //DOM elements
    var el;
    var bodyDiv;
    var headerRow, footerRow;
    var multidayRow, multidayEventsTable;
    var currTimeDiv, getCurrentDate;


  //Class variables
    var date, startDate, endDate;
    var cells = {};
    var widths = {};
    var scrollWidth;
    var scrollable = true;
    var eventHeight;
    var eventPadding;
    var rendered;


  //Browser detection used to adjust event padding
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    var isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 ||
               window.navigator.userAgent.indexOf("Trident/") > -1;



  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of the calendar control. */

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Ensure the "javaxt-noselect" style rule is present in the document
        javaxt.dhtml.utils.addNoSelectRule();


      //Call super
        new javaxt.dhtml.calendar.View(me, config);


      //Process config
        if (!config.eventStore) config.eventStore = new javaxt.dhtml.calendar.EventStore();
        config.holdDelay = isNumber(config.holdDelay) ? parseInt(config.holdDelay) : defaultConfig.holdDelay;
        config.debug = config.debug===true;


      //Specify function used to get current date
        getCurrentDate = config.getCurrentDate==null ?
        getCurrentDate = function(){return new Date();} : config.getCurrentDate;



      //Configure renderers
        if (config.renderers){
            for (var rendererName in config.renderers) {
                if (config.renderers.hasOwnProperty(rendererName)) {
                    if (me[rendererName]){

                      //Override the default renderer
                        (function(rendererName) {
                            me[rendererName] = function(){
                                var renderer = config.renderers[rendererName];
                                return renderer.apply(me, arguments);
                            };

                        })(rendererName);
                    }
                }
            }
        }


      //Call the beforerender callback
        rendered = false;
        var listener = me.getListener('beforerender');
        if (listener!=null) listener.callback.apply(listener.scope, [me]);

      //Set date and render the calendar
        me.setDate(config.date);


        onRender(el, function(){
          //Call the afterrender callback
            listener = me.getListener('afterrender');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
            rendered = true;

          //Call the update callback
            listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        });



        addResizeListener(parent, onResize);
    };


  //**************************************************************************
  //** hasHours
  //**************************************************************************
    this.hasHours = function(){
        return true;
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        parent.appendChild(el);
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        parent.removeChild(el);
    };


  //**************************************************************************
  //** showFooter
  //**************************************************************************
    this.showFooter = function(){
        footerRow.style.display = '';
    };


  //**************************************************************************
  //** hideFooter
  //**************************************************************************
    this.hideFooter = function(){
        footerRow.style.display = "none";
    };


  //**************************************************************************
  //** enableTouch
  //**************************************************************************
    this.enableTouch = function(){
        scrollable = true;
    };


  //**************************************************************************
  //** disableTouch
  //**************************************************************************
    this.disableTouch = function(){
        scrollable = false;
    };


  //**************************************************************************
  //** onResize
  //**************************************************************************
  /** Recomputes event positions after the view is resized.
   */
    var onResize = function(){
        if (!rendered) return;
        if (!el || !el.parentNode) return; //view is hidden (not the active view)

      //Re-lay-out the events (their positions are measured from the grid, which
      //stretches/shrinks with the view). Scroll position is preserved.
        var scrollTop = bodyDiv ? bodyDiv.scrollTop : null;
        var events = me.getEvents();
        me.clear();
        me.addEvents(events);
        if (scrollTop!=null) bodyDiv.scrollTop = scrollTop;

        updateCurrTime();
    };



  //**************************************************************************
  //** renderTable
  //**************************************************************************
  /** Used to render a new table for the current date.
   */
    var renderTable = function(){


      //Remove any previously rendered table
        if (el!=null){
            for (var i=0; i<parent.childNodes.length; i++){
                if (parent.childNodes[i]==el){
                    parent.removeChild(el);
                    break;
                }
            }
        }


      //Reset variables
        cells = {};
        widths = {};



      //Create main table
        var div, tr, td;
        var table = el = createTable(parent);
        table.className = "javaxt-cal-day javaxt-noselect";


      //Create header row
        tr = table.addRow();
        addStyle(tr, config.style.header);
        tr.setAttribute("desc", "header");
        headerRow = tr;
        var header = tr.addColumn({width: "100%", height: "inherit"});



      //Create row for multiday events
        tr = table.addRow();
        addStyle(tr, config.style.multidayHeader);
        tr.setAttribute("desc", "multiday events");
        tr.style.display = "none";
        tr.style.visibility = "hidden"; //visible
        multidayRow = tr;
        td = tr.addColumn({width: "100%", height: "inherit"});
        var multidayDiv = createElement('div', td, {
            width: "100%",
            height: "inherit",
            position: "relative"
        });
        multidayDiv.setAttribute("desc", "multiday-div");



      //Create body row
        tr = table.addRow();
        addStyle(tr, config.style.body);
        tr.setAttribute("desc", "body");
        td = tr.addColumn({width: "100%", height: "100%"});

        bodyDiv = createElement('div', td, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        bodyDiv.setAttribute("desc", "body-div");
        div = createElement('div', bodyDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: 'scroll',
            overflowX: 'hidden'
        });
        bodyDiv = div;

      //Add logic to enable/disable scroll. This is important for touch devices.
        bodyDiv.addEventListener('touchstart', function(e) {
            if (!scrollable) e.preventDefault();
        }, false);
        bodyDiv.addEventListener('touchmove', function(e) {
            if (!scrollable) e.preventDefault();
        }, false);


      //Add scroll listener
        var listener = me.getListener('scroll');
        if (listener){
            div.addEventListener('scroll', function(e) {
                listener.callback.apply(listener.scope, [me]);
            }, false);
        }


      //Create footer row
        tr = table.addRow();
        tr.setAttribute("desc", "footer");
        footerRow = tr;
        var footer = tr.addColumn({width: "100%", height: "inherit"});


      //Create current time indicator
        currTimeDiv = createElement("div", bodyDiv, {
            position: "absolute",
            width: "100%",
            display: "none"
        });
        addStyle(currTimeDiv, config.style.currentTimeIndicator);


      //Populate header
        var headerTable = createTable(header);
        tr = headerTable.addRow();
        td = tr.addColumn();
        var spacerUL = createElement('div', td);

        var d = new Date(startDate);
        for (var i=0; i<config.days; i++){
            td = tr.addColumn({width: (100/config.days) + '%', height: "100%"});
            addStyle(td, config.style.headerCol);
            td.appendChild(me.createColumnHeader(d.getDay()));
            d.setDate(d.getDate()+1);
        }

        td = tr.addColumn();
        var spacerUR = createElement('div', td);


      //Grow the header row to fit its column headers (e.g. a custom renderer
      //that stacks the weekday over the date). No-op for single-line headers.
        resizeHeader(headerRow);


      //Populate footer
        var footerTable = createTable(footer);
        tr = footerTable.addRow();
        td = tr.addColumn();
        var spacerLL = createElement('div', td);

        var d = new Date(startDate);
        for (var i=0; i<config.days; i++){
            td = tr.addColumn({width: (100/config.days) + '%', height: "100%"});
            addStyle(td, config.style.footerCol);
            td.appendChild(me.createColumnFooter(d.getDay()));
            d.setDate(d.getDate()+1);
        }

        td = tr.addColumn();
        var spacerLR = createElement('div', td);



      //Populate multiday div
        var multidayContent = createElement('div', multidayDiv, {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        multidayContent.setAttribute("desc", "multiday-content");
        div = createElement('div', multidayContent, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: 'scroll',
            overflowX: 'hidden'
        });
        var multidayTable = createTable(div);
        tr = multidayTable.addRow();
        td = tr.addColumn();
        var spacerML = createElement('div', td);
        for (var i=0; i<config.days; i++){
            td = tr.addColumn({width: (100/config.days) + '%', height: "1px"});
            addStyle(td, config.style.multidayCol);
        }
        multidayEventsTable = multidayTable.firstChild;





      //Populate body
        var bodyTable = createTable(bodyDiv);
        var row = bodyTable.addRow();



      //Create left column to render hours
        var leftCol = row.addColumn({verticalAlign: "top"});
        var hours = createTable(leftCol);
        for (var i=0; i<24; i++){
            var tr = hours.addRow();
            var td = tr.addColumn();
            addStyle(td, config.style.hour);
            if (i==23) addStyle(td, config.style.hourLast);
            if (i==0) td.style.borderTop = "0px";
            td.appendChild(me.createHourLabel(i));
        }



      //Create main table used to render days
        var d = new Date(startDate);
        for (var i=0; i<config.days; i++){

            td = row.addColumn({width: (100/config.days) + '%', height: "100%", verticalAlign: "top"});
            addStyle(td, config.style.cell);
            td.valign="top";


          //Create div used to store events and the table grid
            var outerDiv = createElement('div', td, {
                width: "100%",
                height: "100%",
                position: "relative",
                cursor: "inherit"
            });
            var innerDiv = createElement('div', outerDiv, {
                width: "100%",
                height: "100%",
                position: "absolute",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                cursor: "inherit"
            });


            var cell = innerDiv;
            var cellID = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
            cell.date = new Date(d);
            cells[cellID] = cell;


          //Create table
            var innerTable = createTable(cell);



          //Add 1 row for every 30 minutes
            for (var j=0; j<24*2; j++){
                var tr = innerTable.addRow();

                var col = tr.addColumn();
                addStyle(col, config.style.halfHour);
                if (j % 2 != 0) addStyle(col, config.style.halfHourSep);
                if (j==47) addStyle(col, config.style.hourLast);
                if (j==0) col.style.borderTop = "0px";

                addListeners(tr, config.holdDelay);
            }


            d.setDate(d.getDate()+1);
        }



      //Update the spacer in the left column of the header
        var lt = _getRect(leftCol.childNodes[0]).width;
        spacerUL.style.width =
        spacerML.style.width =
        spacerLL.style.width = lt + 'px';


      //Update the spacer in the right column of the header
        var bodyWidth = _getRect(bodyDiv).width;
        var tableWidth = _getRect(leftCol.parentNode.parentNode.parentNode).width;
        scrollWidth = Math.abs(bodyWidth-tableWidth);
        spacerUR.style.width =
        spacerLR.style.width = scrollWidth + 'px';


      //Position the current time indicator once the grid is laid out. Measuring
      //row offsets requires layout, so defer via onRender - running this while
      //the view is still hidden/0-sized (e.g. mid view-switch) would pin the
      //indicator to the top (12am) until the next timer tick. onResize corrects
      //it again if the grid height changes after it first renders.
        currTimeDiv.style.left = lt + 'px';
        onRender(el, updateCurrTime);


      //Kick off scheduled task to periodically update the current time indicator
        var epoch = getCurrentDate().getTime() / 1000;
        var secondsSinceLastTimerTrigger = epoch % 60;
        var secondsUntilNextTimerTrigger = 60 - secondsSinceLastTimerTrigger;
        setTimeout(function() {
            setInterval(updateCurrTime, 60*1000);
            updateCurrTime();
        }, secondsUntilNextTimerTrigger*1000);



      //Measure the event geometry now that the grid is in the DOM. This must
      //happen before events are loaded so multiday wrappers and single-day
      //event padding are sized correctly.
        updateEventMetrics();


      //Scroll to start of workday
        me.scrollTo(6.5);


      //Call the "update" listener
        if (rendered){
            var listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        }
    };


  //**************************************************************************
  //** addListeners
  //**************************************************************************
  /** Used to initialize a cell for click and hold events.
   */
    var addListeners = function(cell, holdDelay){


      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;


      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;


      //OnClick
        //cell.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything


      //MouseDown
        var onMouseDown = function(e){

            var tr = this;

          //Set the holdStarter and wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;


                //start hold
                var listener = me.getListener('cellhold');
                if (listener){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    var date = getDate();
                    callback.apply(scope, [date, tr, me, e]);
                }

            }, holdDelay);

        };



      //MouseUp
        var onMouseUp = function(e){

            var tr = this;


          //Get date associated with the selected cell
            var date = getDate();



          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);


                var listener = me.getListener('cellclick');
                if (listener){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [date, tr, me, e]);
                }

            }

          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //End hold
                var listener = me.getListener('cellrelease');
                if (listener){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [date, tr, me, e]);
                }
            }
        };


        cell.onmousedown = onMouseDown;
        cell.onmouseup = onMouseUp;
        cell.ontouchstart = function(e) {

            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            this.onmousedown.apply(this, [{
                clientX: x,
                clientY: y
            }]);
        };
        cell.ontouchend = function(e){
            var touch = e.changedTouches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            this.onmouseup.apply(this, [{
                clientX: x,
                clientY: y
            }]);
        };

      //Get date associated with the selected cell
        var getDate = function(){

            var tbody = cell.parentNode;
            var _cell = tbody.parentNode.parentNode;
            var date = new Date(_cell.date);

            var hour = 0;
            for (var i=0; i<tbody.childNodes.length; i++){
                var tr = tbody.childNodes[i];
                if (tr===cell){
                    hour = (i/2);
                    break;
                }
            }
            date.setTime(date.getTime() + ((hour*60) * 60 * 1000));
            return date;
        };
    };


  //**************************************************************************
  //** createColumnHeader
  //**************************************************************************
  /** Returns a div used to indicate the day of the week. The div is inserted
   *  into a column header that corresponds to a given date. This method can
   *  be safely overridden to generate custom headers.
   */
    this.createColumnHeader = function(i){
        var outerDiv = createElement('div', {
            width: "100%",
            height: "100%",
            position: "relative",
            cursor: "inherit"
        });
        var innerDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            cursor: "inherit"
        });


        var text = config.dayNames[i];
        if (config.days>1) text = text.substring(0,3);
        //else text+= ", " + config.monthNames[d.getMonth()] + " " + d.getDate();
        innerDiv.innerHTML = text;


        return outerDiv;
    };



    this.createColumnFooter = function(i){
        return createElement('div');
    };



  //**************************************************************************
  //** createHourLabel
  //**************************************************************************
  /** Returns a div used to indicate the hour of day (e.g. 12pm). This method
   *  can be safely overridden to generate custom labels for hours.
   */
    this.createHourLabel = function(hour){
        var div = createElement('div', {
            float: "right",
            padding: "0px 7px 0px 7px"
        });


      //Update hour and set meridian
        var meridian = 'AM';
        if (hour==0) hour = 12;
        else if (hour==12) meridian = 'PM';
        else if (hour>12){
            hour = (hour-12);
            meridian = 'PM';
        }

      //Create table to render the hour and meridian
        var hdr = createTable(div);
        var tr = hdr.addRow();
        var td = tr.addColumn();
        addStyle(td, config.style.labelHour);
        td.innerHTML = hour;
        td = tr.addColumn();
        addStyle(td, config.style.labelMeridian);
        td.innerHTML = meridian;

        return div;
    };


  //**************************************************************************
  //** updateCurrTime
  //**************************************************************************
  /** Used to update the position of the current time indicator.
   */
    var updateCurrTime = function(){

        var date = getCurrentDate();
        var cellID = (date.getMonth()+1) + "-" + date.getDate() + "-" + date.getFullYear();
        var cell = cells[cellID];
        if (cell){

            var hours = date.getHours();
            var h1 = getVerticalOffset(hours, cell);
            var h2 = getVerticalOffset(hours+1, cell);

            var pixelsPerMinute = (h2-h1)/60;
            var h = h1+(date.getMinutes()*pixelsPerMinute);

            currTimeDiv.style.display = '';
            currTimeDiv.style.top = h + "px";
        }
        else{
            currTimeDiv.style.display = "none";
        }
    };


  //**************************************************************************
  //** scrollTo
  //**************************************************************************
  /** Used to scroll to a specific time of day.
   *  @param hour Time of day, specified as a decimal (e.g. 6.5 for 6:30 AM)
   */
    this.scrollTo = function(hour){
        var cellID = (date.getMonth()+1) + "-" + date.getDate() + "-" + date.getFullYear();
        var cell = cells[cellID];
        var offset = getVerticalOffset(hour, cell);
        bodyDiv.scrollTop = offset+1; //+1 for border
    };


  //**************************************************************************
  //** getScrollDiv
  //**************************************************************************
    this.getScrollDiv = function(){
        return bodyDiv;
    };


  //**************************************************************************
  //** getVerticalOffset
  //**************************************************************************
  /** Returns the vertical offset (relative to the cell) of a given hour. The
   *  offset is measured directly from the rendered grid rows rather than summed
   *  from cached row heights - the rows stretch to fill the available space
   *  (e.g. on large screens) and fractional heights would otherwise accumulate
   *  rounding error, causing events to drift away from the hour lines.
   */
    var getVerticalOffset = function(hour, cell){
        var tbody = cell.childNodes[0].childNodes[0];
        var rows = tbody.childNodes;
        if (rows.length==0) return 0;

        var cellTop = _getRect(cell).top;

      //There are 2 rows per hour; find the row that starts at (or just after)
      //the requested hour and return the top of that row relative to the cell.
        var i = Math.ceil(hour*2);
        if (i < rows.length) return _getRect(rows[i]).top - cellTop;

      //At/after the end of the day - use the bottom of the last row.
        return _getRect(rows[rows.length-1]).bottom - cellTop;
    };


  //**************************************************************************
  //** getEventStore
  //**************************************************************************
    this.getEventStore = function(){
        return config.eventStore;
    };


  //**************************************************************************
  //** addEvent
  //**************************************************************************
    this.addEvent = function(event){
        addEvent(event);
    };


  //**************************************************************************
  //** addEvent
  //**************************************************************************
  /** Private method used to add an event to the view.
   *  @param deferUpdates Option to postpone or defer updating the event
   *  width and position when there are overlapping events. This option is
   *  provided for optimization.
   */
    var addEvent = function(event, deferUpdates){

        log("Adding " + event.getSubject() + "...");
        var numDays = event.numDays();


      //Check if we've already rendered the given event
        if (numDays>=1){
            for (var i=1; i<multidayEventsTable.childNodes.length; i++){
                var tr = multidayEventsTable.childNodes[i];
                for (var j=1; j<tr.childNodes.length; j++){
                    var td = tr.childNodes[j];
                    if (td.childNodes.length>0){
                        var div = td.childNodes[0];
                        if (div.event.equals(event)){
                            return;
                        }
                    }
                }
            }

        }
        else{
            var divs = getDivs(event.getStartDate());
            for (var i=0; i<divs.length; i++){
                var div = divs[i];
                if (div.event.equals(event)){
                    return;
                }
            }
        }



      //If we're still here, add the event
        var style = getStyle(event, config);
        event.setStyle(style);

        if (numDays>=1){
            addMultiDayEvent(event);
        }
        else{
            addSingleDayEvent(event, deferUpdates);
        }


      //Update the event store
        config.eventStore.add(event);
    };


  //**************************************************************************
  //** addEvents
  //**************************************************************************
  /** Used to add multiple events to the view. This method is recommended for
   *  bulk loading and is significantly faster than calling addEvent multiple
   *  times.
   */
    this.addEvents = function(events){


      //Add events but defer updating position and widths of overlapping events
        for (var i=0; i<events.length; i++){
            addEvent(events[i], true);
        }



      //Generate list of all single-day events in the view
        var singleDayEvents = [];
        events = me.getEvents();
        for (var i=0; i<events.length; i++){
            var event = events[i];
            if (event.numDays()<1){
                var div = getDiv(event);
                if (div!=null) singleDayEvents.push(event);
            }
        }


      //Local variables
        var processedEvents = [];
        var isProcessed = function(event){
            for (var i=0; i<processedEvents.length; i++){
                if (processedEvents[i].equals(event)){
                    return true;
                }
            }
            return false;
        };



      //Iterate through single-day events and update widths
        for (var i=0; i<singleDayEvents.length; i++){
            var event = singleDayEvents[i];

            var updateWidth = !isProcessed(event);


            if (updateWidth){
                var overlappingEvents = getOverlappingEvents(event);
                if (overlappingEvents.length>0){

                  //Compute number of columns
                    var numColumns = 2;
                    if (overlappingEvents.length>1){

                      //The following logic is somewhat flawed and may yeild
                      //a column count slightly higher than expected...
                        for (var j=0; j<overlappingEvents.length; j++){
                            var _event = overlappingEvents[j];
                            var _startDate = _event.getStartDate();
                            var _endDate = _event.getEndDate();
                            var numIntersects = 0;
                            for (var k=0; k<overlappingEvents.length; k++){
                                if (!overlappingEvents[k].equals(_event)){
                                    var a = overlappingEvents[k].getStartDate();
                                    var b = overlappingEvents[k].getEndDate();
                                    if (_startDate.getTime() < b.getTime() && a.getTime() < _endDate.getTime()){
                                        numIntersects++;
                                    }
                                }
                            }

                            if (numIntersects>0){
                                var _numColumns = 1 + 1 + numIntersects;
                                if (_numColumns>numColumns) numColumns = _numColumns;
                            }

                        }
                    }


                    var width = (Math.floor((1/(numColumns))*100));
                    log("Update " + event.getSubject() + " width to " + width + "%");
                    var outerDiv = getDiv(event);
                    outerDiv.style.width = width + "%";


                    for (var j=0; j<overlappingEvents.length; j++){
                        var _event = overlappingEvents[j];
                        var _outerDiv = getDiv(_event);

                        var _width = parseInt(_outerDiv.style.width);
                        if (widths["_"+_width]!=null) _width = widths["_"+_width];
                        if (_width<width) width = _width;

                        _outerDiv.style.width = width + "%";

                        processedEvents.push(_event);
                    }
                }
            }

            processedEvents.push(event);
        }



      //Iterate through single-day events and update position of overlapping events
        processedEvents = [];
        for (var i=0; i<singleDayEvents.length; i++){
            var event = singleDayEvents[i];
            if (!isProcessed(event)){

                var overlappingEvents = getOverlappingEvents(event);
                if (overlappingEvents.length>0){

                    for (var j=0; j<overlappingEvents.length; j++){
                        var _event = overlappingEvents[j];
                        var _outerDiv = getDiv(_event);
                        var _width = parseInt(_outerDiv.style.width);
                        if (widths["_"+_width]!=null) _width = widths["_"+_width];

                        updatePosition(_outerDiv, _event, _width);
                        processedEvents.push(_event);
                    }

                }
            }
            processedEvents.push(event);
        }
        processedEvents = null;




      //Fill any gaps
        for (var i=0; i<singleDayEvents.length; i++){
            var event = singleDayEvents[i];
            var outerDiv = getDiv(event);


            var width = parseInt(outerDiv.style.width);
            if (widths["_"+width]!=null) width = widths["_"+width];
            var numColumns = Math.floor(100/width);

            if (numColumns>1){

                var left = parseInt(outerDiv.style.left);
                var colIndex = Math.floor(left/width)+1;


                log(event.getSubject() + " is in column " + colIndex + "/" + numColumns);

                if (colIndex===(numColumns-1)){
                    var overlappingEvents = getOverlappingEvents(event);
                    var nextEvent = overlappingEvents[overlappingEvents.length-1];
                    var nextDiv = getDiv(nextEvent);
                    var orgWidth = parseInt(outerDiv.style.width);
                    var newWidth = parseInt(nextDiv.style.left) - left;
                    if (newWidth>orgWidth){
                        log("   ++ Updating " + event.getSubject() + " width to " + newWidth + "% (was " + orgWidth + "%)");
                        outerDiv.style.width = newWidth + "%";
                    }
                }

            }
        }

    };


  //**************************************************************************
  //** removeEvent
  //**************************************************************************

    this.removeEvent = function(event){

      //Update event store
        config.eventStore.remove(event);


      //Remove div
        if (event.numDays()>=1){

            for (var i=1; i<multidayEventsTable.childNodes.length; i++){
                var tr = multidayEventsTable.childNodes[i];
                for (var j=1; j<tr.childNodes.length; j++){
                    var td = tr.childNodes[j];
                    if (td.childNodes.length>0){
                        var div = td.childNodes[0];
                        if (div.event.equals(event)){

                          //Remove event div
                            td.removeChild(div);


                          //Remove colspan
                            var colSpan = td.colSpan;
                            if (colSpan>=2){
                                td.colSpan = 1;
                                var nextSibling = td.nextSibling;
                                var clone = td.cloneNode(true);
                                //var tr = td.parentNode;
                                for (var k=0; k<colSpan; k++){
                                    if (nextSibling){
                                        tr.insertBefore(clone, nextSibling);
                                    }
                                    else{
                                        tr.appendChild(clone);
                                    }
                                }
                            }


                          //Delete the row if we can
                            if (multidayEventsTable.childNodes.length>1){
                                var hasEvents = false;
                                for (var k=1; k<tr.childNodes.length; k++){
                                    if (tr.childNodes[k].childNodes.length>0){
                                        hasEvents = true;
                                        break;
                                    }
                                }

                                if (!hasEvents){
                                    multidayEventsTable.removeChild(tr);
                                }
                            }


                          //Update table height
                            var maxHeight = (multidayEventsTable.childNodes.length-1)*(eventHeight+eventPadding);
                            if (maxHeight==0){
                                multidayRow.style.display = "none";
                                multidayRow.style.visibility = "hidden";
                            }
                            else{
                                multidayEventsTable.parentNode.parentNode.parentNode.style.height = (maxHeight+(eventPadding)) + "px";
                            }


                            return;
                        }
                    }
                }
            }

        }
        else{

          //Remove event div
            var divs = getDivs(event.getStartDate());
            for (var i=0; i<divs.length; i++){
                var div = divs[i];
                if (div.event.equals(event)){
                    var parentNode = div.parentNode;
                    parentNode.removeChild(div);
                    break;
                }
            }


          //Update overlapping events as needed
            var overlappingEvents = getOverlappingEvents(event);
            if (overlappingEvents.length>0){

              //Remove overlapping events
                for (var i=0; i<overlappingEvents.length; i++){
                    for (var j=0; j<divs.length; j++){
                        var div = divs[j];
                        if (div.event.equals(overlappingEvents[i])){
                            var parentNode = div.parentNode;
                            parentNode.removeChild(div);
                            break;
                        }
                    }
                }

              //Add overlapping events
                me.addEvents(overlappingEvents);
            }
        }
    };


  //**************************************************************************
  //** getEvents
  //**************************************************************************
  /** Returns an array of all the events rendered in the view.
   */
    this.getEvents = function(){

        var events = [];

      //Find events that occur with a single day
        var d = new Date(date);
        if (config.days>1 && d.getDay()>0) d.setDate(d.getDate()-d.getDay());
        for (var i=0; i<config.days; i++){
            var divs = getDivs(d);

            for (var j=0; j<divs.length; j++){
                var div = divs[j];
                var event = div.event;
                events.push(event);
            }

            d.setDate(d.getDate()+1);
        }



      //Find multi-day events events
        for (var i=1; i<multidayEventsTable.childNodes.length; i++){
            var tr = multidayEventsTable.childNodes[i];
            for (var j=1; j<tr.childNodes.length; j++){
                var td = tr.childNodes[j];
                if (td.childNodes.length>0){
                    var div = td.childNodes[0];
                    var event = div.event;

                    var addEvent = true;
                    for (var k=0; k<events.length; k++){
                        if (events[k].equals(event)){
                            addEvent = false;
                            break;
                        }
                    }

                    if (addEvent) events.push(event);
                }
            }
        }

        return events;
    };


  //**************************************************************************
  //** clear
  //**************************************************************************
  /** Used to remove all the events from the view.
   */
    this.clear = function(){

      //Remove events that occur with a single day
        var d = new Date(date);
        if (config.days>1 && d.getDay()>0) d.setDate(d.getDate()-d.getDay());
        for (var i=0; i<config.days; i++){
            var divs = getDivs(d);

            for (var j=0; j<divs.length; j++){
                var div = divs[j];
                var event = div.event;
                config.eventStore.remove(event);
                var parentNode = div.parentNode;
                parentNode.removeChild(div);
            }

            d.setDate(d.getDate()+1);
        }



      //Remove any multi-day events
        var row = multidayEventsTable.childNodes[0];
        while (row.nextSibling){
            var tr = row.nextSibling;

            for (var j=1; j<tr.childNodes.length; j++){
                var td = tr.childNodes[j];
                if (td.childNodes.length>0){
                    var div = td.childNodes[0];
                    var event = div.event;
                    config.eventStore.remove(event);
                }
            }

            multidayEventsTable.removeChild(tr);
        }
        multidayRow.style.display = "none";
        multidayRow.style.visibility = "hidden";
    };


  //**************************************************************************
  //** refresh
  //**************************************************************************
  /** Used to re-render all the events in the cell.
   */
    this.refresh = function(){
        var events = me.getEvents();
        me.clear();
        me.addEvents(events);
        me.scrollTo(6.5);
    };


  //**************************************************************************
  //** addSingleDayEvent
  //**************************************************************************
  /** Used to render events that start and end on the same day.
   */
    var addSingleDayEvent = function(event, deferUpdates){

        if (deferUpdates!=true) deferUpdates = false;

      //Find cell used to render event
        var d = event.getStartDate();
        var cellID = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
        var cell = cells[cellID];
        if (cell==null) return;



        var width = 100;
        var overlappingEvents, rects, leftCoords;



      //Update position and width of any overlapping events
        if (!deferUpdates){

          //Get bounding rectangles of the overlapping events
            rects = [];
            var overlappingEvents = getOverlappingEvents(event);
            for (var i=0; i<overlappingEvents.length; i++){
                var _event = overlappingEvents[i];
                var _outerDiv = getDiv(_event);
                if (_outerDiv!=null){
                    rects.push(_getRect(_outerDiv));
                }
            }


          //Generate list of the left coordinates of any overlapping events
            leftCoords = [];
            for (var i=0; i<rects.length; i++){
                var x = rects[i].left;
                var addCoord = true;
                for (j=0; j<leftCoords.length; j++){
                    if (leftCoords[j]==x){
                        addCoord = false;
                        break;
                    }
                }
                if (addCoord) leftCoords.push(x);
            }
            leftCoords.sort(function(a,b){
                return a-b;
            });



          //Compute width for new event. Note that the current logic for calculating
          //the number of columns is flawed because it relies on overlapping events.
          //The logic in the for loop is a hacky workaround.
            var numColumns = leftCoords.length;
            width = (Math.floor((1/(numColumns+1))*100));
            for (var i=0; i<overlappingEvents.length; i++){
                var _event = overlappingEvents[i];
                var _outerDiv = getDiv(_event);
                if (_outerDiv!=null){
                    var _width = parseInt(_outerDiv.style.width);
                    if (widths["_"+_width]!=null) _width = widths["_"+_width];
                    if (_width<width) width = _width;
                }
            }



          //Update position and width of any overlapping events
            for (var i=0; i<overlappingEvents.length; i++){

                var _event = overlappingEvents[i];
                var _outerDiv = getDiv(_event);
                if (_outerDiv!=null){
                    var _width = parseInt(_outerDiv.style.width);
                    if (widths["_"+_width]!=null) _width = widths["_"+_width];
                    if (width<_width) _width = width;

                    log(event.getSubject()  + " intersects " + _event.getSubject());
                    log("   Moving " + _event.getSubject() + " to 0 and setting width to " + _width + "% (was " + _outerDiv.style.width + ")");

                    _outerDiv.style.width = _width + "%";
                    _outerDiv.style.left = "0px";
                    updatePadding(_outerDiv);
                    if (!deferUpdates) updatePosition(_outerDiv, _event, _width);
                }
            }
        }



      //Create an absolute div within the cell to render the event
        var outerDiv = createElement('div', {
            width: width + "%",
            left: "0px",
            position: "absolute"
        });
        updatePadding(outerDiv);
        var startTime = event.getStartDate().getHours() + (event.getStartDate().getMinutes()/60);
        var endTime = event.getEndDate().getHours() + (event.getEndDate().getMinutes()/60);

      //Position the event as a percentage of the day so it scales with the grid
      //(the grid rows stretch to fill the view). Pixel offsets would drift away
      //from the hour lines whenever the grid is resized/re-laid-out.
        outerDiv.style.top = ((startTime/24)*100) + "%";
        outerDiv.style.height = (((endTime-startTime)/24)*100) + "%";
        outerDiv.event = event;
        cell.appendChild(outerDiv);


      //Create div used to render the event
        var div = event.createDiv();


      //Wrap event in a table to ensure proper padding (I couldn't figure out how to do it with divs)
        var eventTable = createTable(outerDiv);
        var tr = eventTable.addRow();
        var td = tr.addColumn({
            verticalAlign: "top",
            width: "100%",
            height: "100%",
            padding: ((eventPadding/2)+1) + "px " + eventPadding + "px " + (eventPadding/2) + "px" //+1 for half-hour border
        });
        td.appendChild(div);


      //Update vertical padding. Each browser pads tables differently. Chrome
      //doesn't apply any padding so the table fits perfectly in the div. IE
      //puts the 1px table below where we expect and adds 1px to the bottom.
      //FF adds 1 px to the bottom. This might have something to do with how
      //browsers interpret the cellpadding and cellspacing attributes.
        if (isIE) {
            td.style.paddingTop = (eventPadding/2) + "px";
            td.style.paddingBottom = (eventPadding+1) + "px";
        }
        if (isFirefox){
            td.style.paddingTop = (eventPadding/2) + "px";
            td.style.paddingBottom = (((eventPadding/2)+1)*2) + "px";
        }



      //Initialize mouse events
        if (event.isEditable()) initDrag(outerDiv, me, config.holdDelay, config.style.eventDrag);
        else{
            outerDiv.onclick = function(e){
                var listener = me.getListener('eventclick');
                if (listener!=null){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [this.event, this, me, e]);
                }
            };
        }



      //Update position and width of the new div
        if (!deferUpdates){
            if (overlappingEvents.length>0){

              //Update position of the new div as needed
                log("Update " + event.getSubject() + "?");
                updatePosition(outerDiv, event, width);


              //If there are any divs to the right, ensure that the width spans
              //to the closest div
                var rightDiv;
                var r1 = _getRect(outerDiv);
                var _right = r1.right;
                for (var i=0; i<leftCoords.length; i++){
                    if (leftCoords[i]>=_right){


                        for (var j=0; j<rects.length; j++){
                            var x = rects[j].left;
                            if (x==leftCoords[i]){
                                rightDiv = getDiv(overlappingEvents[j]);
                                break;
                            }
                        }

                        break;
                    }
                    if (rightDiv!=null) break;
                }

                if (rightDiv!=null){
                    var _left = parseInt(outerDiv.style.left);
                    var newWidth = parseInt(rightDiv.style.left) - _left;
                    log("   ++ Updating " + event.getSubject() + " width to " + newWidth + "% (was " + width + "%)");
                    outerDiv.style.width = newWidth + "%";
                }

            }
        }
    };


  //**************************************************************************
  //** addMultiDayEvent
  //**************************************************************************
  /** Used to render multi-day events
   */
    var addMultiDayEvent = function(event){

      //Check whether the event is in range
        if (event.getEndDate()<startDate || event.getStartDate()>endDate) return;


        var startColID, endColID;
        var continueLeft = false;
        var continueRight = false;
        var a = javaxt.dhtml.calendar.utils.getDaysBetween(startDate, event.getStartDate());
        var b = javaxt.dhtml.calendar.utils.getDaysBetween(startDate, event.getEndDate());
        //console.log(event.getSubject() + " " + a + " --> " + b);

        startColID = a;
        if (a<0){
            startColID = 0;
            continueLeft = true;
        }
        startColID = Math.floor(startColID);



      //b is the event-end offset from the view start, so it is the end column
      //directly - do NOT add startColID (that double-counts the start offset and
      //makes multiday events too wide in the week view). Floor before the
      //comparison: an event that ends late on the last visible day (e.g. 23:59)
      //gives a fractional value just under the next column and must NOT be
      //treated as continuing past the view.
        endColID = Math.floor(b);
        if (endColID>config.days-1){
            endColID = config.days-1;
            continueRight = true;
        }


        //console.log("use cols " + startColID + " - " + endColID);



      //Find start/end columns in the multiday events table
        var startCol, endCol;
        for (var i=1; i<multidayEventsTable.childNodes.length; i++){ //skip first row
            var tr = multidayEventsTable.childNodes[i];
            var idx = 0;
            for (var j=1; j<tr.childNodes.length; j++){ //skip first column
                var td = tr.childNodes[j];

                if (idx==startColID){
                    if (td.childNodes.length==0){
                        //console.log("Found start!");
                        //console.log(td);
                        startCol = td;
                    }
                    else{
                        i = multidayEventsTable.childNodes.length;
                        break;
                    }
                }

                if (idx==endColID){
                    if (td.childNodes.length==0){
                        //console.log("Found end!");
                        //console.log(td);
                        endCol = td;


                      //check if any cells between the startCol and endCol are occupied
                        if (startCol!=endCol){
                            var previousCol = td.previousSibling;
                            while (previousCol!=startCol){
                                if (previousCol.childNodes.length>0){
                                    startCol = endCol = null;
                                    break;
                                }

                                previousCol = previousCol.previousSibling;
                            }
                        }
                    }


                    i = multidayEventsTable.childNodes.length;
                    break;
                }


                var colSpan = td.colSpan;
                if (colSpan>=2) idx+=colSpan;
                else idx++;
            }
        }



      //Add new row to the multidayEventsTable as needed
        if (!startCol || !endCol){
            var tr = createElement("tr", multidayEventsTable);
            var td = createElement("td", tr);
            addStyle(td, config.style.multidayColSpacer);


          //Remove height from spacer col of previous row and set current col height
            if (multidayEventsTable.childNodes.length>1){
                tr.previousSibling.childNodes[0].style.height = '';
            }
            td.style.height = "100%";



          //Add days
            for (var i=0; i<config.days; i++){
                td = createElement('td', tr);
                addStyle(td, config.style.multidayCol);

                if (i==startColID) startCol = td;
                if (i==endColID) endCol = td;
            }
        }


      //Add colspan as needed
        var colSpan = (endColID-startColID)+1;
        if (colSpan>=2){
            javaxt.dhtml.calendar.utils.addColSpan(startCol, colSpan);
        }


      //Add event to the startCol
        var outerDiv = createElement('div', {
            width: "100%",
            height: "100%",
            position: "absolute"
        });

        var paddingLeft = continueLeft ? "0px" : eventPadding + "px";
        var paddingRight = continueRight ? "0px" : eventPadding + "px";
        var innerDiv = createElement('div', outerDiv, {
            height: "100%",
            padding: "0px " + paddingRight + " 0px " + paddingLeft, //Horizontal padding
            position: "relative"
        });

        var div = event.createDiv(continueLeft, continueRight);
        div.style.height = "100%";
        innerDiv.appendChild(div);


      //Wrap the outerdiv to ensure proper overflow
        var wrapper = createElement('div', {
            width: "100%",
            height: eventHeight + "px",
            position: "relative",
            marginTop: (multidayEventsTable.childNodes.length>2 ? (eventPadding*2) : 0) + "px"
        });
        wrapper.appendChild(outerDiv);
        wrapper.event = event;
        wrapper.onclick = function(e){
            var listener = me.getListener('eventclick');
            if (listener!=null){
                var callback = listener.callback;
                var scope = listener.scope;
                callback.apply(scope, [this.event, this, me, e]);
            }
        };

        startCol.appendChild(wrapper);


      //Update the visibility of the multiday row
        multidayRow.style.display = '';
        multidayRow.style.visibility = "visible";


      //Update table height
        var numMultiDayEvents = multidayEventsTable.childNodes.length-1;
        var h = numMultiDayEvents*(eventHeight+eventPadding);
        h = (h+(eventPadding*2));
        var multidayEventsDiv = multidayEventsTable.parentNode.parentNode.parentNode;
        multidayEventsDiv.style.height =  h + "px";




      //Check whether the columns are aligned. For some browsers (e.g. Firefox),
      //the vertical scroll bar doesn't show up until the overflow container
      //reaches a certain height. Without the scroll bar, the multiday event
      //columns become misaligned with the cells.
        var h1 = multidayEventsTable.childNodes[0].childNodes[1];
        var c1;
        for (var id in cells) {
            if (cells.hasOwnProperty(id)) {
                c1 = cells[id].parentNode.parentNode;
                break;
            }
        }

      //Update the height of the vertical scroll bar until it becomes visible.
      //This should work assuming the multidayEventsTable and the header
       var orgHeight = h;
        while (h1.offsetWidth>c1.offsetWidth){
            if (h<scrollWidth*2) h = scrollWidth*2;
            else h++;
            multidayEventsDiv.style.height =  h + "px";

          //If the widths don't align after growing to 100px in height, then
          //there's something wrong - possibly a css style issue with borders.
            if (h===100){
                multidayEventsDiv.style.height = orgHeight + "px";
                break;
            }
        }

    };


  //**************************************************************************
  //** getDOM
  //**************************************************************************
    this.getDOM = function(){
        return el;
    };


  //**************************************************************************
  //** next
  //**************************************************************************
    this.next = function(){
        var d = new Date(startDate);
        d.setDate(d.getDate()+config.days);
        me.setDate(d);
    };


  //**************************************************************************
  //** back
  //**************************************************************************
    this.back = function(){
        var d = new Date(startDate);
        d.setDate(d.getDate()-config.days);
        me.setDate(d);
    };


  //**************************************************************************
  //** setDate
  //**************************************************************************
    this.setDate = function(d){
        if (d==null) d = getCurrentDate(); //null date is sometimes passed in from the constructor


        if (date!=null){
            if (d.getFullYear()==date.getFullYear() && d.getMonth()==date.getMonth() && d.getDate()==date.getDate()){
                date = d;
                return;
            }
        }


        date = d;
        startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        if (config.days>1 && startDate.getDay()>0) startDate.setDate(startDate.getDate()-startDate.getDay());

        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate()+config.days);


        renderTable();
        loadEvents();
    };


  //**************************************************************************
  //** getDate
  //**************************************************************************
    this.getDate = function(){
        return date;
    };


  //**************************************************************************
  //** getDateRange
  //**************************************************************************
  /** Returns the start/end dates represented by this view. */

    this.getDateRange = function(){
        return {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
  /** Returns a title for the current view. */

    this.getTitle = function(){
        if (config.days==1){
            var month = config.monthNames[date.getMonth()];
            return (month + " " + date.getDate() + ", " + date.getFullYear());
        }
        else{
            var range = me.getDateRange();
            var startDate = range.startDate;
            var endDate = range.endDate;
            endDate.setDate(endDate.getDate()-1);

            var startMonth = config.monthNames[startDate.getMonth()];
            var endMonth = config.monthNames[endDate.getMonth()];

            var a = startMonth + " " + startDate.getDate();
            var b = endDate.getDate() + ", " + endDate.getFullYear();
            if (startDate.getMonth()==endDate.getMonth() && startDate.getFullYear()==endDate.getFullYear()){
                return (a + " - " + b);
            }
            else{
                if (startDate.getFullYear()==endDate.getFullYear()){
                    return (a + " - " + endMonth + " " + b);
                }
                else{
                    return (a + ", " + startDate.getFullYear() + " - " + endMonth + " " + b);
                }
            }
        }
    };


  //**************************************************************************
  //** loadEvents
  //**************************************************************************
    var loadEvents = function(){

        var events = config.eventStore.getEvents();
        for (var i=0; i<events.length; i++){

            if (events[i].getStartDate().getTime()<endDate.getTime() &&
                events[i].getEndDate().getTime()>=startDate.getTime()){
                me.addEvent(events[i]);
            }
        }
    };


  //**************************************************************************
  //** updatePosition
  //**************************************************************************
  /** Function used to move a div from left to right until we find an area
   *  that doesn't intersect another div.
   */
    var updatePosition = function(div, _event, width){

      //Get bounding rectangle of the div. Subtract 1 pixel for intesection test.
        var r1 = _getRect(div);
        r1 = {
            left: r1.left+1,
            right: r1.right-1,
            top: r1.top+1,
            bottom: r1.bottom-1
        };


      //Check whether the div intersect any other divs. Shift div
      //to the right until we find a
        var divs = getDivs(_event.getStartDate());
        var x = 0;
        while (x<=100){

            var shiftRight = false;
            for (var j=0; j<divs.length; j++){



                if (div==divs[j]){}
                else{


                    var r2 = _getRect(divs[j]);
                    r2 = {
                        left: r2.left+1,
                        right: r2.right-1,
                        top: r2.top+1,
                        bottom: r2.bottom-1
                    };

                    if (intersects(r1, r2)){
                        log("   -- " + _event.getSubject() + " intersects " + divs[j].innerHTML);
                        log(r1.left + " vs " + r2.left);
                        log(r1.right + " vs " + r2.right);
                        shiftRight = true;
                        break;
                    }
                }
            }

            if (shiftRight){
                x++;
                div.style.left = (x*width) + "%";
                updatePadding(div);
                r1 = _getRect(div);
                r1 = {
                    left: r1.left+1,
                    right: r1.right-1,
                    top: r1.top+1,
                    bottom: r1.bottom-1
                };
                log("   -- " + _event.getSubject() + " is now here: " + div.style.left + " (column " + (x+1) + ")");
            }
            else{
                break;
            }
        }

        log("   -- " + _event.getSubject() + " is in column " + (x+1) + "/" + Math.floor(100/width));

        var _colIndex = x+1;
        var _numColumns = Math.floor(100/width);
        var _left = (x*width);
        if (_colIndex==_numColumns){

          //If the div is in the right column, ensure that the width
          //extends all the way to the edge (e.g. make 33% to 34%).
            if (_left+width<100){
                var newWidth = (width+(100-(_left+width)));
                log("   -- Updating " + _event.getSubject() + " width to " + newWidth + "% (was " + width + "%)");
                div.style.width = newWidth + "%";
                widths["_"+newWidth] = width;
            }
        }
    };


  //**************************************************************************
  //** updatePadding
  //**************************************************************************
  /** Used to add/remove left padding to an event div
   */
    var updatePadding = function(outerDiv){

        var td;
        var el = outerDiv;
        while (el.childNodes.length>0){
            el = el.childNodes[0];
            if (el.tagName.toUpperCase()==="TD"){
                td = el;
                break;
            }
        }

        if (td){
            var left = parseInt(outerDiv.style.left);
            if (left===0){
                td.style.paddingLeft = eventPadding+"px";
            }
            else{
                td.style.paddingLeft = "0px";
            }
        }
    };


  //**************************************************************************
  //** sortEvents
  //**************************************************************************
  /** Used to sort events by order of appearance in the cell - left to right,
   *  top to bottom.
   */
    var sortEvents = function(events){

        var _events = [];
        for (var i=0; i<events.length; i++){
            _events.push(events[i]);
        }

        var divs = [];
        for (var id in cells) {
            if (cells.hasOwnProperty(id)) {
                var cell = cells[id];
                for (var i=0; i<cell.childNodes.length; i++){
                    var el = cell.childNodes[i];
                    var tagName = el.tagName.toLowerCase();
                    if (tagName=="div" && el.event!=null) divs.push(el);
                }
            }
        }


        var getRow = function(event){
            var startRow = event.getStartDate().getHours()*2;
            if (event.getStartDate().getMinutes()>=30) startRow+=1;
            return startRow;
        };


        events.sort(function(event1, event2){
            var y1 = getRow(event1);
            var y2 = getRow(event2);

            var div1, div2;
            for (var i=0; i<_events.length; i++){
                if (_events[i].equals(event1)){
                    div1 = divs[i];
                }
                if (_events[i].equals(event2)){
                    div2 = divs[i];
                }

                if (div1!=null && div2!=null) break;
            }
            var x1 = parseInt(div1.style.left);
            var x2 = parseInt(div2.style.left);

            var a = x1 + (y1*1000);
            var b = x2 + (y2*1000);
            return a-b;
        });

        return events;
    };


  //**************************************************************************
  //** getOverlappingEvents
  //**************************************************************************
  /** Returns a list of events that overlap a given event. This method ignores
   *  multi-day events and events that are not in the current view.
   */
    var getOverlappingEvents = function(event){

        var arr = [];
        var overlappingEvents = config.eventStore.getOverlappingEvents(event);
        for (var i=0; i<overlappingEvents.length; i++){
            var _event = overlappingEvents[i];
            if (_event.numDays()<1){//Ignore mulitday events
                var _div = getDiv(_event);
                if (_div!=null){ //Ignore events that are out of view
                    arr.push(_event);
                }
            }
        }
        return sortEvents(arr);
    };


  //**************************************************************************
  //** getDivs
  //**************************************************************************
  /** Returns an array of event divs for a given day. Ignores multiday events.
   */
    var getDivs = function(date){
        var divs = [];
        var d = new Date(date);
        var cellID = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
        var cell = cells[cellID];
        if (cell!=null){
            for (var i=0; i<cell.childNodes.length; i++){
                var el = cell.childNodes[i];
                var tagName = el.tagName.toLowerCase();
                if (tagName=="div" && el.event!=null) divs.push(el);
            }
        }
        return divs;
    };


  //**************************************************************************
  //** getDiv
  //**************************************************************************
  /** Returns the div associated with a given event.
   */
    var getDiv = function(event){

        if (event.numDays()>=1){
            //TODO: Find multiday event div...
        }
        else{
            var divs = getDivs(event.getStartDate());
            for (var i=0; i<divs.length; i++){
                var div = divs[i];
                if (div.event.equals(event)) return div;
            }
        }
        return null;
    };


  //**************************************************************************
  //** getCells
  //**************************************************************************
  /** Returns an array of cells - one for each day in the view. A cell is
   *  defined by a date/id and a bounding rectangle. These cells are used
   *  when dragging events.
   */
    this.getCells = function(){
        var arr = [];
        for (var id in cells) {
            if (cells.hasOwnProperty(id)) {
                var div = cells[id];
                var rect = _getRect(div);
                arr.push({
                    id: id,
                    rect: rect
                });
            }
        }
        return arr;
    };


  //**************************************************************************
  //** updateEventMetrics
  //**************************************************************************
  /** Used to set eventHeight and eventPadding
   */
    var updateEventMetrics = function(){
        getEventMetrics(el, config.style.event, function(metrics){
          //Multiday event divs are border-box (see the .javaxt-cal-day rule), so
          //their height:100% is the full bar - use the full rendered height so
          //the text isn't clipped.
            eventHeight = metrics.offsetHeight;
            eventPadding = metrics.padding;
        });
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var addResizeListener = javaxt.dhtml.utils.addResizeListener;
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var intersects = javaxt.dhtml.utils.intersects;
    var isNumber = javaxt.dhtml.utils.isNumber;
    var addStyle = javaxt.dhtml.utils.addStyle;
    var onRender = javaxt.dhtml.utils.onRender;
    var _getRect = javaxt.dhtml.utils.getRect;
    var merge = javaxt.dhtml.utils.merge;

    var log = function(str){if(config.debug)console.log(str);};
    var getEventMetrics = javaxt.dhtml.calendar.utils.getEventMetrics;
    var resizeHeader = javaxt.dhtml.calendar.utils.resizeHeader;
    var getStyle = javaxt.dhtml.calendar.utils.getStyle;
    var initDrag = javaxt.dhtml.calendar.utils.initDrag;

    init();
};