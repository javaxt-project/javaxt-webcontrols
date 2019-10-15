if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  DataStore
//*****************************************************************************/
/**
 *   Simple data store used to manage records and broadcast updates
 *
 ******************************************************************************/

javaxt.dhtml.DataStore = function(data) {

    var me = this;
    var listeners = {};
    var records = [];

    this.length = 0;


    var init = function(){
        if (isArray(data)){
            records = data;
            me.length = records.length;
        }
    };

    this.addEventListener = function(name, fn, scope){
        if (!fn) return;
        var listener = {
            fn: fn,
            scope: scope
        };
        if (listeners[name]){
            listeners[name].push(listener);
        }
        else{
            listeners[name]=[listener];
        }
    };

    var fireEvent = function(name, ret){
        if (listeners[name]){
            var arr = listeners[name];
            for (var i=0; i<arr.length; i++){
                var listener = arr[i];
                listener.fn.apply(listener.scope, isArray(ret) ? ret : [ret]);
            }
        }
    };

    this.push = function(record){
        me.add(record);
    };

    this.add = function(record){
        records.push(record);
        me.length = records.length;
        fireEvent("add", record);
    };

    this.pop = function(record){
        var obj = records.pop(record);
        me.length = records.length;
        fireEvent("remove", obj);
    };

    this.remove = function(record){
        for (var i=0; i<records.length; i++){
            if (records[i]===record){
                me.removeAt(i);
                break;
            }
        }
    };

    this.removeAt = function(idx){
        me.splice(idx, 1);
    };

    this.splice = function(idx, numRecords){
        var arr = records.splice(idx, numRecords);
        me.length = records.length;
        fireEvent("remove", arr);
    };

    this.get = function(idx){
        return records[idx];
    };

    this.set = function(idx, record){
        var orgRecord = records[idx];
        records[idx] = record;
        fireEvent("update", [record, orgRecord]);
    };



    var isArray = javaxt.dhtml.utils.isArray;

    init();
};