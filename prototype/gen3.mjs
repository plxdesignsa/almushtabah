import {readFileSync} from 'fs';
let src=readFileSync('gen2.mjs','utf8').replace(/\nconsole\.log[\s\S]*$/,'');
const mod=await import('data:text/javascript;base64,'+Buffer.from(src+'\nexport {makeLayout,makeSolution,propagate,trueClues};').toString('base64'));
const {makeLayout,makeSolution,propagate,trueClues}=mod;
const R=n=>Math.floor(Math.random()*n);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

// يبني المجالات من مجموعة أدلة ثم يشغّل الاستنتاج
function solvable(L,n,keepers,clues){
  const doms=[...Array(n)].map((_,c)=>{
    const s=new Set([...Array(n*n).keys()]);
    if(c<n-keepers) for(const cell of [...s]) if(L.restricted.has(L.room[cell])) s.delete(cell);
    return s;});
  const rel=[];
  for(const cl of clues){
    if(cl.t==='u'){ for(const cell of [...doms[cl.ch]]) if(!cl.f(cell)) doms[cl.ch].delete(cell); }
    else rel.push(cl);
  }
  const r=propagate(L,doms,rel,null);
  return r.solved && !r.dead;
}

// المولّد الصحيح: ابدأ بالكل ← احذف ما دام الاستنتاج يحل
function generate(n,rooms,keepers){
  const L=makeLayout(n,rooms);
  const sol=makeSolution(L,keepers);
  if(!sol) return null;
  let all=[];
  for(let i=0;i<n;i++) for(const cl of trueClues(L,sol,i)){ cl.ch=i; all.push(cl); }
  if(!solvable(L,n,keepers,all)) return null;
  let cur=shuf(all);
  for(const cl of [...cur]){
    const trial=cur.filter(x=>x!==cl);
    if(solvable(L,n,keepers,trial)) cur=trial;
  }
  const per=new Int16Array(n); cur.forEach(c=>per[c.ch]++);
  return {clues:cur.length, maxPerChar:Math.max(...per), minPerChar:Math.min(...per),
          withNone:[...per].filter(x=>x===0).length};
}

console.log('n  | غرف | حرّاس | نجاح  | أدلة نهائية | أقصى/شخصية | بلا دليل');
console.log('---+-----+-------+-------+-------------+------------+---------');
for(const [n,rooms,keepers] of [[8,7,4],[12,10,6],[16,14,8]]){
  const got=[]; const T=n<=8?25:15;
  for(let t=0;t<T;t++){ const g=generate(n,rooms,keepers); if(g) got.push(g); }
  if(!got.length){ console.log(`${n} | فشل`); continue; }
  const avg=k=>(got.reduce((s,g)=>s+g[k],0)/got.length).toFixed(1);
  const mx =k=>Math.max(...got.map(g=>g[k]));
  console.log(String(n).padEnd(3)+'| '+String(rooms).padEnd(4)+'| '+String(keepers).padEnd(6)+'| '
    +String(got.length+'/'+T).padEnd(6)+'| '+String(avg('clues')).padEnd(12)+'| '
    +String(mx('maxPerChar')).padEnd(11)+'| '+avg('withNone'));
}
