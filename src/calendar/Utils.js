if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.calendar) javaxt.dhtml.calendar={};
javaxt.dhtml.calendar.Utils = {

    
    monthNames : ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ],
    
    dayNames : ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    
  //**************************************************************************
  //** getDaysBetween
  //**************************************************************************
  /** Returns the number of days between 2 dates. Returns a decimal value.
   */
    getDaysBetween: function(startDate, endDate){
        
        function treatAsUTC(date) {
            var result = new Date(date);
            result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
            return result;
        }        
        
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
    },


  //**************************************************************************
  //** addColSpan
  //**************************************************************************
  /** Used to add a colspan to a given column.
   */
    addColSpan : function(td, newSpan){
        if (newSpan<2) return;
        
      //Add colspan
        td.colSpan = newSpan;



        var deleteCells = function(startCol, numCells){
            if (startCol==null) return;
            var td = startCol;
            var tr = td.parentNode;
            var x = 0;
            var del = [];
            while (x<numCells){
                var colSpan = td.colSpan;
                if (colSpan==null || colSpan<2) colSpan=1;
                x = x + colSpan;

                del.push(td);
                td = td.nextSibling;
                if (td==null) break;
            }
            for (var i=0; i<del.length; i++){
                tr.removeChild(del[i]);
            }
        };   
    

      //Delete cells that we've spanned
        deleteCells(td.nextSibling, newSpan-1);
        
    },


  //**************************************************************************
  //** getRect
  //**************************************************************************
  /** Returns the geometry of a given element.
   */
    getRect : function(el){

        if (el.getBoundingClientRect){
            return el.getBoundingClientRect();
        }
        else{
            var x = 0;
            var y = 0;
            var w = el.offsetWidth;
            var h = el.offsetHeight;

            function isNumber(n){
               return n === parseFloat(n);
            }

            var org = el;

            do{
                x += el.offsetLeft - el.scrollLeft;
                y += el.offsetTop - el.scrollTop;
            } while ( el = el.offsetParent );


            el = org;
            do{
                if (isNumber(el.scrollLeft)) x -= el.scrollLeft;
                if (isNumber(el.scrollTop)) y -= el.scrollTop;
            } while ( el = el.parentNode );


            return{
                left: x,
                right: x+w,
                top: y,
                bottom: y+h,
                width: w,
                height: h
            };
        }
    },


  //**************************************************************************
  //** getNextHighestZindex
  //**************************************************************************
  /** Private method used to get the next highest z index. 
   *  http://greengeckodesign.com/blog/2007/07/get-highest-z-index-in-javascript.html
   */
    getNextHighestZindex : function(obj){
       var highestIndex = 0;
       var currentIndex = 0;
       var elArray = Array();
       if(obj){elArray = obj.getElementsByTagName('*');}else{elArray = document.getElementsByTagName('*');}
       for(var i=0; i < elArray.length; i++){
          if (elArray[i].currentStyle){
             currentIndex = parseFloat(elArray[i].currentStyle['zIndex']);
          }else if(window.getComputedStyle){
             currentIndex = parseFloat(document.defaultView.getComputedStyle(elArray[i],null).getPropertyValue('z-index'));
          }
          if(!isNaN(currentIndex) && currentIndex > highestIndex){highestIndex = currentIndex;}
       }
       return(highestIndex+1);
    },


  //**************************************************************************
  //** initDrag
  //**************************************************************************
  /** Used to enable/initialize event dragging. Drag events are initiated 
   *  after a predefined holdDelay.
   *  @param holdDelay Number of milliseconds to wait before recognizing a hold
   */
    initDrag : function(div, view, holdDelay){
     
                
      //This timeout, started on mousedown, triggers the beginning of a hold
        var holdStarter = null;

        
      //This flag indicates the user is currently holding the mouse down
        var holdActive = false;

       
      //OnClick
        //div.onclick = NOTHING!! not using onclick at all - onmousedown and onmouseup take care of everything

   
      //MouseDown
        div.onmousedown = function(e){

            
          //Set the holdStarter and wait for the predetermined delay, and then begin a hold
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;


              //Initiate drag
                startDrag(e);
                
                
              //Add event listeners
                if (document.addEventListener) { // For all major browsers, except IE 8 and earlier
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                } 
                else if (document.attachEvent) { // For IE 8 and earlier versions
                    document.attachEvent("onmousemove", onMouseMove);
                    document.attachEvent("onmouseup", onMouseUp);
                }             

            }, holdDelay);
            
        };



      //MouseUp
        var onMouseUp = function (e){
            
            
          //Remove javaxt-cal-event-drag class from the event div
            var innerDiv = getInnerDiv(div);
            innerDiv.className = innerDiv.className.replace( /(?:^|\s)javaxt-cal-event-drag(?!\S)/g , '' );

            
            
          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                
                
                var listener = view.getListener('eventclick');
                if (listener!=null){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [div.event, e]);
                }
            }
            
          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;

              //Remove event listeners
                if (document.removeEventListener) { // For all major browsers, except IE 8 and earlier
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                } else if (document.detachEvent) { // For IE 8 and earlier versions
                    document.detachEvent("onmousemove", onMouseMove);
                    document.detachEvent("onmouseup", onMouseUp);
                }
                
              //Update cursor
                div.style.cursor = 'pointer';
                
              //Move div
                moveDiv(div);
                
              //Remove the "javaxt-noselect" class
                var body = document.getElementsByTagName('body')[0];
                body.className = body.className.replace( /(?:^|\s)javaxt-noselect(?!\S)/g , '' );
            }
        };


        div.onmouseup = onMouseUp;

        

      //Start touch (similar to "onmousedown")
        div.ontouchstart = function(e) {

            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            
          //Disable scrolling in the view
            view.disableTouch();

            
            
          //Set the holdStarter and wait for the holdDelay before starting the drag
            holdStarter = setTimeout(function() {
                holdStarter = null;
                holdActive = true;

              //Initiate drag
                startDrag({
                    clientX: x,
                    clientY: y
                });
                
                
              //Add "touchmove" event listener
                if (document.removeEventListener) { // For all major browsers, except IE 8 and earlier
                    div.addEventListener("touchmove", onTouchMove); //,false?
                }
                else if (document.detachEvent) {
                    div.attachEvent("ontouchmove", onTouchMove);
                }
                
                
            }, holdDelay);            
        };

      //End touch (similar to "onmouseup")
        div.ontouchend = function(e) {


          //Remove javaxt-cal-event-drag class from the event div
            var innerDiv = getInnerDiv(div);
            innerDiv.className = innerDiv.className.replace( /(?:^|\s)javaxt-cal-event-drag(?!\S)/g , '' );
            

          //Remove "touchmove" event listener
            if (document.removeEventListener) { // For all major browsers, except IE 8 and earlier
                div.removeEventListener("touchmove", onTouchMove);
            }
            else if (document.detachEvent) {
                div.detachEvent("ontouchmove", onTouchMove);
            }


          //Enable scrolling in the view
            view.enableTouch();


          //If the mouse is released immediately (i.e., a click), before the
          //holdStarter runs, then cancel the holdStarter and do the click
            if (holdStarter) {
                clearTimeout(holdStarter);
                
              //run click-only operation here
                //console.log("Click!");
                var listener = view.getListener('eventclick');
                if (listener!=null){
                    var callback = listener.callback;
                    var scope = listener.scope;
                    callback.apply(scope, [div.event, e]);
                }
            }
            
          //Otherwise, if the mouse was being held, end the hold
            else if (holdActive) {
                holdActive = false;
                moveDiv(div);
            }
           
        };
        




                
        var onMouseMove = function(e){
            var x = e.clientX;
            var y = e.clientY;
            div.style.left = (x-div.xOffset) + 'px';
            div.style.top = (y-div.yOffset) + 'px';
        };
        
        var onTouchMove = function(e) {
            e.preventDefault();
            var touch = e.touches[0];
            var x = touch.pageX;
            var y = touch.pageY;

            onMouseMove({
                clientX: x,
                clientY: y
            });
        };
        
        
        var startDrag = function(e){
            var x = e.clientX;
            var y = e.clientY;

            var rect = _getRect(div);
            var top = rect.top-parseInt(div.style.marginTop);
            
            var xOffset = x-rect.left;
            var yOffset = view.hasHours() ? (rect.height/2) : y-top;


            var parentNode = div.parentNode;

            var orgStyle = {
                width: div.style.width,
                left: div.style.left,
                top: div.style.top,
                rect: rect
            };
            div.orgStyle = orgStyle;
            div.orgParent = parentNode;
            div.xOffset = xOffset;
            div.yOffset = yOffset;
            
            
          //Disable text selection in the entire document - very important!
            var body = document.getElementsByTagName('body')[0];
            if (!body.className.match(/(?:^|\s)javaxt-noselect(?!\S)/) ){
                body.className += (body.className.length==0 ? "" : " ") + "javaxt-noselect";
            }            
            

          //Remove div from the current cell and append it to the body
            var nextSibling = div.nextSibling;
            parentNode.removeChild(div);
            body.appendChild(div);


          //Add placeholder div as needed (e.g. month view)
            if (view.hasHours()==false && nextSibling!=null){ 
                var placeHolderDiv = document.createElement("div");
                placeHolderDiv.style.width = "100%";
                placeHolderDiv.style.height = rect.height + "px";
                placeHolderDiv.style.marginTop = div.style.marginTop;
                parentNode.insertBefore(placeHolderDiv, nextSibling);
                placeHolderDiv.event = div.event;
            }



            div.style.position = "absolute";
            div.style.width = rect.width + 'px';
            div.style.left = rect.left + 'px';
            div.style.top = (y-yOffset) + 'px';
            div.style.cursor = 'move';
            div.style.zIndex = getNextHighestZindex();
            
            
            
          //Add javaxt-cal-event-drag class to the event div
            var innerDiv = getInnerDiv(div);
            innerDiv.className += " javaxt-cal-event-drag";
        };
        



        /** Used to move an event from cell to cell.  */
        var moveDiv = function(div){
            
            
          //Compute geometry of the div
            var rect = _getRect(div);
            var minY = rect.top;


          //Generate list of cells that intersect the four corners of the div
            var cells = getCells(rect);


          //If the div doesn't intersect any cells in the view, return the div 
          //to its original location.
            if (cells.length==0){
                returnDiv(div);
                return;
            }


          //Select cell to move to
            var cell;
            if (cells.length==1){
                cell = cells[0];
            }
            else{

              //Find the cell with the largest area of intersection
                var intersections = {};
                var keys = [];
                for (var i=0; i<cells.length; i++){
                    var cell = cells[i];

                    var area = getAreaOfIntersection(rect, cell);
                    keys.push(area);
                    intersections[area] = cell;
                }
                keys.sort(function(a,b){return b-a});
                cell = intersections[keys[0]];
            }


          //Find the event associated with this div and the original cell ID
            var event = div.event;
            var d = event.getStartDate();
            var currID = (d.getMonth()+1) + "-" + d.getDate() + "-" + d.getFullYear();

            

          //Move the div
            if (cell.id==currID){


                if (view.hasHours()){


                  //Compute distance that the div has moved. If the div has only
                  //moved by a few pixels in the y direction, cancel the move.
                    var a = 1; //disregard changes in x
                    var b = minY - div.orgStyle.rect.top;
                    var d = Math.sqrt( a*a + b*b );
                    if (d<15){
                        returnDiv(div);
                        return;
                    }
                    


                  //Update start/end time
                    var startDate = event.getStartDate();
                    var endDate = event.getEndDate();
                    setTime(getTime(minY+5, div), startDate, endDate); //+5 is for cell padding...

                    moveEvent(event, startDate, endDate);
                }
                else{

                  //Return the div to its original position
                    returnDiv(div);
                }
            }
            else{ //move div to a new cell

              //Compute new event start/end dates
                var arr = cell.id.split("-");
                var startDate = event.getStartDate();
                startDate.setFullYear(parseInt(arr[2]));
                startDate.setMonth(parseInt(arr[0])-1);
                startDate.setDate(parseInt(arr[1]));

                var diffDays = Math.round((startDate.getTime() - event.getStartDate().getTime())/(24*60*60*1000));
                var endDate = event.getEndDate();
                endDate.setDate(endDate.getDate()+diffDays);

              //Update start/end time
                if (view.hasHours()){
                    setTime(getTime(minY+5, div), startDate, endDate);
                }



                moveEvent(event, startDate, endDate);
            }
            
        };
        
        
        

        
        /** Used to update the start/end date of an event and render it in a given cell. */
        var moveEvent = function(event, startDate, endDate){

            var fn = function(move){
                
                if (move==true){
                
                    var parentNode = div.parentNode;
                    parentNode.removeChild(div);


                  //Remove the event from the current cell. Do this before updating  
                  //the start/end date. Otherwise, we might end up with holes/gaps 
                  //between events in the cell.
                    view.removeEvent(event);

                  //Update the event start/end dates
                    event.setStartDate(startDate);
                    event.setEndDate(endDate);

                  //Add the event to the cell
                    view.addEvent(event);     
                
                  //Call the aftermove callback
                    listener = view.getListener('aftermove');
                    if (listener!=null) listener.callback.apply(listener.scope, [event]);                
                }
                else{
                    returnDiv(div);
                }
                
            };



          //Call the beforemove callback
            var listener = view.getListener('beforemove');
            if (listener!=null) listener.callback.apply(listener.scope, [event, startDate, endDate, fn]);
            else fn(true);

        };



        /** Used to cancel a div move and return the div to its original position. */
        var returnDiv = function(div){
            var parentNode = div.parentNode;
            parentNode.removeChild(div);
            var orgStyle = div.orgStyle;
            div.style.left = orgStyle.left;
            div.style.top = orgStyle.top;
            div.style.width = orgStyle.width;
            
            if (view.hasHours()){
                div.orgParent.appendChild(div);
            }
            else{
                
              //Make the div relative
                div.style.position = "relative";
                
                
              //Find placeholder div
                var placeholderDiv = null;
                var event = div.event;
                for (var i=0; i<div.orgParent.childNodes.length; i++){
                    if (div.orgParent.childNodes[i].event.equals(event)){
                        placeholderDiv = div.orgParent.childNodes[i];
                        break;
                    }
                }
                
                
              //Return div to its original parent
                if (placeholderDiv==null){
                    div.orgParent.appendChild(div);
                }
                else{
                    
                  //Replace placeholder div with the original div
                    var nextDiv = placeholderDiv.nextSibling;
                    if (nextDiv==null){
                        div.orgParent.removeChild(placeholderDiv);
                        div.orgParent.appendChild(div);
                    }
                    else{
                        div.orgParent.insertBefore(div, placeholderDiv);
                        div.orgParent.removeChild(placeholderDiv);
                    }
                }
            }

            
            div.orgParent = null;
            div.orgStyle = null;
        };
        
  
        /** Find the inner div with class="javaxt-cal-event" */
        var getInnerDiv = function(div){

            var el = div;
            while (el.childNodes.length>0){
                var firstChild = el.childNodes[0];
                
                if (firstChild.className.match(/(?:^|\s)javaxt-cal-event(?!\S)/) ){
                    return firstChild;
                }
                else{
                    el = firstChild;
                }
            }
        };
  
  
        /** Returns a list of cells that intersect the four corners of a given rectangle. */
        var getCells = function(rect){

            var minX = rect.left;
            var maxX = rect.right;
            var minY = rect.top;
            var maxY = rect.bottom;        

          //Generate list of cells that intersect the four corners of the div
            var cells = [];
            var addCell = function(cell){
                if (cell==null) return;
                for (var i=0; i<cells.length; i++){
                    if (cells[i].id==cell.id) return;
                }
                cells.push(cell);
            };
            addCell(getCell(minX, minY)); //ul
            addCell(getCell(minX, maxY)); //ll
            addCell(getCell(maxX, maxY)); //lr
            addCell(getCell(maxX, minY)); //ur

            return cells;
        };
        
        

        /** Returns a cell at a given x,y location within the view. */
        var getCell = function(x,y){
            var cells = view.getCells();
            for (var i=0; i<cells.length; i++){
                var cell = cells[i];
                var rect = cell.rect;

                var minX = rect.left;
                var maxX = rect.right;
                if (x>=minX && x<=maxX){
                    var minY = rect.top;
                    var maxY = rect.bottom;
                    if (y>=minY && y<=maxY){
                        return cell;
                    }
                }
            }
            return null;
        };



        /** Returns the total area that a given rectangle intersects a cell. */
        var getAreaOfIntersection = function(r1, cell){

            var rect = cell.rect;
            var minX = rect.left;
            var maxX = rect.right;
            var minY = rect.top;
            var maxY = rect.bottom;

            var left = r1.left;
            var right = r1.right;
            var top = r1.top;
            var bottom = r1.bottom;

            if (left<minX) left=minX;
            if (right>maxX) right=maxX;
            if (top<minY) top=minY;
            if (bottom>maxY) bottom=maxY;

            var w = right-left;
            var h = bottom-top;
            return w*h;
        };
        
        


        /** Returns the time represented by a given y coordinate in the view. 
         *  The returned value is a decimal (e.g. 9.5 representing 9:30 AM). */
        var getTime = function(y, div){
            
            
            var rows = [];
            var parentNode = div.orgParent;
            for (var i=0; i<parentNode.childNodes.length; i++){
                var el = parentNode.childNodes[i];
                var tagName = el.tagName.toLowerCase();
                if (tagName=="table"){
                    var tbody = el.childNodes[0];
                    for (var j=0; j<tbody.childNodes.length; j++){
                        rows.push(tbody.childNodes[j]);
                    }
                }
            }
 

            for (var i=0; i<rows.length; i++){

                var rect = _getRect(rows[i]);
                var minY = rect.top;
                var maxY = rect.bottom;

                if (y>=minY && y<=maxY){
                    return (i/2);
                }

            }
            return null;
        };



        /** Used to update a given start and end date with a given time. The time
         *  variable must be a decimal value (e.g. 9.5 representing 9:30 AM). */
        var setTime = function(time, startDate, endDate){
            var diff = time - (startDate.getHours() + (startDate.getMinutes()/60));
            var h = Math.floor(diff);
            var m = Math.abs((diff % 1)*60);

            startDate.setHours(startDate.getHours()+h);
            startDate.setMinutes(startDate.getMinutes()+m);

            endDate.setHours(endDate.getHours()+h);
            endDate.setMinutes(endDate.getMinutes()+m);
        };
        
        
        var getNextHighestZindex = javaxt.dhtml.calendar.Utils.getNextHighestZindex;
        var _getRect = javaxt.dhtml.calendar.Utils.getRect;   
  
    }
};