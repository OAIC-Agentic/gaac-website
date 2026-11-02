import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Liquid} from 'liquid-gooey';

const stepIcons=['layers','user','users-alt','calendar-clock','trophy','rocket-lunch'];
const Icon=({name,className=''})=><i className={'gaac-icon gi-'+name+' '+className} aria-hidden="true"/>;

function useMedia(query){
  const [matches,setMatches]=useState(()=>window.matchMedia(query).matches);
  useEffect(()=>{const media=window.matchMedia(query);const update=()=>setMatches(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[query]);
  return matches;
}

function LiquidMarker({position,reduced}){
  if(!position)return null;
  const {x,y,size}=position;
  if(reduced)return <div className="liquid-static-marker" style={{width:size,height:size,transform:'translate('+x+'px,'+y+'px)'}}/>;
  return <Liquid className="liquid-marker-layer" blur={6} contrast={18} fill="var(--accent)" shadow="0 5px 16px rgba(24,111,144,.14), inset 0 1px 0 rgba(255,255,255,.85)" filterPadding={40}>
    <Liquid.Item x={x+size*.25} y={y+size*.25} transition="bouncy" delay={45} radius={size*.275} style={{position:'absolute',left:0,top:0,width:size*.55,height:size*.55,lineHeight:0}}><div className="liquid-marker-drop" style={{width:size*.55,height:size*.55}}/></Liquid.Item>
    <Liquid.Item x={x} y={y} transition="bouncy" radius={size/2} style={{position:'absolute',left:0,top:0,width:size,height:size,lineHeight:0}}><div className="liquid-marker-orb" style={{width:size,height:size}}/></Liquid.Item>
  </Liquid>;
}

function Guide({steps,lang,initialId,onSelect}){
  const zh=lang==='zh';const t=(en,cn)=>zh?cn:en;
  const [active,setActive]=useState(()=>Math.max(0,steps.findIndex(s=>s.id===initialId)));
  const [position,setPosition]=useState(null);
  const listRef=useRef(null);const buttonRefs=useRef([]);const panelRef=useRef(null);const hoverTimer=useRef(0);
  const reduced=useMedia('(prefers-reduced-motion: reduce)');const fine=useMedia('(hover: hover) and (pointer: fine)');const mobile=useMedia('(max-width: 760px)');
  const selected=steps[active];
  const shortTitles=zh?['比赛任务','参赛资格','报名组队','比赛安排','评分奖金','赛后机会']:['Tasks','Eligibility','Teams','Format','Scoring','Afterward'];
  useLayoutEffect(()=>{
    const list=listRef.current;const icon=buttonRefs.current[active]?.querySelector('.glass-step-icon');if(!list||!icon)return;
    const measure=()=>{const l=list.getBoundingClientRect();const b=icon.getBoundingClientRect();setPosition({x:b.left-l.left-3,y:b.top-l.top-3,size:b.width+6});};
    measure();const observer=new ResizeObserver(measure);observer.observe(list);observer.observe(icon);window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[active,mobile]);
  useEffect(()=>{onSelect?.(selected.id);},[selected.id,onSelect]);
  useEffect(()=>()=>clearTimeout(hoverTimer.current),[]);
  function choose(index){clearTimeout(hoverTimer.current);setActive(index);}
  function hover(index){if(!fine)return;clearTimeout(hoverTimer.current);hoverTimer.current=setTimeout(()=>setActive(index),90);}
  function keyboard(event,index){
    const moves={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1};let next;
    if(event.key in moves)next=(index+moves[event.key]+steps.length)%steps.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=steps.length-1;else return;
    event.preventDefault();choose(next);buttonRefs.current[next]?.focus({preventScroll:true});
  }
  function advance(next){choose(next);}
  return <div className="liquid-guide-layout">
    <aside className="glass-steps-rail glass-surface">
      <div className="glass-rail-caption"><Icon name="eye"/><span>{t('EXPLORE THE CHALLENGE','了解这场比赛')}</span><span className="rail-caption-count">01—06</span></div>
      <div className="glass-step-list" ref={listRef} role="tablist" aria-label={t('Participant guide topics','参赛指南主题')} aria-orientation={mobile?'horizontal':'vertical'} onPointerLeave={()=>clearTimeout(hoverTimer.current)}>
        <LiquidMarker position={position} reduced={reduced}/>
        {steps.map((step,index)=><button key={step.id} id={'tab-'+step.id} ref={node=>buttonRefs.current[index]=node} className={'glass-step '+(index===active?'is-active':'')} type="button" role="tab" aria-selected={index===active} aria-label={step.title} aria-controls="glass-guide-panel" tabIndex={index===active?0:-1} onPointerEnter={()=>hover(index)} onFocus={()=>choose(index)} onClick={()=>choose(index)} onKeyDown={e=>keyboard(e,index)}>
          <span className="glass-step-icon"><Icon name={stepIcons[index]}/></span>
          <span className="glass-step-copy"><span className="glass-step-number">0{index+1}</span><span className="glass-step-title">{mobile?shortTitles[index]:step.title}</span></span>
          <Icon name="arrow-up-right" className="glass-step-arrow"/>
        </button>)}
      </div>
    </aside>
    <section className="glass-guide-panel glass-surface" id="glass-guide-panel" ref={panelRef} role="tabpanel" aria-labelledby={'tab-'+selected.id} tabIndex={0}>
      <div className="glass-panel-glow" aria-hidden="true"/>
      <div className="glass-panel-navigation"><button type="button" onClick={()=>advance(active-1)} disabled={active===0}><Icon name="arrow-small-left"/>{t('Previous','上一步')}</button><div className="glass-progress" aria-hidden="true">{steps.map((s,i)=><span key={s.id} className={i===active?'active':''}/>)}</div><button type="button" onClick={()=>advance(active+1)} disabled={active===steps.length-1}>{t('Next','下一步')}<Icon name="arrow-small-right"/></button></div>
      <div className="glass-panel-content" key={selected.id}>
        <div className="glass-panel-kicker"><span className="glass-panel-icon"><Icon name={stepIcons[active]}/></span><span>{t('PARTICIPANT GUIDE','参赛指南')}<strong>0{active+1} / 06</strong></span></div>
        <h3 className="glass-panel-title">{selected.title}</h3>
        <p className="glass-panel-summary">{selected.description}</p>
        <div className={'glass-content glass-content-'+selected.id} dangerouslySetInnerHTML={{__html:selected.body}}/>
      </div>
    </section>
  </div>;
}

function iconMarkup(name){return '<i class="gaac-icon gi-'+name+'" aria-hidden="true"></i>';}
function decorate(body){
  const node=body.cloneNode(true);
  node.querySelectorAll('.task-format').forEach((el,i)=>{el.innerHTML=iconMarkup(['presentation','chart-histogram','document'][i])+'<span>'+el.textContent+'</span>';});
  node.querySelectorAll('.guide-skills strong').forEach((el,i)=>el.insertAdjacentHTML('afterbegin',iconMarkup(['layers','brain','route','shield-check'][i])));
  node.querySelectorAll('.schedule-time > span').forEach(el=>el.insertAdjacentHTML('afterbegin',iconMarkup('clock-three')));
  node.querySelectorAll('.event-score-detail dt').forEach((el,i)=>el.insertAdjacentHTML('afterbegin',iconMarkup(['star','bolt','shield-check'][i])));
  node.querySelectorAll('.event-prize-note h4').forEach(el=>el.insertAdjacentHTML('afterbegin',iconMarkup('trophy')));
  node.querySelectorAll('.event-after-plan > li > span').forEach(el=>el.insertAdjacentHTML('afterbegin',iconMarkup('rocket-lunch')));
  return node.innerHTML;
}

export function mountLiquidGuide(container,{lang='zh',initialId,onSelect}={}){
  if(!container)return()=>{};
  const steps=[...container.querySelectorAll('.participant-step')].map(el=>({id:el.id,title:el.querySelector('.guide-step-title').textContent,description:el.querySelector('.guide-step-description').textContent,body:decorate(el.querySelector('.guide-step-body'))}));
  if(steps.length!==6)return()=>{};
  const hash=location.hash.slice(1);const selected=steps.some(s=>s.id===hash)?hash:initialId;
  const root=createRoot(container);container.dataset.enhanced='true';root.render(<Guide steps={steps} lang={lang} initialId={selected} onSelect={onSelect}/>);
  return()=>{root.unmount();delete container.dataset.enhanced;};
}
