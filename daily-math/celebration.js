/* Prerecorded CC0 feedback clips. Attribution and provenance: assets/audio-licenses/.
 * Caller checks the game's Effects setting before invoking these helpers.
 * playCorrectCelebration(audioCtx) retains the old call signature; the argument
 * is intentionally unused. This module plays MP3 files through HTMLAudio only.
 */
(function(root){
  'use strict';
  const scriptUrl=root.document?.currentScript?.src;
  const base=scriptUrl||root.document?.baseURI||root.location?.href;
  const specs={
    correct:{file:'correct-chime.mp3',volume:.68,voices:1},
    tap:{file:'tap.mp3',volume:.65,voices:3},
    wrong:{file:'wrong.mp3',volume:.58,voices:1}
  };
  const pools=new Map();
  let enabled=true;
  function stopVoice(voice){
    try{voice.pause();voice.currentTime=0;}catch{}
  }
  function stopDailyFeedback(){for(const pool of pools.values())for(const voice of pool)stopVoice(voice);}
  function play(kind){
    if(!enabled||root.document?.hidden||root.DailyPlatform?.audioAllowed?.()===false||typeof root.Audio!=='function')return null;
    try{
      const spec=specs[kind];let pool=pools.get(kind);
      if(!pool){pool=[];pools.set(kind,pool);}
      let voice=pool.find(item=>item.paused||item.ended);
      if(!voice&&pool.length<spec.voices){
        voice=new root.Audio(new URL('assets/'+spec.file,base).href);
        voice.preload='auto';voice.volume=spec.volume;pool.push(voice);
      }
      if(!voice){voice=pool.shift();stopVoice(voice);pool.push(voice);}
      voice.currentTime=0;
      const result=voice.play();
      if(result&&typeof result.catch==='function')result.catch(()=>{});
      return {stop:()=>stopVoice(voice)};
    }catch{return null;}
  }
  root.playCorrectCelebration=function(_audioCtx){return play('correct');};
  root.playTapFeedback=function(){return play('tap');};
  root.playWrongFeedback=function(){return play('wrong');};
  root.stopDailyFeedback=stopDailyFeedback;
  root.DailyFeedback=Object.freeze({
    setEnabled(value){enabled=!!value;if(!enabled)stopDailyFeedback();},
    stop:stopDailyFeedback
  });
  root.document?.addEventListener?.('visibilitychange',()=>{if(root.document.hidden)stopDailyFeedback();});
})(typeof window!=='undefined'?window:globalThis);
