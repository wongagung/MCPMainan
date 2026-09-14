import http from 'node:http';
import crypto from 'node:crypto';

const HOST = process.env.ROBLOX_MCP_HOST || '127.0.0.1';
const PORT = Number(process.env.ROBLOX_MCP_PORT || 58888);
const TOKEN = process.env.ROBLOX_MCP_TOKEN || 'roblox-universal-mcp-local';
const MAX_QUEUE = 1000;
const clients = new Map();
const pending = [];

function json(res, code, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(code, {'content-type':'application/json; charset=utf-8','content-length':data.length,'cache-control':'no-store','access-control-allow-origin':'http://localhost'});
  res.end(data);
}
async function readBody(req){const chunks=[];for await(const chunk of req)chunks.push(chunk);if(!chunks.length)return {};return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function authorized(req,body={}){const header=req.headers['x-roblox-mcp-token'];return header===TOKEN||body.token===TOKEN;}
function parseUrl(req){return new URL(req.url,`http://${HOST}:${PORT}`);}
function snapshotClient(c){return {sessionId:c.sessionId,connectedAt:c.connectedAt,lastSeen:c.lastSeen,pluginVersion:c.pluginVersion??null,studioVersion:c.studioVersion??null,placeId:c.placeId??null,universeId:c.universeId??null,placeName:c.placeName??null,gameName:c.gameName??null,selection:c.selection??[],status:c.status??'connected'};}
function targetSession(query){const requested=query.get('sessionId');if(requested&&clients.has(requested))return requested;let best=null;for(const [id,c] of clients){if(!best||c.lastSeen>best.lastSeen)best={id,...c};}return best?.id??null;}
function cleanExpired(){const cutoff=Date.now()-10*60_000;for(const[id,client]of clients)if(client.lastSeen<cutoff)clients.delete(id);const queueCutoff=Date.now()-2*60_000;for(let i=pending.length-1;i>=0;i--)if(pending[i].createdAt<queueCutoff){pending[i].reject?.(new Error('Roblox Studio command timed out'));pending.splice(i,1);}}
setInterval(cleanExpired,15_000).unref();
const resultRegistry=new Map();
const server=http.createServer(async(req,res)=>{try{const url=parseUrl(req);const path=url.pathname;if(req.method==='GET'&&path==='/health')return json(res,200,{ok:true,service:'roblox-universal-mcp-bridge',protocol:'local-rpc-1',clients:clients.size});const body=['POST','PUT','PATCH'].includes(req.method)?await readBody(req):{};if(!authorized(req,body))return json(res,401,{ok:false,error:'Unauthorized'});if(req.method==='POST'&&path==='/connect'){const sessionId=crypto.randomUUID();const now=Date.now();clients.set(sessionId,{sessionId,connectedAt:now,lastSeen:now,pluginVersion:body.pluginVersion,studioVersion:body.studioVersion,placeId:body.placeId,universeId:body.universeId,placeName:body.placeName,gameName:body.gameName,selection:body.selection??[],status:'connected'});return json(res,200,{ok:true,sessionId,heartbeatMs:2500});}const sessionId=body.sessionId||url.searchParams.get('sessionId');if(sessionId&&clients.has(sessionId))clients.get(sessionId).lastSeen=Date.now();if(req.method==='POST'&&path==='/heartbeat'){if(!sessionId||!clients.has(sessionId))return json(res,404,{ok:false,error:'Unknown session'});Object.assign(clients.get(sessionId),body.state||{});clients.get(sessionId).lastSeen=Date.now();return json(res,200,{ok:true});}if(req.method==='GET'&&path==='/poll'){const id=targetSession(url.searchParams);if(!id)return json(res,200,{ok:true,command:null});const idx=pending.findIndex(x=>!x.sessionId||x.sessionId===id);if(idx<0)return json(res,200,{ok:true,command:null});const cmd=pending.splice(idx,1)[0];cmd.sessionId=id;return json(res,200,{ok:true,command:{id:cmd.id,method:cmd.method,params:cmd.params}});}if(req.method==='POST'&&path==='/result'){const{id,ok,result,error}=body;const waiter=resultRegistry.get(id);if(waiter){resultRegistry.delete(id);if(ok)waiter.resolve(result);else waiter.reject(new Error(error||'Roblox Studio command failed'));}return json(res,200,{ok:true,matched:Boolean(waiter)});}if(req.method==='GET'&&path==='/status')return json(res,200,{ok:true,clients:[...clients.values()].map(snapshotClient),queue:pending.length});return json(res,404,{ok:false,error:'Not found'});}catch(error){return json(res,500,{ok:false,error:String(error?.message||error)});}});
export function sendCommand(method,params={},sessionId=null){if(clients.size===0)throw new Error('Roblox Studio plugin is not connected');const id=crypto.randomUUID();const promise=new Promise((resolve,reject)=>resultRegistry.set(id,{resolve,reject}));pending.push({id,method,params,sessionId,createdAt:Date.now(),resolve(){},reject(){}});if(pending.length>MAX_QUEUE){const removed=pending.shift();resultRegistry.get(removed.id)?.reject(new Error('Command queue full'));resultRegistry.delete(removed.id);}return promise;}
export function getStatus(){return {clients:[...clients.values()].map(snapshotClient),queue:pending.length,token:TOKEN,host:HOST,port:PORT};}
if(process.argv[1]===new URL(import.meta.url).pathname.replace(/\\/g,'/'))server.listen(PORT,HOST,()=>console.error(`[roblox-universal-mcp] bridge listening on http://${HOST}:${PORT}`));
