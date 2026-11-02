const SESSION='__Host-homepage_session',STATE='__Host-homepage_oauth';
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function unb64(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
async function key(secret){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function seal(value,secret){const payload=b64(enc.encode(JSON.stringify(value)));return payload+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(payload))))}
async function unseal(token,secret){try{const [payload,sig,...extra]=token.split('.');if(extra.length||!payload||!sig)return null;if(!await crypto.subtle.verify('HMAC',await key(secret),unb64(sig),enc.encode(payload)))return null;const value=JSON.parse(new TextDecoder().decode(unb64(payload)));return Number.isFinite(value.exp)&&value.exp>Date.now()/1000?value:null}catch{return null}}
const cookie=(name,value,seconds)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
function readCookie(request,name){return request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
function headers(){return new Headers({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'})}
function redirect(url,cookies=[]){const h=headers();h.set('Location',url);cookies.forEach(c=>h.append('Set-Cookie',c));return new Response(null,{status:303,headers:h})}
function page(message='',status=200){const h=headers();h.set('Content-Type','text/html; charset=utf-8');return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Homepage · Sign in</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f7ea;font:14px Verdana,sans-serif;color:#48693f;min-height:100svh;display:grid;place-items:center;overflow:hidden}body:before{content:'';position:fixed;inset:0;z-index:-1;background:radial-gradient(circle,#cbdca9 1.8px,transparent 2px) 0 0/24px 24px;animation:dots 8s linear infinite}main{width:min(340px,calc(100% - 36px));background:#fffbea;border:1.5px solid #9ab873;border-radius:16px;padding:30px 24px;text-align:center;box-shadow:5px 5px #d2e4b7}h1{font:28px Georgia;margin:0 0 10px}p{font-size:12px;line-height:1.6}a{display:inline-flex;align-items:center;justify-content:center;gap:12px;background:white;border:1px solid #747775;border-radius:5px;color:#1f1f1f;font:500 14px Arial;padding:12px 16px;text-decoration:none;margin-top:12px}b{font-size:20px;color:#4285f4}small{display:block;margin-top:18px;font-size:11px;color:#768967}@keyframes dots{to{background-position:96px -96px}}@media(prefers-reduced-motion:reduce){body:before{animation:none}}</style><main><h1>Homepage</h1><p>${message||'A little space to call home.'}</p><a href="/auth/login"><b aria-hidden="true">G</b>Sign in with Google</a><small>Use your Google account to continue.</small></main></html>`,{status,headers:h})}
function allowed(env,user){const emails=(env.ALLOWED_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return !emails.length||emails.includes(user.email.toLowerCase())}
export async function onRequest(context){const {request,env}=context,url=new URL(request.url),path=url.pathname;
 // The configured production origin also pins the Google callback URL.
 if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!env.SESSION_SECRET||env.SESSION_SECRET.length<32||!env.SITE_URL)return page('Google sign-in is not configured yet. The owner needs to add the Cloudflare environment settings.',503);
 let origin;try{origin=new URL(env.SITE_URL).origin;if(!origin.startsWith('https://'))throw Error()}catch{return page('The owner needs to configure a valid HTTPS SITE_URL.',503)}
 if(url.origin!==origin)return redirect(origin+'/');
 const session=await unseal(readCookie(request,SESSION),env.SESSION_SECRET);
 const user=session?.kind==='session'&&typeof session.email==='string'&&typeof session.sub==='string'&&allowed(env,session)?session:null;
 if(path==='/auth/login'){
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  const state=b64(crypto.getRandomValues(new Uint8Array(32))),verifier=b64(crypto.getRandomValues(new Uint8Array(32))),challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(verifier))));
  const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');auth.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:origin+'/auth/callback',response_type:'code',scope:'openid email profile',state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();
  return redirect(auth.toString(),[cookie(STATE,await seal({kind:'oauth',state,verifier,exp:Date.now()/1000+600},env.SESSION_SECRET),600)]);
 }
 if(path==='/auth/callback'){
  const pending=await unseal(readCookie(request,STATE),env.SESSION_SECRET);const clear=cookie(STATE,'',0);
  if(request.method!=='GET'||pending?.kind!=='oauth'||!url.searchParams.get('state')||pending.state!==url.searchParams.get('state'))return page('Sign-in expired or could not be verified. Please try again.',400);
  if(url.searchParams.has('error')||!url.searchParams.get('code'))return redirect('/signin?error=cancelled',[clear]);
  try{
   const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code:url.searchParams.get('code'),code_verifier:pending.verifier,grant_type:'authorization_code',redirect_uri:origin+'/auth/callback'})});
   if(!tokenResponse.ok)throw Error('token');const tokens=await tokenResponse.json();if(typeof tokens.access_token!=='string')throw Error('token');
   const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+tokens.access_token}});if(!info.ok)throw Error('userinfo');const account=await info.json();
   if(!account.sub||typeof account.email!=='string'||account.email_verified!==true)throw Error('email');
   if(!allowed(env,account)){const response=page('This Google account does not have access to this Homepage.',403);response.headers.append('Set-Cookie',clear);return response}
   const value=await seal({kind:'session',sub:account.sub,email:account.email,name:String(account.name||account.email).slice(0,160),exp:Math.floor(Date.now()/1000)+604800},env.SESSION_SECRET);
   return redirect('/',[cookie(SESSION,value,604800),clear]);
  }catch{return redirect('/signin?error=failed',[clear])}
 }
 if(path==='/auth/logout'){
  if(request.method!=='POST'||request.headers.get('Origin')!==origin)return new Response('Not allowed',{status:403,headers:headers()});
  return redirect('/signin',[cookie(SESSION,'',0),cookie(STATE,'',0)]);
 }
 if(path==='/auth/me'){const h=headers();h.set('Content-Type','application/json');return new Response(JSON.stringify(user?{name:user.name,email:user.email}: {signedIn:false}),{status:user?200:401,headers:h})}
 if(path==='/signin')return user?redirect('/'):page(url.searchParams.get('error')==='failed'?'Google sign-in failed. Please try again.':url.searchParams.get('error')==='cancelled'?'Sign-in was cancelled. Please try again.':'');
 if(!user)return request.method==='GET'||request.method==='HEAD'?redirect('/signin'):new Response('Sign in required',{status:401,headers:headers()});
 const upstream=await context.next();const response=new Response(upstream.body,upstream);response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');return response;
}
