// Development-only alpha cover, using exactly the live geometry, motion and light.
import * as THREE from 'three';
import {buildWorld} from '../src/hero/geometry.js';
import {animateWorld} from '../src/hero/motion.js';
import {lightWorld,view} from '../src/hero/lighting.js';
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1400,1050);renderer.setClearColor(0,0);
const scene=new THREE.Scene(),environment=lightWorld(renderer,scene,false),world=buildWorld(false);scene.add(world.root);animateWorld(world,3);
const aspect=1400/1050,h=Math.max(view.minHeight,view.width/aspect),camera=new THREE.OrthographicCamera(-h*aspect/2,h*aspect/2,h/2,-h/2,.1,100),target=new THREE.Vector3(...view.target);
camera.position.set(target.x+Math.sin(view.azimuth)*Math.cos(view.pitch)*20,target.y+Math.sin(view.pitch)*20,target.z+Math.cos(view.azimuth)*Math.cos(view.pitch)*20);camera.lookAt(target);renderer.render(scene,camera);
const image=document.createElement('img');image.src=renderer.domElement.toDataURL('image/webp',.94);image.style.width='100%';document.body.append(image);const output=document.createElement('pre');output.id='cover-output';output.textContent=image.src;output.hidden=true;document.body.append(output);renderer.dispose();environment.dispose();
