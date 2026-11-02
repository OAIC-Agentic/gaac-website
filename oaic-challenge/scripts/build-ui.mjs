import { build, context } from 'esbuild';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const iconMap={'layers':'layers','users-alt':'users','user':'user','calendar-clock':'calendar-clock','trophy':'trophy','rocket-lunch':'rocket','presentation':'presentation','chart-histogram':'chart-column-increasing','document':'file-text','brain':'brain','shield-check':'shield-check','clock-three':'clock-3','route':'route','arrow-small-down':'arrow-down','arrow-up-right':'arrow-up-right','arrow-small-left':'arrow-left','arrow-small-right':'arrow-right','eye':'eye','handshake':'handshake','building':'building-2','graduation-cap':'graduation-cap','check':'check','bolt':'zap','star':'star','book-open-cover':'book-open'};
export const iconNames=Object.keys(iconMap);
export async function prepareAssets(){
  const out=resolve(root,'dist/assets');await mkdir(out,{recursive:true});
  const vendor=resolve(root,'node_modules/lucide-static');
  let selected='/* Lucide Icons, ISC/MIT. Full notices: lucide-LICENSE.txt */\n.gaac-icon{display:inline-block;width:1em;height:1em;flex-shrink:0;font-style:normal;line-height:1;vertical-align:-.1em}\n.gaac-icon::before{content:"";display:block;width:1em;height:1em;background:currentColor;-webkit-mask:var(--icon) center/contain no-repeat;mask:var(--icon) center/contain no-repeat}\n';
  for(const [name,file] of Object.entries(iconMap)){
    const svg=(await readFile(resolve(vendor,'icons',file+'.svg'),'utf8')).replace(/<!--[^]*?-->/g,'').replace(/currentColor/g,'#000').replace(/\s+/g,' ').trim();
    selected+='.gi-'+name+'{--icon:url("data:image/svg+xml,'+encodeURIComponent(svg)+'")}\n';
  }
  await writeFile(resolve(out,'ui-icons.css'),selected);
  await copyFile(resolve(vendor,'LICENSE'),resolve(out,'lucide-LICENSE.txt'));
  const notices=[];for(const pkg of ['liquid-gooey','react','react-dom'])notices.push(pkg+'\n'+await readFile(resolve(root,'node_modules',pkg,'LICENSE'),'utf8'));
  await writeFile(resolve(out,'ui-licenses.txt'),notices.join('\n\n'));
}
export const buildOptions={absWorkingDir:root,entryPoints:['src/liquid-guide.jsx'],outfile:'dist/assets/liquid-guide.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',target:['es2020'],minify:true,charset:'utf8',legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'};
export async function buildUI(){await prepareAssets();await build(buildOptions);}
export async function watchUI(){await prepareAssets();const ctx=await context(buildOptions);await ctx.watch();return ctx;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildUI();
