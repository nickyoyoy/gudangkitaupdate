import type { Request, Response } from 'express';
import { authorizeRead, fail } from './_lib/http.js';
import { readCollection } from './_lib/firestoreReader.js';
export default async function handler(req: Request,res: Response){
 if(!authorizeRead(req,res)) return;
 try{
  const days=Math.min(Math.max(Number(req.query.days)||7,1),90);
  const all=await readCollection('items');
  const items=all.map((i:any)=>{const rate=Number(i.targetDailyRate)||0,stock=Number(i.stock)||0;return {...i,daysRemaining:rate>0?stock/rate:null};})
    .filter((i:any)=>i.daysRemaining!==null&&i.daysRemaining<=days).sort((a:any,b:any)=>a.daysRemaining-b.daysRemaining);
  res.status(200).json({thresholdDays:days,count:items.length,items});
 }catch(e){fail(res,e);}
}