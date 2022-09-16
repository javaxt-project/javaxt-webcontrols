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
        onConnect : function(){},
        onFailure : function(code, reason){},
        onMessage : function(msg){},
        url: "",
        debugr : {
            append: function(msg){
                //console.log(msg);
            }
        }
    };


    var socket;
    var timer, keepAliveTimer;
    var statusTimer, lastMessage;
    var connectionSuccess = false;
    var debugr = {
        append: function(msg){
            //console.log(msg);
        }
    };


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


        var debugr = config.debugr;


        var protocol = window.location.protocol.toLowerCase();
        if (protocol.indexOf("https")===0) protocol = "wss";
        else protocol = "ws";
        var url = protocol + '://' + window.location.host;
        if (config.url.indexOf("/")!=0) url += "/";
        url += config.url;



        var keepAlive = function() {
            var timeout = 20000;
            if (socket.readyState == socket.OPEN) {
                socket.send('');
            }
            keepAliveTimer = setTimeout(keepAlive, timeout);
        };





        var start = function(){
            connectionSuccess = false;
            var connectionStatusTimer;

            socket = new WebSocket(url);

            socket.onopen = function(){
                debugr.append("onopen");

              //Update the connectionSuccess variable after a small delay. This
              //gives us a chance to see if the socket closes immediately after
              //open (see onclose)
                connectionStatusTimer = setTimeout(function(){
                    connectionSuccess = true;
                }, 500);

                keepAlive();

                config.onConnect();
            };


          //Handle messages sent by the server
            socket.onmessage = function(event) {
                connectionSuccess = true;
                var msg = event.data;
                debugr.append(msg);
                lastMessage = msg;
                config.onMessage(msg);
            };


          //Reconnect on disconnect
            socket.onclose = function(event){
                debugr.append("onclose");
                debugr.append(event.code + ": " + event.reason);

                if (keepAliveTimer) clearTimeout(keepAliveTimer);
                if (connectionSuccess){
                    if (timer) check(); //Reconnect on disconnect
                }
                else{ //Websocket failed!
                    debugr.append("Websocket failed");
                    socket = null;
                    clearTimeout(timer);
                    clearTimeout(connectionStatusTimer);
                    config.onFailure(event.code, event.reason);
                }
            };


            socket.onerror = function(){
                debugr.append("error!");
            };
        };



        function check(){
            if (!socket || socket.readyState === WebSocket.CLOSED) start();
        }

        start();

        timer = setInterval(check, 15000);
    };


  //**************************************************************************
  //** stop
  //**************************************************************************
    this.stop = function(){
        connectionSuccess = false;
        if (timer) clearInterval(timer);
        if (keepAliveTimer) clearTimeout(keepAliveTimer);
        if (statusTimer) clearTimeout(statusTimer);
        if (socket) socket.close();
    };

    init();
};