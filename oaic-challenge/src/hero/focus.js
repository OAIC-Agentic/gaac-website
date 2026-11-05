import {MeshDepthMaterial} from 'three';

// Keep each island's opacity independent while preserving unique animated
// materials (for example the finance rows) and shared geometry/textures.
// Hashed coverage fades solid surfaces and their depth together. Blending an
// invisible solid still writes depth, and its default shadow stays opaque.
// Keep coverage and shadow materials configured from the first frame so
// changing focus never changes render queues or compiles shader variants.
export function makeFocusContext(root){
  const owners=new Map(),groups=new Map();
  for(const child of root.children){
    const owner=child.userData.island??child.userData.focusOwner??-1;
    if(!groups.has(owner))groups.set(owner,{objects:[],materials:new Set(),weight:1});
    groups.get(owner).objects.push(child);
    child.traverse(mesh=>{if(!mesh.material)return;for(const material of [mesh.material].flat()){if(!owners.has(material))owners.set(material,new Set());owners.get(material).add(owner);}});
  }
  const copies=new Map(),shadows=new Map();
  for(const [owner,group] of groups){
    const materialFor=material=>{
      let result=material;
      if(owners.get(material).size>1){
        if(!copies.has(material))copies.set(material,new Map());
        const pool=copies.get(material);if(!pool.has(owner))pool.set(owner,material.clone());result=pool.get(owner);
      }
      if(!result.transparent){
        result.alphaHash=true;
      }else result.depthWrite=false;
      group.materials.add(result);return result;
    };
    for(const object of group.objects)object.traverse(mesh=>{
      if(!mesh.material)return;
      mesh.material=Array.isArray(mesh.material)?mesh.material.map(materialFor):materialFor(mesh.material);
      if(mesh.castShadow&&!Array.isArray(mesh.material)){
        if(!shadows.has(mesh.material))shadows.set(mesh.material,new MeshDepthMaterial({alphaHash:true}));
        mesh.customDepthMaterial=shadows.get(mesh.material);
      }
    });
    group.materials=[...group.materials].map(material=>({material,opacity:material.opacity}));
  }
  copies.forEach((_,original)=>original.dispose());
  return {
    restore(){for(const group of groups.values())for(const state of group.materials)state.material.opacity=state.opacity;},
    update(focus,dt,immediate=false){
      let moving=false;
      for(const [owner,group] of groups){
        const goal=focus<0||owner===focus?1:0;
        group.weight=immediate?goal:group.weight+(goal-group.weight)*(1-Math.exp(-dt*9));
        if(Math.abs(goal-group.weight)<.001)group.weight=goal;else moving=true;
        for(const object of group.objects)object.visible=group.weight>0;
        for(const state of group.materials){
          state.material.opacity*=group.weight;
        }
      }
      // Shadow-map materials do not inherit the surface opacity in Three.js.
      for(const [surface,depth] of shadows)depth.opacity=surface.opacity;
      return moving;
    }
  };
}
