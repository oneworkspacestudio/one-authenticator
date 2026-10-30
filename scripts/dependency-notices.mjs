import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const web=path.resolve(process.argv[2]||'web'),out=path.resolve(process.argv[3]||'dist/package');mkdirSync(out,{recursive:true});
const lock=JSON.parse(readFileSync(path.join(web,'package-lock.json'),'utf8'));let text='One Authenticator runtime dependency notices\n\n';
for(const [name,record] of Object.entries(lock.packages)){
 if(!name||record.dev)continue;const root=path.join(web,name),pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));const files=readdirSync(root).filter(f=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(f));
 if(!files.length)throw Error('Missing dependency licence: '+pkg.name);text+=`\n===== ${pkg.name} ${pkg.version} (${pkg.license||'see below'}) =====\n`;
 for(const file of files)text+=readFileSync(path.join(root,file),'utf8')+'\n';
}
writeFileSync(path.join(out,'THIRD-PARTY-LICENSES.txt'),text);
