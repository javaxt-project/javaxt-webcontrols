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
    var id;
    var subject;
    var startDate, endDate;
    var editable;
    var attr;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of an event. */

    var init = function(){
        id = config.id;
        subject = config.subject;
        startDate = new Date(config.startDate);
        endDate = new Date(config.endDate);
        editable = config.editable;
        if (editable==true) editable = true;
        else editable = false;
        
        attr = {};
        for (var key in config) {
            if (config.hasOwnProperty(key)) {

                switch(key) {
                    case 'subject', 'startDate', 'endDate', 'editable':
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
        return Math.floor(javaxt.dhtml.calendar.Utils.getDaysBetween(startDate, endDate));
    };

    this.isEditable = function(){
        return editable;
    };
    
    this.setEditable = function(b){
        editable = b;
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
        for (var key in me) {
            if (me.hasOwnProperty(key)) {
                if (key.indexOf("get")==0){
                    var fn = me[key];
                    json[key.substring(3)] = fn.apply(me, []);
                }
                else if (key.indexOf("is")==0){
                    var fn = me[key];
                    json[key.substring(2)] = fn.apply(me, []);
                }
            }
        }
        
        
        
//        for (var key in attr) {
//            if (attr.hasOwnProperty(key)) {
//                json[key] = attr[key];
//            }   
//        }
        
        return json;
    };

    this.equals = function(event){

        var a = me.toJson();
        var b = event.toJson();
        for (var key in a) {
            if (a.hasOwnProperty(key)) {

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
        

        var outerDiv = document.createElement('div');
        outerDiv.className = "javaxt-cal-event" + 
            (continueLeft==true? " javaxt-cal-event-continue-left" : "") + 
            (continueRight==true? " javaxt-cal-event-continue-right" : "");
        outerDiv.style.height = "100%";
        outerDiv.style.position = "relative";
        outerDiv.style.overflow = "hidden";
        
        
        var innerDiv = document.createElement('div');
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.overflow = "hidden";
        innerDiv.innerHTML = me.getSubject();
        
        
        outerDiv.appendChild(innerDiv);        
        
        
        return outerDiv;
    };

    init();
};