// Stage the archive only. Installation and profile changes belong to Harness.
import {copyFileSync,constants,existsSync,mkdirSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';

function bundleIdentity(bytes) {
    const tar=gunzipSync(bytes,{maxOutputLength:32*1024*1024});
    let manifest;
    for(let at=0;at+512<=tar.length;){
        const header=tar.subarray(at,at+512);
        if(header.every(v=>v===0))break;
        const name=header.subarray(0,100).toString().split('\0')[0];
        const prefix=header.subarray(345,500).toString().split('\0')[0];
        const path=(prefix?prefix+'/':'')+name;
        const kind=header[156];
        const checksum=parseInt(header.subarray(148,156).toString().replace(/\0/g,'').trim(),8);
        const actual=header.reduce((sum,value,i)=>sum+(i>=148&&i<156?32:value),0);
        if(checksum!==actual)throw Error('Invalid archive header');
        // Release archives contain regular files/directories only. Reject links
        // and path-override metadata before handing the archive to the host.
        if(![0,48,53].includes(kind))throw Error('Unsupported archive entry type');
        const size=parseInt(header.subarray(124,136).toString().replace(/\0/g,'').trim(),8);
        if(!Number.isSafeInteger(size)||size<0||at+512+size>tar.length)throw Error('Invalid archive entry');
        // Nothing is extracted; reject paths that an installer should not follow.
        if(!path.startsWith('package/')||path.includes('\\')||path.includes(':')||path.split('/').some(p=>p==='..'||p==='.'))throw Error('Unsafe archive path');
        if(path==='package/package.json'){
            if(manifest)throw Error('Duplicate package manifest');
            if(size>65536)throw Error('Package manifest is too large');
            manifest=JSON.parse(tar.subarray(at+512,at+512+size));
        }
        at+=512+Math.ceil(size/512)*512;
    }
    if(manifest?.name!=='dsh-plugin-skins'||manifest.dsh?.bundle?.patch!=='./cordis.patch.yml')throw Error('Not the glass skin bundle');
    if(Object.keys(manifest.scripts||{}).some(k=>['preinstall','install','postinstall','prepare'].includes(k)))throw Error('Unexpected installation scripts');
    return manifest;
}
export function stageBundle(source,{cacheRoot}={}) {
    const input=realpathSync(resolve(source));
    if(statSync(input).size>8*1024*1024)throw Error('Archive is too large');
    const bytes=readFileSync(input),manifest=bundleIdentity(bytes);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    // Content-addressed storage is independent of the downloaded file name.
    const home=process.env.DSH_HOME?resolve(process.env.DSH_HOME):join(homedir(),'.dsh');
    const root=resolve(cacheRoot||join(home,'bundle-cache','dsh-plugin-skins'));
    mkdirSync(root,{recursive:true});
    const canonical=realpathSync(root),target=join(canonical,sha256+'.tgz');
    const rel=relative(canonical,target);
    if(isAbsolute(rel)||rel.startsWith('..'))throw Error('Archive destination escapes cache');
    if(existsSync(target)){
        if(createHash('sha256').update(readFileSync(target)).digest('hex')!==sha256)throw Error('Cached archive integrity mismatch');
    }else copyFileSync(input,target,constants.COPYFILE_EXCL);
    if(createHash('sha256').update(readFileSync(target)).digest('hex')!==sha256)throw Error('Copied archive integrity mismatch');
    return {name:manifest.name,version:manifest.version,author:manifest.author,sha256,spec:target,action:'install_bundle',installed:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
    if(!process.argv[2])throw Error('Usage: node INSTALLER.mjs <attached .tgz> [--cache-root=<managed directory>]');
    const cacheRoot=process.argv.find(a=>a.startsWith('--cache-root='))?.slice(13);
    console.log(JSON.stringify(stageBundle(process.argv[2],{cacheRoot}),null,2));
}
