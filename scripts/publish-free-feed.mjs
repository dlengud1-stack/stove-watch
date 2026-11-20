// Publish a complete feed and its restart checkpoint together, without modifying the checkout.
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const ref='refs/heads/stovewatch-feed';
const format='stovewatch-public-feed-v1';
const out=mkdtempSync(join(tmpdir(),'stove-public-'));
const git=(args,input)=>execFileSync('git',args,{input,maxBuffer:32*1024*1024});
const hash=input=>git(['hash-object','-w','--stdin'],input).toString().trim();

try {
  const remote=spawnSync('git',['ls-remote','--exit-code','--heads','origin',ref],{encoding:'utf8'});
  if(remote.error)throw remote.error;
  const parents=[];
  if(remote.status===0){
    git(['fetch','--no-tags','--depth=1','origin',ref]);
    const parent=git(['rev-parse','FETCH_HEAD']).toString().trim();
    if(git(['show',parent+':.stove-format']).toString().trim()!==format)
      throw Error('전용 데이터 브랜치의 형식이 다릅니다. 해당 브랜치의 내용을 확인하세요.');
    writeFileSync(join(out,'state.json.gz'),git(['show',parent+':state.json.gz']));
    parents.push('-p',parent);
  }else if(remote.status!==2){
    throw Error('데이터 브랜치 조회 실패. '+remote.stderr.trim());
  }
  execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
  execFileSync(process.execPath,['scripts/collect-once.mjs',out],{stdio:'inherit'});
  const files=[['.stove-format',format+'\n'],['feed.json',readFileSync(join(out,'feed.json'))],['state.json.gz',readFileSync(join(out,'state.json.gz'))]];
  const entries=files.map(([name,content])=>'100644 blob '+hash(content)+'\t'+name+'\n').join('');
  const tree=git(['mktree'],entries).toString().trim();
  const commit=git(['-c','user.name=Stove Watch','-c','user.email=github-actions[bot]@users.noreply.github.com','commit-tree',tree,...parents,'-m','Refresh LCK public feed']).toString().trim();
  git(['push','origin',commit+':'+ref]);
}finally{
  rmSync(out,{force:true,recursive:true});
}
