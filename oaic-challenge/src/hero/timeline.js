// All three workspaces run concurrently. Independent smooth periods overlap;
// no stage selector, global reset or t * changing-speed path discontinuity.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const phase=(time,offset=0,duration=8)=>((time-offset)%duration+duration)%duration;
export const wave=(time,period=8,offset=0)=>(1-Math.cos((time+offset)*Math.PI*2/period))*.5;
export function concurrentState(t){return {layout:wave(t,7.2),finance:wave(t,6.4,1.1),research:wave(t,8.4,2.1)};}
