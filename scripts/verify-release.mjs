// Verify creator signature and artifact hashes; does not install or execute assets.
import{readFileSync}from'node:fs';import{resolve,join,basename}from'node:path';import{createHash,verify}from'node:crypto';
const root=resolve(process.argv[2]||'.'),bytes=readFileSync(join(root,'PROVENANCE.json')),signature=readFileSync(join(root,'PROVENANCE.sig')),key=readFileSync(new URL('../docs/CREATOR-PUBLIC-KEY.pem',import.meta.url));
if(!verify(null,bytes,key,signature))throw Error('Creator signature mismatch');const manifest=JSON.parse(bytes);if(manifest.creator!=='爱伦提卡'||manifest.project!=='dsh-plugin-skins')throw Error('Project identity mismatch');
for(const item of manifest.artifacts){if(basename(item.name)!==item.name||item.name.includes('\\'))throw Error('Unsafe artifact name');if(createHash('sha256').update(readFileSync(join(root,item.name))).digest('hex')!==item.sha256)throw Error('Artifact hash mismatch: '+item.name)}
console.log('Creator signature and all artifact hashes verified. Installation remains a separate host action.');
