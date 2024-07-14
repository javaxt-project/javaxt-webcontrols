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
 <pre>
    var ws = new javaxt.dhtml.WebSocket({
        url: "/live/stats",
        onMessage: function(msg){
            console.log(msg);
        }
    });

    var logout = function(){
        ws.stop(); //stop listening to events and disconnect from the server
    };
 </pre>
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
       *  ping messages. Value is in milliseconds. Default is 15000 (1.5 seconds).
       */
        keepAlive: 15000,

      /** Message to send to the server. This message is periodically sent to
       *  the server to test whether it is still alive. See keepAlive config.
       */
        pingMessage: "",

      /** Max amount of time to wait for the websocket to reconnect with the
       *  server after a disconnect. Value is in milliseconds. Default is
       *  300000 (5 minutes).
       */
        timeout: 5*60*1000,


      /** Class used to debug the websocket. This config is not required to use
       *  this class. Implementations must implement an append() method.
       */
        debugr : {
            append: function(msg){
                //console.log(msg);
            }
        }
    };


    var url;
    var socket;
    var timer;
    var connectionSuccess = false;
    var connectionStartTime, connectionEndTime;


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



      //Set url to websocket endpoint
        var protocol = window.location.protocol.toLowerCase();
        if (protocol.indexOf("https")===0) protocol = "wss";
        else protocol = "ws";
        url = protocol + '://' + window.location.host;
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


        connect();
    };


  //**************************************************************************
  //** connect
  //**************************************************************************
    var connect = function(){
        var connectionStatusTimer;
        var debugr = config.debugr;


        if (timer) clearInterval(timer);
        timer = setInterval(function() {
            if (socket){
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(config.pingMessage);
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
                connectionStartTime = new Date().getTime();
                connectionEndTime = 0;
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

          //Record timestamp of the disconnect
            if (!connectionEndTime) connectionEndTime = new Date().getTime();


          //Try to reconnect
            if (connectionSuccess){ //Reconnect!
                if ((new Date().getTime()-connectionEndTime)<config.timeout){
                    me.onDisconnect();
                    connect();
                }
                else{ //Hang up...
                    me.stop();
                    clearTimeout(connectionStatusTimer);
                    me.onTimeout();
                    me.onDisconnect();
                }
            }
            else{ //Websocket failed!
                debugr.append("Websocket failed");
                socket = null;
                clearTimeout(timer);
                clearTimeout(connectionStatusTimer);
                me.onFailure(event.code, event.reason);
                me.onDisconnect();
            }
        };


        socket.onerror = function(){
            debugr.append("error!");
        };
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
  //** onDisconnect
  //**************************************************************************
  /** Called whenever a websocket connection is closed or severed.
   */
    this.onDisconnect = function(){};


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
  //** onTimeout
  //**************************************************************************
  /** Called when a websocket is disconnected from the server for an extended
   *  period of time. See timeout config.
   */
    this.onTimeout = function(){};


  //**************************************************************************
  //** start
  //**************************************************************************
  /** Used to open a websocket connection to the server and start listening to
   *  events. Note that the websocket listener is started automatically when
   *  this class is first initialized. This method is only intended to be used
   *  after calling stop().
   */
    this.start = function(){
        if (socket) return;
        connect();
    };


  //**************************************************************************
  //** stop
  //**************************************************************************
  /** Used to stop listening to events and close the websocket
   */
    this.stop = function(){
        connectionSuccess = false;
        if (timer) clearInterval(timer);
        if (socket){
            socket.close();
            socket = null;
        }
    };


  //**************************************************************************
  //** send
  //**************************************************************************
  /** Used to send a message to the server via the websocket.
   */
    this.send = function(message){
        if (socket){
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            }
            else if (socket.readyState === WebSocket.CLOSED){
                //Maybe queue the messages and send on reconnect?
            }
        }
    };


    init();
};