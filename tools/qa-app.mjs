// Smoke adicional: interface, backups e primeira partida totalmente offline.
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const raiz = new URL('../out/', import.meta.url).pathname;
const pasta = process.argv[2] || '/tmp/cinzas-qa';
await mkdir(pasta, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const srv = http.createServer(async (req,res) => {
  try { let p = join(raiz, new URL(req.url,'http://local').pathname); if ((await stat(p)).isDirectory()) p=join(p,'index.html'); res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream'}); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0,'127.0.0.1');
await new Promise(r=>srv.once('listening',r));
const url=`http://127.0.0.1:${srv.address().port}/`;
const browser = await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let count=0;
const ok=(s,c=true)=>{assert(c,s); console.log('OK '+s);count++;};
try {
 const page=await browser.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const click=async text=>{const sel=await page.$$('button');for(const b of sel){if((await b.evaluate(e=>e.textContent)).match(text)){await b.evaluate(e=>e.click());return;}}throw Error('Botão ausente: '+text);};
 for(const [w,h] of [[320,568],[412,915],[915,412],[1440,900]]){
  await page.setViewport({width:w,height:h,isMobile:w<1000,hasTouch:w<1000});await page.goto(url,{waitUntil:'networkidle0'});
  ok(`menu ${w}×${h} sem corte horizontal`,await page.evaluate(()=>document.querySelector('.menu-app').scrollWidth<=innerWidth));
  ok(`iniciar visível por rolagem ${w}`,await page.evaluate(()=>{const t=document.querySelector('.menu-app'),b=document.querySelector('.iniciar');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&t.scrollHeight>=t.clientHeight;}));
  await page.screenshot({path:join(pasta,`menu-${w}.png`)});
 }
 await page.setViewport({width:412,height:915,isMobile:true,hasTouch:true});await page.goto(url,{waitUntil:'networkidle0'});
 await click(/^Configurações/);ok('painel com nome e foco acessível',await page.evaluate(()=>document.activeElement?.getAttribute('role')==='dialog'&&document.activeElement?.getAttribute('aria-modal')==='true'));
 await page.keyboard.press('Escape');ok('Escape fecha o painel',await page.$('.menu-app'));
 await click(/^Configurações/);await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent==='Duas mãos');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});
 ok('encostar para rolar não muda o controle',await page.evaluate(()=>!localStorage.getItem('cinzas.cfg')));
 await page.keyboard.press('Escape');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>document.body.innerText.includes('Disponível offline'),{timeout:30000});ok('precache completo sinalizado antes de jogar');
 await page.setOfflineMode(true);await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.menu-app');ok('menu reabre sem rede');
 await click(/^Sobreviver/);await page.waitForFunction(()=>window.__cinzas?.store.getState().carga>=1,{timeout:90000});ok('primeira partida carrega offline, incluindo Phaser e fontes');
 await page.evaluate(()=>window.__cinzas.store.setState({painel:null}));
 for(const w of [320,412]) for(const ui of [0.85,1,1.2]){
  await page.setViewport({width:w,height:915,isMobile:true,hasTouch:true});
  await page.evaluate(ui=>{const st=window.__cinzas.store;st.setState({cfg:{...st.getState().cfg,ui}});},ui);
  await page.waitForFunction(ui=>document.querySelector('.hud').style.getPropertyValue('--u')===String(ui),{},ui);
  ok(`HUD sem sobreposição ${w} / escala ${ui}`,await page.evaluate(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),v=q('.vitais'),r=q('.relogio'),b=q('.topo-dir'),o=q('.obj');return v.right<=r.left&&r.bottom<=b.top&&v.bottom<=o.top&&b.bottom<=o.top;}));
 }
 await page.setViewport({width:412,height:915,isMobile:true,hasTouch:true});
 await page.evaluate(()=>{const st=window.__cinzas.store;st.setState({cfg:{...st.getState().cfg,ui:1}});});
 await page.screenshot({path:join(pasta,'base-revisada.png')});
 await page.evaluate(()=>window.__cinzas.store.setState({painel:'inv'}));
 await page.waitForFunction(()=>{const g=document.querySelector('.mochila-grade');return g&&g.querySelector('.cel').getBoundingClientRect().width<=50;});
 ok('as 8 colunas da mochila cabem na tela',await page.evaluate(()=>{const g=document.querySelector('.mochila-grade'),r=g.getBoundingClientRect(),last=g.querySelectorAll('.cel')[7].getBoundingClientRect();return last.right<=r.right+1&&r.right<=innerWidth;}));
 await page.screenshot({path:join(pasta,'mochila-revisada.png')});
 await page.evaluate(()=>{window.__cinzas.store.setState({painel:null});window.__cinzas.ponte.cmd.salvar();});
 ok('save válido gravado',await page.evaluate(()=>!!localStorage.getItem('cinzas.save.v2')));
 ok('cena encerrada não recria um save',await page.evaluate(()=>{const c=window.__cinzas.cena(),salvo=localStorage.getItem('cinzas.save.v2');c.morto=true;localStorage.removeItem('cinzas.save.v2');window.__cinzas.ponte.cmd.salvar();const ok=localStorage.getItem('cinzas.save.v2')===null;localStorage.setItem('cinzas.save.v2',salvo);c.morto=false;return ok;}));
 await page.evaluate(()=>{window.__cinzas.store.setState({painel:'pausa'});});await click(/^Salvar e sair/);await click(/^Configurações/);
 const original=await page.evaluate(()=>localStorage.getItem('cinzas.save.v2'));
 const backup=JSON.stringify({app:'cinzas',versao:1,run:JSON.parse(original)});
 const backupFile=join(pasta,'backup.json');await (await import('node:fs/promises')).writeFile(backupFile,backup);
 await page.$('input[type=file]').then(e=>e.uploadFile(backupFile));await page.waitForFunction(()=>document.body.innerText.includes('Restaurar dia'));await click(/^Cancelar$/);ok('cancelar importação preserva save',await page.evaluate(v=>localStorage.getItem('cinzas.save.v2')===v,original));
 await page.$('input[type=file]').then(e=>e.uploadFile(backupFile));await page.waitForFunction(()=>document.body.innerText.includes('Restaurar dia'));await click(/^Restaurar partida$/);ok('backup válido restaurado',await page.evaluate(()=>document.body.innerText.includes('Partida restaurada')));
 await page.keyboard.press('Escape');await click(/^Iniciar nova/);ok('nova jornada exige decisão explícita',await page.evaluate(()=>document.body.innerText.includes('Apagar partida e começar')));await click(/^Manter minha/);ok('cancelar nova jornada mantém progresso',await page.evaluate(()=>!!localStorage.getItem('cinzas.save.v2')));
 await page.evaluate(()=>localStorage.setItem('cinzas.save.v2','{"seed":"quebrado"}'));await page.reload({waitUntil:'networkidle0'});ok('save danificado não quebra o menu',await page.evaluate(()=>!!document.querySelector('.iniciar')&&!document.body.innerText.includes('Continuar jornada')));
 // A chegada ao Abrigo 7 precisa concluir a campanha, apagar o save e permitir voltar ao menu.
 await page.evaluate(v=>localStorage.setItem('cinzas.save.v2',v),original);await page.reload({waitUntil:'networkidle0'});await click(/^Continuar jornada/);
 await page.waitForFunction(()=>window.__cinzas?.store.getState().carga>=1,{timeout:90000});
 await page.evaluate(()=>{window.__semEventos=true;window.__viagemRapida=true;const st=window.__cinzas.store,c=window.__cinzas.cena();c.devXp(6000);c.perkAvisado=1e9;c.s.combustivel=50;c.s.sabeAbrigo=true;st.setState({painel:null,combustivel:50,sabeAbrigo:true,inv:{...st.getState().inv,radio:1}});window.__cinzas.ponte.cmd.viajar('abrigo7');});
 await page.waitForFunction(()=>window.__cinzas.store.getState().tela==='vitoria',{timeout:60000});
 ok('a rota final chega à vitória',await page.evaluate(()=>window.__cinzas.store.getState().resumo.vitoria));
 await page.screenshot({path:join(pasta,'vitoria.png')});
 await page.evaluate(()=>window.__cinzas.ponte.cmd.salvar());
 ok('a vitória encerra o save definitivamente',await page.evaluate(()=>localStorage.getItem('cinzas.save.v2')===null&&!window.__cinzas.store.getState().temSave));
 await click(/^Nova run/);ok('o final permite voltar ao menu',await page.waitForSelector('.menu-app'));
 ok('nenhuma exceção de JavaScript',errors.length===0);console.log(`${count}/${count} verificações passaram.`);
} finally {await browser.close();srv.close();}
