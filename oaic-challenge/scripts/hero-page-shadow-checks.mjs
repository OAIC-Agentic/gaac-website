// Development-only real-WebGL checks for page clearance and focus ghosting.
import * as THREE from 'three';
import {buildWorld} from '../src/hero/geometry.js';
import {animateWorld} from '../src/hero/motion.js';
import {makeFocusContext} from '../src/hero/focus.js';
import {lightWorld,view} from '../src/hero/lighting.js';

const report=document.querySelector('pre'),frames=document.querySelector('#frames'),results=[];
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(800,600);renderer.setClearColor('#F6FAFA',1);
const scene=new THREE.Scene(),environment=lightWorld(renderer,scene,false),world=buildWorld(false);
scene.add(world.root);const focus=makeFocusContext(world.root);
const camera=new THREE.OrthographicCamera(-7,7,5.25,-5.25,.1,100);
function aim(target,width=14){
  camera.left=-width/2;camera.right=width/2;camera.top=width*.375;camera.bottom=-width*.375;
  camera.position.set(target.x+Math.sin(view.azimuth)*Math.cos(view.pitch)*20,target.y+Math.sin(view.pitch)*20,target.z+Math.cos(view.azimuth)*Math.cos(view.pitch)*20);
  camera.lookAt(target);camera.updateProjectionMatrix();
}
function check(name,pass,detail){results.push({name,pass,detail});report.textContent=JSON.stringify(results,null,2);if(!pass)throw Error(name);}
function picture(name){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=renderer.domElement.toDataURL('image/webp',.92);caption.textContent=name;figure.append(img,caption);frames.append(figure);}
function pixels(){renderer.render(scene,camera);const gl=renderer.getContext(),data=new Uint8Array(800*600*4);gl.readPixels(0,0,800,600,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;}
try{
  const point=new THREE.Vector3(),paper=world.turningSheet.children[0],book=world.turningPage.parent,positions=paper.geometry.attributes.position;
  let minClearance=Infinity,minDeterminant=Infinity,maxLift=0;
  for(let sample=0;sample<=168;sample++){
    animateWorld(world,sample/20);world.root.updateMatrixWorld(true);
    minDeterminant=Math.min(minDeterminant,Math.abs(world.turningSheet.matrixWorld.determinant()));
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(paper.matrixWorld);book.worldToLocal(point);
      minClearance=Math.min(minClearance,point.y);maxLift=Math.max(maxLift,point.y);
    }
  }
  check('page stays above the open spread through a complete turn',minClearance>=.169&&maxLift>1,{minClearance,maxLift,samples:169});
  check('upright page has a finite nonzero transform',minDeterminant>=.000099,{minDeterminant});
  aim(new THREE.Vector3(3.15,1.4,3.15),6.8);
  for(const t of [6.3,7.7,8.4,9.1,10.5]){focus.restore();animateWorld(world,t);focus.update(2,1,true);renderer.render(scene,camera);picture('Research page · '+t+' s');}

  focus.restore();animateWorld(world,3);focus.update(-1,1,true);
  const states=new Map();world.root.traverse(o=>{if(o.material)states.set(o.material,[o.material.transparent,o.material.depthWrite,o.material.alphaHash,o.material.version]);});
  let shadowsMatch=true,casters=0;
  for(let frame=0;frame<80;frame++){
    focus.restore();animateWorld(world,3+frame/60);focus.update(1,1/60);
    world.root.traverse(o=>{if(!o.castShadow)return;casters++;if(!o.customDepthMaterial||Math.abs(o.customDepthMaterial.opacity-o.material.opacity)>1e-8)shadowsMatch=false;});
  }
  check('animated shadow coverage follows outgoing surfaces',shadowsMatch&&casters>0,{castersSampled:casters});
  check('focus does not switch render queues depth settings or shader defines',[...states].every(([m,s])=>[m.transparent,m.depthWrite,m.alphaHash,m.version].every((v,i)=>v===s[i])));

  aim(new THREE.Vector3(3.3,1.2,-2.4),7);
  focus.restore();animateWorld(world,3);focus.update(-1,1,true);
  focus.restore();animateWorld(world,3);focus.update(1,-Math.log(.0011)/9);const near=pixels();picture('Finance · last fading frame');
  focus.restore();animateWorld(world,3);focus.update(1,1,true);const gone=pixels();picture('Finance · surroundings hidden');
  let changed=0,totalDifference=0;
  for(let i=0;i<near.length;i+=4){let largest=0;for(let j=0;j<3;j++){const d=Math.abs(near[i+j]-gone[i+j]);largest=Math.max(largest,d);totalDifference+=d;}if(largest>8)changed++;}
  const difference={changedPixels:changed,pixelFraction:changed/(800*600),meanChannelDifference:totalDifference/(800*600*3)};
  check('hiding the last fading frame does not reveal a solid bridge or shadow',difference.pixelFraction<.003&&difference.meanChannelDifference<.25,difference);
  document.body.dataset.result='passed';
}catch(error){document.body.dataset.result='failed';report.textContent+='\n'+error.stack;}
finally{
  const geometries=new Set(),materials=new Set(),textures=new Set();
  scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isLight)o.shadow?.dispose();if(o.geometry)geometries.add(o.geometry);for(const m of [o.material,o.customDepthMaterial])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();
}
