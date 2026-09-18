if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.calendar) javaxt.dhtml.calendar={};

//******************************************************************************
//**  Month View
//*****************************************************************************/
/**
 *   Used to render a month
 *
 ******************************************************************************/

javaxt.dhtml.calendar.Month = function(parent, config) {
    this.className = "javaxt.dhtml.calendar.Month";

    var me = this;
    var defaultConfig = {


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {

        },


      /** Vertical spacing between events, in pixels */
        eventSpacing: 2,

      /** Amount of time, in milliseconds, to wait before a mousedown is
       *  treated as a "hold" instead of a "click"
       */
        holdDelay: 500,

      /** If true, enables debug logging to the console */
        debug: false
    };



  //DOM elements
    var table;


  //Class variables
    var startDate, endDate;
    var numWeeks;
    var cells = {};
    var multiDayCols = {};
    var singleDayCols = {};
    var mutiDayEventDivs = [];
    var touchEnabled = true;
    var rendered;


  //Config options (defaults are defined in defaultConfig)
    var date;
    var days;
    var store;


  //Event geometry derived from the DOM (see updateEventMetrics). These are
  //not config options - they are measured from an actual event rendered with
  //the configured event style so the layout adapts to the current theme
  //(font size, borders, padding) instead of assuming fixed pixel values.
    var eventHeight;   //event wrapper height (natural content height), in pixels
    var eventPadding;  //padding within a cell, in pixels



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


      //Get days config
        days = config.dayNames;


      //Call super
        new javaxt.dhtml.calendar.View(me, config);

      //Set store
        store = config.eventStore==null ? new javaxt.dhtml.calendar.EventStore() : config.eventStore;


      //Set config options. Normalize/validate the numeric values back into
      //the config object so they can be referenced directly (e.g. config.eventSpacing).
      //Note: eventHeight and eventPadding are NOT config options - they are
      //measured from the DOM (see updateEventMetrics).
        var isNumber = javaxt.dhtml.utils.isNumber;
        config.holdDelay = isNumber(config.holdDelay) ? parseInt(config.holdDelay) : defaultConfig.holdDelay;
        config.debug = config.debug===true;
        config.eventSpacing = isNumber(config.eventSpacing) ? parseInt(config.eventSpacing) : defaultConfig.eventSpacing;
        eventSpacer = config.eventSpacing + 1; //desired gap between events (px)


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


      //Defer the afterrender/update callbacks until the grid has actually
      //rendered. When the view is already visible this fires synchronously.
        onRender(table, function(){

          //Call the afterrender callback
            listener = me.getListener('afterrender');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
            rendered = true;

          //Call the update callback
            listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        });
    };


  //**************************************************************************
  //** hasHours
  //**************************************************************************
    this.hasHours = function(){
        return false;
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
        var el = me.getDOM();
        parent.appendChild(el);
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
        var el = me.getDOM();
        parent.removeChild(el);
    };


  //**************************************************************************
  //** enableTouch
  //**************************************************************************
    this.enableTouch = function(){
        touchEnabled = true;
    };


  //**************************************************************************
  //** disableTouch
  //**************************************************************************
    this.disableTouch = function(){
        touchEnabled = false;
    };



  //**************************************************************************
  //** renderTable
  //**************************************************************************
  /** Used to render a new table for the current date.
   */
    var renderTable = function(){


      //Remove any previously rendered table
        if (table!=null){
            for (var i=0; i<parent.childNodes.length; i++){
                if (parent.childNodes[i]==table){
                    parent.removeChild(table);
                    break;
                }
            }
        }


      //Create table with 2 rows - one for the header and one for the grid
        table = createTable(parent);
        table.className = "javaxt-cal-month javaxt-noselect";
        var tr = table.addRow();
        addStyle(tr, config.style.header);
        tr.setAttribute("desc", "header-row");
        var header = tr.addColumn({width: "100%"});
        tr = table.addRow();
        addStyle(tr, config.style.body);
        tr.setAttribute("desc", "body-row");
        var body = tr.addColumn({width: "100%", height: "100%"});


      //Create header table
        var headerTable = createTable(header);
        var th = headerTable.addRow();
        for (var i=0; i<days.length; i++){
            var td = th.addColumn({width: (100/days.length) + '%'});
            addStyle(td, config.style.headerCol);


            //Update left and right border of the first and last days. The
            //border should be set via the javaxt-cal-header style.
            if (i==0) td.style.borderLeft = "0px";
            if (i==days.length-1) td.style.borderRight = "0px";


            td.appendChild(me.createColumnHeader(i));
        }



      //Create the grid. The grid consists of a number of nested tables. The
      //outer table has 1 column and a row for each week
        var gridTable = createTable(body);
        for (var i=0; i<numWeeks; i++){
            tr = gridTable.addRow();
            td = tr.addColumn({width: "100%"});


          //Create table for the week. The table has 3 rows. The first row is
          //for the cell headers, the middle for is for the cell content, and
          //last row is for the cell footers
            var week = createTable(td);
            for (var x=0; x<3; x++){
                tr = week.addRow();
                td = tr.addColumn({width: "100%"});


              //Create innerTable used to render days in the week
                var innerTable;
                if (x==1){
                    innerTable = createTable();

                    //Wrap the week table in a div for overflow purposes
                    var div = createElement("div", {
                        width: "100%",
                        height: "100%",
                        position: 'absolute',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                    });
                    div.appendChild(innerTable);

                    var wrapper = createElement('div', {
                        width: "100%",
                        height: "100%",
                        position: "relative"
                    });
                    wrapper.appendChild(div);

                    td.style.height = "100%";
                    td.appendChild(wrapper);
                }
                else{
                    innerTable = createTable(td);
                }


                var numInnerRows = 1;
                if (x==1) numInnerRows = 2;
                for (var k=0; k<numInnerRows; k++){

                  //Set date
                    var d = new Date(startDate);
                    d.setDate(d.getDate()+(i*days.length));


                    tr = innerTable.addRow();


                  //Add columns - one for each day
                    for (var j=0; j<days.length; j++){
                        td = tr.addColumn({width: (100/days.length) + '%'});
                        if (d.getMonth()<date.getMonth()) addStyle(td, config.style.cellPrevMonth);
                        else if (d.getMonth()>date.getMonth()) addStyle(td, config.style.cellNextMonth);
                        else addStyle(td, config.style.cell);




                      //Update list of cells
                        var id = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
                        var cell = cells[id];
                        if (cell==null){
                            cells[id] = [td];
                        }
                        else{
                            cells[id].push(td);
                        }



                      //Add event listener
                        td.date = new Date(d);
                        if (x==1){
                            td.onclick = function(e){
                                var el = this;
                                var clickedEvent = false;
                                var div = el.childNodes[0];
                                if (div.childNodes.length>0){
                                    var firstEvent = _getRect(div.childNodes[0]);
                                    var lastEvent = div.childNodes.length==1 ?
                                    firstEvent : _getRect(div.childNodes[div.childNodes.length-1]);
                                    var y = e.clientY;
                                    if (y<firstEvent.top || y>lastEvent.bottom){}
                                    else clickedEvent = true;
                                }


                                if (!clickedEvent){
                                    var _date = new Date(el.date);
                                    var listener = me.getListener('cellclick');
                                    if (listener!=null){
                                        var callback = listener.callback;
                                        var scope = listener.scope;
                                        callback.apply(scope, [_date, el, me, e]);
                                    }
                                }
                            };
                        }
                        else{
                            td.onclick = function(e){
                                var el = this;
                                var _date = new Date(el.date);
                                var listener = me.getListener('cellclick');
                                if (listener!=null){
                                    var callback = listener.callback;
                                    var scope = listener.scope;
                                    callback.apply(scope, [_date, el, me, e]);
                                }
                            };
                        }


                        td.ontouchstart = function(e) {

                          //Disable select/highlight behaviour
                            e.preventDefault();


                          //Call onclick function
                            if (touchEnabled){
                                var touch = e.touches[0];
                                var x = touch.pageX;
                                var y = touch.pageY;
                                this.onclick.apply(this, [{
                                    clientX: x,
                                    clientY: y
                                }]);
                            }
                        };



                        if (x==0){
                            addStyle(td, config.style.cellHeader);
                            td.appendChild(me.createCellHeader(new Date(d), i, j));
                        }
                        else if (x==1){

                            if (k==0){
                                multiDayCols[id] = [td];
                                td.style.height = "1px";
                            }
                            else{
                                div = createElement("div", td, {
                                    width: "100%",
                                    height: "100%",
                                    position: "relative"
                                });
                                singleDayCols[id] = td;
                            }
                        }
                        else if (x==2){
                            addStyle(td, config.style.cellFooter);
                            td.style.height = "1px";
                            td.appendChild(me.createCellFooter(new Date(d), i, j));
                        }

                        d.setDate(d.getDate()+1);




                      //Remove borders as needed. The borders for these
                      //specific cells should be set by javaxt-cal-body
                        if (j==0){
                            td.style.borderLeft = "0px";
                        }
                        if (j==days.length-1){
                            td.style.borderRight = "0px";
                        }
                        if (i==0){
                            td.style.borderTop = "0px";
                        }
                        if (i==numWeeks-1){
                            td.style.borderBottom = "0px";
                        }



                        tr.appendChild(td);
                    }
                }
            }
        }



      //Measure the event geometry now that the grid is in the DOM. This must
      //happen before events are loaded so the wrappers are sized correctly.
        updateEventMetrics();



      //Call the update callback
        if (rendered){
            var listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        }
    };


  //**************************************************************************
  //** createColumnHeader
  //**************************************************************************
  /** Returns a div used to indicate the day of the week. The div is inserted
   *  into a given column header. This method can be safely overridden to
   *  generate custom headers.
   */
    this.createColumnHeader = function(i){
        var outerDiv = createElement('div', {
            width: "100%",
            height: "100%",
            position: "relative"
        });
        var innerDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        });
        innerDiv.innerHTML = days[i];
        return outerDiv;
    };


  //**************************************************************************
  //** createCellHeader
  //**************************************************************************
  /** Returns a div used to indicate the date within an individual cell. This
   *  method can be safely overridden to generate custom cell headers.
   */
    this.createCellHeader = function(date, i, j){
        var text = date.getDate();
        var monthName = config.monthNames[date.getMonth()].substring(0,3) + " ";
        if (i==0 && j==0) text = monthName + text;
        else if (text==1) text = monthName + text;
        var div = createElement("div");
        div.innerHTML = text;
        return div;
    };


  //**************************************************************************
  //** createCellFooter
  //**************************************************************************
  /** Returns an div empty which is enserted into the cell footer. This method
   *  can be safely overridden to generate custom cell footers.
   */
    this.createCellFooter = function(date, i, j){
        var div = createElement("div");
        return div;
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
                var cols = cells[id];

                var r1 = _getRect(cols[0]);
                var r2 = _getRect(cols[cols.length-1]);
                var x1 = r1.left;
                var x2 = r1.right;
                var y1 = r1.top;
                var y2 = r2.bottom;


                var rect = {
                    left: x1,
                    right: x2,
                    top: y1,
                    bottom: y2,
                    width: x2-x1,
                    height: y2-y1
                };

                arr.push({
                    id: id,
                    rect: rect
                });
            }
        }
        return arr;
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

        log("Adding " + event.getSubject() + "...");


      //Check if we've already rendered the given event
        var numDays = event.numDays();
        if (numDays>=1){
            for (var id in multiDayCols) {
                if (multiDayCols.hasOwnProperty(id)) {
                    var arr = multiDayCols[id];
                    if (arr!=null){
                        for (var i=1; i<arr.length; i++){
                            var td = arr[i];
                            var eventDiv = td.firstChild;
                            if (eventDiv!=null){
                                var _event = eventDiv.event;
                                if (_event.equals(event)){
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
        else{
            var d = event.getStartDate();
            var id = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
            var td = singleDayCols[id];
            if (td!=null){
                var div = td.childNodes[0];
                for (var i=0; i<div.childNodes.length; i++){
                    if (div.childNodes[i].event.equals(event)){
                        return;
                    }
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
            addSingleDayEvent(event);
        }


      //Update the event store
        store.add(event);
    };



  //**************************************************************************
  //** removeEvent
  //**************************************************************************

    this.removeEvent = function(event){


      //Remove the event from the store
        store.remove(event);


      //Update view
        if (event.numDays()>=1){ //Multiday Event


          //Remove div
            var rows = [];
            for (var id in multiDayCols) {
                if (multiDayCols.hasOwnProperty(id)) {
                    var arr = multiDayCols[id];
                    for (var i=1; i<arr.length; i++){
                        var td = arr[i];


                        var eventDiv = td.firstChild;
                        if (eventDiv!=null){
                            var _event = eventDiv.event;
                            if (_event.equals(event)){
                                td.removeChild(eventDiv);

                                var tr = td.parentNode;
                                if (tr!=null){
                                    var addRow = true;
                                    for (var j=0; j<rows.length; j++){
                                        if (rows[j]==tr){
                                            addRow = false;
                                            break;
                                        }
                                    }
                                    if (addRow) rows.push(tr);
                                }

                            }

                        }
                    }
                }
            }



          //Remove empty rows
            for (var i=0; i<rows.length; i++){
                var tr = rows[i];

              //Count number of events are in the row
                var numEvents = 0;
                var cols = [];
                for (j=0; j<tr.childNodes.length; j++){
                    var td = tr.childNodes[j];
                    cols.push(td);
                    var eventDiv = td.firstChild;
                    if (eventDiv!=null){
                        numEvents++;
                    }
                }

              //If there are no other events, delete the row
                if (numEvents==0){

                  //Remove the row
                    var tbody = tr.parentNode;
                    tbody.removeChild(tr);


                  //Update the multiDayCols array
                    for (j=0; j<cols.length; j++){
                        var td = cols[j];



                        for (var id in multiDayCols) {
                            if (multiDayCols.hasOwnProperty(id)) {
                                var arr = multiDayCols[id];


                                for (var k=1; k<arr.length; k++){
                                    var _td = arr[k];
                                    if (td==_td){
                                        arr.splice(k, 1);



                                        if (td.colSpan>=2){
                                            var str = id.split("-");
                                            var month = parseInt(str[0]);
                                            var day = parseInt(str[1]);
                                            var year = parseInt(str[2]);
                                            var date = new Date(year, month-1, day);
                                            for (var x=1; x<td.colSpan; x++){
                                                date.setDate(date.getDate()+1);
                                                var _id = (date.getMonth()+1) + "-" + date.getDate() + "-" + date.getFullYear();
                                                var _arr = multiDayCols[_id];
                                                _arr.splice(k, 1);
                                            }
                                        }


                                        break;
                                    }
                                }


                            }
                        }

                    }



                  //Update margins for the first multiday event in the table
                    var firstRow = tbody.childNodes[0];
                    for (var id in multiDayCols) {
                        if (multiDayCols.hasOwnProperty(id)) {
                            var arr = multiDayCols[id];
                            if (arr.length>1){
                                var td = arr[1];
                                if (td.parentNode!=null){
                                    if (td.parentNode.previousSibling==firstRow){
                                        var eventDiv = td.firstChild;
                                        if (eventDiv!=null){
                                            eventDiv.style.marginTop = "0px";
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            }



            alignEvents();

        }
        else{ //Single day event

            var d = event.getStartDate();
            var id = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
            var td = singleDayCols[id];
            var div = td.childNodes[0];
            for (var i=0; i<div.childNodes.length; i++){
                if (div.childNodes[i].event.equals(event)){
                    div.removeChild(div.childNodes[i]);
                    break;
                }
            }

          //Re-space the remaining events in the cell
            spaceEvents(div);
        }
    };


  //**************************************************************************
  //** getEvents
  //**************************************************************************
  /** Returns an array of all the events rendered in the view.
   */
    this.getEvents = function(){

        var events = [];

      //Find all single-day events
        for (var id in singleDayCols) {
            if (singleDayCols.hasOwnProperty(id)) {
                var td = singleDayCols[id];
                var div = td.childNodes[0];
                for (var i=0; i<div.childNodes.length; i++){
                    var eventDiv = div.childNodes[i];
                    var event = eventDiv.event;
                    events.push(event);
                }
            }
        }


      //Find multi-day events
        for (var id in multiDayCols) {
            if (multiDayCols.hasOwnProperty(id)) {
                var arr = multiDayCols[id];
                for (var i=1; i<arr.length; i++){
                    var td = arr[i];
                    var eventDiv = td.firstChild;
                    if (eventDiv!=null){
                        var event = eventDiv.event;

                        var addEvent = true;
                        for (var j=0; j<events.length; j++){
                            if (events[j].equals(event)){
                                addEvent = false;
                                break;
                            }
                        }

                        if (addEvent) events.push(event);
                    }
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


      //Remove single-day events
        for (var id in singleDayCols) {
            if (singleDayCols.hasOwnProperty(id)) {
                var td = singleDayCols[id];
                var div = td.childNodes[0];
                div.style.marginTop = "0px"; //See alignEvents
                while (div.firstChild) {
                    var eventDiv = div.firstChild;
                    var event = eventDiv.event;
                    store.remove(event);
                    div.removeChild(eventDiv);
                }
            }
        }



      //Remove multi-day events
        var rows = [];
        for (var id in multiDayCols) {
            if (multiDayCols.hasOwnProperty(id)) {
                var arr = multiDayCols[id];
                for (var i=1; i<arr.length; i++){
                    var td = arr[i];


                    var eventDiv = td.firstChild;
                    if (eventDiv!=null){
                        var event = eventDiv.event;
                        store.remove(event);
                    }


                    var tr = td.parentNode;
                    if (tr!=null){
                        var addRow = true;
                        for (var j=0; j<rows.length; j++){
                            if (rows[j]==tr){
                                addRow = false;
                                break;
                            }
                        }
                        if (addRow) rows.push(tr);
                    }
                }
                multiDayCols[id] = [arr[0]];
            }
        }
        for (var i=0; i<rows.length; i++){
            var tr = rows[i];
            var tbody = tr.parentNode;
            tbody.removeChild(tr);
        }

    };


  //**************************************************************************
  //** refresh
  //**************************************************************************
  /** Used to re-render all the events in the cell.
   */
    this.refresh = function(){
        var events = me.getEvents();
        me.clear();
        for (var i=0; i<events.length; i++){
            me.addEvent(events[i]);
        }
    };


  //**************************************************************************
  //** addSingleDayEvent
  //**************************************************************************
  /** Used to render events that start and end on the same day.
   */
    var addSingleDayEvent = function(event){


        var d = event.getStartDate();
        var id = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();
        var td = singleDayCols[id];
        if (td==null) return;


      //Create div used to render the event
        var div = event.createDiv();


      //Wrap the div in a bunch of divs for overflow purposes
        var wrapper = createElement('div', {
            width: "100%",
            height: eventHeight + "px",
            marginTop: (config.eventSpacing*2) + "px",  //Vertical padding
            position: "relative",
            cursor: 'pointer'
        });
        wrapper.event = event;

        var outerDiv = createElement('div', wrapper, {
            width: "100%",
            height: "100%",
            position: "absolute"
        });

        var innerDiv = createElement('div', outerDiv, {
            height: "100%",
            padding: "0px " + eventPadding + "px", //Horizontal padding
            position: "relative"
        });
        innerDiv.appendChild(div);


      //Initialize mouse events
        if (event.isEditable()) initDrag(wrapper, me, config.holdDelay, config.style.eventDrag);
        else{
            wrapper.onclick = function(e){
                var listener = me.getListener('eventclick');
                if (listener!=null){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [this.event, this, me, e]);
                }
            };
        }


      //Append the div to the calendar grid
        var div = td.childNodes[0];
        var addedEvent = false;
        for (var i=0; i<div.childNodes.length; i++){
            var _event = div.childNodes[i].event;
            if (!event.equals(_event)){

                if (_event.getStartDate().getTime()>=event.getStartDate().getTime()){

                    div.insertBefore(wrapper, div.childNodes[i]);
                    addedEvent = true;
                    break;
                }
            }
        }
        if (!addedEvent){
            div.appendChild(wrapper);
        }


      //Ensure a consistent gap between stacked events
        spaceEvents(div);

    };


  //**************************************************************************
  //** addMultiDayEvent
  //**************************************************************************
  /** Used to render multi-day events
   */
    var addMultiDayEvent = function(event){


      //Find cells to span
        var cols = [];
        for (var x=0; x<event.numDays()+1; x++){
            var date = new Date(event.getStartDate());
            date.setDate(date.getDate()+x);
            var id = (date.getMonth()+1) + "-" + date.getDate() + "-" + date.getFullYear();
            if (multiDayCols[id]!=null) cols.push(multiDayCols[id]);
        }
        if (cols.length==0) return;


      //Group cells into logical spans
        var spans = [];
        var span = [];
        for (var i=0; i<cols.length; i++){
            var col = cols[i][0];
            span.push(cols[i]);
            if (col.nextSibling==null){
                spans.push(span);
                span = [];
            }
        }
        if (span.length>0) spans.push(span);


      //Iterate through the spans and render events
        for (var i=0; i<spans.length; i++){
            var cols = spans[i];
            var k; //cell number


          //Find first available column
            var col = null;
            if (cols[0].length>1){

                for (k=1; k<cols[0].length; k++){

                    var spanInUse = false;
                    for (var j=0; j<cols.length; j++){
                        var _col = cols[j][k];

                        if (_col.childNodes.length>0 || _col.parentNode==null){
                            spanInUse = true;
                            break;
                        }

                    }

                    if (!spanInUse){
                        col = cols[0][k];
                        break;
                    }
                }
            }


          //If a suitable column was not found, add a new row and select a
          //column from the new row
            if (col==null){

              //Insert row
                var currRow = cols[0][cols[0].length-1].parentNode;
                var nextRow = currRow.nextSibling;
                var newRow = cols[0][0].parentNode.cloneNode(true);
                currRow.parentNode.insertBefore(newRow, nextRow);

              //Update the multiDayCols array
                for (var j=0; j<cols[0][0].parentNode.childNodes.length; j++){
                    var td = cols[0][0].parentNode.childNodes[j];

                    for (var key in multiDayCols) {
                        if (multiDayCols.hasOwnProperty(key)) {
                            var entry = multiDayCols[key];
                            if (entry[0]==td){
                                entry.push(newRow.childNodes[j]);
                            }
                        }
                    }
                }


              //Select col from the multiDayCols array
                k = cols[0].length-1;
                col = cols[0][k];
            }



          //Add colspan and insert div to render the event
            javaxt.dhtml.calendar.utils.addColSpan(col, cols.length);

            var continueLeft = i>0 && col.previousSibling==null;
            var continueRight = col.nextSibling==null && (spans.length>1 && i<spans.length-1);
            var div = event.createDiv(continueLeft, continueRight);

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

            div.style.height = "100%";
            innerDiv.appendChild(div);


          //Wrap the outerdiv to ensure proper overflow
            var wrapper = createElement('div', {
                width: "100%",
                height: eventHeight + "px", //"100%"
                position: "relative"
            });
            if (k>1) wrapper.style.marginTop = (config.eventSpacing*2) + "px";  //Vertical padding
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


            col.appendChild(wrapper);
            col.style.height = eventHeight + "px";
            mutiDayEventDivs.push(wrapper);
        }



      //Move the event divs up to fill the gap created by multi-events
        alignEvents();
    };


  //**************************************************************************
  //** alignEvents
  //**************************************************************************
  /** Used to vertically align events to fill any gaps created by multi-events.
   *  If there are multiday events that span a cell, events are aligned with
   *  the last multiday event in the cell. Otherwise, events are aligned with
   *  the cell header
   */
    var alignEvents = function(){
        for (var id in singleDayCols) {
            if (singleDayCols.hasOwnProperty(id)) {
                var td = singleDayCols[id];
                var div = td.childNodes[0];
                var cols = multiDayCols[id];
                var offset = 0;



                var numUsedCols = 0;
                var lastUsedCol = null;
                for (var i=1; i<cols.length; i++){
                    if (cols[i].childNodes.length>0 || cols[i].parentNode==null){
                        numUsedCols++;
                        lastUsedCol = i;
                    }
                }


                //The following logic doesn't work for FireFox:
                //var offset = (((cols.length-1)-numUsedCols)*(eventHeight));
                //if (numUsedCols==0) offset+=eventSpacing;
                //As a workaround, we need to compute offset using the DOM
                var tr = td.parentNode;
                var y2 = _getRect(tr).top;
                var y1;
                if (lastUsedCol!=null){
                    var lastUsedRow = tr.parentNode.childNodes[lastUsedCol];
                    y1 = _getRect(lastUsedRow).bottom;
                    offset = y2-y1;
                }
                else{
                    y1 = _getRect(tr.parentNode.childNodes[0]).top;
                    offset = ((y2-y1)+((config.eventSpacing*2)-1)); //-1px for spacer row?
                }


                div.style.marginTop = -offset + "px";


              //Keep single-day events clear of the multiday bar and each other
                spaceEvents(div);
            }
        }
    };


  //**************************************************************************
  //** spaceEvents
  //**************************************************************************
  /** Ensures a small, consistent vertical gap between the events stacked in a
   *  cell. The event divs can render slightly taller than their wrapper (border
   *  + padding), so aligning to the table rows leaves overlaps. Instead we
   *  measure the actual geometry with getRect() and nudge each event's
   *  margin-top so it clears the event above it - including any multiday event
   *  spanning the cell (which the single-day events must sit below).
   */
    var eventSpacer; //desired gap between events (px); set in init() from eventSpacing

    var nudgeBelow = function(wrapper, aboveRect){
        var curr = getEventDiv(wrapper);
        if (curr==null || aboveRect==null) return;
        var gap = _getRect(curr).top - aboveRect.bottom;
        if (gap < eventSpacer){
            var margin = parseInt(wrapper.style.marginTop);
            if (isNaN(margin)) margin = 0;
            wrapper.style.marginTop = (margin + (eventSpacer - gap)) + "px";
        }
    };

    var spaceEvents = function(container){
        if (container==null) return;

      //Collect the single-day event wrappers in render order
        var wrappers = [];
        for (var i=0; i<container.childNodes.length; i++){
            if (container.childNodes[i].event) wrappers.push(container.childNodes[i]);
        }
        if (wrappers.length==0) return;

      //Reset to the default vertical padding so the pass is idempotent (also
      //tightens gaps left behind when an event is removed)
        for (var i=0; i<wrappers.length; i++){
            wrappers[i].style.marginTop = (config.eventSpacing*2) + "px";
        }

      //Ensure the first single-day event clears the lowest multiday event that
      //spans this cell. Multiday events use a colspan (rendered in the start
      //day's cell) so we can't look them up by day - instead we find, within
      //this week, any event that horizontally overlaps this column. The
      //multiday bar overflows its row, so measuring the actual event geometry
      //(getRect) is what avoids the overlap.
        var td = container.parentNode;              //the javaxt-cal-cell
        var weekBody = td.parentNode.parentNode;    //tbody holding this week's rows
        var tdRect = _getRect(td);
        var boundary = null;
        var divs = weekBody.getElementsByTagName("div");
        for (var i=0; i<divs.length; i++){
            var el = divs[i];
            if (el.isCalEvent!==true) continue;
            if (container.contains(el)) continue;   //skip this cell's single-day events
            var mr = _getRect(el);
            if (mr.right > tdRect.left && mr.left < tdRect.right){ //same column
                if (boundary==null || mr.bottom > boundary) boundary = mr.bottom;
            }
        }
        if (boundary!=null) nudgeBelow(wrappers[0], {bottom: boundary});

      //Walk top-to-bottom, pushing each event down until it clears the one
      //above it. Adjusting a wrapper also shifts the ones below it, so we
      //re-measure on each iteration.
        for (var i=1; i<wrappers.length; i++){
            var above = getEventDiv(wrappers[i-1]);
            if (above!=null) nudgeBelow(wrappers[i], _getRect(above));
        }
    };


  //**************************************************************************
  //** getEventDiv
  //**************************************************************************
  /** Returns the visible event div (tagged with "isCalEvent") inside a wrapper.
   */
    var getEventDiv = function(el){
        while (el!=null && el.childNodes && el.childNodes.length>0){
            el = el.childNodes[0];
            if (el.isCalEvent===true) return el;
        }
        return null;
    };


  //**************************************************************************
  //** getDOM
  //**************************************************************************
    this.getDOM = function(){
        return table;
    };


  //**************************************************************************
  //** next
  //**************************************************************************
    this.next = function(){
        date.setMonth(date.getMonth()+1);
        computeRange(date);
        renderTable();
        loadEvents();
    };


  //**************************************************************************
  //** back
  //**************************************************************************
    this.back = function(){
        date.setMonth(date.getMonth()-1);
        computeRange(date);
        renderTable();
        loadEvents();
    };


  //**************************************************************************
  //** setDate
  //**************************************************************************
    this.setDate = function(d){
        if (d==null) d = new Date();


        if (date!=null){
            if (d.getFullYear()==date.getFullYear() && d.getMonth()==date.getMonth()){
                date = d;
                return;
            }
        }


        date = d;
        computeRange(date);
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
  //** computeRange
  //**************************************************************************
    var computeRange = function(d){

      //Compute number of rows to render. Credit:
      //http://stackoverflow.com/a/2485172
        var year = d.getFullYear();
        var month = d.getMonth()+1;
        var firstOfMonth = new Date(year, month-1, 1);
        var lastOfMonth = new Date(year, month, 0);
        numWeeks = Math.ceil( (firstOfMonth.getDay() + lastOfMonth.getDate()) / 7);

        startDate = new Date(firstOfMonth);
        startDate.setDate(startDate.getDate()-firstOfMonth.getDay());

        endDate = new Date(lastOfMonth);
        endDate.setDate(endDate.getDate()+(6-lastOfMonth.getDay()));
    };


  //**************************************************************************
  //** getDateRange
  //**************************************************************************
  /** Returns the start/end dates represented by this view.
   */
    this.getDateRange = function(){
        return {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };
    };


  //**************************************************************************
  //** getTitle
  //**************************************************************************
  /** Returns a title for the current view.
   */
    this.getTitle = function(){
        return (config.monthNames[date.getMonth()] + " " + date.getFullYear());
    };


  //**************************************************************************
  //** loadEvents
  //**************************************************************************
    var loadEvents = function(){
        var events = store.getEvents();
        for (var i=0; i<events.length; i++){
            me.addEvent(events[i]);
        }
    };


  //**************************************************************************
  //** updateEventMetrics
  //**************************************************************************
  /** Used to set eventHeight and eventPadding
   */
    var updateEventMetrics = function(){
        getEventMetrics(table, config.style.event, function(metrics){
          //Month event divs are content-box; the wrapper height drives the
          //content and the border+padding are added on top.
            eventHeight = metrics.contentHeight;
            eventPadding = metrics.padding;
        });
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var createTable = javaxt.dhtml.utils.createTable;
    var onRender = javaxt.dhtml.utils.onRender;
    var addStyle = javaxt.dhtml.utils.addStyle;
    var _getRect = javaxt.dhtml.utils.getRect;
    var merge = javaxt.dhtml.utils.merge;

    var log = function(str){if(config.debug)console.log(str);};
    var getStyle = javaxt.dhtml.calendar.utils.getStyle;
    var initDrag = javaxt.dhtml.calendar.utils.initDrag;
    var getEventMetrics = javaxt.dhtml.calendar.utils.getEventMetrics;

    init();
};