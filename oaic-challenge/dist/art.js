// A small, dependency-free sculptural study of the GAAC mark's open curves and peaks.
// This is live vector-like canvas motion, not an AI-generated film or recorded footage.
export function createSculpture(canvas, theme, toggle) {
  const ctx = canvas.getContext('2d');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let running = !media.matches, frame, destroyed = false, time = 0, last = 0, lastPaint = 0, visible = true;
  let width = 0, height = 0, pointerX = 0, pointerY = 0;
  const palette = theme === 'acid' ? [204, 248, 55] : theme === 'iris' ? [138, 230, 255] : [34, 74, 255];
  const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const unit = a => {const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function rotate(p, ax, ay, az) {
    let [x,y,z] = p, c=Math.cos(ax),s=Math.sin(ax); [y,z]=[y*c-z*s,y*s+z*c];
    c=Math.cos(ay);s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];
    c=Math.cos(az);s=Math.sin(az);return [x*c-y*s,x*s+y*c,z];
  }
  const curves = [0,1].map(k => {
    const points = [], N = 128, F = 32;
    const center = t => {
      const r = theme === 'acid' ? 1.21 + .08*Math.cos(3*t) : 1.22 + .23*Math.cos(3*t);
      const p = [r*Math.sin(t),r*Math.cos(t),.18*Math.sin(2*t)];
      const q = rotate(p, k ? -.48 : .35, k ? .86 : -.22, k ? -.35 : .12);
      return [q[0]+(k?.39:-.39), q[1]+(k?-.13:.14),q[2]+(k?.24:-.24)];
    };
    for(let i=0;i<=N;i++){
      const t = .18 + (Math.PI*2-.62)*i/N;
      const p = center(t), p2=center(t+.001), tangent=unit(p2.map((v,j)=>v-p[j]));
      const normal = unit(cross(tangent,[0,0,1])), binormal=unit(cross(tangent,normal));
      const ring=[];
      for(let j=0;j<F;j++){
        const a=2*Math.PI*j/F, radius=theme==='iris'?.19:.205;
        const n = normal.map((v,d)=>v*Math.cos(a)+binormal[d]*Math.sin(a));
        ring.push({p:p.map((v,d)=>v+n[d]*radius),n});
      }
      points.push(ring);
    }
    return {points,N,F};
  });
  function draw(now=0) {
    if(destroyed || !visible || document.hidden) return;
    if(running && lastPaint && now-lastPaint>=0 && now-lastPaint<32){frame=requestAnimationFrame(draw);return;}
    lastPaint=now;
    if(running&&last)time+=Math.min(now-last,40)*.00013;
    last=now;
    ctx.clearRect(0,0,width,height);
    const scale=Math.min(width/4.8,height/4.5);
    const offY=height*.49 + Math.sin(time*1.5)*6;
    const ax=-.19 + Math.sin(time)*.13 + pointerY*.06;
    const ay=-.30 + Math.cos(time*.7)*.10 + pointerX*.08;
    const az=theme==='iris' ? -.10 : -.18;
    // A softly grounded shadow keeps the geometry physical without a background image.
    ctx.save();ctx.translate(width*.51,height*.79);ctx.scale(1,.20);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,width*.31);
    shadow.addColorStop(0,theme==='acid'?'#00000080':theme==='iris'?'#102c3a25':'#28245a25');shadow.addColorStop(1,'#00000000');
    ctx.fillStyle=shadow;ctx.fillRect(-width*.4,-width*.4,width*.8,width*.8);ctx.restore();
    const project = p => { const f=6/(6+p[2]);return [width*.50+p[0]*scale*f,offY-p[1]*scale*f]; };
    const faces=[];
    const light=unit([-.5,.8,-1.3]);
    for(let k=0;k<curves.length;k++){
      const {points,N,F}=curves[k];
      const pp=points.map(ring=>ring.map(v=>({p:rotate(v.p,ax,ay,az),n:rotate(v.n,ax,ay,az)})));
      for(let i=0;i<N;i++)for(let j=0;j<F;j++){
        const verts=[pp[i][j],pp[i+1][j],pp[i+1][(j+1)%F],pp[i][(j+1)%F]];
        const n=unit(verts.reduce((s,v)=>s.map((a,d)=>a+v.n[d]),[0,0,0]));
        const diffuse=Math.max(0,dot(n,light));
        const spec=Math.pow(Math.max(0,dot(n,unit([-.36,.48,-1.8]))),25);
        const edge=Math.pow(1-Math.abs(n[2]),3)*.10;
        const bright=.24+diffuse*.78+edge;
        const rgb=palette.map((v,d)=>Math.min(255,v*bright+spec*(d===2?65:110)));
        faces.push({v:verts.map(v=>project(v.p)),z:verts.reduce((s,v)=>s+v.p[2],0)/4,c:`rgb(${rgb.map(Math.round).join(',')})`});
      }
      // Close both cut faces; their visible openings echo the broken C and G in the mark.
      for(const i of [0,N]){
        const verts=pp[i];
        faces.push({v:verts.map(v=>project(v.p)),z:verts.reduce((s,v)=>s+v.p[2],0)/F,c:theme==='acid'?'#899b34':theme==='iris'?'#28667C':'#1230ab'});
      }
    }
    faces.sort((a,b)=>b.z-a.z);
    for(const face of faces){ctx.beginPath();face.v.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=face.c;ctx.strokeStyle=face.c;ctx.lineWidth=.55;ctx.fill();ctx.stroke();}
    if(running)frame=requestAnimationFrame(draw);
  }
  function size(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(!running)draw();}
  const observer=new ResizeObserver(size);observer.observe(canvas);
  const sync=()=>{toggle.textContent=running?'Ⅱ':'▶';toggle.setAttribute('aria-label',running?'Pause sculpture motion':'Play sculpture motion');toggle.setAttribute('aria-pressed',String(running));};
  const onClick=()=>{running=!running;cancelAnimationFrame(frame);last=0;sync();draw();};
  const onMedia=()=>{running=!media.matches;cancelAnimationFrame(frame);last=0;sync();draw();};
  const onMove=e=>{const r=canvas.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;};
  toggle.addEventListener('click',onClick);media.addEventListener('change',onMedia);canvas.addEventListener('pointermove',onMove);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;cancelAnimationFrame(frame);last=0;if(visible)draw();});
  visibilityObserver.observe(canvas);
  const onVisibility=()=>{cancelAnimationFrame(frame);last=0;if(!document.hidden)draw();};
  document.addEventListener('visibilitychange',onVisibility);
  size();sync();draw();canvas.dataset.ready='true';
  return ()=>{destroyed=true;cancelAnimationFrame(frame);observer.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',onVisibility);toggle.removeEventListener('click',onClick);media.removeEventListener('change',onMedia);canvas.removeEventListener('pointermove',onMove);};
}
