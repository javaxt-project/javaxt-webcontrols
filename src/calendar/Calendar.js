if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Calendar Class
//*****************************************************************************/
/**
 *   Used to render events for a given month/week/day
 *
 ******************************************************************************/

javaxt.dhtml.Calendar = function(parent, config) {

    this.className = "javaxt.dhtml.Calendar";

    var me = this;
    var view = null;
    var views = {};
    var currView;
    
    
    var rendered = false;
    var deferredEvents = [];
    var _listeners = {};
    
    
    var supportedViews = {
        day: javaxt.dhtml.calendar.Day,
        week: javaxt.dhtml.calendar.Week,
        month: javaxt.dhtml.calendar.Month
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);
        config = clone;


      //Set store
        if (config.eventStore==null) config.eventStore = new javaxt.dhtml.calendar.EventStore();

        
        
      //Replace listeners with local callbacks so that the events appear to
      //be fired from this class instead of the views
        var listeners = config.listeners;
        var beforerender = null;
        var afterrender = null;
        if (listeners!=null){
            
            for (var listenerName in listeners) {
                if (listeners.hasOwnProperty(listenerName)) {
                    var listener = listeners[listenerName];
                    
                    
                    if (listenerName=='beforerender'){
                        beforerender = listener;
                        delete listeners[listenerName];
                    }
                    else if (listenerName=='afterrender'){
                        afterrender = listener;
                        delete listeners[listenerName];
                    }
                    else{
                        _listeners[listenerName] = listener;
                        (function(listenerName) {

                            listeners[listenerName] = function(){
                                //console.log("** fire " + listenerName + "? " + rendered);


                                var args = [];
                                for (var i=0; i<arguments.length; i++){
                                    var arg = arguments[i];
                                    
                                    for (var name in supportedViews) {
                                        if (supportedViews.hasOwnProperty(name)) {
                                            var clazz = supportedViews[name];
                                            if (arg instanceof clazz){
                                                arg = me;
                                                break;
                                            }
                                        }
                                    }
                                    
                                    
                                    args.push(arg);
                                }


                                if (!rendered){ 
                                    deferredEvents.push({
                                        name: listenerName,
                                        args: args
                                    });
                                    return;
                                }


                                var _listener = _listeners[listenerName];
                                if (_listener!=null) _listener.apply(me, args);
                            };

                        })(listenerName);
                    
                    }
                }
            }
            

        }
        
        
      //
        deferEvents();


      //Call super
        new javaxt.dhtml.calendar.View(me, config);



      //Call the beforerender callback
        if (beforerender!=null) beforerender.apply(me, [me]);

        
      //Render view
        me.setView(config.view);


      //Call the afterrender callback
        if (afterrender!=null) afterrender.apply(me, [me]);

        
      //Execute deferred events
        executeDeferredEvents();

    };


    var deferEvents = function(){
        deferredEvents = [];
        rendered = false; 
    };

    var executeDeferredEvents = function(){
        rendered = true;
        for (var i=0; i<deferredEvents.length; i++){
            var deferredEvent = deferredEvents[i];
            
            var listener = _listeners[deferredEvent.name];
            var args = deferredEvent.args;
            if (listener!=null) listener.apply(me, args);
        }
        deferredEvents = [];
    };
    
    var updateInterface = function(){
        for (var fn in view) {
            if (view.hasOwnProperty(fn) && fn!=='className') {

              //Method 1: Adopt the method straight from the view
                me[fn] = view[fn];


              //Method 2: Create an anonymous function to call the method using the view
              /*
                (function(fn) { 

                    me[fn] = function(){
                        view[fn].apply(me, arguments);
                    };


                })(fn); 
              */

            }
        }

        //console.log(me.getTitle());
        //console.log(me.className);
    };


  //**************************************************************************
  //** setView
  //**************************************************************************
  /** Used to update the view. */

    this.setView = function(viewName){

        if (viewName!=null) viewName = viewName.toLowerCase();
        if (viewName==currView) return;
        
        
        var _view = views[viewName];
        if (_view!=null){
            currView = viewName;
            
            var date = view.getDate();
            
            view.hide();            
            
            view = _view;
            view.setDate(date);
            updateInterface();
            view.show();
            view.refresh();
            
            
            var listener = me.getListener('update');
            if (listener!=null) listener.callback.apply(listener.scope, [me]);
        }
        else{
            
            var classToLoad = null;
            for (var name in supportedViews) {
                if (supportedViews.hasOwnProperty(name)) {
                    if (viewName==name){
                        classToLoad = supportedViews[name];
                        break;
                    }
                }
            }
            
            
            if (classToLoad){

                deferEvents();
                
                var date = null;
                if (view!=null){
                    date = view.getDate();
                    view.hide();
                }
                
                view = new classToLoad(parent, config);
                if (date!=null) view.setDate(date);
                
                updateInterface();
                views[viewName] = view;
                currView = viewName;
                
                
                
                executeDeferredEvents();
            }

        }
    };


  //**************************************************************************
  //** getView
  //**************************************************************************
  /** Returns the current view. */

    this.getView = function(){
        return view;
    };


  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    var merge = function(settings, defaults) {
        for (var p in defaults) {
            if ( defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined" ) {
                if (p!=0) //<--Added this as a bug fix
                merge(settings[p], defaults[p]);
            }
            else {
                settings[p] = defaults[p];
            }
        }
    };


    init();
};