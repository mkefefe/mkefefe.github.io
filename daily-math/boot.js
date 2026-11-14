(async function(){
  try {
    await window.DailyPlatform.initialize();
    await window.DailyStorage.initialize();
    document.body.prepend(document.getElementById('gameTemplate').content.cloneNode(true));
    // English is the supported language; use it for every other platform locale.
    const locale=window.DailyPlatform.language();
    document.documentElement.lang=locale==='en'?'en':'en';
    for(const path of ['assets/problems.js','assets/extra-problems.js','teaching-steps.js','teaching-hints.js','online-scores.js','celebration.js','age-challenge.js','game.js']){
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=path+'?v=desktop-60';s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});
    }
  } catch(error) {
    (document.getElementById('board')||document.body).textContent='Could not load Daily Math. Please reload.';
    console.error('Daily Math startup failed',error);
  }
})();


