if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  PlayControl
//******************************************************************************
/**
 *   Used to render a slider that can be used a part of a audio or video
 *   controller. This class builds upon the javaxt.dhtml.Slider class by
 *   providing basic functions like play, pause, and stop. However, this class
 *   does not provide any buttons or any other components to perform these
 *   operations - this is just a fancy slider :-) Users can interact with the
 *   slider while its running and get back elapsed time.
 *
 ******************************************************************************/

javaxt.dhtml.PlayControl = function(parent, config) {
    this.className = "javaxt.dhtml.PlayControl";

    var me = this;
    var slider;
    var playing = false;
    var timerId;
    var loop = false;

    var defaultConfig = {

      /** Used to specify the start time, in seconds. Default is 0.
       */
        startTime: 0,


      /** Refresh rate, in seconds. Default is 0.2.
       */
        speed: 0.2,


      /** Used to specify the total run time, in seconds. Default is 60.
       */
        totalTime: 60,


      /** Style for individual elements within the component. Uses the style
       *  defined in the javaxt.dhtml.Slider class by default.
       */
        style: {
            groove: {},
            handle: {}
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;

        var fireEvents = false;

        slider = new javaxt.dhtml.Slider(parent, config);

        slider.onChange = function(){
            if (fireEvents){
                me.onChange(me.getElapsedTime());
            }
        };

        slider.onDrag = function(){
            var resume = playing;
            if (playing) me.pause();
            if (resume) me.play(loop);
        };


        slider.onRender = function(){
            me.setElapsedTime(config.startTime);
            fireEvents = true;
        };
    };


  //**************************************************************************
  //** setRunTime
  //**************************************************************************
  /** Used to update the total run time. This value is originally set in the
   *  config settings (see totalTime).
   *  @param runTime Total run time, in seconds
   */
    this.setRunTime = function(runTime){
        if (runTime===config.totalTime) return;
        var resume = false;
        if (playing){
            me.pause();
            resume = true;
        }
        config.totalTime = runTime;
        if (resume) me.play();
    };


  //**************************************************************************
  //** play
  //**************************************************************************
  /** Used to start the player
   */
    this.play = function(_loop){
        if (playing===true) return;


        if (_loop===true) loop = true;
        else loop = false;


        playing = true;
        var startDate = new Date().getTime();
        var currVal = slider.getPosition();
        if (currVal>0){
            startDate = startDate - ((currVal/slider.getWidth()) * config.totalTime)*1000;
        }

        timerId = setInterval(function(){
            var w = slider.getWidth();
            var elapsedTime = (new Date().getTime()-startDate)/1000;
            var percentComplete = elapsedTime/config.totalTime;
            var nextVal = w*percentComplete; //Math.ceil


            if (nextVal>=w){
                if (loop===true){
                    me.onEnd();
                    slider.setValue(0);
                    startDate = new Date().getTime();
                }
                else{
                    slider.setValue(w);
                    me.pause();
                    me.onEnd();
                }
            }
            else{
                slider.setValue(nextVal);
            }

        }, config.speed*1000);

    };


  //**************************************************************************
  //** pause
  //**************************************************************************
  /** Used to pause the player.
   */
    this.pause = function(){
        clearInterval(timerId);
        playing = false;
    };


  //**************************************************************************
  //** stop
  //**************************************************************************
  /** Used to stop the player and set the start time to 0 seconds.
   */
    this.stop = function(){
        me.pause();
        slider.setValue(0);
    };


  //**************************************************************************
  //** isPlaying
  //**************************************************************************
  /** Returns true if the player is playing.
   */
    this.isPlaying = function(){
        return playing;
    };


  //**************************************************************************
  //** getElapsedTime
  //**************************************************************************
    this.getElapsedTime = function(){
        return (slider.getPosition()/slider.getWidth()) * config.totalTime;
    };


  //**************************************************************************
  //** setElapsedTime
  //**************************************************************************
  /** Used to update the elapsed time time.
   *  @param elapsedTime Time in seconds
   */
    this.setElapsedTime = function(elapsedTime){
        if (elapsedTime==null || elapsedTime<0) return;


        var w = slider.getWidth();
        var x = Math.ceil((elapsedTime/config.totalTime)*w);


        if (x>w) x = 0;


        slider.setValue(x);
    };


  //**************************************************************************
  //** onChange
  //**************************************************************************
  /** Called whenever the player is updated.
   */
    this.onChange = function(elapsedTime){};


  //**************************************************************************
  //** onEnd
  //**************************************************************************
  /** Called whenever the elapsed time equals the total run time.
   */
    this.onEnd = function(){};


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var merge = javaxt.dhtml.utils.merge;


    init();
};