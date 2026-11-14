(function(){
 const lines=["Okay, calculator brain!","That equation never stood a chance.","Math called. It wants a rematch.","Nice! Leave a few numbers for me.","You made that look suspiciously easy."];
 let timer,exitTimer,last=-1,original='';
 const dialog=document.getElementById('resultDialog'),emblem=document.getElementById('resultEmblem');
 function clear(){clearTimeout(timer);clearTimeout(exitTimer);if(emblem.querySelector('.mascot-reaction'))emblem.innerHTML=original;emblem.setAttribute('aria-hidden','true');}
 new MutationObserver(()=>{if(!dialog.open){clear();return;}clear();if(!emblem.classList.contains('celebrate'))return;original=emblem.innerHTML;let index=(last+1+Math.floor(Math.random()*(lines.length-1)))%lines.length;last=index;
 const card=document.createElement('div');card.className='mascot-reaction';card.setAttribute('role','status');const img=document.createElement('img');img.src='assets/math-mascot.svg';img.alt='';const bubble=document.createElement('span');bubble.textContent=lines[index];card.append(img,bubble);emblem.replaceChildren(card);emblem.removeAttribute('aria-hidden');
 timer=setTimeout(()=>{card.classList.add('leaving');exitTimer=setTimeout(()=>{emblem.innerHTML=original;emblem.setAttribute('aria-hidden','true');},250)},3500);
 }).observe(dialog,{attributes:true,attributeFilter:['open']});
})();