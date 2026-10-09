import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertCurrentClient} from '../scripts/build-client.mjs';
assertCurrentClient();
for(const name of ['creator-defaults','preference','acknowledgements','installer']){
 const result=spawnSync(process.execPath,[fileURLToPath(new URL(name+'.mjs',import.meta.url))],{stdio:'inherit',timeout:60000});
 if(result.status!==0)process.exit(result.status||1);
}
console.log('Portable public checks passed. Real-device visual/performance verification remains separate.');
