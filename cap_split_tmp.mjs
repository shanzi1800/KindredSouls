import https from 'node:https';
const body = JSON.stringify({birthDate:'1992-03-17',birthTime:'07:00',lat:10.8231,lon:106.6297,tz:'Asia/Ho_Chi_Minh',lang:'vi',reportType:'monthly'});
const req = https.request({host:'kindredsouls.online',path:'/api/wealth-oracle/stream',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'Accept-Encoding':'identity'},timeout:200000},(res)=>{
  let data=''; res.on('data',c=>data+=c); res.on('end',()=>{
    let text='',san=''; const events=[];
    for(const line of data.split('\n')){ if(!line.startsWith('data: '))continue; const p=line.slice(6); if(p==='[DONE]')continue; try{const j=JSON.parse(p); if(j.text)text+=j.text; if(j.sanitized)san=j.sanitized; if(j.text&&j._dbg)events.push({dbg:j._dbg,len:j.text.length});}catch(e){} }
    const check=(t,l)=>{ const ms=[...t.matchAll(/mayắn|khôngý|trongương/g)]; return ms.length; };
    console.log('text len', text.length, 'mayắn数:', check(text), '| sanitized len', san.length, 'mayắn数:', check(san));
    // text 流中 mayắn 上下文
    const ms=[...text.matchAll(/mayắn/g)];
    for(const m of ms.slice(0,3)) console.log('TEXT...'+text.slice(Math.max(0,m.index-60),m.index+60).replace(/\n/g,'⏎')+'...');
    // san 独有 vs text 共有
    const sOnly = san.includes('mayắn') && !text.includes('mayắn');
    console.log('mayắn 仅sanitized引入:', sOnly);
    // text 中是否 may + 空格 + mắn 完整存在(说明text干净,san损坏)
    console.log('text 含完整 may mắn:', text.includes('may mắn'), '| san 含完整 may mắn:', san.includes('may mắn'));
    // 检查事件数/dbg
    console.log('text事件数(含dbg):', events.length, '| 首事件dbg:', JSON.stringify(events[0]?.dbg).slice(0,150));
  });
}); req.on('error',e=>console.error('ERR',e.message)); req.end();
