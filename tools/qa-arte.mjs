// Pranchas visuais para revisão de arte; não equivalem a aprovação externa de artista.
import http from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {join,extname} from 'node:path';
import puppeteer from 'puppeteer-core';
const raiz=new URL('../out/',import.meta.url).pathname,pasta=process.argv[2]||'/tmp/cinzas-arte';
await mkdir(pasta,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer(async(req,res)=>{try{let p=join(raiz,new URL(req.url,'http://local').pathname);if((await stat(p)).isDirectory())p=join(p,'index.html');res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream'});res.end(await readFile(p));}catch{res.writeHead(404);res.end();}}).listen(0,'127.0.0.1');
await new Promise(r=>srv.once('listening',r));
const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const p=await b.newPage();await p.setViewport({width:1100,height:1400});
 const erros=[];p.on('pageerror',e=>erros.push(String(e)));
 for(const grupo of ['humanos','animais','flora','props','estruturas','clipes','colosso']){
  await p.goto(`http://127.0.0.1:${srv.address().port}/arte/?g=${grupo}`,{waitUntil:'networkidle0'});
  const canvas=await p.$('canvas');if(!canvas)throw Error('Prancha ausente: '+grupo);
  await canvas.screenshot({path:join(pasta,grupo+'.png')});
  console.log('Prancha renderizada: '+grupo);
 }
 if(erros.length)throw Error(erros.join('\n'));
 console.log('7/7 pranchas renderizadas sem exceções. Revisão visual pendente de inspeção.');
}finally{await b.close();srv.close();}
