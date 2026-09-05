// محرّك المشتبه — نموذج أولي لإثبات الآلية
const R=n=>Math.floor(Math.random()*n);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};

// ---------- التخطيط: غرف بنمو عشوائي من بذور ----------
function makeLayout(n){
  const k=Math.max(4,Math.round(n*0.62));           // عدد الغرف
  const room=new Int16Array(n*n).fill(-1);
  const seeds=shuf([...Array(n*n).keys()]).slice(0,k);
  const q=[]; seeds.forEach((c,i)=>{room[c]=i;q.push(c);});
  while(q.length){
    const cur=q.shift(), r=(cur/n)|0, c=cur%n;
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nr=r+dr, nc=c+dc;
      if(nr<0||nc<0||nr>=n||nc>=n) continue;
      const id=nr*n+nc;
      if(room[id]===-1){room[id]=room[cur];q.push(id);}
    }
  }
  const objs=shuf([...Array(n*n).keys()]).slice(0,n).map((cell,i)=>({id:i,cell}));
  return {n,k,room,objs};
}
const adj=(L,a,b)=>{const n=L.n,ar=(a/n)|0,ac=a%n,br=(b/n)|0,bc=b%n;
  return Math.abs(ar-br)+Math.abs(ac-bc)===1 && L.room[a]===L.room[b];};

function randSolution(n){
  const rows=shuf([...Array(n).keys()]), cols=shuf([...Array(n).keys()]);
  return [...Array(n).keys()].map(i=>rows[i]*n+cols[i]);
}

// ---------- توليد كل القيود الصادقة ----------
function allConstraints(L,sol){
  const {n,room,objs}=L, C=[];
  const roomCount={}; sol.forEach(c=>roomCount[room[c]]=(roomCount[room[c]]||0)+1);
  for(let i=0;i<n;i++){
    const p=sol[i], pr=(p/n)|0, pc=p%n, rm=room[p];
    C.push({ch:i,kind:'u',t:'inRoom',f:x=>room[x]===rm});
    for(let q=0;q<L.k;q++) if(q!==rm) C.push({ch:i,kind:'u',t:'notInRoom',f:x=>room[x]!==q});
    for(const o of objs){
      if(o.cell===p) C.push({ch:i,kind:'u',t:'on',f:x=>x===o.cell});
      else C.push({ch:i,kind:'u',t:'noton',f:x=>x!==o.cell});
      if(adj(L,p,o.cell)) C.push({ch:i,kind:'u',t:'beside',f:x=>adj(L,x,o.cell)});
      else C.push({ch:i,kind:'u',t:'notbeside',f:x=>!adj(L,x,o.cell)});
    }
    C.push({ch:i,kind:'u',t:'inRow',f:x=>((x/n)|0)===pr});
    C.push({ch:i,kind:'u',t:'inCol',f:x=>(x%n)===pc});
    if(roomCount[rm]===1) C.push({ch:i,kind:'alone'});
    for(let j=0;j<n;j++){ if(i===j) continue;
      const q2=sol[j], qr=(q2/n)|0, qc=q2%n;
      if(room[q2]===rm && roomCount[rm]===2) C.push({ch:i,kind:'aloneWith',o:j});
      if(qc===pc && pr-qr===-1) C.push({ch:i,kind:'north1',o:j});
      if(adj(L,p,q2)) C.push({ch:i,kind:'besideCh',o:j});
      if(room[q2]===rm) C.push({ch:i,kind:'sameRoom',o:j});
      else C.push({ch:i,kind:'diffRoom',o:j});
    }
  }
  return C;
}

// ---------- العدّاد: يتوقف عند حلّين ----------
function countUpTo2(L,cons){
  const {n,room}=L;
  const doms=[...Array(n)].map(()=>{const d=[];for(let x=0;x<n*n;x++)d.push(x);return d;});
  for(const c of cons) if(c.kind==='u') doms[c.ch]=doms[c.ch].filter(c.f);
  const rel=cons.filter(c=>c.kind!=='u');
  for(const d of doms) if(!d.length) return 0;

  const order=[...Array(n).keys()].sort((a,b)=>doms[a].length-doms[b].length);
  const usedR=new Uint8Array(n), usedC=new Uint8Array(n);
  const pos=new Int32Array(n).fill(-1);
  const rcnt=new Int16Array(L.k);
  let found=0, nodes=0;

  const relOk=(ch)=>{
    for(const c of rel){
      const a=c.ch, b=c.o;
      if(a!==ch && b!==ch) continue;
      if(c.kind==='alone'){ if(pos[a]>=0 && rcnt[room[pos[a]]]>1) return false; continue; }
      if(pos[a]<0) continue;
      if(c.kind==='aloneWith'){ if(pos[b]>=0 && room[pos[a]]!==room[pos[b]]) return false;
                                if(rcnt[room[pos[a]]]>2) return false; continue; }
      if(pos[b]<0) continue;
      const A=pos[a],B=pos[b];
      if(c.kind==='north1'  && !((A%n)===(B%n) && ((A/n)|0)===((B/n)|0)-1)) return false;
      if(c.kind==='besideCh'&& !adj(L,A,B)) return false;
      if(c.kind==='sameRoom'&& room[A]!==room[B]) return false;
      if(c.kind==='diffRoom'&& room[A]===room[B]) return false;
    }
    return true;
  };

  function rec(k){
    if(found>1||++nodes>4e6) return;
    if(k===n){found++;return;}
    const ch=order[k];
    for(const cell of doms[ch]){
      const r=(cell/n)|0, c=cell%n;
      if(usedR[r]||usedC[c]) continue;
      usedR[r]=1;usedC[c]=1;pos[ch]=cell;rcnt[room[cell]]++;
      if(relOk(ch)) rec(k+1);
      usedR[r]=0;usedC[c]=0;pos[ch]=-1;rcnt[room[cell]]--;
      if(found>1||nodes>4e6) return;
    }
  }
  rec(0);
  return nodes>4e6 ? -1 : found;
}

// ---------- المولّد: أضف حتى الفرادة ثم احذف الزائد ----------
function generate(n,maxPerChar){
  const L=makeLayout(n), sol=randSolution(n);
  const pool=shuf(allConstraints(L,sol));
  const per=new Int16Array(n);
  let cur=[];
  for(const c of pool){
    if(per[c.ch]>=maxPerChar) continue;
    cur.push(c); per[c.ch]++;
    if(cur.length%4===0 && countUpTo2(L,cur)===1) break;
  }
  if(countUpTo2(L,cur)!==1) return null;
  for(const c of [...cur]){                       // التقليم
    const trial=cur.filter(x=>x!==c);
    if(countUpTo2(L,trial)===1) cur=trial;
  }
  const byChar={}; cur.forEach(c=>byChar[c.ch]=(byChar[c.ch]||0)+1);
  return {n, rooms:L.k, constraints:cur.length,
          maxPerChar:Math.max(...Object.values(byChar)),
          charsWithClue:Object.keys(byChar).length};
}

console.log('n  | غرف | قيود نهائية | أقصى/شخصية | شخصيات لها دليل');
console.log('---+-----+-------------+------------+----------------');
for(const n of [5,8,12,16]){
  const runs=[];
  for(let t=0;t<(n<=8?6:3);t++){ const g=generate(n,2); if(g) runs.push(g); }
  if(!runs.length){ console.log(`${n}  | فشل`); continue; }
  const avg=k=>Math.round(runs.reduce((s,r)=>s+r[k],0)/runs.length);
  console.log(String(n).padEnd(3)+'| '+String(runs[0].rooms).padEnd(4)+'| '
    +String(avg('constraints')).padEnd(12)+'| '+String(avg('maxPerChar')).padEnd(11)+'| '
    +avg('charsWithClue')+' / '+n);
}
