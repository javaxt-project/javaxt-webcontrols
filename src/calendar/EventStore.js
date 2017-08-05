if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.calendar) javaxt.dhtml.calendar={};

//******************************************************************************
//**  Event Store
//*****************************************************************************/
/**
 *   Used to manage an array of events and helps keep all of the calendar views 
 *   in sync.
 *
 ******************************************************************************/

javaxt.dhtml.calendar.EventStore = function(events) {
    this.className = "javaxt.dhtml.calendar.EventStore";
    
    
    var me = this;
    
    var init = function(){
        if (events==null || !(events instanceof Array)) events = [];
    };
    
    
    this.add = function(event){
        if (me.contains(event)) return;
        events.push(event);
    };
    
    this.remove = function(event){
        for (var i=0; i<events.length; i++){
            if (events[i].equals(event)){
                events.splice(i,1);
                break;
            }
        }
    };
    
    this.contains = function(event){
        for (var i=0; i<events.length; i++){
            if (events[i].equals(event)) return true;
        }
        return false;
    };
    
    this.clear = function(){
        //events = [];
        events.length = 0; //We don't want to lose the original array
    };
    
    this.getEvents = function(){
        return events;
    };
    
    
  //**************************************************************************
  //** getOverlappingEvents
  //**************************************************************************
  /** Returns a list of events that overlap a given event.
   */
    this.getOverlappingEvents = function(event){

        var startDate = event.getStartDate();
        var endDate = event.getEndDate();
        
        var overlappingEvents = [];
        var events = me.getEvents(); //in case someone want to override getEvents 
        for (var i=0; i<events.length; i++){
            if (!events[i].equals(event)){
                var a = events[i].getStartDate();
                var b = events[i].getEndDate();
                if (startDate.getTime() < b.getTime() && a.getTime() < endDate.getTime()){
                    overlappingEvents.push(events[i]);
                }
            }
        }
        
        return overlappingEvents;
    };
    

    
    init();
};