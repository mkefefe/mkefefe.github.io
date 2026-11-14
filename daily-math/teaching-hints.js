/* Hints are deliberately separate from worked solutions. Never read p.answer here. */
function learningHint(p, stage) {
  if (p.learningHints?.[stage - 1]) return p.learningHints[stage - 1];
  const card = (math, label) => ({html: `<div class="math-line">${math}</div>`, label});
  const fraction = (a,b) => `<span class="fraction"><span>${a}</span><span>${b}</span></span>`;
  const balance = (left,right,operation) => `<div class="equation-working"><span>${left}</span><span>=</span><span>${right}</span><span class="operation">${operation}</span><span></span><span class="operation">${operation}</span></div>`;
  const q=p.q, n=(q.match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  if(!p.topic&&p.level===0)return arithmeticScaffold(p,stage);
  const rules = {
    'missing-number':['□ + known = total','To find a missing addend, subtract the known number from the total.'],
    'equal-groups':['total = groups × each group','Equal groups all have the same size. Multiply the group count by the size of each group.'],
    'fractions':['a/c + b/c = (a + b)/c','When the bottom numbers match, add the top numbers and keep the bottom number.'],
    'mixed-fractions':['Same denominator → add numerators','The denominator is the bottom number. Rewrite both fractions with the same denominator before adding.'],
    'logarithms':['log_b(n) = x ↔ bˣ = n','A logarithm asks which power of the base makes the given number.'],
    'exponent-laws':['aᵐ × aⁿ = aᵐ⁺ⁿ','When multiplying powers with the same base, add their exponents.'],
    'quadratic-formula':['x = (−b ± √(b² − 4ac)) / (2a)','Match the equation to ax² + bx + c = 0. Keep the minus sign when identifying b.'],
    'mean':['mean = total ÷ count','The mean is the total shared equally among all the values.'],
    'median':['Put the values in order','The median is the middle value after sorting. For two middle values, use their average.'],
    'range':['range = largest − smallest','The range tells you the distance between the smallest and largest values.'],
    'probability':['probability = wanted ÷ total','Count the outcomes you want and all possible outcomes. Write their ratio as a fraction.'],
    'weighted-mean':['Σ(value × weight) ÷ Σweights','Each weight says how many times a value counts. Multiply before adding.'],
    'partitioned-rectangle':['whole area = width × height','The section areas add up to the whole rectangle. All sections share the same height.'],
    'rectangle-diagonal':['d² = w² + h²','The diagonal makes a right triangle inside the blue section. Use that section’s width and height.'],
    'composite-area':['remaining area = whole − missing','Imagine the complete rectangle, then subtract the missing corner.'],
    'trapezoid-area':['area = (a + b)h / 2','Here a and b are the parallel sides. The height h meets them at a right angle.'],
    'square-roots':['√n × √n = n','A square root is a number that makes n when multiplied by itself. Use the positive root here.'],
    'root-expressions':['Roots first → other operations','Work out what each square-root sign means before adding, subtracting or multiplying.'],
    'simplify-radicals':['√(a²b) = a√b','A perfect-square factor can come out of the root. The remaining factor stays inside.'],
    'order-of-operations':['Brackets → powers → × ÷ → + −','Work left to right when operations have the same priority.'],
    'decimals':['Line up the decimal points','Keep ones above ones, tenths above tenths, and hundredths above hundredths.'],
    'linear-both-sides':['Do the same thing on both sides','Gather the x terms on one side and the plain numbers on the other.'],
    'bracket-equations':['Undo the outside multiplication','Divide both sides by the number outside the brackets.'],
    'fraction-equations':['Undo division with multiplication','Multiply both sides by the number beneath the fraction bar.'],
    'two-variable-substitution':['Replace the letter you know','A letter next to a number means multiplication. Use the given value in brackets.'],
    'general-systems':['Two equations → one unknown','Scale the equations so one letter has matching coefficients, then subtract.'],
    'simultaneous-equations':['Combine the two equations','Adding or subtracting the equations can remove one unknown.'],
    'percentages':['p% = p / 100','Percent means out of one hundred. Multiply that fraction by the whole.'],
    'discounts':['sale price = price − discount','Find the amount taken off before working out the new price.'],
    'rectangle-area':['area = length × width','Area counts the square units inside the rectangle.'],
    'ratios':['Find the value of one part','A ratio compares equal-sized parts. Divide the known amount by its number of parts.'],
    'triangle-angles':['a + b + c = 180°','The three inside angles of every triangle add to 180°.'],
    'right-triangle':['a² + b² = c²','The two shorter sides meet at the square corner. The longest side c is opposite that corner.'],
    'parallel-angles':['Corresponding angles are equal','Parallel lines never meet. A line crossing both creates matching angles in the same position.'],
    'expressions':['Replace letters → follow the operations','Put the given values in brackets. Multiply before adding.'],
    'divide-fractions':['a/b ÷ c/d = a/b × d/c','Flip the second fraction, then multiply. Convert mixed numbers to fractions first.'],
    'circle-area':['area = πr²','The radius runs from the centre to the edge. Square it, then multiply by π.'],
    'trigonometry':['SOH · CAH · TOA','Sine uses opposite/hypotenuse, cosine adjacent/hypotenuse, and tangent opposite/adjacent.'],
    'quadratic-derivative':['d(ax² + bx + c)/dx = 2ax + b','A derivative gives the rate of change. A constant term contributes zero.'],
    'polynomial-integral':['∫axⁿ dx = axⁿ⁺¹/(n + 1)','Increase the power by one, then divide by that new power. Apply this to each term.']
  };
  if(stage===1){
    if(p.visualHint) return p.visualHint;
    if(rules[p.topic])return card(...rules[p.topic]);
    if(!p.topic){
      if(p.level===0)return card(q.includes('+')?'Add by place value':'Subtract by place value',q.includes('+')?'Combine ones with ones and tens with tens.':'Take away the smaller parts one at a time.');
      if(p.level===1)return card(q.includes('÷')?'division = equal groups':'× before +',q.includes('÷')?'Ask how many equal groups fit into the total.':'Multiply the two numbers first, then add the remaining number.');
      if(p.level===2)return card('ax + b = total','x is the unknown number. Undo addition first, then undo multiplication.');
      if(p.level===3)return card('(x − a)(x − b) = 0','Find two numbers with the required sum and product. Each factor can equal zero.');
      if(p.level===4)return card('f(value): replace x with value','Write the given number in brackets wherever x appears, then follow the order of operations.');
      return card(q.includes('∫')?'area under a line = ½ × base × height':'d(ax³ + bx)/dx = 3ax² + b',q.includes('∫')?'This line starts at zero, so the area under it is a triangle.':'For each power, multiply by the exponent and reduce the exponent by one.');
    }
    return card('Identify the unknown','Use the given values and a matching rule to find the missing quantity.');
  }
  let m;
  if(p.topic==='square-roots')return card(`□ × □ = ${n[0]}`,'Try squaring the answer choices. Which one gives this number?');
  if(p.topic==='logarithms')return card(`${n[0]}<sup>□</sup> = ${n[1]}`,'Multiply the base by itself and keep count of the factors.');
  if(p.topic==='mixed-fractions')return card(fraction('a × d','b × d')+' + '+fraction('c × b','d × b'),'Multiply each fraction’s top and bottom by the other denominator. Then add the top numbers.');
  if(p.topic==='triangle-angles')return card('x = 180° − (known angle + known angle)','Use only the angles inside the triangle. Add the known two before subtracting.');
  if(p.topic==='parallel-angles')return card('Same position at each crossing','Follow the two blue angle marks. Corresponding angles match because the two lines are parallel.');
  if(p.topic==='trigonometry')return card(q.includes('cos')?'cos θ = adjacent / hypotenuse':q.includes('tan')?'tan θ = opposite / adjacent':'sin θ = opposite / hypotenuse','Start at θ. The opposite side faces it; the adjacent side touches it and is not the hypotenuse.');
  if(p.topic==='bracket-equations'&&(m=q.match(/(\d+)\(x \+ (\d+)\) = (\d+)/)))return card(fraction(`${m[1]}(x + ${m[2]})`,m[1])+' = '+fraction(m[3],m[1]),`Divide each side by ${m[1]}. Then subtract ${m[2]} from each side.`);
  if(p.topic==='linear-both-sides'&&(m=q.match(/(\d+)x \+ (\d+) = (\d+)x \+ (\d+)/)))return {html:balance(`${m[1]}x + ${m[2]}`,`${m[3]}x + ${m[4]}`,`− ${m[3]}x`),label:`Subtract ${m[3]}x on both sides to leave x terms on just one side.`};
  if(!p.topic&&p.level===2)return {html:balance(`${n[0]}x + ${n[1]}`,n[2],`− ${n[1]}`),label:`Subtract ${n[1]} from both sides. After simplifying, divide both sides by ${n[0]}.`};
  if(!p.topic&&p.level===3)return card(`□ + □ = ${n[0]}<br>□ × □ = ${n[1]}`,'List factor pairs of the product. Find the pair with the required sum.');
  if(!p.topic&&p.level===4)return card(`${n[0]} × (${n[2]})² + ${n[1]}`,'Square the bracketed number first, then multiply, then add.');
  if(!p.topic&&p.level===1&&q.includes('÷'))return card(`${n[1]} × □ = ${n[0]}`,'Use multiplication to find the missing number of groups.');
  return secondHint(p);
}


/* Concrete arithmetic hints: only operands and unfilled destinations, never a result. */
function arithmeticScaffold(p, stage) {
  const m=p.q.match(/^(\d+)\s*([+−-])\s*(\d+)\s*=\s*\?$/);
  if(!m)return {html:'<div class="math-line">Start → count → check</div>',label:'Use the given numbers to decide how far to count.'};
  const a=Number(m[1]),b=Number(m[3]),plus=m[2]==='+',sign=plus?'+':'−';
  const svg=(body,label,height=110)=>`<svg class="arithmetic-hint" viewBox="0 0 320 ${height}" width="320" height="${height}" role="img" aria-label="${label}" style="display:block;width:100%;max-width:320px;margin:auto">${body}</svg>`;
  const dot=(x,y,fill)=>`<circle cx="${x}" cy="${y}" r="7" fill="${fill}" stroke="#24364d" stroke-width="1.5"/>`;
  if(stage===1){
    if(plus&&a<=10&&b<=10){
      const group=(count,start,fill)=>`<rect x="${start}" y="8" width="125" height="84" rx="16" fill="#f1f6fa" stroke="#d2dce7" stroke-width="2"/><text x="${start+62.5}" y="30" text-anchor="middle" fill="#24364d" font-size="20" style="font-size:20px">${count} ${count===1?'dot':'dots'}</text>`+Array.from({length:count},(_,i)=>dot(start+62.5-((Math.min(5,count-Math.floor(i/5)*5)-1)*21)/2+(i%5)*21,48+Math.floor(i/5)*23,fill)).join('');
      return {html:svg(group(a,5,'#55c6f1')+group(b,190,'#ffdc43')+'<text x="160" y="61" text-anchor="middle" font-size="29" style="font-size:29px" fill="#24364d">+</text>',`${a} blue dots plus ${b} yellow dots; total not filled in`,100),label:'Put the two groups together. Count all the dots.'};
    }
    if(!plus&&a<=20){
      const dots=Array.from({length:a},(_,i)=>dot(160-((Math.min(10,a-Math.floor(i/10)*10)-1)*25)/2+(i%10)*25,55+Math.floor(i/10)*28,'#55c6f1')).join('');
      return {html:svg(`<text x="160" y="24" text-anchor="middle" font-size="22" style="font-size:22px" fill="#24364d">Start with ${a} ${a===1?'dot':'dots'}</text>`+dots,`${a} dots before taking any away`,100),label:`Take away ${b} ${b===1?'dot':'dots'}. Count what is left.`};
    }
    return {html:`<div class="math-line"><span class="ink">${a}</span> ${sign} ${b} = □</div>`,label:plus?`Start with ${a}. Add ${b} more.`:`Start with ${a}. Take away ${b}.`};
  }
  if(b===0)return {html:`<div class="math-line">${a} ${sign} 0 = □</div>`,label:'Adding or taking away zero leaves the starting amount unchanged.'};
  const small=b<=8;
  const step=small?1:10**Math.max(1,Math.floor(Math.log10(b)));
  let low,high;
  if(small){low=a-(plus?2:b+1);high=a+(plus?b+1:2);if(a<=6&&b<=4){low=-1;high=Math.max(6,a+b+1)}}
  else {low=a-3*step;high=a+3*step}
  const count=Math.round((high-low)/step),left=22,right=298,y=62,space=(right-left)/count;
  let body=`<path d="M12 ${y}H308m-6 -5 6 5-6 5M18 ${y-5}l-6 5 6 5" fill="none" stroke="#24364d" stroke-width="2.5" stroke-linecap="round"/>`;
  for(let i=0;i<=count;i++){
    const value=low+i*step,x=left+i*space,isStart=value===a;
    body+=`<path d="M${x} ${y-6}v12" stroke="${isStart?'#1683a6':'#24364d'}" stroke-width="${isStart?3:2}"/><text x="${x}" y="${y+29}" text-anchor="middle" fill="${isStart?'#1683a6':'#24364d'}" style="font-size:${count>10?16:19}px">${value<0?'−'+Math.abs(value):value}</text>`;
    if(isStart)body+=`<path d="M${x} 25v21m-5-6 5 6 5-6" fill="none" stroke="#1683a6" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  const direction=plus?'right':'left';
  const label=small?`Start at ${a}. Move ${b} ${b===1?'tick':'ticks'} to the ${direction}.`:`Start at ${a}. Move ${direction} ${Math.floor(b/step)} ticks (${Math.floor(b/step)*step})${b%step?`, then ${b%step} more`:""}.`;
  return {html:svg(body,`Number line from ${low} to ${high}, ticks every ${step}; only the starting number ${a} is marked`,110),label};
}
