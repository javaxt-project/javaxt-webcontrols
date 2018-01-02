if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  Http Authentication
//*****************************************************************************/
/**
 *   Used to perform BASIC HTTP authentication using a technique outlined in 
 *   the following article: 
 *   http://www.javaxt.com/Tutorials/Javascript/Form_Based_HTTP_Authentication
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
        request.send(null);

      //Process Response
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

            var request1 = new XMLHttpRequest();
            var request2 = new XMLHttpRequest();

          //Logout. Tell the server not to return the "WWW-Authenticate" header
            request1.open("GET", logoutURL + "?prompt=false", true);
            request1.send("");
            request1.onreadystatechange = function(){
                if (request1.readyState === 4) {

                  //Login with dummy credentials to clear the auth cache
                    request2.open("GET", loginURL, true, "logout", "logout");
                    request2.send("");

                    request2.onreadystatechange = function(){
                        if (request2.readyState === 4) {
                            if (callback!=null) callback.call();
                        }
                    };

                }
            };
        }
    };
};