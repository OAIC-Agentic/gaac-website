import * as THREE from 'three';
import { buildWorld } from './geometry.js';
import { clamp } from './timeline.js';
import { animateWorld } from './motion.js';
import { lightWorld, view } from './lighting.js';
import { makeFocusContext } from './focus.js';

/** Mount owns every observer, event, frame and GPU allocation. No global scene. */
export function mountHero(host, {lang='zh'}={}) {
  if (!host) return () => {};
  const canvas=host.querySelector('canvas'), toggle=host.querySelector('[data-hero-motion]'), reset=host.querySelector('[data-hero-reset]');
  const labels=[...host.querySelectorAll('[data-hero-label]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), compact=matchMedia('(max-width: 700px)').matches;
  const abort=new AbortController(), listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
  let renderer, world, environment, scene, resizeObserver, intersection, focusFrames, updateFocusContext;
  let destroyed=false, failed=false, raf=0, visible=false, previous=0, elapsed=reduced.matches?3:0, playing=!reduced.matches;
  let yaw=0, yawGoal=0, pitch=view.pitch, pitchGoal=view.pitch, velocity=0, focus=-1, zoom=1, zoomGoal=1;
  let dragging=null, settling=false, frames=0;
  const target=new THREE.Vector3(...view.target), targetGoal=target.clone(), baseTarget=target.clone();
  const camera=new THREE.OrthographicCamera(-7,7,5,-5,.1,100);
  function disposeGPU() {
    const geometries=new Set(), materials=new Set(), textures=new Set();
    scene?.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isLight)o.shadow?.dispose();if(o.geometry)geometries.add(o.geometry);for(const mat of [...(Array.isArray(o.material)?o.material:[o.material]),o.customDepthMaterial,o.customDistanceMaterial])if(mat){materials.add(mat);for(const val of Object.values(mat))if(val?.isTexture)textures.add(val);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
    environment?.dispose();renderer?.dispose();renderer?.forceContextLoss();
  }
  function fallback() {
    if(failed||destroyed)return;failed=true;cancelAnimationFrame(raf);raf=0;
    abort.abort();resizeObserver?.disconnect();intersection?.disconnect();disposeGPU();
    host.dataset.state='fallback';toggle.hidden=true;reset.hidden=true;labels.forEach(label=>label.disabled=true);
  }
  try {
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact?1.5:1.8));
    scene=new THREE.Scene();environment=lightWorld(renderer,scene,compact);
    world=buildWorld(compact);scene.add(world.root);
    animateWorld(world,elapsed);focusFrames=measureFocusFrames();
    updateFocusContext=makeFocusContext(world.root);
    labels.forEach(label=>label.disabled=false);

  } catch(error) { console.warn('GAAC Hero: static cover in use.',error);fallback();return ()=>{destroyed=true;}; }

  function updateMotion(){animateWorld(world,elapsed);host.dataset.phase='concurrent';host.dataset.elapsed=elapsed.toFixed(2);}
  const projected=new THREE.Vector3();
  function updateLabels(){
    if(!labels.length)return;
    world.root.updateMatrixWorld(true);camera.updateMatrixWorld();
    const {width,height}=host.getBoundingClientRect(),placed=[];
    labels.forEach((label,i)=>{
      label.setAttribute('aria-pressed',String(focus===i));
      // In a close-up, keep every destination in a stable HTML switcher.
      if(focus>=0)return;
      world.labelAnchors[i].getWorldPosition(projected);projected.project(camera);
      const w=label.offsetWidth,h=label.offsetHeight;
      const x=clamp((projected.x+1)*width/2,w/2+6,width-w/2-6);
      let y=clamp((1-projected.y)*height/2+(i>1?12:-12),h/2+7,height-h/2-10);
      // Keep four concise labels readable even when the visitor rotates the model.
      for(const other of placed)if(Math.abs(x-other.x)<(w+other.w)/2+5&&Math.abs(y-other.y)<(h+other.h)/2+6)y=clamp(other.y+(y<other.y?-1:1)*((h+other.h)/2+10),h/2+7,height-h/2-10);
      label.style.left=x+'px';label.style.top=y+'px';placed.push({x,y,w,h});
    });
  }
  function measureFocusFrames(){
    // Measure mesh bounds in camera space, rather than fitting one oversized
    // world-axis box around the roof and courtyard. Include instanced details.
    world.root.updateMatrixWorld(true);
    const orientation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
      new THREE.Vector3(Math.sin(view.azimuth)*Math.cos(view.pitch),Math.sin(view.pitch),Math.cos(view.azimuth)*Math.cos(view.pitch)),new THREE.Vector3(),new THREE.Vector3(0,1,0)));
    const inverse=orientation.clone().invert(),point=new THREE.Vector3(),box=new THREE.Box3();
    return world.focusTargets.map(group=>{
      const bounds=new THREE.Box3();
      group.traverse(mesh=>{if(!mesh.isMesh)return;box.setFromObject(mesh);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])bounds.expandByPoint(point.set(x,y,z).applyQuaternion(inverse));});
      return {center:bounds.getCenter(new THREE.Vector3()).applyQuaternion(orientation),size:bounds.getSize(new THREE.Vector3()),up:new THREE.Vector3(0,1,0).applyQuaternion(orientation)};
    });
  }
  function frameFocus(){
    targetGoal.copy(baseTarget);zoomGoal=1;
    if(focus<0)return;
    const frame=focusFrames[focus],{width,height}=host.getBoundingClientRect();
    // Reserve space for the destination switcher and overview control.
    // The roof/courtyard bounds contain empty corner space; use that space for
    // a closer view while retaining the full island width on narrow screens.
    zoomGoal=Math.min(3.5,(camera.right-camera.left)*(1-40/width)/frame.size.x,(camera.top-camera.bottom)*(1-100/height)*(focus===3?1.12:1.22)/frame.size.y);
    targetGoal.copy(frame.center).addScaledVector(frame.up,.12);
  }
  function updateCamera(dt) {
    const lerp=reduced.matches?1:1-Math.exp(-dt*6);
    if(!dragging && Math.abs(velocity)>.00002){yawGoal+=velocity*dt*60;velocity*=Math.exp(-dt*7);}
    yaw+=(yawGoal-yaw)*lerp;pitch+=(pitchGoal-pitch)*lerp;zoom+=(zoomGoal-zoom)*lerp;target.lerp(targetGoal,lerp);
    const azimuth=view.azimuth+yaw, radius=20;
    camera.position.set(target.x+Math.sin(azimuth)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,target.z+Math.cos(azimuth)*Math.cos(pitch)*radius);
    camera.lookAt(target);camera.zoom=zoom;camera.updateProjectionMatrix();
    settling=Math.abs(yawGoal-yaw)+Math.abs(pitchGoal-pitch)+Math.abs(zoomGoal-zoom)+target.distanceTo(targetGoal)+Math.abs(velocity)>.0002;
  }
  function render(now) {
    raf=0;if(destroyed||failed||!visible||document.hidden)return;
    if(previous && now-previous < (compact?1000/30:1000/60)-1){raf=requestAnimationFrame(render);return;}
    const dt=previous?Math.min((now-previous)/1000,.075):1/60;previous=now;
    if(playing)elapsed+=dt;
    updateFocusContext.restore();updateMotion();updateCamera(dt);updateLabels();
    settling=updateFocusContext.update(focus,dt,reduced.matches)||settling;
    try{renderer.render(scene,camera);}catch(error){console.warn('GAAC Hero render failed',error);fallback();return;}
    frames++;host.dataset.frames=String(frames);host.dataset.state='ready';
    if(playing||settling)raf=requestAnimationFrame(render);else previous=0;
  }
  function requestRender(){if(!raf&&!failed&&!destroyed&&visible&&!document.hidden)raf=requestAnimationFrame(render);}
  function suspend(){cancelAnimationFrame(raf);raf=0;previous=0;}
  function syncButton(){toggle.hidden=false;toggle.textContent=playing?'Ⅱ':'▶';toggle.setAttribute('aria-label',lang==='zh'?(playing?'暂停小世界动画':'继续小世界动画'):(playing?'Pause world animation':'Resume world animation'));toggle.setAttribute('aria-pressed',String(!playing));}
  function size(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);const aspect=width/height,h=Math.max(view.minHeight,view.width/aspect);camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();frameFocus();settling=true;requestRender();}
  resizeObserver=new ResizeObserver(size);resizeObserver.observe(host);
  intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;suspend();requestRender();},{threshold:.01});intersection.observe(host);
  listen(document,'visibilitychange',()=>{suspend();requestRender();});
  listen(toggle,'click',()=>{playing=!playing;syncButton();suspend();requestRender();});
  listen(reduced,'change',()=>{playing=!reduced.matches;velocity=0;yawGoal=0;pitchGoal=view.pitch;syncButton();suspend();requestRender();});
  function setFocus(index){focus=index;yawGoal=0;pitchGoal=view.pitch;velocity=0;if(index>=0)host.dataset.focus=String(index);else delete host.dataset.focus;frameFocus();reset.hidden=index<0;settling=true;requestRender();}
  labels.forEach((label,i)=>listen(label,'click',()=>setFocus(focus===i?-1:i)));
  listen(reset,'click',()=>{yawGoal=0;pitchGoal=view.pitch;velocity=0;setFocus(-1);reset.hidden=true;});
  const raycaster=new THREE.Raycaster();
  function pick(e){const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects(focus<0?world.focusTargets:[world.focusTargets[focus]],true);if(hits.length){let o=hits[0].object;while(o&&o.userData.island===undefined)o=o.parent;if(o)setFocus(focus===o.userData.island?-1:o.userData.island);}else setFocus(-1);}
  function hover(e){
    if(e.pointerType!=='mouse'||e.buttons||dragging||reduced.matches||e.target.closest('button'))return;
    const rect=host.getBoundingClientRect(),x=clamp((e.clientX-rect.left)/rect.width,0,1)*2-1,y=clamp((e.clientY-rect.top)/rect.height,0,1)*2-1;
    velocity=0;yawGoal=-x*(focus<0?.55:.22);pitchGoal=view.pitch+y*(focus<0?.12:.08);settling=true;requestRender();
  }
  listen(host,'pointerenter',hover);listen(host,'pointermove',hover);
  listen(host,'pointerleave',e=>{if(e.pointerType!=='mouse')return;yawGoal=0;pitchGoal=view.pitch;velocity=0;dragging=null;reset.hidden=focus<0;settling=true;requestRender();});
  // Mouse movement controls the view without a pressed button. Touch-action
  // preserves native vertical scroll. Capture touch only once a
  // clearly horizontal intent is established; a cancelled gesture never picks.
  listen(canvas,'pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;velocity=0;dragging={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,mode:e.pointerType==='touch'?'pending':'click'};});
  listen(canvas,'pointermove',e=>{
    if(!dragging||dragging.id!==e.pointerId)return;
    const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
    if(Math.hypot(dx,dy)>7)dragging.moved=true;
    if(dragging.mode==='pending'&&Math.hypot(dx,dy)>9){if(Math.abs(dx)>Math.abs(dy)*1.35){dragging.mode='rotate';canvas.setPointerCapture(e.pointerId);}else dragging.mode='scroll';}
    if(dragging.mode==='rotate'&&dragging.moved){const mx=e.clientX-dragging.lastX;velocity=reduced.matches?0:-mx*.002;yawGoal-=mx*.004;pitchGoal=clamp(pitchGoal+(e.clientY-dragging.lastY)*.003,.35,.91);reset.hidden=false;settling=true;requestRender();}
    dragging.lastX=e.clientX;dragging.lastY=e.clientY;
  });
  function end(e,cancel=false){if(!dragging||dragging.id!==e.pointerId)return;const click=!cancel&&!dragging.moved&&dragging.mode!=='scroll';dragging=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click)pick(e);requestRender();}
  listen(canvas,'pointerup',e=>end(e));listen(canvas,'pointercancel',e=>end(e,true));listen(canvas,'lostpointercapture',e=>{if(dragging)end(e,true);});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();fallback();});
  syncButton();size();
  return ()=>{if(destroyed)return;destroyed=true;suspend();abort.abort();resizeObserver.disconnect();intersection.disconnect();if(!failed)disposeGPU();};
}
