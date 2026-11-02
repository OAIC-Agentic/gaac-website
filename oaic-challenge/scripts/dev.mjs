import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { watchUI } from './build-ui.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ui=await watchUI();
const server=spawn('python3',['scripts/dev.py'],{cwd:root,stdio:'inherit',env:process.env});
let stopping=false;
async function stop(signal='SIGINT'){if(stopping)return;stopping=true;server.kill(signal);await ui.dispose();}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop('SIGTERM'));
server.on('error',async error=>{console.error(error.message);await ui.dispose();process.exitCode=1;});
server.on('exit',async code=>{await ui.dispose();process.exitCode=code||0;});
