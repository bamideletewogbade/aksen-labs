import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const passwordUrl=uri(compile(fs.readFileSync('lib/admin-password.ts','utf8')));
const {hashPassword,verifyPassword,digestToken}=await import(passwordUrl);
const hash=await hashPassword('synthetic-test-password');assert.ok(await verifyPassword('synthetic-test-password',hash));assert.equal(await verifyPassword('wrong',hash),false);assert.equal(await verifyPassword('x','invalid'),false);assert.notEqual(hash,await hashPassword('synthetic-test-password'));assert.equal((await digestToken('token')).length,64);
let code=compile(fs.readFileSync('lib/admin-session.ts','utf8'));const mods={'drizzle-orm':uri('export const sql=(...x)=>x'),'@/db':uri('export const getDb=()=>({execute:async()=>({rows:globalThis.sessionRows||[]})})'),'./admin-password':passwordUrl};
code=code.replace(/from\s+['"]([^'"]+)['"]/g,(_,name)=>`from '${mods[name]||name}'`);const {sessionToken,adminSessionUser}=await import(uri(code));
assert.equal(sessionToken('aksen_admin=bad'),null);assert.equal(sessionToken('aksen_admin='+'a'.repeat(64)+'; aksen_admin='+'b'.repeat(64)),null);
process.env.ADMIN_PASSWORD_HASH=hash;process.env.ADMIN_EMAILS='test@example.com';
assert.equal(await adminSessionUser('aksen_admin='+'a'.repeat(64)),null);globalThis.sessionRows=[{owner_id:'retained-owner',email:'test@example.com'}];assert.equal((await adminSessionUser('aksen_admin='+'a'.repeat(64))).userId,'retained-owner');
console.log('PASS: salted password verification, wrong/malformed rejection, token hashing, duplicate-cookie rejection and session owner preservation.');
globalThis.loginAllowed=true;globalThis.savedSession=false;
const routeMods={
 'drizzle-orm':uri('export const sql=(strings,...values)=>({text:strings.join("?"),values})'),
 '@/db':uri('export const getDb=()=>({execute:async query=>{if(query.text.includes("workspace_demo_usage"))return {rows:globalThis.loginAllowed?[{}]:[]};if(query.text.includes("INSERT INTO admin_sessions"))globalThis.savedSession=true;return {rows:[]}}})'),
 '@/lib/bounded-json':uri(compile(fs.readFileSync('lib/bounded-json.ts','utf8'))),
 '@/lib/admin-password':passwordUrl,
 '@/lib/admin-session':uri('export const ADMIN_COOKIE="aksen_admin";export const sessionToken=()=>null;export const sessionVersion=async()=>"test-version"'),
 '@/lib/request-log':uri('export const withRequestLog=(_p,h)=>h'),
};
let route=compile(fs.readFileSync('app/api/session/route.ts','utf8')).replace(/from\s+['"]([^'"]+)['"]/g,(_,name)=>`from '${routeMods[name]||name}'`);
const {POST}=await import(uri(route));process.env.ADMIN_OWNER_ID='retained-owner';
const login=(email,password,headers={})=>POST(new Request('https://local/api/session',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({email,password})}));
assert.equal((await login('test@example.com','synthetic-test-password',{origin:'https://elsewhere'})).status,403);
assert.equal((await login('test@example.com','wrong')).status,401);assert.equal(globalThis.savedSession,false);
assert.equal((await login('other@example.com','synthetic-test-password')).status,401);assert.equal(globalThis.savedSession,false);
globalThis.loginAllowed=false;assert.equal((await login('test@example.com','synthetic-test-password')).status,429);globalThis.loginAllowed=true;
const signedIn=await login('TEST@example.com','synthetic-test-password');assert.equal(signedIn.status,200);assert.equal(globalThis.savedSession,true);for(const flag of ['HttpOnly','Secure','SameSite=Strict','Max-Age=28800'])assert.ok(signedIn.headers.get('set-cookie').includes(flag));
console.log('PASS: sign-in origin, credentials, account match, persistent rate-limit gate and HTTPS cookie flags.');
