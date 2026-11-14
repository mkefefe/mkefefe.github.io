/* Static worked examples. Independent of answers and safe to load before game.js. */
var improvedTeachingSteps = (() => {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const line = (...rows) => `<div class="math-line">${rows.map(row=>`<div>${row}</div>`).join('')}</div>`;
  const fraction = (top,bottom) => `<span class="fraction"><span>${top}</span><span>${bottom}</span></span>`;
  const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
  const rational=(n,d=1)=>{if(!d)throw Error('Zero denominator');const g=gcd(n,d);n/=g;d/=g;if(d<0){n=-n;d=-d}return d===1?String(n):`${n}/${d}`};
  const display=value=>String(value).includes('/')?fraction(...String(value).split('/')):esc(value);
  const signed=(a,b)=>`${a} ${b<0?'−':'+'} ${Math.abs(b)}`;
  const term=(a,letter='x')=>a===1?letter:a===-1?'−'+letter:`${a}${letter}`;
  const twoTerms=(a,b)=>`${term(a)} ${b<0?'−':'+'} ${term(Math.abs(b),'y')}`;
  const card=(html,label,result)=>({html,label,...(result!==undefined?{result:String(result)}:{})});
  const eq=(left,right,operation,outLeft,outRight)=>`<div class="equation-working"><span>${left}</span><span>=</span><span>${right}</span><span class="operation">${operation}</span><span></span><span class="operation">${operation}</span><span class="working-result">${outLeft}</span><span>=</span><span class="working-result">${outRight}</span></div>`;
  const systemLayout=html=>html.replaceAll('class="equation-working"','class="equation-working systems-working" style="grid-template-columns:minmax(0,2fr) 20px minmax(0,1fr);font-size:20px"').replaceAll('class="operation"','class="operation" style="font-size:18px"');
  const subtract=(b)=>b<0?`+ ${-b}`:`− ${b}`;
  const divide=(a,total)=>card(`<div class="equation-working division-working"><span>${fraction(term(a),a)}</span><span>=</span><span>${fraction(total,a)}</span></div><div class="solution-line">x = ${display(rational(total,a))}</div>`,`Divide both sides by ${a}; the multiplier of x becomes 1.`,rational(total,a));
  return function improvedTeachingSteps(p){
    if(!p||typeof p.q!=='string')return null;
    const q=p.q.replaceAll('−','-'),topic=p.topic;
    let m;
    if(!topic&&p.level===0){
      m=q.match(/^(\d+) ([+-]) (\d+) = \?$/);if(!m)return null;
      const a=+m[1],b=+m[3],plus=m[2]==='+',symbol=plus?'+':'−',result=plus?a+b:a-b;
      const total=plus?result:a;
      if(total<=20&&result>=0){
        let dots='';
        for(let i=0;i<total;i++){
          const removed=!plus&&i>=result,fill=removed?'#d2d9e2':plus&&i>=a?'#ffdb43':'#54c7ee';
          dots+=`<circle cx="${30+(i%10)*28}" cy="${22+Math.floor(i/10)*27}" r="8" fill="${fill}" stroke="${removed?'#a9b3bf':'#24364d'}" stroke-width="1.5"${removed?' class="taken-away"':''}/>`;
        }
        const picture=total?`<svg class="arithmetic-working" viewBox="0 0 320 ${total>10?68:42}" width="320" height="${total>10?68:42}" role="img" aria-label="${plus?`${a} blue dots and ${b} yellow dots make ${result}`:`${b} of ${a} dots are gray and taken away; ${result} blue dots remain`}" style="display:block;width:100%;max-width:320px;margin:auto">${dots}</svg>`:'';
        return [card(picture+line(`${a} ${symbol} ${b} = <span class="ink">${result}</span>`),plus?'Count the blue and yellow dots together.':`Take away ${b} ${b===1?'dot':'dots'}. ${result} blue ${result===1?'dot remains':'dots remain'}.`,result)];
      }
      const tens=Math.floor(b/10)*10,ones=b%10;
      if(tens&&ones){
        const middle=plus?a+tens:a-tens;
        return [card(line(`${a} ${symbol} ${b}`,`${a} ${symbol} <span class="ink">${tens}</span> ${symbol} <span class="ink">${ones}</span>`),`Split ${b} into ${tens} and ${ones}.`),card(`<div class="equation-working"><span>${a} ${symbol} ${tens}</span><span>=</span><span>${middle}</span><span>${middle} ${symbol} ${ones}</span><span>=</span><span class="ink">${result}</span></div>`,plus?`Add ${tens}, then add ${ones}.`:`Take away ${tens}, then take away ${ones}.`,result)];
      }
      const label=tens?`Count ${plus?'forward':'back'} by 10, ${tens/10} ${tens===10?'time':'times'}.`:`Count ${plus?'forward':'back'} ${b} ${b===1?'space':'spaces'} from ${a}.`;
      return [card(line(`${a} ${symbol} ${b} = <span class="ink">${result}</span>`),label,result)];
    }
    if(topic==='median'){
      m=q.match(/^Find the median of ([\d, .-]+)\?$/);if(!m)return null;
      const values=m[1].split(',').map(Number).sort((a,b)=>a-b);if(!values.length||!values.every(Number.isFinite))return null;
      const middle=Math.floor(values.length/2),even=values.length%2===0;
      const ordered=values.map((v,i)=>(i===middle||(even&&i===middle-1))?`<span class="ink">${v}</span>`:String(v)).join(', ');
      const answer=even?rational(values[middle-1]+values[middle],2):String(values[middle]);
      return [card(line(ordered),'Put the values in order. The blue value'+(even?'s are':' is')+' in the middle.'),card(line(even?`${fraction(`${values[middle-1]} + ${values[middle]}`,2)} = ${display(answer)}`:`Median = ${answer}`),even?'With two middle values, add them and divide by 2.':'With one middle value, that value is the median.',answer)];
    }
    if(topic==='order-of-operations'){
      if(m=q.match(/^\((\d+) \+ (\d+)\)² - (\d+) = \?$/)){
        const [,a,b,c]=m.map(Number),sum=a+b,square=sum*sum,result=square-c;
        return [card(line(`(<span class="ink">${a} + ${b}</span>)² − ${c}`,`${sum}² − ${c}`),'Add inside the brackets first.'),card(line(`${sum} × ${sum} − ${c}`,`${square} − ${c} = <span class="ink">${result}</span>`),'Square the bracket result, then subtract.',result)];
      }
      if(m=q.match(/^(\d+) × \((\d+) \+ (\d+)\) - (\d+) = \?$/)){
        const [,a,b,c,d]=m.map(Number),sum=b+c,product=a*sum,result=product-d;
        return [card(line(`${a} × (<span class="ink">${b} + ${c}</span>) − ${d}`,`${a} × ${sum} − ${d}`),'Add inside the brackets first.'),card(line(`${product} − ${d} = <span class="ink">${result}</span>`),'Multiply before subtracting.',result)];
      }
      return null;
    }
    if(topic==='decimals'){
      m=q.match(/^(\d+)\.(\d{2}) \+ (\d+)\.(\d{2}) = \?$/);if(!m)return null;
      const a=Number(m[1])*100+Number(m[2]),b=Number(m[3])*100+Number(m[4]),result=((a+b)/100).toFixed(2);
      const digits=result.length-3;
      // Fixed-width digits keep the hundredths, tenths and decimal points aligned.
      const row=(sign,value,border=false)=>`<div style="${border?'border-top:2px solid #98aabb;':''}display:grid;grid-template-columns:1ch ${digits}ch 1ch 2ch;column-gap:0"><span>${sign}</span><span style="text-align:right">${value.split('.')[0]}</span><span>.</span><span>${value.split('.')[1]}</span></div>`;
      return [card(`<div role="img" aria-label="${esc(`${m[1]}.${m[2]} plus ${m[3]}.${m[4]} equals ${result}, aligned by decimal point`)}" style="display:inline-block;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;line-height:1.5">${row('',`${m[1]}.${m[2]}`)}${row('+',`${m[3]}.${m[4]}`)}${row('',result,true)}</div>`,'Line up the decimal points. Add from the right, carrying when needed.',result)];
    }
    if(topic==='bracket-equations'){
      m=q.match(/^Solve (-?\d+)\(x ([+-]) (\d+)\) = (-?\d+)\?$/);if(!m)return null;
      const a=Number(m[1]),b=Number(m[3])*(m[2]==='-'?-1:1),total=Number(m[4]);if(!a||total%a)return null;
      const divided=total/a,result=divided-b;
      return [card(`<div class="equation-working division-working"><span>${fraction(`${a}(${signed('x',b)})`,a)}</span><span>=</span><span>${fraction(total,a)}</span><span class="working-result">${signed('x',b)}</span><span>=</span><span class="working-result">${divided}</span></div>`,`Divide both sides by ${a} to remove the multiplier outside the brackets.`),card(eq(signed('x',b),divided,subtract(b),'x',result),`${b<0?'Add':'Subtract'} ${Math.abs(b)} on both sides to leave x alone.`,result)];
    }
    if(topic==='linear-both-sides'){
      m=q.match(/^Solve (-?\d+)x ([+-]) (\d+) = (-?\d+)x ([+-]) (\d+)\?$/);if(!m)return null;
      const a=+m[1],b=+m[3]*(m[2]==='-'?-1:1),c=+m[4],d=+m[6]*(m[5]==='-'?-1:1),coef=a-c;if(!coef)return null;
      return [card(eq(signed(term(a),b),signed(term(c),d),`${c<0?'+':'−'} ${term(Math.abs(c))}`,signed(term(coef),b),d),`Subtract the same ${term(c)} term from both sides.`),card(eq(signed(term(coef),b),d,subtract(b),term(coef),d-b),`${b<0?'Add':'Subtract'} ${Math.abs(b)} on both sides.`),divide(coef,d-b)];
    }
    if(topic==='fraction-equations'){
      m=q.match(/^Solve \((-?\d+)x ([+-]) (\d+)\) \/ (\d+) = (-?\d+)(?:\/(\d+))?\?$/);if(!m)return null;
      const a=+m[1],b=+m[3]*(m[2]==='-'?-1:1),den=+m[4],num=+m[5],rhsDen=+(m[6]||1);if(!a||!den||!rhsDen||den*num%rhsDen)return null;
      const total=den*num/rhsDen,rhs=display(rational(num,rhsDen));
      return [card(eq(fraction(signed(term(a),b),den),rhs,`× ${den}`,signed(term(a),b),total),`Multiply both sides by ${den} to undo the fraction bar.`),card(eq(signed(term(a),b),total,subtract(b),term(a),total-b),`${b<0?'Add':'Subtract'} ${Math.abs(b)} on both sides.`),divide(a,total-b)];
    }
    if(topic==='two-variable-substitution'){
      m=q.match(/^(-?\d+)x ([+-]) (\d+)y = (-?\d+), and y = (-?\d+)\. Find x\?$/);if(!m)return null;
      const a=+m[1],b=+m[3]*(m[2]==='-'?-1:1),total=+m[4],y=+m[5],known=b*y;if(!a)return null;
      return [card(line(`${term(a)} ${b<0?'−':'+'} (${Math.abs(b)} × ${y<0?'('+y+')':y}) = ${total}`,`${signed(term(a),known)} = ${total}`),`Replace y with ${y}, then multiply inside the brackets.`),card(eq(signed(term(a),known),total,subtract(known),term(a),total-known),`${known<0?'Add':'Subtract'} ${Math.abs(known)} on both sides.`),divide(a,total-known)];
    }
    if(topic==='general-systems'){
      m=q.match(/^(-?\d+)x ([+-]) (\d+)y = (-?\d+); (-?\d+)x ([+-]) (\d+)y = (-?\d+)\. Find x\?$/);if(!m)return null;
      const a=+m[1],b=+m[3]*(m[2]==='-'?-1:1),u=+m[4],c=+m[5],d=+m[7]*(m[6]==='-'?-1:1),v=+m[8];if(!b||!d||a*d===b*c)return null;
      const g=gcd(b,d),k=d/g,l=b/g,aa=a*k,bb=b*k,uu=u*k,cc=c*l,dd=d*l,vv=v*l,coef=aa-cc,total=uu-vv;
      return [card(systemLayout(eq(twoTerms(a,b),u,`× ${k}`,twoTerms(aa,bb),uu)+`<div style="height:12px"></div>`+eq(twoTerms(c,d),v,`× ${l}`,twoTerms(cc,dd),vv)),'Multiply both sides of each equation so the y terms match.'),card(systemLayout(`<div class="equation-working"><span>${twoTerms(aa,bb)}</span><span>=</span><span>${uu}</span><span class="operation">− (${twoTerms(cc,dd)})</span><span></span><span class="operation">− (${vv})</span><span class="working-result">${term(coef)}</span><span>=</span><span class="working-result">${total}</span></div>`),'Subtract the second equation from the first. The matching y terms become zero.'),divide(coef,total)];
    }
    if(topic==='square-roots'){
      m=q.match(/^(?:What is|Find) the positive square root of (\d+)\?$/);if(!m)return null;const n=+m[1],root=Math.sqrt(n);if(!Number.isInteger(root))return null;
      return [card(line(`${root} × ${root} = ${n}`,`√${n} = <span class="ink">${root}</span>`),'The positive square root is the positive number that multiplies by itself to make the original number.',root)];
    }
    if(topic==='root-expressions'){
      let first,result,operation;
      if(m=q.match(/^√(\d+) ([+-]) √(\d+) = \?$/)){const a=Math.sqrt(+m[1]),b=Math.sqrt(+m[3]);if(!Number.isInteger(a)||!Number.isInteger(b))return null;first=[`√${m[1]} = ${a}`,`√${m[3]} = ${b}`];result=m[2]==='+'?a+b:a-b;operation=`${a} ${m[2]==='+'?'+':'−'} ${b}`}
      else if(m=q.match(/^(\d+) × √(\d+) = \?$/)){const a=+m[1],b=Math.sqrt(+m[2]);if(!Number.isInteger(b))return null;first=[`√${m[2]} = ${b}`];result=a*b;operation=`${a} × ${b}`}
      else if(m=q.match(/^√(\d+) - (\d+) = \?$/)){const a=Math.sqrt(+m[1]),b=+m[2];if(!Number.isInteger(a))return null;first=[`√${m[1]} = ${a}`];result=a-b;operation=`${a} − ${b}`}
      else return null;
      return [card(line(...first),'Evaluate the square roots first.'),card(line(`${operation} = <span class="ink">${result}</span>`),'Use those values in the original calculation.',result)];
    }
    if(topic==='simplify-radicals'){
      m=q.match(/^Simplify √(\d+)\?$/);if(!m)return null;const n=+m[1];let factor=Math.floor(Math.sqrt(n));while(factor>1&&n%(factor*factor))factor--;const square=factor*factor,remainder=n/square,result=remainder===1?String(factor):factor===1?`√${remainder}`:`${factor}√${remainder}`;
      return [card(line(`√${n} = √(${square} × ${remainder})`),'Split the number into a perfect square times the remaining factor.'),card(line(`√${square} × √${remainder}`,`= <span class="ink">${result}</span>`),'Take the square root of the perfect-square part. Keep the remaining root.',result)];
    }
    return null;
  };
})();
