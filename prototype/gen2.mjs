// المشتبه — مولّد قائم على الاستنتاج (لا تعداد شامل)
const R=n=>Math.floor(Math.random()*n);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

function makeLayout(n,nRooms){
  const room=new Int16Array(n*n).fill(-1);
  const seeds=shuf([...Array(n*n).keys()]).slice(0,nRooms);
  const q=[]; seeds.forEach((c,i)=>{room[c]=i;q.push(c);});
  while(q.length){const cur=q.shift(),r=(cur/n)|0,c=cur%n;
    for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc;
      if(nr<0||nc<0||nr>=n||nc>=n)continue;const id=nr*n+nc;
      if(room[id]===-1){room[id]=room[cur];q.push(id);}}}
  const cells=[...Array(nRooms)].map(()=>[]);
  for(let i=0;i<n*n;i++) cells[room[i]].push(i);
  // غرف "مقيّدة" (موائل) — نصف الغرف
  const restricted=new Set(shuf([...Array(nRooms).keys()]).slice(0,Math.floor(nRooms/2)));
  const objs=new Map();
  for(const cell of shuf([...Array(n*n).keys()]).slice(0,Math.floor(n*1.5))) objs.set(cell,'obj'+objs.size);
  return {n,nRooms,room,cells,restricted,objs};
}
const adj=(L,a,b)=>{const n=L.n;return Math.abs(((a/n)|0)-((b/n)|0))+Math.abs(a%n-b%n)===1&&L.room[a]===L.room[b];};

// حل يحترم القيدين العامين: الزوّار خارج الموائل + كل موئل غير فارغ
function makeSolution(L,nKeepers){
  const {n,restricted,cells,room}=L;
  for(let attempt=0;attempt<4000;attempt++){
    const usedR=new Set(),usedC=new Set(),pos=new Array(n).fill(-1);
    const keepers=[...Array(nKeepers).keys()].map(i=>n-nKeepers+i);
    const rl=shuf([...restricted]); let ok=true;
    for(let i=0;i<rl.length;i++){                       // حارس لكل موئل
      if(i>=keepers.length){ok=false;break;}
      const cand=shuf([...cells[rl[i]]]).find(c=>!usedR.has((c/n)|0)&&!usedC.has(c%n));
      if(cand==null){ok=false;break;}
      pos[keepers[i]]=cand; usedR.add((cand/n)|0); usedC.add(cand%n);
    }
    if(!ok) continue;
    for(let ch=0;ch<n;ch++){
      if(pos[ch]>=0) continue;
      const visitor=ch<n-nKeepers;
      const cand=shuf([...Array(n*n).keys()]).find(c=>!usedR.has((c/n)|0)&&!usedC.has(c%n)&&(!visitor||!restricted.has(room[c])));
      if(cand==null){ok=false;break;}
      pos[ch]=cand; usedR.add((cand/n)|0); usedC.add(cand%n);
    }
    if(ok&&pos.every(p=>p>=0)) return pos;
  }
  return null;
}

// ---------- الاستنتاج ----------
function propagate(L,doms,cons,trace){
  const {n,room,cells,restricted}=L;
  let changed=true, steps=0;
  const assigned=()=>doms.map(d=>d.size===1?[...d][0]:-1);
  while(changed && steps<400){
    changed=false; steps++;
    const A=assigned();
    // 1) المُثبَّت يحجب صفه وعموده
    for(let c=0;c<n;c++){ if(A[c]<0) continue;
      const r=(A[c]/n)|0, col=A[c]%n;
      for(let o=0;o<n;o++){ if(o===c) continue;
        for(const cell of [...doms[o]]) if(((cell/n)|0)===r||cell%n===col){doms[o].delete(cell);changed=true;} } }
    // 2) وحيد مخفي على الصفوف والأعمدة
    for(const axis of [0,1]){
      for(let k=0;k<n;k++){
        const cand=[];
        for(let c=0;c<n;c++){ for(const cell of doms[c]){ const v=axis?cell%n:((cell/n)|0);
          if(v===k){cand.push(c);break;} } }
        if(cand.length===1){ const c=cand[0];
          for(const cell of [...doms[c]]){ const v=axis?cell%n:((cell/n)|0);
            if(v!==k){doms[c].delete(cell);changed=true;} } } } }
    // 3) قيود «وحده» و«وحده مع»
    for(const cn of cons){
      if(cn.t==='alone'&&A[cn.ch]>=0){ const rm=room[A[cn.ch]];
        for(let o=0;o<n;o++){ if(o===cn.ch) continue;
          for(const cell of cells[rm]) if(doms[o].delete(cell)) changed=true; } }
      if(cn.t==='aloneWith'){ const a=cn.ch,b=cn.o;
        for(const[x,y]of[[a,b],[b,a]]) if(A[x]>=0){ const rm=room[A[x]];
          for(const cell of [...doms[y]]) if(room[cell]!==rm){doms[y].delete(cell);changed=true;}
          for(let o=0;o<n;o++){ if(o===a||o===b) continue;
            for(const cell of cells[rm]) if(doms[o].delete(cell)) changed=true; } } }
    }
    // 4) القيد العام: لا موئل فارغ
    for(const rm of restricted){
      let occupant=-1, cand=[];
      for(let c=0;c<n;c++){ if(A[c]>=0&&room[A[c]]===rm){occupant=c;break;}
        for(const cell of doms[c]) if(room[cell]===rm){cand.push(c);break;} }
      if(occupant<0&&cand.length===1){ const c=cand[0];
        for(const cell of [...doms[c]]) if(room[cell]!==rm){doms[c].delete(cell);changed=true;} } }
    for(const d of doms) if(d.size===0) return {solved:false,dead:true};
  }
  return {solved:doms.every(d=>d.size===1),dead:false};
}

function trueClues(L,sol,i){
  const {n,room,objs,restricted}=L, p=sol[i], rm=room[p], out=[];
  out.push({t:'u',d:`in room ${rm}`,f:x=>room[x]===rm});
  for(let q=0;q<L.nRooms;q++) if(q!==rm) out.push({t:'u',d:`not in room ${q}`,f:x=>room[x]!==q});
  for(const [cell,id] of objs){
    if(cell===p) out.push({t:'u',d:`on ${id}`,f:x=>x===cell});
    if(adj(L,p,cell)) out.push({t:'u',d:`beside ${id}`,f:x=>adj(L,x,cell)});
    else out.push({t:'u',d:`not beside ${id}`,f:x=>!adj(L,x,cell)});
  }
  out.push({t:'u',d:`in row ${((p/n)|0)+1}`,f:x=>((x/n)|0)===((p/n)|0)});
  out.push({t:'u',d:`in column ${p%n+1}`,f:x=>x%n===p%n});
  const cnt=sol.filter(q=>room[q]===rm).length;
  if(cnt===1) out.push({t:'alone',ch:i,d:'alone in the room'});
  if(cnt===2){ const o=sol.findIndex((q,j)=>j!==i&&room[q]===rm);
    out.push({t:'aloneWith',ch:i,o,d:`alone with C${o}`}); }
  return out;
}

function build(n,nRooms,nKeepers,maxPerChar){
  const L=makeLayout(n,nRooms);
  const sol=makeSolution(L,nKeepers);
  if(!sol) return null;
  const base=[...Array(n*n).keys()];
  const mkDoms=()=>{
    const d=[...Array(n)].map((_,c)=>{
      const s=new Set(base);
      if(c<n-nKeepers) for(const cell of base) if(L.restricted.has(L.room[cell])) s.delete(cell); // القيد العام 1
      return s; });
    return d; };
  const chosen=[]; const per=new Int16Array(n);
  for(let iter=0;iter<n*maxPerChar+5;iter++){
    const doms=mkDoms();
    for(const cn of chosen) if(cn.t==='u') for(const cell of [...doms[cn.ch]]) if(!cn.f(cell)) doms[cn.ch].delete(cell);
    const res=propagate(L,doms,chosen,null);
    if(res.solved) return {n,nRooms,clues:chosen.length,
      perChar:Math.max(...per), covered:per.filter(x=>x>0).length};
    if(res.dead) return null;
    // اختر الشخصية الأكثر غموضًا وأضف لها أقوى دليل
    let worst=-1,ws=-1;
    for(let c=0;c<n;c++) if(per[c]<maxPerChar && doms[c].size>ws){ws=doms[c].size;worst=c;}
    if(worst<0) return null;
    const pool=trueClues(L,sol,worst);
    let best=null,bs=1e9;
    for(const cl of pool){
      if(cl.t!=='u'){ if(bs>1) {best=cl;bs=1;} continue; }
      let s=0; for(const cell of doms[worst]) if(cl.f(cell)) s++;
      if(s<bs&&s>0){bs=s;best=cl;}
    }
    if(!best) return null;
    best.ch=worst; chosen.push(best); per[worst]++;
  }
  return null;
}

console.log('n  | غرف | حرّاس | نجاح | أدلة | أقصى/شخصية');
console.log('---+-----+-------+------+------+-----------');
for(const [n,rooms,keepers] of [[8,7,4],[12,10,6],[16,14,8]]){
  let ok=0,cl=0,pc=0;
  for(let t=0;t<40;t++){ const g=build(n,rooms,keepers,2); if(g){ok++;cl+=g.clues;pc=Math.max(pc,g.perChar);} }
  console.log(String(n).padEnd(3)+'| '+String(rooms).padEnd(4)+'| '+String(keepers).padEnd(6)+'| '
    +String(ok+'/40').padEnd(5)+'| '+(ok?Math.round(cl/ok):'-')+String('').padEnd(3)+' | '+(ok?pc:'-'));
}
