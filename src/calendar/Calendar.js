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


    var defaultConfig = {


      /** Day names or abbreviations to use in the column headers
       */
        dayNames : ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],


      /** Month names or abbreviations used in the header
       */
        monthNames : ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],


      /** Style for individual elements within the component. Note that you can
       *  provide CSS class names instead of individual style definitions.
       */
        style: {

            panel: {
                width: "100%",
                height: "100%"
            },

          //Header
            header : {
                border: "1px solid #99BBE8",
                background: "#EEEEEE",
                height: "25px"
            },
            headerCol : {
                borderLeft: "1px solid #99BBE8",
                borderRight: "1px solid #99BBE8",
                textAlign: "center",
                fontFamily: "tahoma,arial,verdana,sans-serif",
                fontSize: "11px",
                paddingTop: "5px"
            },
            footerCol : {},

          //Multiday event header
            multidayHeader : {
                borderBottom: "1px solid #99BBE8",
                borderLeft: "1px solid #000000",
                borderRight: "1px solid #000000",
                backgroundColor: "#FFFFFF"
            },
            multidayCol : {
                borderLeft: "1px solid #000000",
                borderRight: "1px solid #000000",
                paddingTop: "0px",
                verticalAlign: "top"
            },
            multidayColSpacer : {},

          //Body
            body : {
                borderRight: "1px solid #000000",
                borderBottom: "1px solid #000000",
                borderLeft: "1px solid #000000"
            },

          //Cells
            cell : {
                borderRight: "1px solid #000000",
                borderLeft: "1px solid #000000",
                verticalAlign: "top"
            },
            cellHeader : {
                height: "15px",
                padding: "0 2px 0 0",
                textAlign: "right",
                fontFamily: "tahoma,arial,verdana,sans-serif",
                fontSize: "11px"
            },
            cellFooter : {
                borderBottom: "1px solid #000000"
            },
            cellPrevMonth : {
                background: "#EFF9FC",
                borderRight: "1px solid #000000",
                borderLeft: "1px solid #000000"
            },
            cellNextMonth : {
                background: "#EFF9FC",
                borderRight: "1px solid #000000",
                borderLeft: "1px solid #000000"
            },

          //Hours
            hour : {
                height: "55px", /* 56px-1px for border */
                borderTop: "1px solid #99BBE8"
            },
            halfHour : {
                height: "27px", /* 28px-1px for border */
                borderTop: "1px solid #99BBE8"
            },
            halfHourSep : {
                borderTop: "1px solid #D7E8FF"
            },
            hourLast : {
                borderBottom: "1px solid #99BBE8"
            },

          //Hour labels
            labelHour : {
                fontFamily: '"Times New Roman", Times, serif',
                fontSize: "18pt",
                verticalAlign: "top"
            },
            labelMeridian : {
                fontFamily: "tahoma,arial,verdana,sans-serif",
                fontSize: "11px",
                padding: "0px 0px 0px 3px",
                verticalAlign: "top"
            },

          //Current time indicator
            currentTimeIndicator : {
                borderTop: "1px solid #FFA1A1"
            },

          //Events
            event : {
                fontFamily: "tahoma,arial,verdana,sans-serif",
                fontSize: "11px",
                paddingLeft: "4px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: "1px solid #803D5E",
                borderRadius: "3px",
                backgroundColor: "#E2C0D0"
            },
            eventContinueLeft : {
                borderRadius: "0px 3px 3px 0px",
                borderLeft: "0px"
            },
            eventContinueRight : {
                borderRadius: "3px 0px 0px 3px",
                borderRight: "0px"
            },
            eventDrag : {
                cursor: "move",
                boxShadow: "0 12px 14px 0 rgba(0, 0, 0, 0.2), 0 13px 20px 0 rgba(0, 0, 0, 0.2)"
            }
        },


      /** Instance of an EventStore
       */
        eventStore: null,


      /** Vertical spacing between events, in pixels
       */
        eventSpacing: 2,


      /** Amount of time, in milliseconds, to wait before a mousedown is
       *  treated as a "hold" instead of a "click"
       */
        holdDelay: 500,


      /** If true, enables debug logging to the console
       */
        debug: false

    };



  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */

    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Ensure the "javaxt-noselect" style rule is present in the document
        javaxt.dhtml.utils.addNoSelectRule();


      //Set store
        if (!config.eventStore) config.eventStore = new javaxt.dhtml.calendar.EventStore();



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


        var mainDiv = createElement("div", parent, config.style.panel);
        mainDiv.style.position = "relative";
        mainDiv.classList.add("javaxt-calendar");
        me.el = mainDiv;


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
  /** Used to update the view.
   */
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

                view = new classToLoad(me.el, config);
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
  /** Returns the current view.
   */
    this.getView = function(){
        return view;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;
    var createElement = javaxt.dhtml.utils.createElement;


    init();
};