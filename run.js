// Pruebas de Mitca. Uso:  node tests/run.js   (desde la carpeta del repo, con index.html al lado)
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=[...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
function grab(name){ // saca "function name(...){...}" contando llaves
  const re=new RegExp('(?:async\\s+)?function\\s+'+name+'\\s*\\(');const m=re.exec(js);if(!m)throw new Error('no encontré '+name);
  let i=js.indexOf('{',m.index),d=0,q=null;
  for(;i<js.length;i++){const c=js[i];
    if(q){if(c==='\\'){i++;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='`'){q=c;continue}
    if(c==='{')d++;else if(c==='}'){d--;if(d===0){i++;break}}}
  return js.slice(m.index,i)}
function grabVar(name){const m=new RegExp('^var '+name+'=.*$','m').exec(js);if(!m)throw new Error('no encontré var '+name);return m[0]}
const LS={};global.localStorage={getItem:k=>LS[k]??null,setItem:(k,v)=>LS[k]=String(v),removeItem:k=>delete LS[k],get length(){return Object.keys(LS).length},key:i=>Object.keys(LS)[i]};
let src='var HVY=false,ATT=null,DOC=null,NVC=null,COOL={},GW={tok:"",prov:[]},DOCB=20000;var store=function(k){return localStorage.getItem(k)||""};var keysOf=function(v){return String(v||"").split(/[\\s,;]+/).filter(Boolean)};';
['DSTOP','DKIND','DWORDN','DH','DN'].forEach(v=>{try{src+=grabVar(v)+'\n'}catch(e){}});
['ffold','rng','cnt','dStem','dTerms','dNum','docOutline','dEnd','docPrep','docSearch','docRange','docBuild','docPick','why','provOrder','nvId','nvChatList','mlist','misOrder'].forEach(f=>{try{src+=grab(f)+'\n'}catch(e){console.log('  (omitida '+f+': '+e.message+')')}});
try{src+=grabVar('PROVD')+'\n'}catch(e){}
try{src+=grabVar('NVT')+'\n'}catch(e){}
src+='return{ffold,dTerms,dNum,docOutline,docRange,docPick,why,provOrder,nvId,nvChatList,mlist,setDoc(d){DOC=d},setHvy(v){HVY=v},setAtt(a){ATT=a},setNvc(c){NVC=c},DOC:()=>DOC};';
const M=new Function(src)();
let ok=0,bad=0;function t(n,f){try{f();ok++;console.log('✓',n)}catch(e){bad++;console.log('✗',n,'\n   ',e.message)}}

t('why: cuota',()=>assert.equal(M.why(new Error('Too Many Requests (429)')),'cuota agotada'));
t('why: modelo retirado/no existe',()=>assert.equal(M.why(new Error('Not found (404)')),'modelo no existe'));
t('why: llave inválida',()=>assert.equal(M.why(new Error('401 Unauthorized')),'llave inválida'));
t('why: tiempo',()=>assert.equal(M.why(new Error('timeout: tardó demasiado')),'tardó demasiado'));
t('dNum: palabras y romanos',()=>{assert.equal(M.dNum('tres'),3);assert.equal(M.dNum('XII'),12);assert.equal(M.dNum('7'),7)});
t('docRange: páginas',()=>{M.setDoc({pages:Array(100).fill('x')});assert.deepEqual(M.docRange('resume las paginas 10 a 20'),{a:10,b:20});assert.deepEqual(M.docRange('primeros 5 paginas'),{a:1,b:5});assert.ok(M.docRange('pagina 500').bad)});
t('dTerms: quita palabras vacías',()=>{const r=M.dTerms(M.ffold('que dice el documento de las zapatas corridas'));assert.ok(r.includes('zapatas')&&!r.includes('que'))});
const pages=Array.from({length:30},(_,i)=>i===0?'Contenido':i===4?'Capítulo 1: Cimientos\nLas zapatas corridas se usan en muros.':i===9?'Capítulo 2: Estructura\nVigas y columnas.':i===20?'Capítulo 3: Acabados\nPintura.':'Texto de relleno número '+i);
t('docOutline: detecta capítulos',()=>{const o=M.docOutline(pages);assert.deepEqual(o.map(x=>x.lab),['Capítulo 1','Capítulo 2','Capítulo 3'])});
const mkDoc=()=>({name:'t',pages,np:30,outline:M.docOutline(pages),chars:100});
t('docPick: por capítulo',()=>{M.setDoc(mkDoc());const r=M.docPick('resume el capitulo 2');assert.equal(r.mode,'out');assert.ok(/Vigas/.test(r.txt)&&!/Cimientos/.test(r.txt))});
t('docPick: por páginas',()=>{M.setDoc(mkDoc());const r=M.docPick('lee las paginas 5 a 5');assert.equal(r.mode,'pag');assert.ok(/zapatas/.test(r.txt))});
t('docPick: búsqueda por palabra',()=>{M.setDoc(mkDoc());const r=M.docPick('que dice de las zapatas');assert.equal(r.mode,'bus');assert.ok(/zapatas/.test(r.txt))});
t('docPick: páginas inexistentes',()=>{M.setDoc(mkDoc());assert.equal(M.docPick('pagina 99').mode,'bad')});
t('provOrder: respeta el orden guardado y completa el resto',()=>{localStorage.setItem('jv_order','groq,nvidia');const o=M.provOrder(false);assert.deepEqual(o.slice(0,2),['groq','nvidia']);assert.ok(o.includes('gemini')&&o.includes('mistral'));localStorage.removeItem('jv_order')});
t('provOrder: ignora nombres raros',()=>{localStorage.setItem('jv_order','xx,groq');assert.equal(M.provOrder(false)[0],'groq');localStorage.removeItem('jv_order')});
t('nvId: encuentra por título en el catálogo',()=>{M.setNvc(['google/gemma-4-31b-it','nvidia/nemotron-3-ultra-550b-a55b']);assert.equal(M.nvId('gemma-4-31b-it'),'google/gemma-4-31b-it');assert.equal(M.nvId('no-existe'),null)});
t('nvChatList: charla, pesado y visión',()=>{M.setNvc(['nvidia/nemotron-3.5-lightning-30b-a3b','nvidia/nemotron-3-ultra-550b-a55b','nvidia/nemotron-3.5-super-vl-120b-a12b']);M.setHvy(false);assert.equal(M.nvChatList()[0],'nvidia/nemotron-3.5-lightning-30b-a3b');M.setHvy(true);assert.equal(M.nvChatList()[0],'nvidia/nemotron-3-ultra-550b-a55b');M.setHvy(false);M.setAtt({kind:'img'});assert.equal(M.nvChatList()[0],'nvidia/nemotron-3.5-super-vl-120b-a12b');M.setAtt(null)});
t('mlist nvidia: descarta el modelo retirado',()=>{M.setNvc(['nvidia/nemotron-3.5-lightning-30b-a3b']);const l=M.mlist('meta/llama-3.3-70b-instruct','nvidia');assert.ok(!l.includes('meta/llama-3.3-70b-instruct'))});
console.log('\n'+ok+' bien, '+bad+' mal');process.exit(bad?1:0);
