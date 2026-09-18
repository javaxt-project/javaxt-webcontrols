if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};
if(!javaxt.dhtml.calendar) javaxt.dhtml.calendar={};

//******************************************************************************
//**  Event Class
//*****************************************************************************/
/**
 *   Used to represent a calendar event.
 *
 ******************************************************************************/

javaxt.dhtml.calendar.Event = function(config) {

    var me = this;
    var defaultConfig = {
        id: null,
        subject: null,
        startDate: null,
        endDate: null,
        editable: false,
        style: {
            event: null,
            eventContinueLeft: null,
            eventContinueRight: null
        }
    };

    var id;
    var subject;
    var startDate, endDate;
    var editable;
    var style;
    var attr;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of an event. */

    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


        id = config.id;
        subject = config.subject;
        startDate = new Date(config.startDate);
        endDate = new Date(config.endDate);
        editable = config.editable;
        if (editable==true) editable = true;
        else editable = false;
        if (!style) style = {};
        style = config.style;


        attr = {};
        for (var key in config) {
            if (config.hasOwnProperty(key)) {

              //Skip the "known" keys (exposed via dedicated getters) and the
              //style config - these should not end up in attr/toJson/equals.
                switch(key) {
                    case 'id':
                    case 'subject':
                    case 'startDate':
                    case 'endDate':
                    case 'editable':
                    case 'style':
                        break;
                    default:
                        attr[key] = config[key];
                }

            }
        }
    };

    this.getID = function(){
        return id;
    };

    this.getSubject = function(){
        return subject;
    };

    this.getStartDate = function(){
        return new Date(startDate);
    };

    this.setStartDate = function(date){
        startDate = new Date(date);
    };

    this.getEndDate = function(){
        return new Date(endDate);
    };

    this.setEndDate = function(date){
        endDate = new Date(date);
    };

    this.numDays = function(){
        return Math.floor(javaxt.dhtml.calendar.utils.getDaysBetween(startDate, endDate));
    };

    this.isEditable = function(){
        return editable;
    };

    this.setEditable = function(b){
        editable = b;
    };


    this.setStyle = function(s){
        if (!s) s = {};
        style = s;
    };

    this.getStyle = function(){
        return style;
    };


    this.get = function(key){
        switch(key) {
            case 'subject':
                return getSubject();
                break;
            case 'startDate':
                return getStartDate();
                break;
            case 'endDate':
                return getEndDate();
                break;
            case 'editable':
                return isEditable();
                break;
            default:
                return attr[key];
        }
    };


    this.toJson = function(){
        var json = {};

      //Add all the original attributes
        for (var key in attr) {
            if (attr.hasOwnProperty(key)) {
                json[key] = attr[key];
            }
        }

      //Update JSON with values retrieved from public "get" and "is" methods
        for (var key in me) {
            if (me.hasOwnProperty(key)) {

                if (key.indexOf("get")==0 && key!="get"){

                  //Get function
                    var fn = me[key];

                  //Update key
                    key = key.substring(3,4).toLowerCase() + key.substring(4);
                    if (key=="iD") key = "id";

                  //Get value
                    var val = fn.apply(me, []);
                    if (val instanceof Date) {
                        val = getISOString(val);
                    }

                  //Update JSON
                    json[key] = val;
                }
                else if (key.indexOf("is")==0){
                    var fn = me[key];
                    key = key.substring(2,3).toLowerCase() + key.substring(3);
                    json[key] = fn.apply(me, []);
                }
            }
        }

        return json;
    };




    this.equals = function(event){

        var a = me.toJson();
        var b = event.toJson();
        for (var key in a) {
            if (a.hasOwnProperty(key)) {

              //Style does not affect event identity
                if (key=="style") continue;

                var x = a[key];
                var y = b[key];

                if (x==null && y!=null) return false;
                if (x!=null && y==null) return false;
                if (x!=null){
                    if (x instanceof Date){
                        if (!(y instanceof Date)) return false;
                        else{
                            x = x.getTime();
                            y = y.getTime();
                        }
                    }
                    //console.log(" -- " + x + " vs " + y + " (" + (x==y) + ")");
                    if (x!=y) return false;
                }


            }
        }
        return true;
    };


    this.createDiv = function(continueLeft, continueRight){


        var outerDiv = createElement('div');
        setStyle(outerDiv, style.event);
        addStyle(outerDiv, {
            height: "100%",
            position: "relative",
            overflow: "hidden"
        });
        if (continueLeft==true) addStyle(outerDiv, style.eventContinueLeft);
        if (continueRight==true) addStyle(outerDiv, style.eventContinueRight);
        if (continueLeft==true && continueRight==true) addStyle(outerDiv, {borderRadius: "0px"});

      //Structural marker used by the drag layer (see Utils.getInnerDiv)
        outerDiv.isCalEvent = true;


        var innerDiv = createElement('div', outerDiv, {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden"
        });
        innerDiv.innerHTML = me.getSubject();


        return outerDiv;
    };


    var getISOString = function(date) {
        function pad(n) {return n < 10 ? '0' + n : n;}
        return date.getUTCFullYear() + '-'
            + pad(date.getUTCMonth() + 1) + '-'
            + pad(date.getUTCDate()) + 'T'
            + pad(date.getUTCHours()) + ':'
            + pad(date.getUTCMinutes()) + ':'
            + pad(date.getUTCSeconds()) + 'Z';
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var createElement = javaxt.dhtml.utils.createElement;
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;
    var addStyle = javaxt.dhtml.utils.addStyle;


    init();
};