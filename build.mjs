import {mkdir,copyFile,cp,access} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ['index.html','_routes.json'])await copyFile(name,'dist/'+name);
for(const name of ['asset','assets','vendor','icon.png','favicon.ico']){try{await access(name);await cp(name,'dist/'+name,{recursive:true})}catch(e){if(e.code!=='ENOENT')throw e}}
