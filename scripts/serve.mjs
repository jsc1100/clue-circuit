import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('docs');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain'};
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  const path=resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if(!path.startsWith(root+sep)) throw Error('Invalid path');
  const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 } catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Clue Circuit: http://localhost:3000'));
