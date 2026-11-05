import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// The palette deliberately includes deeper optical blues: pale cyan alone gets
// bleached by daylight. Porcelain, glass and structural metal stay distinguishable.
export function makeKit(compact) {
  const materials = {
    porcelain: new THREE.MeshStandardMaterial({color:'#FFFFFF',roughness:.68}),
    ice: new THREE.MeshStandardMaterial({color:'#D6EBF1',roughness:.62}),
    blue: new THREE.MeshStandardMaterial({color:'#27B8DE',roughness:.32,metalness:.12}),
    sky: new THREE.MeshStandardMaterial({color:'#8AE6FF',roughness:.28,metalness:.1}),
    ink: new THREE.MeshStandardMaterial({color:'#102C3A',roughness:.42,metalness:.3}),
    line: new THREE.MeshStandardMaterial({color:'#48778C',roughness:.54}),
    facade: new THREE.MeshPhysicalMaterial({color:'#32BADD',roughness:.23,metalness:.08,clearcoat:.8,clearcoatRoughness:.16,transmission:compact?0:.12,thickness:.12,transparent:true,opacity:.82,side:THREE.DoubleSide}),
    glass: new THREE.MeshPhysicalMaterial({color:'#37C9EB',roughness:.2,metalness:.05,transmission:compact?0:.15,transparent:true,opacity:.78,thickness:.22,ior:1.3,depthWrite:false,side:THREE.DoubleSide}),
    signal: new THREE.MeshStandardMaterial({color:'#8AE6FF',emissive:'#37C9EB',emissiveIntensity:.65,roughness:.3}),
  };
  const geometries=new Map();
  function cached(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function mesh(parent,geo,mat,x=0,y=0,z=0){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=!mat.transparent;o.receiveShadow=true;parent.add(o);return o;}
  function box(parent,w,h,d,mat,x=0,y=0,z=0,r=.025){return mesh(parent,cached(`b:${w}:${h}:${d}:${r}`,()=>new RoundedBoxGeometry(w,h,d,compact?2:3,Math.min(r,w/3,h/3,d/3))),mat,x,y,z);}
  function cylinder(parent,r,h,mat,x=0,y=0,z=0){return mesh(parent,cached(`c:${r}:${h}`,()=>new THREE.CylinderGeometry(r,r,h,compact?40:64)),mat,x,y,z);}
  function tube(parent,points,r,mat){const curve=points instanceof THREE.Curve?points:new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=mesh(parent,new THREE.TubeGeometry(curve,compact?28:48,r,6,false),mat);o.userData.curve=curve;return o;}
  // Repeated books, table cells, server trays and vents share one draw call.
  function boxes(parent,items,mat){const o=new THREE.InstancedMesh(cached('unit-box',()=>new THREE.BoxGeometry(1,1,1)),mat,items.length),dummy=new THREE.Object3D();items.forEach((v,i)=>{dummy.position.set(v[0],v[1],v[2]);dummy.scale.set(v[3],v[4],v[5]);dummy.rotation.set(0,v[6]||0,0);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(v[7])o.setColorAt(i,new THREE.Color(v[7]));});o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function island(parent,w,d,y){const group=new THREE.Group();group.position.y=y;parent.add(group);const s=new THREE.Shape();s.moveTo(-w*.5,-d*.18);s.bezierCurveTo(-w*.56,-d*.6,-w*.13,-d*.53,w*.18,-d*.47);s.bezierCurveTo(w*.51,-d*.52,w*.56,-d*.24,w*.49,d*.11);s.bezierCurveTo(w*.53,d*.44,w*.16,d*.57,-w*.1,d*.48);s.bezierCurveTo(-w*.38,d*.5,-w*.55,d*.25,-w*.5,-d*.18);
    for(let i=0;i<3;i++){const geo=new THREE.ExtrudeGeometry(s,{depth:i?.07:.28,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.05,curveSegments:compact?14:24});geo.rotateX(-Math.PI/2);const o=mesh(group,geo,i===1?materials.ice:materials.porcelain,0,i===0?0:.31+(i-1)*.12,0);o.scale.setScalar(1-i*.065);}return group;}
  function roof(parent,width,depth,y){const n=40,s=new THREE.Shape(),height=t=>.24*Math.sin(t*Math.PI*2-.8)+.06*Math.cos(t*Math.PI);s.moveTo(-width/2,y+height(0));for(let i=1;i<=n;i++)s.lineTo((i/n-.5)*width,y+height(i/n));for(let i=n;i>=0;i--)s.lineTo((i/n-.5)*width,y+height(i/n)-.09);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:depth-.12,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:3,steps:1});geo.translate(0,0,-depth/2+.06);const underside=mesh(parent,geo,materials.ice);underside.position.y=-.065;mesh(parent,geo,materials.porcelain);return height;}
  function pavilion(parent,width,depth,height,z){const group=new THREE.Group();parent.add(group);group.position.set(0,.53,z);const wave=roof(group,width+.2,depth,height);const frames=[],panes=[];
    for(let i=0;i<9;i++){const x=(i/8-.5)*width*.9,h=height+wave(i/8)-.1;frames.push([x,h/2,-depth*.34,.04,h,.05]);if(i<8)panes.push([x+width*.9/16,h/2,-depth*.34,width*.9/8-.04,h-.1,.025]);}
    boxes(group,frames,materials.ink);boxes(group,panes,materials.facade);box(group,width*.9,.045,.08,materials.sky,0,.55,-depth*.31);box(group,width*.9,.045,.08,materials.sky,0,1.12,-depth*.31);return group;}
  function bridge(parent,start,end){const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),curve=new THREE.CubicBezierCurve3(a,a.clone().lerp(b,.3).add(new THREE.Vector3(-.28,.24,.44)),a.clone().lerp(b,.73).add(new THREE.Vector3(.2,.18,.3)),b);const pos=[],idx=[],rails=[[],[]],posts=[],n=40,width=.54;
    for(let i=0;i<=n;i++){const p=curve.getPoint(i/n),t=curve.getTangent(i/n),side=new THREE.Vector3(-t.z,0,t.x).normalize();for(const sign of [-1,1]){const v=p.clone().addScaledVector(side,sign*width/2);pos.push(v.x,v.y,v.z);rails[sign===-1?0:1].push(v.clone());if(i%8===0)posts.push([v.x,v.y+.12,v.z,.018,.25,.018]);}if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(parent,geo,materials.glass);
    for(const edge of rails){tube(parent,new THREE.CatmullRomCurve3(edge),.025,materials.blue);const top=edge.map(v=>v.clone().add(new THREE.Vector3(0,.25,0)));tube(parent,new THREE.CatmullRomCurve3(top),.017,materials.sky);const wall=[],wi=[];edge.forEach((v,i)=>{wall.push(v.x,v.y,v.z,v.x,v.y+.25,v.z);if(i<n){const a=i*2;wi.push(a,a+1,a+2,a+1,a+3,a+2);}});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(wall,3));g.setIndex(wi);g.computeVertexNormals();mesh(parent,g,materials.glass);}boxes(parent,posts,materials.line);return curve;}
  function tree(parent,x,z,size=1){const tree=new THREE.Group();tree.position.set(x,.52,z);tree.scale.setScalar(size);parent.add(tree);cylinder(tree,.2,.1,materials.porcelain,0,.05);cylinder(tree,.155,.025,materials.line,0,.108);cylinder(tree,.025,.55,materials.ink,0,.37);const leaves=new THREE.InstancedMesh(cached('leaf',()=>new THREE.IcosahedronGeometry(.13,1)),materials.ice,compact?8:15),dummy=new THREE.Object3D();for(let i=0;i<leaves.count;i++){const a=i*2.4;dummy.position.set(Math.cos(a)*(.1+i%3*.04),.58+(i%4)*.07,Math.sin(a)*.16);dummy.scale.set(.9,1.2,.9);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color(i%3===0?'#63B7CC':'#D7F3F8'));}leaves.castShadow=true;tree.add(leaves);return tree;}
  function landscape(parent,w,d){const rails=[],posts=[];for(let j=0;j<=32;j++){const a=-Math.PI*.12+j/32*Math.PI*1.25;const p=[Math.cos(a)*w*.44,.87,-Math.sin(a)*d*.43];rails.push(p);if(j%4===0)posts.push([p[0],.69,p[2],.025,.35,.025]);}tube(parent,rails,.018,materials.ink);boxes(parent,posts,materials.line);
    for(let j=0;j<4;j++)box(parent,1.0-j*.05,.06,.27,materials.porcelain,-.35,.16+j*.09,d*.5-j*.18);
    const seams=[];for(let j=0;j<5;j++)seams.push([-.9+j*.43,.505,.75,.008,.006,.7]);boxes(parent,seams,materials.line);
    for(const x of [-1.35,1.35]){box(parent,.48,.13,.26,materials.porcelain,x,.58,.76);const leaves=[];for(let j=0;j<6;j++)leaves.push([x-.18+j*.07,.68+(j%2)*.04,.76,.08,.12,.14,0,j%2?'#5CAEC4':'#A2DAE6']);boxes(parent,leaves,materials.blue);}}
  return {materials,mesh,box,boxes,cylinder,tube,island,pavilion,roof,bridge,tree,landscape};
}

function presentations(k,parent){const m=k.materials,slides=[],modules=[],editFrames=[];k.pavilion(parent,3.75,1.45,2.14,-.61);
  for(let i=0;i<3;i++){const slide=new THREE.Group();parent.add(slide);slide.position.set((i-1)*1.12,1.42,i===1?.35:.06);slide.rotation.y=(1-i)*.12;slide.userData.baseY=1.42;slides.push(slide);k.box(slide,1.5,1.02,.08,m.ink);k.box(slide,1.45,.97,.03,m.sky,0,0,.045);k.box(slide,1.37,.87,.025,m.porcelain,0,-.015,.069);const pieces=[];
    pieces.push(k.box(slide,.75,.065,.018,m.ink,-.21,.3,.09,.006));
    if(i===0){pieces.push(k.box(slide,.7,.35,.02,m.blue,-.25,-.03,.09));const mountain=new THREE.Shape();mountain.moveTo(-.3,0);mountain.lineTo(-.05,.23);mountain.lineTo(.09,.06);mountain.lineTo(.21,.16);mountain.lineTo(.35,0);const mg=new THREE.ShapeGeometry(mountain);k.mesh(slide,mg,m.sky,-.25,-.2,.105);}
    else if(i===1){for(let j=0;j<3;j++)pieces.push(k.box(slide,.28,.19,.025,j%2?m.blue:m.sky,-.46+j*.42,.03,.09));}
    else{const donut=k.mesh(slide,new THREE.TorusGeometry(.2,.045,8,32),m.blue,.27,.01,.1);donut.rotation.z=.3;for(let j=0;j<3;j++)pieces.push(k.box(slide,.14,.1+j*.06,.025,m.blue,-.5+j*.2,-.16+j*.03,.09));}
    for(let j=0;j<3;j++)pieces.push(k.box(slide,i===0?.28:.92-j*.08,.025,.015,m.line,i===0?.4:-.08,-.21-j*.07,.09,.004));
    pieces.forEach((object,j)=>modules.push({object,base:object.position.clone(),offset:i*.8+j*.35,axis:j%2?'x':'y'}));
    const outline=k.tube(slide,[[-.77,-.53,.11],[-.77,.53,.11],[.77,.53,.11],[.77,-.53,.11],[-.77,-.53,.11]],.009,m.blue);editFrames.push(outline);
    for(const x of [-.77,.77])for(const y of [-.53,.53])k.box(slide,.06,.06,.02,m.sky,x,y,.12,.006);
    k.box(parent,.035,.36,.05,m.ink,slide.position.x,.72,slide.position.z);
  }
  const cards=[];for(let i=0;i<2;i++){const card=new THREE.Group();parent.add(card);card.position.set(-.5+i*1.25,.95,1.03);card.rotation.x=-.16;k.box(card,.67,.39,.04,m.sky);k.box(card,.59,.31,.02,m.porcelain,0,0,.03);if(i===0)k.box(card,.2,.19,.02,m.blue,-.12,0,.05);else for(let j=0;j<3;j++)k.box(card,.09,.09+j*.04,.02,m.blue,-.14+j*.14,-.05+j*.02,.05);cards.push(card);}return {slides,modules,editFrames,pptCards:cards};
}
function financials(k,parent){const m=k.materials;k.pavilion(parent,3.7,1.25,2.15,-.73);const table=new THREE.Group();parent.add(table);table.position.set(-.48,1.42,-.4);k.box(table,2.15,1.33,.07,m.ink);k.box(table,2.07,1.25,.025,m.porcelain,0,0,.05);k.box(table,1.98,.18,.02,m.blue,0,.5,.075);const rows=[];
  for(let r=0;r<6;r++){const mat=m.ice.clone();k.box(table,1.98,.14,.012,mat,0,.29-r*.165,.075,.003);rows.push(mat);const cells=[];for(let c=0;c<4;c++)for(let b=0;b<3;b++)cells.push([-.83+c*.49+b*.055,.29-r*.165,.09,.025,.035,.01]);k.boxes(table,cells,m.line);}
  const columns=[];for(let i=0;i<4;i++)columns.push([-.5+i*.49,0,.095,.01,1.17,.012]);k.boxes(table,columns,m.porcelain);
  const bars=[];k.box(parent,2.62,.1,.72,m.ink,.23,.58,.68);
  for(let i=0;i<5;i++){const h=.42+i*.21,x=-.76+i*.49;const bar=k.box(parent,.31,h,.38,m.blue,x,.65+h/2,.68);k.box(bar,.28,.025,.35,m.sky,0,h/2,0);k.box(bar,.035,h-.04,.018,m.sky,-.12,0,.198,.005);bars.push({object:bar,height:h});}
  const chart=new THREE.Group();parent.add(chart);chart.position.set(.72,1.65,-.07);k.box(chart,1.82,1.02,.025,m.glass);const graph=[[-.78,-.31,.05],[-.5,-.15,.05],[-.22,-.21,.05],[.04,.07,.05],[.32,.02,.05],[.77,.35,.05]];const line=k.tube(chart,graph,.021,m.ink);const trace=k.tube(chart,graph.map(p=>[p[0],p[1],p[2]+.016]),.013,m.signal.clone());trace.material.transparent=true;const dot=k.mesh(chart,new THREE.SphereGeometry(.045,12,8),m.signal);return {rows,bars,line,lineTrace:trace,lineDot:dot,lineCount:trace.geometry.index.count};
}
function library(k,parent){const m=k.materials,shelf=k.pavilion(parent,3.7,1.04,1.75,-.6);const books=[];
  for(let r=0;r<3;r++){k.box(shelf,3.25,.055,.34,m.porcelain,0,.12+r*.39,.03);for(let i=0;i<22;i++)books.push([-1.5+i*.142,.29+r*.39,.04,.085,.27+(i%3)*.025,.2,0,['#102C3A','#328EAC','#8AE6FF','#F4FAFC'][i%4]]);}
  k.boxes(shelf,books,m.porcelain);for(let i=0;i<5;i++)k.box(shelf,.045,1.28,.34,m.ink,-1.62+i*.81,.7,.03);
  const reports=[];for(let i=0;i<4;i++){const page=new THREE.Group();parent.add(page);page.position.set(1.24,.77+i*.12,.54-i*.065);page.rotation.set(-.35,0,-.04+i*.035);k.box(page,.73,.9,.035,m.porcelain);k.box(page,.46,.06,.018,m.blue,0,.28,.026);const rules=[];for(let j=0;j<5;j++)rules.push([-(j%2)*.035,.1-j*.08,.026,.48-(j%2)*.07,.024,.014]);k.boxes(page,rules,m.line);reports.push(page);}
  const book=new THREE.Group();parent.add(book);book.position.set(-.35,.66,.78);book.rotation.x=-.1;k.box(book,2.05,.07,1.23,m.ink);k.box(book,1.97,.08,1.16,m.ice,0,.06,0);
  function page(side,y){const group=new THREE.Group();book.add(group);group.position.y=y;const pos=[],idx=[],n=24;for(let i=0;i<=n;i++){const t=i/n;for(const z of [-.54,.54])pos.push(side*t*.95,.13*Math.sin(t*Math.PI)+.055*(1-t),z);if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();k.mesh(group,geo,new THREE.MeshStandardMaterial({color:'#FFFFFF',roughness:.8,side:THREE.DoubleSide}));for(let j=0;j<7;j++)k.tube(group,[[side*.14,.12,-.36+j*.105],[side*.43,.18,-.36+j*.105],[side*.8,.11,-.36+j*.105]],.007,m.line);const illustration=k.box(group,.24,.013,.25,m.blue,side*.56,.195,-.21,.01);illustration.rotation.z=-side*.02;return group;}
  for(let j=0;j<2;j++){page(-1,.1+j*.025);page(1,.1+j*.025);}const turningPage=page(1,.17),turningSheet=new THREE.Group();turningSheet.add(...turningPage.children);turningPage.add(turningSheet);
  const sources=[];for(let i=0;i<3;i++){const card=new THREE.Group();parent.add(card);k.box(card,.6,.49,.035,m.sky);k.box(card,.54,.43,.025,m.porcelain,0,0,.028);k.box(card,.13,.21,.015,m.blue,-.15,.01,.05);for(let j=0;j<3;j++)k.box(card,.2,.02,.014,m.line,.07,.1-j*.085,.05,.004);sources.push(card);}
  const evidence=k.tube(parent,[[-1.32,1.2,.2],[-.25,1.65,.4],[1.15,1.2,.48]],.014,m.signal.clone());evidence.material.transparent=true;evidence.material.depthWrite=false;return {reports,turningPage,turningSheet,sources,evidence};
}
function computeCenter(k,root){const m=k.materials,node=new THREE.Group();root.add(node);node.position.set(-2.5,.08,2.4);k.cylinder(node,1.48,.22,m.porcelain,0,.12);k.cylinder(node,1.36,.1,m.ink,0,.27);k.cylinder(node,1.32,.075,m.blue,0,.36);
  // Open front exposes the equipment. The upper annulus is a real cutaway roof.
  const shell=k.mesh(node,new THREE.CylinderGeometry(1.24,1.24,1.53,48,1,true,Math.PI*.5,Math.PI),m.glass,0,1.16);shell.rotation.y=0;
  const cap=k.mesh(node,new THREE.RingGeometry(1.16,1.37,64),m.porcelain,0,1.99);cap.rotation.x=-Math.PI/2;
  k.cylinder(node,1.2,.035,m.glass,0,1.98);
  for(const x of [-.7,.7]){k.box(node,.43,.025,.45,m.ink,x,2.025,-.2);const fan=k.mesh(node,new THREE.TorusGeometry(.14,.016,6,24),m.line,x,2.044,-.2);fan.rotation.x=-Math.PI/2;}
  const rim=k.mesh(node,new THREE.TorusGeometry(1.3,.065,10,64),m.porcelain,0,2.0);rim.rotation.x=Math.PI/2;
  const ring=k.mesh(node,new THREE.TorusGeometry(1.34,.025,8,64),m.signal.clone(),0,.39);ring.rotation.x=Math.PI/2;
  const posts=[];for(let i=0;i<7;i++){const a=-Math.PI/2+i/6*Math.PI;posts.push([Math.sin(a)*1.24,1.17,-Math.cos(a)*1.24,.045,1.55,.045]);}k.boxes(node,posts,m.ink);
  const trays=[],vents=[],status=[],serverLights=[];
  for(let i=0;i<4;i++){const x=-.87+i*.58;k.box(node,.48,1.27,.48,m.ink,x,1.08,.28,.045);k.box(node,.39,1.16,.025,m.line,x,1.09,.535,.012);
    for(let j=0;j<6;j++){const y=.62+j*.172;trays.push([x,y,.559,.35,.125,.026]);status.push([x+.11,y,.583,.06,.021,.012]);for(let v=0;v<4;v++)vents.push([x-.12+v*.04,y,.582,.018,.05,.014]);}
    const light=k.box(node,.07,.024,.015,m.signal.clone(),x+.1,1.58,.59,.005);serverLights.push(light);
    k.tube(node,[[x,.46,.57],[x,.4,.78],[x,.4,1.03],[x-.05,.4,1.2]],.018,m.line);
    k.tube(node,[[x,1.74,.08],[x,1.85,-.36],[x,1.77,-.8],[x,.44,-.82]],.016,m.sky);
  }
  k.boxes(node,trays,m.ink);k.boxes(node,vents,m.sky);k.boxes(node,status,m.signal);const floor=[];for(let i=0;i<14;i++)floor.push([-.98+i*.15,.416,.5,.018,.008,1.08]);k.boxes(node,floor,m.line);
  for(let j=0;j<4;j++)k.box(node,1.15,.06,.26,m.porcelain,0,.09+j*.08,1.58-j*.17);
  return {node,ring,serverLights};
}
export function buildWorld(compact=false){const root=new THREE.Group(),k=makeKit(compact),m=k.materials;
  const ppt=k.island(root,4.45,3.25,.1);ppt.position.x=-3.3;ppt.position.z=-2.3;
  const finance=k.island(root,4.3,3.25,.3);finance.position.x=3.3;finance.position.z=-2.4;
  const research=k.island(root,4.55,3.1,.03);research.position.x=3.15;research.position.z=3.15;
  const islands=[ppt,finance,research];islands.forEach((o,i)=>o.userData.island=i);
  const work={...presentations(k,ppt),...financials(k,finance),...library(k,research),...computeCenter(k,root)};
  const trees=[];islands.forEach((g,i)=>{k.landscape(g,4.35,3.2);trees.push(k.tree(g,-1.78,.25,.83));trees.push(k.tree(g,1.75,-.55,.75));});
  const curves=[k.bridge(root,[-3.35,.48,1.3],[-4.25,.67,-.82]),k.bridge(root,[-1.3,.48,1.72],[1.7,.88,-1.0]),k.bridge(root,[-1.2,.48,2.9],[1.23,.55,3.1])];
  const particles=[];curves.forEach((curve,i)=>{for(let j=0;j<(compact?3:5);j++){const object=k.mesh(root,new THREE.SphereGeometry(.062,10,8),m.signal);object.castShadow=false;particles.push({object,curve,offset:j/(compact?3:5),island:i});}});
  const labelAnchors=[];for(const [parent,position] of [[ppt,[0,3.15,-.55]],[finance,[.15,3.22,-.6]],[research,[.35,.22,1.8]],[work.node,[0,.08,1.86]]]){const anchor=new THREE.Object3D();anchor.position.set(...position);parent.add(anchor);labelAnchors.push(anchor);}
  work.node.userData.island=3;
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),grad=ctx.createRadialGradient(64,64,5,64,64,64);grad.addColorStop(0,'rgba(14,51,70,.48)');grad.addColorStop(.45,'rgba(21,70,91,.26)');grad.addColorStop(1,'rgba(21,70,91,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(c);
  for(const g of [...islands,work.node]){const sh=k.mesh(root,new THREE.PlaneGeometry(g===work.node?4.6:6.2,g===work.node?4:4.9),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),g.position.x,-.12,g.position.z);sh.rotation.x=-Math.PI/2;sh.castShadow=sh.receiveShadow=false;sh.userData.focusOwner=g.userData.island;}
  return {root,islands,focusTargets:[...islands,work.node],trees,particles,labelAnchors,shadowTexture,...work};
}
