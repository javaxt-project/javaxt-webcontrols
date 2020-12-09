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
        onMessage : function(msg){},
        url: ""
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





//        config.onMessage(lastMessage);



        var start = function(){
            socket = new WebSocket(url);

            socket.onopen = function(){
                connectionSuccess = true;
                keepAlive();

                config.onConnect();


//              //The following can be used to test WebSocket failures
//                var testFallback = false;
//                if (testFallback){
//                    connectionSuccess = false;
//                    socket.close();
//                    me.stop();
//                }
            };


          //Handle messages sent by the server
            socket.onmessage = function(event) {
                var msg = event.data;
                debugr.append(msg);
                lastMessage = msg;
                config.onMessage(msg);
            };


          //Reconnect on disconnect
            socket.onclose = function(event){
                debugr.append("onclose!");
                debugr.append(event.code);

                if (keepAliveTimer) clearTimeout(keepAliveTimer);
                if (connectionSuccess){
                    if (timer) check(); //Reconnect on disconnect
                }
                else{ //Websocket failed! Fallback to HTTP polling for status updates
                    debugr.append("Websocket failed");
                    socket = null;
                    clearTimeout(timer);

                    if (config.fallback){
//                        statusTimer = setTimeout(function(){
//                            config.onConnect();
//                        }, 2000);
//
//
//                      //Periodically check job status
//                        var checkStatus = function(){
//
//                            get(config.fallback, {
//                                success : function(text){
//                                    var json = JSON.parse(text);
//                                    var status = json.status;
//                                    if (status==="pending" || status==="running"){
//                                        var message = status;
//                                        var messages = json.messages;
//                                        if (messages.length>0) message = messages[messages.length-1];
//                                        config.onMessage(message);
//                                        timer = setTimeout(checkStatus, 250);
//                                    }
//                                    else{
//                                        config.onMessage(status);
//                                        me.stop();
//                                        config.onComplete();
//                                    }
//                                },
//                                failure: function(response){
//                                    me.stop();
//                                    alert(response);
//                                    //config.onError(response);
//                                }
//                            });
//
//                        };
//                        timer = setTimeout(checkStatus, 1000);
                    }
                }
            };


            socket.onerror = function(){
                debugr.append("error!");
            };
        };





        function check(){
//            if (lastMessage.indexOf("---")===0) return;
            if (!socket || socket.readyState === WebSocket.CLOSED) start();
        }

        start();

        timer = setInterval(check, 15000);
    };


  //**************************************************************************
  //** stop
  //**************************************************************************
    this.stop = function(){
        if (socket) socket.close();
        if (timer) clearInterval(timer);
        if (keepAliveTimer) clearTimeout(keepAliveTimer);
        if (statusTimer) clearTimeout(statusTimer);
    };

    init();
};