import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export const view={target:[0,1.05,.25],pitch:.65,azimuth:.12,width:13.8,minHeight:9.6};
// Shared by live view and fallback-cover generation so materials stay matched.
export function lightWorld(renderer,scene,compact){
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=!compact;renderer.shadowMap.type=THREE.PCFShadowMap;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.08);scene.environment=environment.texture;scene.environmentIntensity=.28;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x7394a4,1.15));
  const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(-4,11,6);key.castShadow=!compact;key.shadow.mapSize.set(1536,1536);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:30});key.shadow.bias=-.0007;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
  const fill=new THREE.DirectionalLight(0xccefff,.75);fill.position.set(6,5,-6);scene.add(fill);return environment;
}
