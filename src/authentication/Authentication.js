if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Http Authentication
//*****************************************************************************/
/**
 *   Used to perform BASIC HTTP authentication
 *
 ******************************************************************************/

javaxt.dhtml.Authentication = function(loginURL, logoutURL) {

    var userAgent = navigator.userAgent.toLowerCase();

  //**************************************************************************
  //** login
  //*************************************************************************/
  /**  Used to execute an http get request to login a user.
   */
    this.login = function(username, password, callback){

        var logoff = this.logoff;

      //Instantiate HTTP Request
        var request = ((window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
        request.open("GET", loginURL, true, username, password);
        request.setRequestHeader("Cache-Control", "no-cache, no-transform");
        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status !== 200){
                    if (navigator.userAgent.toLowerCase().indexOf("firefox") != -1){
                        logoff();
                    }
                }
                if (callback!=null) callback.call(request);
            }
        };
        request.send(null);
    };


  //**************************************************************************
  //** logoff
  //*************************************************************************/
  /**  Used to execute an http get request to clear the http auth.
   */
    this.logoff = function(callback){

        if (userAgent.indexOf("msie") != -1) {
            document.execCommand("ClearAuthenticationCache");
            if (callback!=null) callback.call();
        }
        else{

          //Logout. Tell the server not to return the "WWW-Authenticate" header
            var request = new XMLHttpRequest();
            request.open("GET", logoutURL + "?prompt=false", true);
            request.setRequestHeader("Cache-Control", "no-cache, no-transform");
            request.onreadystatechange = function(){
                if (request.readyState === 4) {

                  //Login with dummy credentials to clear the auth cache
                    var request2 = new XMLHttpRequest();
                    request2.open("GET", loginURL, true, "logout", "logout");
                    request2.setRequestHeader("Cache-Control", "no-cache, no-transform");
                    request2.onreadystatechange = function(){
                        if (request2.readyState === 4) {
                            if (callback!=null) callback.call();
                        }
                    };
                    request2.send("");

                }
            };
            request.send("");
        }
    };
};