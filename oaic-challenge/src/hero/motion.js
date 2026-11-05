import * as THREE from 'three';
import {phase,smooth,wave} from './timeline.js';
const ice=new THREE.Color('#D6EBF1'),blue=new THREE.Color('#27B8DE');
export function animateWorld(w,t){
  w.root.position.y=Math.sin(t*.65)*.024;
  w.slides.forEach((s,i)=>{s.rotation.y=(1-i)*.12+Math.sin(t*.65+i)*.045;s.position.y=s.userData.baseY+Math.sin(t*.9+i)*.018;});
  w.modules.forEach(({object,base,offset,axis})=>{object.position.copy(base);object.position[axis]+=(wave(t,7.2,offset)-.5)*(axis==='x'?.22:.1);});
  w.pptCards.forEach((card,i)=>{card.position.y=.96+Math.sin(t*1.05+i*2)*.1;card.rotation.z=Math.sin(t*.8+i)*.045;});
  w.editFrames.forEach((o,i)=>o.scale.setScalar(1+Math.sin(t*1.2+i)*.008));
  w.rows.forEach((mat,i)=>{const a=(t*.9-i*.57),lit=Math.pow((Math.cos(a)+1)/2,9);mat.color.copy(ice).lerp(blue,.14+lit*.7);});
  w.bars.forEach(({object,height},i)=>{const scale=.56+.44*wave(t,6.4,i*.45+1.1);object.scale.y=scale;object.position.y=.65+height*scale/2;});
  const q=phase(t,0,5.2)/5.2;w.lineTrace.geometry.setDrawRange(0,Math.floor(w.lineCount*smooth(q)/6)*6);w.lineTrace.material.opacity=smooth(q/.12)*(1-smooth((q-.84)/.16));w.lineDot.position.copy(w.line.userData.curve.getPoint(smooth(q)));w.lineDot.scale.setScalar(smooth(q/.1)*(1-smooth((q-.9)/.1)));
  const turn=Math.PI*wave(t,8.4,2.1),curl=Math.cos(turn);
  w.turningPage.rotation.z=turn;
  // Reverse the curl across the spine so the sheet and its print stay above
  // the open spread on both sides. Avoid a singular transform at mid-turn.
  w.turningSheet.scale.y=Math.abs(curl)<.0001?(curl<0?-.0001:.0001):curl;
  w.reports.forEach((page,i)=>{page.position.x=1.24+Math.sin(t*.8+i*.7)*.045;page.rotation.z=-.04+i*.035+Math.sin(t*.75+i*.8)*.025;});
  w.sources.forEach((card,i)=>{const u=phase(t,-i*2.8,8.4)/8.4,p=smooth(u),fade=smooth(u/.16)*(1-smooth((u-.76)/.24));card.position.set(-1.35+p*2.58,1.12+Math.sin(p*Math.PI)*.66,.1+p*.42);card.rotation.set(-.1,0,(1-p)*.15);card.scale.setScalar(.05+fade*.95);card.visible=fade>.005;});
  w.evidence.material.opacity=.24+.2*wave(t,4.2);
  w.ring.material.emissiveIntensity=.4+.25*wave(t,3.8);
  w.serverLights.forEach((led,i)=>led.material.emissiveIntensity=.35+.9*wave(t,2.7,i*.6));
  w.particles.forEach(({object,curve,offset,island})=>{const u=phase(t*.125+offset+island*.16,0,1);object.position.copy(curve.getPoint(u));object.position.y+=.16;object.scale.setScalar(smooth(u/.08)*(1-smooth((u-.92)/.08)));});
  w.trees.forEach((tree,i)=>tree.rotation.z=Math.sin(t*.7+i*1.2)*.02);
}
