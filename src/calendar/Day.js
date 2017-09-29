if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

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
    
    
  //DOM elements
    var el;
    var bodyDiv;
    var footerRow;
    var multidayRow, multidayEventsTable;
    var currTimeDiv, getCurrentDate;
    
    
  //Class variables
    var rendered;
    var startDate, endDate;
    var cells = {};
    var widths = {};
    var rowHeights = [];
    var scrollWidth;
    var scrollable = true;
    
    
  //Config options
    var days = 1;
    var date;
    var store;
    var eventHeight = 17; //Only applies to multiday events
    var eventPadding = 2;
    var holdDelay = 500;
    var debug = false;


  //Browser detection used to adjust event padding
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    var isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 ||
               window.navigator.userAgent.indexOf("Trident/") > -1;



  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of the calendar control. */

    var init = function(){

      //Call super
        new javaxt.dhtml.calendar.View(me, config);

      //Set store
        store = config.eventStore==null ? new javaxt.dhtml.calendar.EventStore() : config.eventStore;

      //Set number of days to render
        if (config.days!=null) days = config.days;

      //Set event size, padding, and spacing
        function isNumeric(n){ return !isNaN(parseFloat(n)) && isFinite(n); }
        if (isNumeric(config.eventHeight)) eventHeight = parseInt(config.eventHeight);
        if (isNumeric(config.eventPadding)) eventPadding = parseInt(config.eventPadding);
        
        
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

      //Call the afterrender callback
        listener = me.getListener('afterrender');
        if (listener!=null) listener.callback.apply(listener.scope, [me]);
        rendered = true;
        
      //Call the update callback
        listener = me.getListener('update');
        if (listener!=null) listener.callback.apply(listener.scope, [me]);        
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
        footerRow.style.display = null;
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
  //** renderTable
  //**************************************************************************
  /** Used to render a new table for the current date. */

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
        rowHeights = [];
        
        

      //Create main table
        var div, tbody, tr, td;
        tbody = createTable();
        var table = el = tbody.parentNode;
        table.className = "javaxt-noselect";
        table.style.cursor = "default";
        parent.appendChild(table);
        

      //Create header row
        tr = document.createElement("tr");
        tr.setAttribute("desc", "header");
        tr.className = "javaxt-cal-header";
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "inherit";
        tr.appendChild(td);
        var header = td;



      //Create row for multiday events
        tr = document.createElement("tr");
        tr.setAttribute("desc", "multiday events");
        tr.className = "javaxt-cal-multiday-header";
        tr.style.display = "none"; 
        tr.style.visibility = "hidden"; //visible
        multidayRow = tr;
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "inherit";
        tr.appendChild(td);            
        var multidayDiv = document.createElement('div');
        multidayDiv.setAttribute("desc", "multiday-div"); 
        multidayDiv.style.width = "100%";
        multidayDiv.style.height = "inherit";
        multidayDiv.style.position = "relative";
        td.appendChild(multidayDiv);
      


      //Create body row
        tr = document.createElement("tr");
        tr.setAttribute("desc", "body");
        tr.className = "javaxt-cal-body";
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);  
        
        bodyDiv = document.createElement('div');
        bodyDiv.setAttribute("desc", "body-div"); 
        bodyDiv.style.width = "100%";
        bodyDiv.style.height = "100%";
        bodyDiv.style.position = "relative";
        td.appendChild(bodyDiv);
        div = document.createElement('div');
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.position = "absolute";
        div.style.overflow = 'scroll';
        div.style.overflowX = 'hidden';
        bodyDiv.appendChild(div);
        bodyDiv = div;
        
      //Add logic to enable/disable scroll. This is important for touch devices.
        bodyDiv.addEventListener('touchstart', function(e) {
            if (!scrollable) e.preventDefault();
        }, false);
        bodyDiv.addEventListener('touchmove', function(e) {
            if (!scrollable)e.preventDefault();
        }, false);
        
        
      //Create footer row
        tr = document.createElement("tr");
        tr.setAttribute("desc", "footer");
        tr.className = "javaxt-cal-footer";
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "inherit";
        tr.appendChild(td);
        footerRow = tr;
        var footer = td;
        

      //Create current time indicator
        currTimeDiv = document.createElement("div");
        currTimeDiv.className = "javaxt-cal-current-time-indicator";
        currTimeDiv.style.position = "absolute";
        currTimeDiv.style.width = "100%";
        currTimeDiv.style.display = "none";
        bodyDiv.appendChild(currTimeDiv);


      //Populate header
        tbody = createTable();
        header.appendChild(tbody.parentNode);
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerUL = document.createElement('div');
        td.appendChild(spacerUL);
        
        var d = new Date(startDate);
        for (var i=0; i<days; i++){
            td = document.createElement('td');
            td.className = "javaxt-cal-header-col";
            td.style.width = (100/days) + '%';
            td.style.height = "100%";
            td.appendChild(me.createColumnHeader(d.getDay()));
            tr.appendChild(td);
            d.setDate(d.getDate()+1);
        }
        
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerUR = document.createElement('div');
        td.appendChild(spacerUR);


      //Populate footer
        tbody = createTable();
        footer.appendChild(tbody.parentNode);
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerLL = document.createElement('div');
        td.appendChild(spacerLL);
        
        var d = new Date(startDate);
        for (var i=0; i<days; i++){
            td = document.createElement('td');
            td.className = "javaxt-cal-footer-col";
            td.style.width = (100/days) + '%';
            td.style.height = "100%";
            td.appendChild(me.createColumnFooter(d.getDay()));
            tr.appendChild(td);
            d.setDate(d.getDate()+1);
        }
        
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerLR = document.createElement('div');
        td.appendChild(spacerLR);
        

        
      //Populate multiday div
        var multidayContent = document.createElement('div');
        multidayContent.setAttribute("desc", "multiday-content"); 
        multidayContent.style.width = "100%";
        multidayContent.style.height = "100%";
        multidayContent.style.position = "relative";
        multidayDiv.appendChild(multidayContent);
        div = document.createElement('div');
        multidayContent.appendChild(div);
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.position = "absolute";
        div.style.overflow = 'scroll';
        div.style.overflowX = 'hidden';
        tbody = createTable();
        div.appendChild(tbody.parentNode);
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        var spacerML = document.createElement('div');
        td.appendChild(spacerML);
        for (var i=0; i<days; i++){
            td = document.createElement('td');
            td.className = "javaxt-cal-multiday-col";
            td.style.width = (100/days) + '%';
            td.style.height = "1px";
            tr.appendChild(td);
        }
        multidayEventsTable = tbody;
        




      //Populate body
        tbody = createTable();
        bodyDiv.appendChild(tbody.parentNode);
        var row = document.createElement('tr');
        tbody.appendChild(row);



      //Create left column to render hours
        var leftCol = document.createElement('td');
        leftCol.style.verticalAlign = "top";
        row.appendChild(leftCol);
        var hours = document.createElement('table');
        hours.style.borderCollapse = "collapse";
        hours.cellSpacing = 0;
        hours.cellPadding = 0;
        leftCol.appendChild(hours);
        tbody = document.createElement('tbody');
        hours.appendChild(tbody);
        for (var i=0; i<24; i++){
            var tr = document.createElement('tr');
            tbody.appendChild(tr);
            var td = document.createElement('td');
            td.className = "javaxt-cal-hour" + (i==23 ? " javaxt-cal-hour-last" : "");
            if (i==0) td.style.borderTop = "0px";
            td.appendChild(me.createHourLabel(i));
            tr.appendChild(td);
        }



      //Create main table used to render days
        var d = new Date(startDate);
        for (var i=0; i<days; i++){

            td = document.createElement('td');
            td.className = 'javaxt-cal-cell';
            td.style.width = (100/days) + '%';
            td.style.height = "100%";
            td.style.verticalAlign = "top";
            td.valign="top";
            row.appendChild(td);
            

          //Create div used to store events and the table grid
            var outerDiv = document.createElement('div');
            outerDiv.style.width = "100%";
            outerDiv.style.height = "100%";
            outerDiv.style.position = "relative";
            outerDiv.style.cursor = "inherit";
            var innerDiv = document.createElement('div');
            innerDiv.style.width = "100%";
            innerDiv.style.height = "100%";
            innerDiv.style.position = "absolute";
            innerDiv.style.whiteSpace = 'nowrap';
            innerDiv.style.overflow = 'hidden';
            innerDiv.style.cursor = "inherit";
            outerDiv.appendChild(innerDiv);
            
            
            var cell = innerDiv;
            var cellID = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
            cell.date = new Date(d);
            cells[cellID] = cell;
            td.appendChild(outerDiv);            
            

          //Create table
            var innerTable = document.createElement('table');
            innerTable.cellSpacing = 0;
            innerTable.cellPadding = 0;
            innerTable.style.width = "100%";
            innerTable.style.borderCollapse = "collapse";
            tbody = document.createElement('tbody');
            innerTable.appendChild(tbody);
            cell.appendChild(innerTable);
            


          //Add 1 row for every 30 minutes
            for (var j=0; j<24*2; j++){
                var tr = document.createElement('tr');
                tbody.appendChild(tr);
                

                var col = document.createElement('td');
                col.className = "javaxt-cal-half-hour" + (j % 2 == 0 ? "" : " javaxt-cal-half-hour-sep") + (j==47 ? " javaxt-cal-hour-last" : "");
                if (j==0) col.style.borderTop = "0px";
                tr.appendChild(col);
                
                
                
                tr.onclick = function(e){
                    var listener = me.getListener('cellclick');
                    if (listener!=null){
                        var callback = listener.callback;
                        var scope = listener.scope;

                        var _tbody = this.parentNode;
                        var _cell = _tbody.parentNode.parentNode;
                        var _date = new Date(_cell.date);
                        

                        var hour = 0;
                        for (var i=0; i<_tbody.childNodes.length; i++){            
                            var tr = _tbody.childNodes[i];
                            if (tr==this){
                                hour = (i/2);
                                break;
                            }
                        }
                        _date.setTime(_date.getTime() + ((hour*60) * 60 * 1000));


                        callback.apply(scope, [_date, me, e]);
                    }
                };
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


      //Update position of the current time indicator
        currTimeDiv.style.left = lt + 'px';
        updateCurrTime();
        
        
      //Kick off scheduled task to periodically update the current time indicator
        var epoch = getCurrentDate().getTime() / 1000;
        var secondsSinceLastTimerTrigger = epoch % 60;
        var secondsUntilNextTimerTrigger = 60 - secondsSinceLastTimerTrigger;
        setTimeout(function() {
            setInterval(updateCurrTime, 60*1000);
            updateCurrTime();
        }, secondsUntilNextTimerTrigger*1000);
        
        

      //Scroll to start of workday
        me.scrollTo(6.5);


      //Call the "update" listener
        if (rendered){
            var listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        }
    };
    
      
  //**************************************************************************
  //** createColumnHeader
  //**************************************************************************
  /** Returns a div used to indicate the day of the week. The div is inserted 
   *  into a column header that corresponds to a given date. This method can 
   *  be safely overridden to generate custom headers.
   */
    this.createColumnHeader = function(i){
        var outerDiv = document.createElement('div');
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.position = "relative";
        outerDiv.style.cursor = "inherit";
        var innerDiv = document.createElement('div');
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.whiteSpace = 'nowrap';
        innerDiv.style.overflow = 'hidden';
        innerDiv.style.cursor = "inherit";


        var text = javaxt.dhtml.calendar.Utils.dayNames[i];
        if (days>1) text = text.substring(0,3);
        //else text+= ", " + javaxt.dhtml.calendar.Utils.monthNames[d.getMonth()] + " " + d.getDate();
        innerDiv.innerHTML = text;


        outerDiv.appendChild(innerDiv);
        return outerDiv;
    };
    
    
    
    this.createColumnFooter = function(i){
        return document.createElement('div');
    };
    
    
    
  //**************************************************************************
  //** createHourLabel
  //**************************************************************************
  /** Returns a div used to indicate the hour of day (e.g. 12pm). This method
   *  can be safely overridden to generate custom labels for hours.
   */
    this.createHourLabel = function(hour){
        var div = document.createElement('div');
        div.style.float = "right";
        div.style.padding = "0px 7px 0px 7px";


      //Update hour and set meridian
        var meridian = 'AM';
        if (hour==0) hour = 12;
        else if (hour==12) meridian = 'PM';
        else if (hour>12){
            hour = (hour-12);
            meridian = 'PM';
        }

      //Create table to render the hour and meridian
        var hdr = document.createElement('table');
        hdr.cellSpacing = 0;
        hdr.cellPadding = 0;
        div.appendChild(hdr);
        var t = document.createElement('tbody');
        hdr.appendChild(t);
        var tr = document.createElement('tr');
        t.appendChild(tr);
        var td = document.createElement('td');
        td.className = "javaxt-cal-label-hour";
        td.innerHTML = hour;
        tr.appendChild(td);
        td = document.createElement('td');
        td.className = "javaxt-cal-label-meridian";
        td.innerHTML = meridian;
        tr.appendChild(td); 
        
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
            
            currTimeDiv.style.display = null;
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
  //** getVerticalOffset
  //**************************************************************************
  /** Returns the relative, vertical offset of a row in a cell. 
   */
    var getVerticalOffset = function(hour, cell){

      //Compute row heights and cache the values for subsequent use. Caching 
      //the row heights improves load times by approx 500ms in IE and 1000ms 
      //in FF. Caching assumes that row heights are the same accross all cells 
      //and that the row  heights do not change.
        if (rowHeights.length==0){
            var tbody = cell.childNodes[0].childNodes[0];
            var rows = tbody.childNodes;
            for (var i=0; i<rows.length; i++){
                var tr = rows[i];
                var rect = _getRect(tr);
                rowHeights.push(rect.height);
            }
        }

      //Compute vertical offset
        var offset = 0;
        for (var i=0; i<rowHeights.length; i++){
            var rowHeight = rowHeights[i];
            offset += rowHeight;
            var h = i*0.5;
            if (h>=hour){
                return (offset-rowHeight);
            }
        }
        return 0;
    };
    
    
  //**************************************************************************
  //** getEventStore
  //**************************************************************************
    this.getEventStore = function(){
        return store;
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
        if (numDays>=1){
            addMultiDayEvent(event);
        }
        else{
            addSingleDayEvent(event, deferUpdates);
        }

        
      //Update the event store
        store.add(event);
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
        store.remove(event);
        
        
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
        if (days>1 && d.getDay()>0) d.setDate(d.getDate()-d.getDay());
        for (var i=0; i<days; i++){
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
        if (days>1 && d.getDay()>0) d.setDate(d.getDate()-d.getDay());
        for (var i=0; i<days; i++){
            var divs = getDivs(d);

            for (var j=0; j<divs.length; j++){
                var div = divs[j];
                var event = div.event;
                store.remove(event);
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
                    store.remove(event);
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
        var outerDiv = document.createElement('div');
        outerDiv.style.width = width + "%";
        outerDiv.style.left = "0px";
        updatePadding(outerDiv);
        outerDiv.style.position = "absolute";
        var startTime = event.getStartDate().getHours() + (event.getStartDate().getMinutes()/60);
        var endTime = event.getEndDate().getHours() + (event.getEndDate().getMinutes()/60);
        var y = getVerticalOffset(startTime, cell);
        var h = getVerticalOffset(endTime, cell)-y;
        outerDiv.style.top = y + "px";
        outerDiv.style.height = h + 'px';
        outerDiv.event = event;
        cell.appendChild(outerDiv);
        

      //Create div used to render the event
        var div = event.createDiv();


      //Wrap event in a table to ensure proper padding (I couldn't figure out how to do it with divs)
        var tbody = createTable();
        outerDiv.appendChild(tbody.parentNode);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        tr.appendChild(td);
        td.style.verticalAlign = "top";
        td.style.width = "100%";
        td.style.height = "100%";
        td.style.padding = ((eventPadding/2)+1) + "px " + eventPadding + "px " + (eventPadding/2) + "px"; //+1 for half-hour border
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
        if (event.isEditable()) initDrag(outerDiv, me, holdDelay);
        else{
            outerDiv.onclick = function(e){
                var listener = me.getListener('eventclick');
                if (listener!=null){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [this.event, e]);
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
        var a = javaxt.dhtml.calendar.Utils.getDaysBetween(startDate, event.getStartDate());
        var b = javaxt.dhtml.calendar.Utils.getDaysBetween(startDate, event.getEndDate());
        //console.log(event.getSubject() + " " + a + " --> " + b);
        
        startColID = a;
        if (a<0){ 
            startColID = 0;
            continueLeft = true;
        }
        startColID = Math.floor(startColID);
        
        
        
        endColID = startColID+b;
        if (endColID>days-1){ 
            endColID = days-1;
            continueRight = true;
        }
        endColID = Math.floor(endColID);
        
        
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
            var tr = document.createElement("tr");
            multidayEventsTable.appendChild(tr);
            var td = document.createElement("td");
            td.className = "javaxt-cal-multiday-col-spacer";
            tr.appendChild(td);


          //Remove height from spacer col of previous row and set current col height
            if (multidayEventsTable.childNodes.length>1){ 
                tr.previousSibling.childNodes[0].style.height = null;
            }
            td.style.height = "100%";
            
            
            
          //Add days
            for (var i=0; i<days; i++){
                td = document.createElement('td');
                td.className = "javaxt-cal-multiday-col";
                tr.appendChild(td);
                
                if (i==startColID) startCol = td;
                if (i==endColID) endCol = td;
            }
        }
        

      //Add colspan as needed
        var colSpan = (endColID-startColID)+1;
        if (colSpan>=2){
            javaxt.dhtml.calendar.Utils.addColSpan(startCol, colSpan);
        }
        
        
      //Add event to the startCol
        var outerDiv = document.createElement('div');
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.position = "absolute";

        var innerDiv = document.createElement('div');
        innerDiv.style.height = "100%";
        var paddingLeft = continueLeft ? "0px" : eventPadding + "px";
        var paddingRight = continueRight ? "0px" : eventPadding + "px";
        innerDiv.style.padding = "0px " + paddingRight + " 0px " + paddingLeft; //Horizontal padding
        innerDiv.style.position = "relative";
        outerDiv.appendChild(innerDiv);

        var div = event.createDiv(continueLeft, continueRight);
        div.style.height = "100%";
        innerDiv.appendChild(div);
        
        
      //Wrap the outerdiv to ensure proper overflow
        var wrapper = document.createElement('div');
        wrapper.style.width = "100%";
        wrapper.style.height = eventHeight + "px";
        wrapper.style.position = "relative";
        wrapper.style.marginTop = (multidayEventsTable.childNodes.length>2 ? (eventPadding*2) : 0) + "px";
        wrapper.appendChild(outerDiv);
        wrapper.event = event;
        wrapper.onclick = function(e){
            var listener = me.getListener('eventclick');
            if (listener!=null){
                var callback = listener.callback;
                var scope = listener.scope;
                callback.apply(scope, [this.event, e]);
            }  
        };
        
        startCol.appendChild(wrapper);
        
        
      //Update the visibility of the multiday row
        multidayRow.style.removeProperty("display");
        multidayRow.style.display = null;
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
        d.setDate(d.getDate()+days);
        me.setDate(d);
    };


  //**************************************************************************
  //** back
  //**************************************************************************
    this.back = function(){
        var d = new Date(startDate);
        d.setDate(d.getDate()-days);
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
        if (days>1 && startDate.getDay()>0) startDate.setDate(startDate.getDate()-startDate.getDay());
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate()+days);

        
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
        if (days==1){
            var month = javaxt.dhtml.calendar.Utils.monthNames[date.getMonth()];
            return (month + " " + date.getDate() + ", " + date.getFullYear());
        }
        else{
            var range = me.getDateRange();
            var startDate = range.startDate;
            var endDate = range.endDate;
            endDate.setDate(endDate.getDate()-1);
            
            var startMonth = javaxt.dhtml.calendar.Utils.monthNames[startDate.getMonth()];
            var endMonth = javaxt.dhtml.calendar.Utils.monthNames[endDate.getMonth()];
            
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
        
        var events = store.getEvents();
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
        var overlappingEvents = store.getOverlappingEvents(event);
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
  //** intersects
  //**************************************************************************
  /** Used to test whether two rectangles intersect.
   */
    var intersects = function(r1, r2) {
      return !(r2.left > r1.right || 
               r2.right < r1.left || 
               r2.top > r1.bottom ||
               r2.bottom < r1.top);
    };


  //**************************************************************************
  //** createTable
  //**************************************************************************
    var createTable = function(){
        var table = document.createElement('table');        
        table.style.width = "100%";
        table.style.height = "100%";
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return tbody;
    };
    

    var _getRect = javaxt.dhtml.calendar.Utils.getRect;
    var initDrag = javaxt.dhtml.calendar.Utils.initDrag;
    var log = function(str){if(debug)console.log(str);};
    
    
    init();
};