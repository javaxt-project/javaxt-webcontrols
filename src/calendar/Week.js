if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Week View
//*****************************************************************************/
/**
 *   Used to render a week
 *
 ******************************************************************************/

javaxt.dhtml.calendar.Week = function(parent, config) {

    this.className = "javaxt.dhtml.calendar.Week";

    var me = this;
    var listeners;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of the calendar control. */

    var init = function(){


/*
      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;
 */



      //Copy config
        var initialConfig = config;
        config = {};
        for (var key in initialConfig) {
            if (initialConfig.hasOwnProperty(key)) {
                config[key] = initialConfig[key];
            }
        }
        
      //Add days to config
        config.days = 7;
        



      //Update the beforerender, afterrender, and update listeners BEFORE
      //instantiating the Day view.
        listeners = config.listeners;
        if (listeners!=null){



            config.listeners = {
                beforerender: function(view){

                  //Copy methods from parent
                    for (var fn in view) {
                        if (view.hasOwnProperty(fn)) {
                            if (me[fn]==null) me[fn] = view[fn];
                        }
                    }

                    var listener = me.getListener('beforerender');
                    if (listener!=null) listener.callback.apply(listener.scope, arguments);
                }
            };


            for (var listenerName in listeners) {
                if (listeners.hasOwnProperty(listenerName)) {
                    
                    if (listenerName!='beforerender'){
                        (function(listenerName) {
                            
                            config.listeners[listenerName] = function(){
                                var listener = me.getListener(listenerName);
                                if (listener!=null) listener.callback.apply(listener.scope, arguments);
                            }
                            
                        })(listenerName);
                    }
                    
                }
            }
        }
        

      //Instantiate the day view
        var view = new javaxt.dhtml.calendar.Day(parent, config);
        view.getListener = me.getListener;
    };


  //**************************************************************************
  //** getListener
  //**************************************************************************
  /** Overrides the native getListener method by replacing arguments in the 
   *  callback. Any arguments that refer to the day view are replaced with 
   *  this view.
   */
    this.getListener = function(name){

        if (listeners!=null){
            var scope = listeners.scope;
            if (scope==null) scope = me;

            var callback = listeners[name];
            if (callback!=null) return {
                callback : function(){

                  //Update the "view" argument as needed
                    for (var i=0; i<arguments.length; i++){
                        if (arguments[i] instanceof javaxt.dhtml.calendar.Day){
                            arguments[i] = me;
                        }
                    }
                    callback.apply(scope, arguments);                    
                },
                scope: scope
            };
        }

        return null;
    };


    init();
};