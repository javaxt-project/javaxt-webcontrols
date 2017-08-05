if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  View
//*****************************************************************************/
/**
 *   Provides an abstract interface that all calendar views must implement.
 *
 ******************************************************************************/

javaxt.dhtml.calendar.View = function(view, config) {


    this.next = function(){};
    this.back = function(){};

    this.getDate = function(){};
    this.setDate = function(){};
    this.getDateRange = function(){};
    this.hasHours = function(){};

    this.getTitle = function(){};

    this.addEvent = function(event){};
    this.removeEvent = function(event){};
    this.getEvents = function(){};
    this.getEventStore = function(){};
    
    this.refresh = function(){};
    this.clear = function(){};

    this.show = function(){};
    this.hide = function(){};
    this.getDOM = function(){};

    


  //**************************************************************************
  //** addEvents
  //**************************************************************************
  /** Used to bulk load events to the view.
   */
    this.addEvents = function(events){
        for (var i=0; i<events.length; i++){
            view.addEvent(events[i]);
        }
    };




  //**************************************************************************
  //** getCells
  //**************************************************************************
  /** Returns an array of cells found in the current view. This method is used
   *  by the various views and is not intended for public use.
   */
    this.getCells = function(){};




  //**************************************************************************
  //** getListener
  //**************************************************************************
  /** Returns a listener by name. */

    this.getListener = function(name){

        var listeners = config.listeners;
        if (listeners!=null){
            var scope = listeners.scope;
            if (scope==null) scope = view;

            var callback = listeners[name];
            if (callback!=null) return {
                callback : callback,
                scope: scope
            };
        }

        return null;
    };
    
    
  //**************************************************************************
  //** addListener
  //**************************************************************************
    this.addListener = function(name, callback, scope){
        var listeners = config.listeners;
        if (listeners==null) listeners = {};
        listeners[name] = {
            callback : callback,
            scope: scope==null ? view : scope
        };
    };
    
    
  //**************************************************************************
  //** removeListener
  //**************************************************************************
    this.removeListener = function(name){
        var listeners = config.listeners;
        if (listeners!=null){
            delete listeners[name];
        }
    };
    
  


  //Extend the view
    var me = this;
    for (var fn in me) {
        if (me.hasOwnProperty(fn)) {
            if (view[fn]==null) view[fn] = me[fn];
        }
    }
};