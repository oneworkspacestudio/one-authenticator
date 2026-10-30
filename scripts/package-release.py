"""Package locally built public artifacts; never publishes or reads installed data."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def contract(c):
 return {'id':'authenticator','name':'One Authenticator','description':'Keep your OneAccount security codes on your phone, even offline','version':c['version'],'kind':'process','package':'authenticator','executable':'one-authenticator.exe','port':9027,'route':'/authenticator','stripPrefix':True,'health':'/healthz','oidc':False,'args':['--listen','127.0.0.1:${PORT}','--public-origin','${ORIGIN}'],'source':'https://github.com/oneworkspacestudio/one-authenticator/releases/tag/v'+c['version']}
def main():
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--notices',required=True);a=p.parse_args();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
 c=json.loads((ROOT/'compatibility.json').read_text(encoding='utf-8'));exe=ROOT/'dist/one-authenticator.exe';assert subprocess.check_output([str(exe),'--version'],text=True).strip()==c['version']
 source=subprocess.check_output(['git','-c','safe.directory='+ROOT.as_posix(),'-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
 contents={name:(ROOT/name).read_bytes() for name in ['LICENSE','NOTICE','compatibility.json']};contents['one-authenticator.exe']=exe.read_bytes();contents['THIRD-PARTY-LICENSES.txt']=Path(a.notices).read_bytes()
 manifest={'schema':1,'version':c['version'],'sourceCommit':source,'singleExecutable':True,'files':{n:{'sha256':hashlib.sha256(b).hexdigest(),'size':len(b)} for n,b in contents.items()}}
 contents['manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode();archive='one-authenticator-'+c['version']+'-windows-amd64.zip'
 with zipfile.ZipFile(out/archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,data in sorted(contents.items()):info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
 packages={}
 for name,data in contents.items():
  if name=='one-authenticator.exe':key,dest='authenticator',name
  elif name in ['LICENSE','NOTICE','THIRD-PARTY-LICENSES.txt']:key,dest='authenticator-'+name,'licenses/OneAuthenticator-'+name
  else:key,dest='authenticator-'+('contract' if name=='compatibility.json' else 'manifest'),'docs/OneAuthenticator/'+name
  packages[key]={'file':dest,'sha256':hashlib.sha256(data).hexdigest(),'size':len(data),'asset':archive,'member':name}
 metadata={'schema':2,'integration':3,'repository':'oneworkspacestudio/one-authenticator','tag':'v'+c['version'],'apps':[contract(c)],'packages':packages,'minimumManager':c['minimumWorkspaceVersion'],'requiredCapabilities':c['capabilities']}
 (out/'workspace-update.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8');(out/'one-authenticator.exe').write_bytes(contents['one-authenticator.exe'])
 for name in ['README.md','LICENSE','NOTICE','config.example.ps1','start-authenticator.cmd']:(out/name).write_bytes((ROOT/name).read_bytes())
 (out/'manifest.json').write_bytes(contents['manifest.json']);(out/'THIRD-PARTY-LICENSES.txt').write_bytes(contents['THIRD-PARTY-LICENSES.txt'])
 (out/'SHA256SUMS.txt').write_text(''.join(sha(f)+'  '+f.name+'\n' for f in sorted(out.iterdir()) if f.is_file() and f.name!='SHA256SUMS.txt'),encoding='utf-8')
 print('Packaged',archive,'from',source)
if __name__=='__main__':main()
