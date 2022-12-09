if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  WebSocket
//*****************************************************************************/
/**
 *   Used to communicate with a server using web sockets. Currently, this is a
 *   read-only listener designed to get updates and status messages from the
 *   server. The listener will automatically reconnect to the server if the
 *   network connnection is interrupted.
 *
 ******************************************************************************/

javaxt.dhtml.WebSocket = function(config) {

    var me = this;
    var defaultConfig = {

      /** Relative path the to websocket endpoint (e.g. "/updates"). You do not
       *  need to specify a full url with a "ws://" or "wss://" prefix.
       */
        url: "",

      /** Interval used to check whether the websocket is still alive and send
       *  pink messages. Value is in milliseconds. Default is 15000 (15 seconds).
       */
        keepAlive: 15000,


      /** Class used to debug the websocket. This config is not required to use
       *  this class. Implementations must implement an append() method.
       */
        debugr : {
            append: function(msg){
                //console.log(msg);
            }
        }
    };


    var socket;
    var timer;
    var connectionSuccess = false;


  //**************************************************************************
  //** init
  //**************************************************************************
    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        javaxt.dhtml.utils.merge(clone, config);


      //Merge clone with default config
        javaxt.dhtml.utils.merge(clone, defaultConfig);
        config = clone;


      //Update events handlers
        for (var key in config) {
            if (config.hasOwnProperty(key)){
                if (typeof config[key] == "function") {
                    if (me[key] && typeof me[key] == "function"){
                        me[key] = config[key];
                    }
                }
            }
        }



      //Get debugger
        var debugr = config.debugr;


      //Set url to websocket endpoint
        var protocol = window.location.protocol.toLowerCase();
        if (protocol.indexOf("https")===0) protocol = "wss";
        else protocol = "ws";
        var url = protocol + '://' + window.location.host;
        if (config.url.indexOf("/")!==0) url += "/";

        var path = config.url;
        if (path){
            var idx = path.indexOf("//");
            if (idx>=0){
                path = path.substring(idx+2);
                idx = path.indexOf("/");
                if (idx>-1) path = path.substring(idx+1);
            }
            url += path;
        }





        var connect = function(){
            var connectionStatusTimer;


            if (timer) clearInterval(timer);
            timer = setInterval(function() {
                if (socket){
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send('');
                    }
                    else if (socket.readyState === WebSocket.CLOSED){
                        connect();
                    }
                }
            }, config.keepAlive);


            socket = new WebSocket(url);
            socket.onopen = function(){
                debugr.append("onopen");

              //Update the connectionSuccess variable after a small delay. This
              //gives us a chance to see if the socket closes immediately after
              //open (see onclose)
                connectionStatusTimer = setTimeout(function(){
                    connectionSuccess = true;
                }, 500);


                me.onConnect();
            };


          //Handle messages sent by the server
            socket.onmessage = function(event) {
                connectionSuccess = true;
                var msg = event.data;
                debugr.append(msg);
                me.onMessage(msg);
            };


          //Reconnect on disconnect
            socket.onclose = function(event){
                debugr.append("onclose");
                debugr.append(event.code + ": " + event.reason);


                if (connectionSuccess){ //Reconnect!
                    connect();
                }
                else{ //Websocket failed!
                    debugr.append("Websocket failed");
                    socket = null;
                    clearTimeout(timer);
                    clearTimeout(connectionStatusTimer);
                    me.onFailure(event.code, event.reason);
                }
            };


            socket.onerror = function(){
                debugr.append("error!");
            };
        };



        connect();
    };


  //**************************************************************************
  //** onConnect
  //**************************************************************************
  /** Called whenever a websocket connection is established with the server.
   *  Note that this event will be fired whenever a connection is dropped and
   *  then restablished.
   */
    this.onConnect = function(){};


  //**************************************************************************
  //** onMessage
  //**************************************************************************
  /** Called whenever a message is recieved from the server.
   */
    this.onMessage = function(msg){};


  //**************************************************************************
  //** onFailure
  //**************************************************************************
  /** Called whenever there is a problem connecting or reconnecting to the
   *  server.
   */
    this.onFailure = function(code, reason){};


  //**************************************************************************
  //** stop
  //**************************************************************************
  /** Used to stop listening to events and close the websocket
   */
    this.stop = function(){
        connectionSuccess = false;
        if (timer) clearInterval(timer);
        if (socket) socket.close();
    };

    init();
};