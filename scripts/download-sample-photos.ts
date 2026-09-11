import {mkdir,writeFile} from 'node:fs/promises';
const photos:Record<string,string>={
 'white-tee':'1521572163474-6864f9cf17ab',
 'blue-denim':'1542272604-787c3835535d',
 'red-sneakers':'1542291026-7eec264c27ff',
 'tan-handbag':'1548036328-c9fa89d128fa',
 'beauty-edit':'1596462502278-27bfdc403348',
 'home-edit':'1600210492486-724fe5c67fb0',
};
await mkdir('public/images/sample',{recursive:true});
const results=await Promise.allSettled(Object.entries(photos).map(async([name,id])=>{
 const url=`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=750&q=85&fm=jpg`;
 const response=await fetch(url);if(!response.ok)throw new Error(`${name}: ${response.status}`);
 await writeFile(`public/images/sample/${name}.jpg`,Buffer.from(await response.arrayBuffer()));return name;
}));
for(const result of results)console.log(result.status==='fulfilled'?`Saved ${result.value}`:String(result.reason));
