import { spawn, execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { sendCommand, getStatus } from './bridge.mjs';

const VERSION = '2.0.0';
const HOST = process.env.ROBLOX_MCP_HOST || '127.0.0.1';
const PORT = Number(process.env.ROBLOX_MCP_PORT || 58888);
const bridgeUrl = `http://${HOST}:${PORT}`;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, '.data');
const memoryFile = path.join(dataDir, 'project-memory.json');
const tasksFile = path.join(dataDir, 'tasks.json');

async function ensureBridge() {
  try { const r = await fetch(`${bridgeUrl}/health`); if (r.ok) return; } catch {}
  const bridge = fileURLToPath(new URL('./bridge.mjs', import.meta.url));
  const child = spawn(process.execPath, [bridge], { detached: true, stdio: 'ignore', windowsHide: true, env: { ...process.env } });
  child.unref();
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`${bridgeUrl}/health`); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Unable to start Roblox MCP bridge on ${bridgeUrl}`);
}

const server = new McpServer({ name: 'roblox-universal-mcp', version: VERSION });
const result = data => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const call = async (method, params = {}, sessionId = null) => { await ensureBridge(); return sendCommand(method, params, sessionId); };
const sessionSchema = z.string().nullable().default(null);

function register(name, description, inputSchema, handler) { server.registerTool(name, { description, inputSchema }, handler); }

register('studio_status', 'Get Studio connection, place, selection, bridge and runtime state.', z.object({ sessionId: sessionSchema }), async ({ sessionId }) => result(await call('status', {}, sessionId)));
register('studio_tree', 'Inspect Instance hierarchy from game or any path.', z.object({ path:z.string().default('game'), depth:z.number().int().min(0).max(12).default(2), includeProperties:z.boolean().default(false), sessionId:sessionSchema }), async ({path,depth,includeProperties,sessionId}) => result(await call('tree',{path,depth,includeProperties},sessionId)));
register('studio_search', 'Search descendants by name, class, source or tag.', z.object({ query:z.string().min(1), mode:z.enum(['name','class','source','tag']).default('name'), root:z.string().default('game'), maxResults:z.number().int().min(1).max(1000).default(100), sessionId:sessionSchema }), async ({query,mode,root,maxResults,sessionId}) => result(await call('search',{query,mode,root,maxResults},sessionId)));
register('studio_get_selection', 'Read current Studio selection.', z.object({sessionId:sessionSchema}), async ({sessionId}) => result(await call('getSelection',{},sessionId)));
register('studio_set_selection', 'Select Instance paths in Studio.', z.object({paths:z.array(z.string()).max(500),sessionId:sessionSchema}), async ({paths,sessionId}) => result(await call('setSelection',{paths},sessionId)));
register('studio_read_script', 'Read a Script, LocalScript or ModuleScript source.', z.object({path:z.string().min(1),sessionId:sessionSchema}), async ({path,sessionId}) => result(await call('readScript',{path},sessionId)));
register('studio_write_script', 'Create or replace Luau source.', z.object({path:z.string().min(1),source:z.string(),createIfMissing:z.boolean().default(true),className:z.enum(['Script','LocalScript','ModuleScript']).default('ModuleScript'),sessionId:sessionSchema}), async ({path,source,createIfMissing,className,sessionId}) => result(await call('writeScript',{path,source,createIfMissing,className},sessionId)));
register('studio_create_instance', 'Create an Instance and set JSON-compatible properties.', z.object({className:z.string().min(1),parent:z.string().default('game.Workspace'),name:z.string().optional(),properties:z.record(z.string(),z.any()).default({}),sessionId:sessionSchema}), async ({className,parent,name,properties,sessionId}) => result(await call('createInstance',{className,parent,name,properties},sessionId)));
register('studio_set_properties', 'Set multiple Instance properties.', z.object({path:z.string().min(1),properties:z.record(z.string(),z.any()),sessionId:sessionSchema}), async ({path,properties,sessionId}) => result(await call('setProperties',{path,properties},sessionId)));
register('studio_delete_instance', 'Delete an Instance with change-history waypoint.', z.object({path:z.string().min(1),sessionId:sessionSchema}), async ({path,sessionId}) => result(await call('deleteInstance',{path},sessionId)));
register('studio_execute_luau', 'Execute Luau in Studio plugin context. Use structured tools first.', z.object({code:z.string().min(1),sessionId:sessionSchema}), async ({code,sessionId}) => result(await call('executeLuau',{code},sessionId)));
register('studio_batch', 'Execute up to 100 structured Studio operations sequentially.', z.object({operations:z.array(z.object({method:z.enum(['tree','search','getSelection','setSelection','readScript','writeScript','createInstance','setProperties','deleteInstance','executeLuau','diagnostics','runtimeOutput','projectAudit','performanceAudit','securityAudit','assetAudit','snapshotCreate','snapshotRestore','playTest','stopTest']),params:z.record(z.string(),z.any()).default({})})).min(1).max(100),sessionId:sessionSchema}), async ({operations,sessionId}) => { const out=[]; for(const op of operations) out.push({method:op.method,result:await call(op.method,op.params,sessionId)}); return result(out); });

register('studio_diagnostics', 'Collect Studio runtime output and source-oriented diagnostics context.', z.object({limit:z.number().int().min(1).max(512).default(100),sessionId:sessionSchema}), async ({limit,sessionId}) => result(await call('diagnostics',{limit},sessionId)));
register('studio_runtime_output', 'Read captured Roblox Studio Output messages.', z.object({limit:z.number().int().min(1).max(512).default(100),type:z.enum(['all','error','warning','output']).default('all'),sessionId:sessionSchema}), async ({limit,type,sessionId}) => result(await call('runtimeOutput',{limit,type},sessionId)));
register('studio_project_audit', 'Return project inventory and health summary.', z.object({root:z.string().default('game'),sessionId:sessionSchema}), async ({root,sessionId}) => result(await call('projectAudit',{root},sessionId)));
register('studio_performance_audit', 'Static performance audit: instances, scripts, lights, particles, unanchored parts and hotspots.', z.object({root:z.string().default('game'),sessionId:sessionSchema}), async ({root,sessionId}) => result(await call('performanceAudit',{root},sessionId)));
register('studio_security_audit', 'Static security audit for remotes, dangerous APIs and client/server trust patterns.', z.object({root:z.string().default('game'),sessionId:sessionSchema}), async ({root,sessionId}) => result(await call('securityAudit',{root},sessionId)));
register('studio_asset_audit', 'Inventory asset IDs and suspicious/unsupported references from scripts and common asset properties.', z.object({root:z.string().default('game'),sessionId:sessionSchema}), async ({root,sessionId}) => result(await call('assetAudit',{root},sessionId)));
register('studio_snapshot_create', 'Create a restorable Studio snapshot in plugin settings.', z.object({name:z.string().min(1).max(80),root:z.string().default('game'),depth:z.number().int().min(0).max(8).default(5),sessionId:sessionSchema}), async ({name,root,depth,sessionId}) => result(await call('snapshotCreate',{name,root,depth},sessionId)));
register('studio_snapshot_restore', 'Restore a previously created snapshot. Preview first when possible.', z.object({name:z.string().min(1).max(80),dryRun:z.boolean().default(false),sessionId:sessionSchema}), async ({name,dryRun,sessionId}) => result(await call('snapshotRestore',{name,dryRun},sessionId)));
register('studio_play_test', 'Run a programmatic Studio play/multiplayer test through StudioTestService.', z.object({mode:z.enum(['play','run','multiplayer']).default('play'),players:z.number().int().min(1).max(8).default(1),args:z.any().optional(),timeoutSeconds:z.number().int().min(1).max(300).default(60),sessionId:sessionSchema}), async ({mode,players,args,timeoutSeconds,sessionId}) => result(await call('playTest',{mode,players,args,timeoutSeconds},sessionId)));
register('studio_stop_test', 'Stop the active Studio programmatic test.', z.object({sessionId:sessionSchema}), async ({sessionId}) => result(await call('stopTest',{},sessionId)));

async function readJson(file, fallback) { try { return JSON.parse(await readFile(file,'utf8')); } catch { return fallback; } }
async function writeJson(file, data) { await mkdir(dataDir,{recursive:true}); await writeFile(file,JSON.stringify(data,null,2)+'\n','utf8'); }
register('project_memory_get', 'Read durable project memory for architecture, conventions, IDs and known issues.', z.object({}), async () => result(await readJson(memoryFile,{version:1,updatedAt:null,notes:[],facts:{},conventions:[],knownIssues:[]})));
register('project_memory_update', 'Update durable project memory without deleting unrelated entries.', z.object({facts:z.record(z.string(),z.any()).optional(),notes:z.array(z.string()).optional(),conventions:z.array(z.string()).optional(),knownIssues:z.array(z.string()).optional()}), async data => { const m=await readJson(memoryFile,{version:1,updatedAt:null,notes:[],facts:{},conventions:[],knownIssues:[]}); if(data.facts) m.facts={...m.facts,...data.facts}; if(data.notes) m.notes=[...new Set([...m.notes,...data.notes])]; if(data.conventions) m.conventions=[...new Set([...m.conventions,...data.conventions])]; if(data.knownIssues) m.knownIssues=[...new Set([...m.knownIssues,...data.knownIssues])]; m.updatedAt=new Date().toISOString(); await writeJson(memoryFile,m); return result(m); });
register('task_list', 'List MCP development tasks.', z.object({status:z.enum(['all','todo','doing','done']).default('all')}), async ({status}) => { const t=await readJson(tasksFile,[]); return result(status==='all'?t:t.filter(x=>x.status===status)); });
register('task_create', 'Create a tracked MCP task.', z.object({title:z.string().min(1),description:z.string().default(''),priority:z.enum(['low','medium','high','critical']).default('medium')}), async ({title,description,priority}) => { const t=await readJson(tasksFile,[]); const item={id:cryptoRandom(),title,description,priority,status:'todo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; t.push(item); await writeJson(tasksFile,t); return result(item); });
register('task_update', 'Update task status or details.', z.object({id:z.string(),status:z.enum(['todo','doing','done']).optional(),title:z.string().optional(),description:z.string().optional()}), async ({id,status,title,description}) => { const t=await readJson(tasksFile,[]); const item=t.find(x=>x.id===id); if(!item) throw new Error('Task not found'); Object.assign(item,{...(status?{status}:{}),...(title?{title}:{}),...(description?{description}:{}),updatedAt:new Date().toISOString()}); await writeJson(tasksFile,t); return result(item); });
function cryptoRandom(){ return Math.random().toString(36).slice(2,10); }

function git(repo,args){ return new Promise((resolve,reject)=>execFile('git',args,{cwd:repo,windowsHide:true,maxBuffer:4*1024*1024},(error,stdout,stderr)=>{ if(error) reject(new Error(stderr||error.message)); else resolve({stdout,stderr}); })); }
register('git_status', 'Inspect git status for a Roblox project directory.', z.object({repoPath:z.string().min(1)}), async ({repoPath}) => result(await git(repoPath,['status','--short','--branch'])));
register('git_diff', 'Read git diff summary or full diff.', z.object({repoPath:z.string().min(1),staged:z.boolean().default(false)}), async ({repoPath,staged}) => result(await git(repoPath,['diff',...(staged?['--cached']:[]),'--stat','--',''])));
register('git_commit', 'Commit selected project changes. Does not push.', z.object({repoPath:z.string().min(1),message:z.string().min(1)}), async ({repoPath,message}) => { await git(repoPath,['add','-A']); return result(await git(repoPath,['commit','-m',message])); });
register('git_push', 'Push the current branch to its configured remote.', z.object({repoPath:z.string().min(1),remote:z.string().default('origin'),branch:z.string().optional()}), async ({repoPath,remote,branch}) => result(await git(repoPath,['push',remote,...(branch?[branch]:[])])));

register('roblox_autopilot', 'Run a bounded plan of Studio operations with automatic validation between phases.', z.object({goal:z.string().min(1),operations:z.array(z.object({method:z.string(),params:z.record(z.string(),z.any()).default({})})).min(1).max(50),sessionId:sessionSchema}), async ({goal,operations,sessionId}) => { const report={goal,startedAt:new Date().toISOString(),steps:[],validation:null}; for(const op of operations){ const started=Date.now(); try { const r=await call(op.method,op.params,sessionId); report.steps.push({method:op.method,ok:true,ms:Date.now()-started,result:r}); } catch(e){ report.steps.push({method:op.method,ok:false,ms:Date.now()-started,error:e.message}); break; } } try { report.validation=await call('projectAudit',{root:'game'},sessionId); } catch(e){ report.validation={error:e.message}; } report.finishedAt=new Date().toISOString(); return result(report); });

await ensureBridge();
await serveStdio(() => server);
