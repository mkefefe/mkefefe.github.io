(async function(){
  const progress=(value,text)=>{document.getElementById('loadFill').style.width=value+'%';document.querySelector('.loading-track').setAttribute('aria-valuenow',value);document.getElementById('loadText').textContent=text;};
  try {
    await window.DailyPlatform.initialize();progress(15,'Getting your game ready…');
    await window.DailyStorage.initialize();progress(25,'Finding your progress…');
    document.body.prepend(document.getElementById('gameTemplate').content.cloneNode(true));
    // English is the supported language; use it for every other platform locale.
    const locale=window.DailyPlatform.language();
    document.documentElement.lang=locale==='en'?'en':'en';
    let loaded=0;
    for(const path of ['assets/problems.js','assets/extra-problems.js','teaching-steps.js','teaching-hints.js','online-scores.js','celebration.js','age-challenge.js','game.js','mascot.js']){
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=path+'?v=desktop-67';s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});
      progress(25+(++loaded/9)*70,'Getting the questions ready…');
    }
    progress(100,'Ready!');
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById('loadingScreen').hidden=true));
  } catch(error) {
    document.getElementById('loadText').textContent='Could not load the game. Please try again.';document.getElementById('loadRetry').hidden=false;
    console.error('Daily Math startup failed',error);
  }
})();



