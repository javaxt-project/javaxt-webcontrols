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
    
    
  //Config options
    var date;
    var days = javaxt.dhtml.calendar.Utils.dayNames;
    var store;
    var eventHeight = 17; 
    var eventPadding = 2; //padding with a cell
    var eventSpacing = 2; //vertical spacing between events
    var holdDelay = 500;
    var debug = false;



  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of the calendar control. */

    var init = function(){

      //Call super
        new javaxt.dhtml.calendar.View(me, config);
        
      //Set store
        store = config.eventStore==null ? new javaxt.dhtml.calendar.EventStore() : config.eventStore;


      //Set event size, padding, and spacing
        function isNumeric(n){ return !isNaN(parseFloat(n)) && isFinite(n); }
        if (isNumeric(config.eventHeight)) eventHeight = parseInt(config.eventHeight);
        if (isNumeric(config.eventPadding)) eventPadding = parseInt(config.eventPadding);
        if (isNumeric(config.eventSpacing)) eventSpacing = parseInt(config.eventSpacing);


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
  /** Used to render a new table for the current date. */

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
        var tbody = createTable();
        table = tbody.parentNode;
        table.className = "javaxt-noselect";
        table.style.cursor = "default";        
        var tr = document.createElement('tr');
        tr.setAttribute("desc", "header-row");
        tr.className = "javaxt-cal-header";
        tbody.appendChild(tr);
        var header = document.createElement('td');
        header.style.width = "100%";
        tr.appendChild(header);
        tr = document.createElement('tr');
        tr.setAttribute("desc", "body-row");
        tr.className = "javaxt-cal-body";
        tbody.appendChild(tr);
        var body = document.createElement('td');
        body.style.width = "100%";
        body.style.height = "100%";
        tr.appendChild(body);


      //Create header table
        tbody = createTable();
        var th = document.createElement('tr');
        tbody.appendChild(th);
        for (var i=0; i<days.length; i++){
            var td = document.createElement('td');
            td.className = 'javaxt-cal-header-col';
            td.style.width = (100/days.length) + '%';

            
            //Update left and right border of the first and last days. The
            //border should be set via the javaxt-cal-header style.
            if (i==0) td.style.borderLeft = "0px";
            if (i==days.length-1) td.style.borderRight = "0px";
            
            
            td.appendChild(me.createColumnHeader(i));
            th.appendChild(td);
        }
        header.appendChild(tbody.parentNode);
        


      //Create the grid. The grid consists of a number of nested tables. The  
      //outer table has 1 column and a row for each week
        tbody = createTable();
        for (var i=0; i<numWeeks; i++){
            tr = document.createElement('tr');
            td = document.createElement('td');
            td.style.width = "100%";
            tr.appendChild(td);
            tbody.appendChild(tr);


          //Create table for the week. The table has 3 rows. The first row is   
          //for the cell headers, the middle for is for the cell content, and 
          //last row is for the cell footers
            var week = createTable();
            td.appendChild(week.parentNode);
            for (var x=0; x<3; x++){
                tr = document.createElement('tr');
                week.appendChild(tr);
                
                td = document.createElement('td');
                td.style.width = "100%";
                tr.appendChild(td);
                
                

                
                
              //Create innerTable used to render days in the week
                var innerTable = createTable();
                if (x==1){
                    //Wrap the week table in a div for overflow purposes
                    var div = document.createElement("div");
                    div.style.width = "100%";
                    div.style.height = "100%";
                    div.style.position = 'absolute';
                    div.style.whiteSpace = 'nowrap';
                    div.style.overflow = 'hidden';
                    div.appendChild(innerTable.parentNode);
                    
                    var wrapper = document.createElement('div');
                    wrapper.style.width = "100%";
                    wrapper.style.height = "100%";
                    wrapper.style.position = "relative";                    
                    wrapper.appendChild(div);
                    
                    td.style.height = "100%";
                    td.appendChild(wrapper);
                }
                else{
                    td.appendChild(innerTable.parentNode);
                }
                
                
                var numInnerRows = 1;
                if (x==1) numInnerRows = 2;
                for (var k=0; k<numInnerRows; k++){
                
                  //Set date
                    var d = new Date(startDate);
                    d.setDate(d.getDate()+(i*days.length));                


                    tr = document.createElement('tr');
                    innerTable.appendChild(tr);                


                  //Add columns - one for each day
                    for (var j=0; j<days.length; j++){
                        td = document.createElement('td');
                        td.style.width = (100/days.length) + '%';
                        td.className = "javaxt-cal-cell";
                        if (d.getMonth()<date.getMonth()) td.className+='-prev-month';
                        else if (d.getMonth()>date.getMonth()) td.className+='-next-month';
                        
                        
                        
                        
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
                            td.className += " javaxt-cal-cell-header";
                            td.appendChild(me.createCellHeader(new Date(d), i, j));
                        }
                        else if (x==1){
                            
                            if (k==0){
                                multiDayCols[id] = [td];
                                td.style.height = "1px";
                            }
                            else{
                                div = document.createElement("div");
                                div.style.width="100%";
                                div.style.height = "100%";
                                div.style.position = "relative"; 
                                td.appendChild(div);
                                singleDayCols[id] = td;
                            }
                        }
                        else if (x==2){
                            td.className += " javaxt-cal-cell-footer";
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
        
        body.appendChild(tbody.parentNode);
        parent.appendChild(table);

        


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
        var outerDiv = document.createElement('div');
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.position = "relative";
        var innerDiv = document.createElement('div');
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.whiteSpace = 'nowrap';
        innerDiv.style.overflow = 'hidden';
        innerDiv.innerHTML = days[i];

        outerDiv.appendChild(innerDiv);
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
        var monthName = javaxt.dhtml.calendar.Utils.monthNames[date.getMonth()].substring(0,3) + " ";
        if (i==0 && j==0) text = monthName + text;
        else if (text==1) text = monthName + text;
        var div = document.createElement("div");
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
        var div = document.createElement("div");
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
        var div = event.createDiv(me);
     
        
      //Wrap the div in a bunch of divs for overflow purposes
        var wrapper = document.createElement('div');
        wrapper.style.width = "100%";
        wrapper.style.height = eventHeight + "px";
        wrapper.style.marginTop = (eventSpacing*2) + "px";  //Vertical padding
        wrapper.style.position = "relative";
        wrapper.style.cursor = 'pointer';
        wrapper.event = event;    
      
        var outerDiv = document.createElement('div');
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.position = "absolute";

        
        wrapper.appendChild(outerDiv);

        var innerDiv = document.createElement('div');
        innerDiv.style.height = "100%";
        innerDiv.style.padding = "0px " + eventPadding + "px"; //Horizontal padding 
        innerDiv.style.position = "relative";
        outerDiv.appendChild(innerDiv);
        innerDiv.appendChild(div);


      //Initialize mouse events
        if (event.isEditable()) initDrag(wrapper, me, holdDelay);
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
            javaxt.dhtml.calendar.Utils.addColSpan(col, cols.length);
            
            var continueLeft = i>0 && col.previousSibling==null;
            var continueRight = col.nextSibling==null && (spans.length>1 && i<spans.length-1);
            var div = event.createDiv(continueLeft, continueRight);

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

            div.style.height = "100%";
            innerDiv.appendChild(div);                


          //Wrap the outerdiv to ensure proper overflow
            var wrapper = document.createElement('div');
            wrapper.style.width = "100%";
            wrapper.style.height = eventHeight + "px"; //"100%";
            wrapper.style.position = "relative";
            if (k>1) wrapper.style.marginTop = (eventSpacing*2) + "px";  //Vertical padding
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
                    offset = ((y2-y1)+((eventSpacing*2)-1)); //-1px for spacer row?
                }
                

                div.style.marginTop = -offset + "px";
            }
        }
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
        return (javaxt.dhtml.calendar.Utils.monthNames[date.getMonth()] + " " + date.getFullYear());
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
    

    var _getRect = javaxt.dhtml.calendar.Utils.getRect;
    var initDrag = javaxt.dhtml.calendar.Utils.initDrag;
    var log = function(str){if(debug)console.log(str);};

    init();
};