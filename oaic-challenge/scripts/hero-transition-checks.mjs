// Development-only real-WebGL transition regression and frame capture.
import * as THREE from 'three';
import {mountHero} from '../src/hero/index.js';

const host=document.querySelector('[data-hero-world]'),report=document.querySelector('pre');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let renderer,scene,watch=null,compiles=0;
const captureCanvas=document.createElement('canvas');captureCanvas.width=800;captureCanvas.height=520;const captureContext=captureCanvas.getContext('2d');
const compile=WebGL2RenderingContext.prototype.compileShader;
WebGL2RenderingContext.prototype.compileShader=function(...args){compiles++;return compile.apply(this,args);};
Object.defineProperty(THREE.WebGLRenderer.prototype,'render',{configurable:true,set(render){
  Object.defineProperty(this,'render',{configurable:true,writable:true,value:(s,c)=>{
    renderer=this;scene=s;
    const begin=performance.now(),result=render.call(this,s,c),end=performance.now();
    if(watch){
      const elapsed=begin-watch.start;
      watch.frames.push({at:elapsed,renderMs:end-begin,programs:this.info.programs.length,clock:+host.dataset.elapsed});
      if(watch.capture&&elapsed>=watch.nextCapture){
        watch.nextCapture+=160;captureContext.fillStyle='#F6FAFA';captureContext.fillRect(0,0,800,520);captureContext.drawImage(this.domElement,0,0,800,520);watch.images.push({at:elapsed,src:captureCanvas.toDataURL('image/webp',.75)});
      }
    }
    return result;
  }});
}});
const stop=mountHero(host),results=[];
function finish(){
  const frames=watch.frames,gaps=frames.slice(1).map((f,i)=>f.at-frames[i].at).sort((a,b)=>a-b);
  const result={name:watch.name,frames:frames.length,compiles:compiles-watch.compiles,programsBefore:watch.programs,programsAfter:renderer.info.programs.length,p95FrameGapMs:gaps[Math.floor(gaps.length*.95)],maxFrameGapMs:gaps.at(-1),clockAdvanced:frames.at(-1).clock-frames[0].clock};
  results.push(result);
  if(watch.capture){
    const strip=document.querySelector('#frames');
    for(const frame of watch.images){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=frame.src;caption.textContent=watch.name+' · '+Math.round(frame.at)+' ms';figure.append(img,caption);strip.append(figure);}
  }
  watch=null;report.textContent=JSON.stringify(results,null,2);
}
function start(name,capture=false){watch={name,capture,start:performance.now(),nextCapture:0,frames:[],images:[],compiles,programs:renderer.info.programs.length};}
try{
  await wait(2000);start('steady');await wait(1200);finish();
  for(const [i,name] of [[1,'finance'],[2,'research'],[3,'compute'],[0,'ppt']]){
    start('enter '+name);host.querySelector('[data-hero-focus="'+i+'"]').click();await wait(1400);finish();
    start('exit '+name,new URLSearchParams(location.search).has('capture'));host.querySelector('[data-hero-reset]').click();await wait(1400);finish();
  }
  document.body.dataset.result='complete';
}catch(error){report.textContent+='\n'+error.stack;document.body.dataset.result='failed';}
window.addEventListener('pagehide',stop,{once:true});
