// Build a portable directory, never a link to the developer's installation.
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve,basename,relative,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {assertCurrentClient} from './build-client.mjs';

export function stageRelease(destination) {
    assertCurrentClient();
    const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(destination);
    const relation=relative(resolve(root),out);
    if(!relation||(!relation.startsWith('..')&&!isAbsolute(relation)))throw Error('Use a separate release directory');
    if(existsSync(out)&&readdirSync(out).length)throw Error('Release directory must be empty');
    const manifest=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
    const files=manifest.files.filter(file=>file!=='DEPENDENCIES.json');
    for(const file of files)if(!existsSync(join(root,file)))throw Error('Missing release file: '+file);
    mkdirSync(out,{recursive:true});
    for(const file of files)cpSync(join(root,file),join(out,file),{recursive:true,dereference:true});
    const packages=new Map();
    const collect=(name,parent)=>{
        const req=createRequire(parent);
        const candidate=req.resolve.paths(name)?.map(base=>join(base,name,'package.json')).find(existsSync);
        if(!candidate)throw Error('Missing release dependency: '+name);
        const file=realpathSync(candidate),pkg=JSON.parse(readFileSync(file,'utf8'));
        if(pkg.name!==name)throw Error('Dependency identity mismatch: '+name);
        if(packages.has(name)){
            if(packages.get(name).version!==pkg.version)throw Error('Conflicting dependency versions: '+name);
            return;
        }
        if(Object.keys(pkg.scripts||{}).some(k=>['preinstall','install','postinstall','prepare'].includes(k)))throw Error('Dependency requires installation code: '+name);
        packages.set(name,{name,version:pkg.version,license:pkg.license});
        cpSync(dirname(file),join(out,'node_modules',name),{recursive:true,dereference:true,filter:p=>basename(p)!=='node_modules'});
        for(const dependency of Object.keys(pkg.dependencies||{}))collect(dependency,file);
    };
    for(const name of Object.keys(manifest.dependencies||{}))collect(name,join(root,'package.json'));
    manifest.bundleDependencies=Object.keys(manifest.dependencies||{});
    for(const name of manifest.bundleDependencies)manifest.dependencies[name]=packages.get(name).version;
    delete manifest.scripts;
    writeFileSync(join(out,'package.json'),JSON.stringify(manifest,null,2)+'\n');
    writeFileSync(join(out,'DEPENDENCIES.json'),JSON.stringify({bundled:[...packages.values()]},null,2)+'\n');
    return {directory:out,packages:[...packages.values()]};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
    const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6);
    if(!out)throw Error('Usage: node scripts/stage-release.mjs --out=<empty directory>');
    console.log(JSON.stringify(stageRelease(out),null,2));
}
