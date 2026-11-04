// Browser integration checks for expensive lifecycle and gesture regressions.
// Bundle this development entry with esbuild; never ship its temporary HTML.
import {mountHero} from '../src/hero/index.js';
import {buildWorld} from '../src/hero/geometry.js';
import {animateWorld} from '../src/hero/motion.js';
import {makeFocusContext} from '../src/hero/focus.js';
import {wave} from '../src/hero/timeline.js';
import * as THREE from 'three';
const report=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(label,ok,detail)=>{report.push({label,pass:!!ok,detail});document.querySelector('pre').textContent=JSON.stringify(report,null,2);if(!ok)throw Error(label);};
function host(){const el=document.createElement('div');el.style.cssText='position:fixed;top:0;left:0;width:700px;height:490px';el.innerHTML='<img src="/assets/hero-islands.webp"><canvas style="position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y pinch-zoom"></canvas><button data-hero-motion></button><button data-hero-reset hidden></button>'+[0,1,2,3].map(i=>'<button data-hero-label data-hero-focus="'+i+'" style="position:absolute;width:100px;height:30px" disabled>Label '+i+'</button>').join('');document.body.append(el);return el;}
let disposal={geometry:0,material:0,texture:0};
let renderedCamera;
// WebGLRenderer installs render on each instance; observe that assignment.
Object.defineProperty(THREE.WebGLRenderer.prototype,'render',{configurable:true,set(render){Object.defineProperty(this,'render',{configurable:true,writable:true,value:(scene,camera)=>{renderedCamera=camera;return render.call(this,scene,camera);}});}});
for(const [key,type] of [['geometry',THREE.BufferGeometry],['material',THREE.Material],['texture',THREE.Texture]]){const original=type.prototype.dispose;type.prototype.dispose=function(){disposal[key]++;return original.call(this);};}
try{
  for(const period of [7.2,6.4,8.4])assert('smooth independent loop '+period,Math.abs(wave(period-1e-5,period)-wave(period+1e-5,period))<.0001);
  const model=buildWorld(true),fingerprint=()=>[model.modules.map(m=>m.object.position.toArray()),model.bars.map(b=>b.object.scale.y),[model.turningPage.rotation.z,...model.sources.map(s=>s.position.y)]].map(JSON.stringify);
  let simultaneous=true;for(let t=0;t<42;t+=.7){animateWorld(model,t);const a=fingerprint();animateWorld(model,t+.2);const b=fingerprint();if(!a.every((v,i)=>v!==b[i]))simultaneous=false;}
  assert('all three tasks change together in every sampled interval across 42 seconds',simultaneous);
  animateWorld(model,5.2-1e-5);const traceEnd=model.lineDot.scale.x;animateWorld(model,5.2+1e-5);assert('chart tracer fades before returning to its start',traceEnd<.001&&model.lineDot.scale.x<.001&&model.lineTrace.material.opacity<.001);
  const focusContext=makeFocusContext(model.root);focusContext.restore();animateWorld(model,2);const traceOpacity=model.lineTrace.material.opacity;focusContext.update(-1,1);assert('focus context preserves animated opacity',model.lineTrace.material.opacity===traceOpacity);focusContext.restore();animateWorld(model,2);focusContext.update(0,1,true);assert('detail view isolates selected island',model.islands[0].visible&&!model.islands[1].visible&&!model.node.visible);focusContext.restore();animateWorld(model,3);focusContext.update(-1,1,true);assert('overview restores every island',model.focusTargets.every(o=>o.visible));
  const materialStates=new Map();model.root.traverse(o=>{for(const m of [o.material].flat())if(m)materialStates.set(m,[m.transparent,m.depthWrite,m.blending,m.version]);});
  const roof=model.node.children.find(o=>o.geometry?.parameters?.height===.035&&o.geometry.parameters.radiusTop===1.2),roofOpacity=roof.material.opacity;
  focusContext.restore();animateWorld(model,3);focusContext.update(0,1,true);let glassContinuous=true,lastOpacity=0;
  for(let frame=0;frame<75;frame++){focusContext.restore();animateWorld(model,3+frame/60);focusContext.update(-1,1/60);if(roof.material.opacity<lastOpacity||roof.material.opacity-lastOpacity>roofOpacity*.15)glassContinuous=false;lastOpacity=roof.material.opacity;}
  assert('returning glass fades monotonically without disappearing',glassContinuous&&Math.abs(roof.material.opacity-roofOpacity)<.001);
  assert('transition preserves render queues depth writes and shader versions',[...materialStates].every(([m,s])=>[m.transparent,m.depthWrite,m.blending,m.version].every((v,i)=>v===s[i])));
  const gs=new Set(),ms=new Set();model.root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)gs.add(o.geometry);for(const m of [o.material].flat())if(m)ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());model.shadowTexture.dispose();
  const el=host(),stop=mountHero(el);await wait(1800);assert('real WebGL automatic start',el.dataset.state==='ready'&&+el.dataset.frames>10,el.dataset.elapsed);
  el.querySelector('[data-hero-motion]').click();await wait(120);const paused=el.dataset.frames;await wait(240);assert('pause stops rendering',paused===el.dataset.frames);
  el.querySelector('[data-hero-motion]').click();await wait(200);assert('resume continues rendering',+el.dataset.frames>+paused);
  el.style.display='none';await wait(200);const hidden=el.dataset.frames;await wait(250);assert('offscreen stops rendering',hidden===el.dataset.frames);el.style.display='block';await wait(200);assert('intersection resume',+el.dataset.frames>+hidden);
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));await wait(100);const background=el.dataset.frames;await wait(250);assert('background stops rendering',background===el.dataset.frames);delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));await wait(200);assert('foreground resume',+el.dataset.frames>+background);
  const canvas=el.querySelector('canvas'),reset=el.querySelector('[data-hero-reset]');canvas.setPointerCapture=()=>{};canvas.hasPointerCapture=()=>false;
  const defaultPosition=renderedCamera.position.clone();canvas.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:650,clientY:160,buttons:0}));await wait(600);assert('hover rotates without any mouse press',renderedCamera.position.distanceTo(defaultPosition)>2);
  el.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));await wait(1200);assert('leaving hover gently restores the view',renderedCamera.position.distanceTo(defaultPosition)<.05);
  function pointer(type,x,y){canvas.dispatchEvent(new PointerEvent(type,{pointerType:'touch',pointerId:7,isPrimary:true,button:0,clientX:x,clientY:y}));}
  pointer('pointerdown',200,200);pointer('pointermove',203,150);pointer('pointerup',203,150);assert('vertical touch leaves exploration unchanged',reset.hidden);
  pointer('pointerdown',200,200);pointer('pointermove',250,204);pointer('pointerup',250,204);assert('horizontal touch enters exploration',!reset.hidden);
  const exploring=+el.dataset.elapsed;await wait(200);assert('business clock continues while exploring',+el.dataset.elapsed>exploring);assert('drag does not select an island',![...el.querySelectorAll('[data-hero-label]')].some(label=>label.getAttribute('aria-pressed')==='true'));
  reset.click();assert('reset returns to overview',reset.hidden);
  const label=el.querySelector('[data-hero-focus="3"]');label.click();await wait(100);assert('HTML compute label focuses the server pavilion',label.getAttribute('aria-pressed')==='true'&&!reset.hidden);reset.click();await wait(100);assert('label focus resets',label.getAttribute('aria-pressed')==='false');
  const detailZooms=[];for(let i=0;i<4;i++){el.querySelector('[data-hero-focus="'+i+'"]').click();const time=+el.dataset.elapsed;await wait(1000);detailZooms.push(renderedCamera.zoom);assert('detail framing and running business '+i,renderedCamera.zoom>1.85&&el.dataset.focus===String(i)&&+el.dataset.elapsed>time,{zoom:renderedCamera.zoom});}
  reset.click();await wait(1200);assert('overview restores zoom and removes detail state',Math.abs(renderedCamera.zoom-1)<.01&&!el.hasAttribute('data-focus'));
  const hit=new THREE.Vector3(-3.3,1.52,-1.95).project(renderedCamera),hx=(hit.x+1)*350,hy=(1-hit.y)*245;for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new PointerEvent(type,{pointerType:'mouse',pointerId:8,isPrimary:true,button:0,clientX:hx,clientY:hy}));assert('clicking actual island geometry opens its detail',el.dataset.focus==='0');
  const before={...disposal};stop();await wait(100);const stopped=el.dataset.frames;await wait(150);assert('unmount cancels frames',stopped===el.dataset.frames);assert('GPU resources disposed',disposal.geometry>before.geometry&&disposal.material>before.material&&disposal.texture>before.texture,disposal);el.remove();
  const originalMedia=window.matchMedia;window.matchMedia=q=>q.includes('prefers-reduced-motion')?Object.assign(new EventTarget(),{matches:true,media:q}):originalMedia(q);
  const reduced=host(),stopReduced=mountHero(reduced);window.matchMedia=originalMedia;await wait(900);const rf=reduced.dataset.frames;await wait(200);assert('reduced motion renders a still frame',rf===reduced.dataset.frames&&reduced.querySelector('[data-hero-motion]').getAttribute('aria-pressed')==='true');reduced.querySelector('canvas').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:650,clientY:160,buttons:0}));await wait(200);assert('reduced motion suppresses hover movement',rf===reduced.dataset.frames);stopReduced();reduced.remove();
  const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:getContext.call(this,type,...args);};const fallback=host(),stopFallback=mountHero(fallback);HTMLCanvasElement.prototype.getContext=getContext;assert('no WebGL uses cover',fallback.dataset.state==='fallback'&&fallback.querySelector('[data-hero-motion]').hidden);assert('fallback image available',fallback.querySelector('img').complete&&fallback.querySelector('img').naturalWidth>0);stopFallback();fallback.remove();
  const lost=host(),stopLost=mountHero(lost);await wait(900);lost.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();await wait(200);assert('context loss falls back safely',lost.dataset.state==='fallback');stopLost();lost.remove();
  for(const route of ['challenge','teams','resources','partners','enterprise','research','ecosystem','involve','directions']) {
    const frame=document.createElement('iframe');frame.style.cssText='width:800px;height:600px';frame.src='/'+route+'/?lang=en';document.body.append(frame);await new Promise(resolve=>frame.onload=resolve);await wait(200);
    const doc=frame.contentDocument;assert('route /'+route+'/',!!doc.querySelector('h1')&&doc.documentElement.lang==='en'&&!doc.querySelector('[data-hero-world]'));frame.remove();
  }
  document.body.dataset.result='passed';
}catch(e){document.body.dataset.result='failed';document.querySelector('pre').textContent+='\n'+e.stack;}
