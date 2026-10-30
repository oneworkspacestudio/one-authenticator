import { createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Authenticator } from './Screen';
import { Controls } from './ui';
import { open, provision, seal, totp, type Account, type Vault } from './crypto';
import { storage } from './storage';
import './style.css';

let installPrompt: any;
window.addEventListener('beforeinstallprompt', (event: any) => { event.preventDefault(); installPrompt=event; });
function App(){
 const [screen,setScreen]=useState('loading');const [vault,setVault]=useState<Vault>();const [account,setAccount]=useState<Account>();
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [code,setCode]=useState('••• •••');const [now,setNow]=useState(Date.now());
 const [online,setOnline]=useState(navigator.onLine);const [copyStatus,setCopyStatus]=useState('');const [scanning,setScanning]=useState(false);
 const [idleSeconds,setIdleSeconds]=useState(()=>{try{return localStorage.getItem('one-authenticator-idle')==='300'?300:60;}catch{return 60;}});
 const activity=useRef(Date.now());const alive=useRef(0);const scanEpoch=useRef(0);const scanner=useRef<{stop:()=>void}|undefined>(undefined);
 const clearInputs=()=>document.querySelectorAll<HTMLInputElement>('input').forEach(input=>input.value='');
 const stopScan=()=>{scanEpoch.current++;scanner.current?.stop();scanner.current=undefined;const video=document.querySelector<HTMLVideoElement>('#qr-camera');(video?.srcObject as MediaStream|null)?.getTracks().forEach(track=>track.stop());setScanning(false);};
 const lock=()=>{alive.current++;setAccount(undefined);setCode('••• •••');setScreen(vault?'locked':'welcome');setCopyStatus('');clearInputs();stopScan();};
 useEffect(()=>{storage('get').then(v=>{setVault(v);setScreen(v?'locked':'welcome');}).catch(e=>{setError(e.message);setScreen('help');});},[]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);addEventListener('online',update);addEventListener('offline',update);return()=>{removeEventListener('online',update);removeEventListener('offline',update);};},[]);
 useEffect(()=>{const hidden=()=>{if(document.hidden){alive.current++;setAccount(undefined);setCode('••• •••');clearInputs();stopScan();setScreen(vault?'locked':'welcome');}};const touch=()=>activity.current=Date.now();document.addEventListener('visibilitychange',hidden);addEventListener('pagehide',hidden);addEventListener('pointerdown',touch);addEventListener('keydown',touch);return()=>{document.removeEventListener('visibilitychange',hidden);removeEventListener('pagehide',hidden);removeEventListener('pointerdown',touch);removeEventListener('keydown',touch);};},[vault]);
 useEffect(()=>{let cancelled=false;const tick=async()=>{const t=Date.now();setNow(t);if(account){if(t-activity.current>idleSeconds*1000){lock();return;}const next=await totp(account.secret,t);if(!cancelled)setCode(next.slice(0,3)+' '+next.slice(3));}};void tick();const interval=setInterval(()=>void tick(),250);return()=>{cancelled=true;clearInterval(interval);};},[account,idleSeconds]);
 const input=(name:string)=>(document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value || '');
 async function action(name:string){
  if(busy)return;setError('');activity.current=Date.now();
  try {
   if(name==='setup'){setScreen('setup');return;}
   if(name==='cancel'){clearInputs();stopScan();setScreen(vault?'locked':'welcome');return;}
   if(name==='back'){setScreen(account?'codes':vault?'locked':'welcome');return;}
   if(name==='lock'){lock();return;}
   if(name==='help'||name==='settings'){setScreen(name);return;}
   if(name==='idle1'||name==='idle5'){const seconds=name==='idle1'?60:300;setIdleSeconds(seconds);try{localStorage.setItem('one-authenticator-idle',String(seconds));}catch{}return;}
   if(name==='install'){if(installPrompt){await installPrompt.prompt();installPrompt=undefined;}else setScreen('help');return;}
   if(name==='remove'){setScreen('removing');return;}
   if(name==='confirmRemove'){if(input('removeConfirmation')!=='REMOVE')throw Error('Type REMOVE to confirm.');await storage('delete');setVault(undefined);setAccount(undefined);setCode('••• •••');setScreen('welcome');return;}
   if(name==='scan'){
    if(!isSecureContext)throw Error('Camera setup requires HTTPS or localhost.');stopScan();const generation=scanEpoch.current;setScanning(true);
    const {BrowserQRCodeReader}=await import('@zxing/browser');
    await new Promise<void>(r=>requestAnimationFrame(()=>r()));
    if(generation!==scanEpoch.current)return;const reader=new BrowserQRCodeReader();const controls=await reader.decodeFromVideoDevice(undefined,'qr-camera',(result)=>{if(result){try{const value=result.getText();provision(value);const field=document.querySelector<HTMLInputElement>('input[name="setupKey"]');if(field)field.value=value;stopScan();}catch(e){setError((e as Error).message);}}});if(generation===scanEpoch.current)scanner.current=controls;else controls.stop();return;
   }
   if(name==='copy'){
    if(!account)throw Error('Unlock the vault first.');const current=await totp(account.secret);await navigator.clipboard.writeText(current);setCopyStatus('Copied. Paste only into your trusted OneAccount sign-in.');
    // Browsers cannot guarantee a delayed clipboard write or background clearing.
    setTimeout(()=>{void navigator.clipboard.readText().then(v=>{if(v===current)return navigator.clipboard.writeText('');}).catch(()=>{});},15000);return;
   }
   if(name==='save'){
    const phrase=input('passphrase');if(phrase!==input('confirmPassphrase'))throw Error('Passphrases do not match.');
    const a=provision(input('setupKey'),input('accountLabel') || 'OneAccount',input('deviceLabel') || 'My phone');const generation=alive.current;setBusy(true);
    const encrypted=await seal(a,phrase);await storage('put',encrypted);setVault(encrypted);clearInputs();
    void navigator.storage?.persist?.().catch(()=>{});
    if(generation===alive.current&&!document.hidden){setAccount(a);setScreen('codes');}else setScreen('locked');return;
   }
   if(name==='unlock'){
    if(!vault)throw Error('Vault unavailable.');const phrase=input('unlockPassphrase');clearInputs();const generation=alive.current;setBusy(true);const a=await open(vault,phrase);
    if(generation===alive.current&&!document.hidden){setAccount(a);setScreen('codes');}return;
   }
  }catch(e){setError((e as Error).message);stopScan();}finally{setBusy(false);}
 }
 const maskedLabel=account ? account.label.includes('@')?account.label.replace(/^(.).*(@.*)$/,'$1•••$2'):account.label.slice(0,2)+'•••' : '';
 const data={error,busy,hasVault:!!vault,...Object.fromEntries(['welcome','setup','locked','codes','settings','help','removing'].map(s=>[s,s===screen])),scanning,code,remaining:30-(now%30000)/1000,maskedLabel,device:account?.device,copyStatus,connection:online?'Ready offline · no account connection needed':'Works offline'};
 return h(Controls.Provider,{value:{busy}},h(Authenticator,{data,onAction:(name:string)=>void action(name)}));
}
createRoot(document.getElementById('root')!).render(h(App));
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
if(location.pathname.startsWith('/authenticator/')&&navigator.onLine){const script=document.createElement('script');script.src='/_workspace/navigation.js';script.defer=true;document.body.append(script);}
