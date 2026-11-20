// Build the public feed and a restart checkpoint. No credentials are passed to collectors.
import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync,gzipSync} from 'node:zlib';
import {translateFeed} from './translate.mjs';
import worker,{sweep} from '../dist/server/index.js';

const directory=process.argv[2];
if(!directory)throw Error('수집 상태를 저장할 디렉터리를 지정하세요.');
await fs.mkdir(directory,{recursive:true});
const checkpoint=path.join(directory,'state.json.gz');
let previous, oldTranslations={};
try{
  previous=gunzipSync(await fs.readFile(checkpoint)).toString('utf8');
  const data=JSON.parse(previous);
  oldTranslations=data.koreanTranslations || {};
  if(!Array.isArray(data.events)||!data.progress)throw Error('수집 상태 형식 오류');
}catch(error){if(error.code!=='ENOENT')throw error}
let next;
const env={ARCHIVE:{get:async()=>next??previous,put:async(key,value)=>{next=value}}};
await sweep(env);
const response=await worker.fetch(new Request('https://stovewatch.invalid/api/feed'),env);
const feed=await response.json();
if(!response.ok||!feed.checkedAt||!Array.isArray(feed.sources))throw Error('공개 피드 생성 실패');
const ok=feed.sources.filter(s=>s.ok).length;
if(!ok&&!previous)throw Error('첫 수집에 성공한 출처가 없습니다. 빈 피드를 게시하지 않습니다.');
const koreanTranslations=await translateFeed(feed,oldTranslations);
await fs.writeFile(checkpoint,gzipSync(JSON.stringify({...JSON.parse(next),koreanTranslations})));
await fs.writeFile(path.join(directory,'feed.json'),JSON.stringify({...feed,koreanTranslations,mode:'pages'}));
console.log(feed.checkedAt+'  '+ok+'/'+feed.sources.length+' sources responding.');

