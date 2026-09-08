import https from 'node:https';
import { writeFileSync } from 'node:fs';
const body = JSON.stringify({birthDate:'1992-03-17',birthTime:'07:00',lat:10.8231,lon:106.6297,tz:'Asia/Ho_Chi_Minh',lang:'vi',reportType:'monthly'});
const req = https.request({host:'kindredsouls.online',path:'/api/wealth-oracle/stream',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'Accept-Encoding':'identity'},timeout:190000},(res)=>{
  let data=''; res.on('data',c=>data+=c); res.on('end',()=>{
    let text='',san='',dbgInfo=[];
    for(const line of data.split('\n')){ if(!line.startsWith('data: '))continue; const p=line.slice(6); if(p==='[DONE]')continue; try{const j=JSON.parse(p); if(j.text)text+=j.text; if(j.sanitized)san=j.sanitized; if(j._dbg)dbgInfo.push(j._dbg);}catch(e){} }
    const ms=[...text.matchAll(/mayắn/g)]; const ss=[...san.matchAll(/mayắn/g)];
    const out = {textLen:text.length, sanLen:san.length, textMayan:ms.length, sanMayan:ss.length, textFull:text.includes('may mắn'), sanFull:san.includes('may mắn'), sanOnly:san.includes('mayắn')&&!text.includes('mayắn'), dbgCount:dbgInfo.length, dbgFirst:dbgInfo[0]||null, textCtx:ms.slice(0,3).map(m=>text.slice(Math.max(0,m.index-60),m.index+60)), sanCtx:ss.slice(0,3).map(m=>san.slice(Math.max(0,m.index-60),m.index+60))};
    writeFileSync('/tmp/cap_split_out.json', JSON.stringify(out,null,1));
    console.log('DONE');
    process.exit(0);
  });
});
req.on('error',e=>{ console.log('ERR '+e.message); process.exit(1); });
req.setTimeout(190000, ()=>{ console.log('TIMEOUT'); process.exit(2); });
req.end();
