import type { Express, Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { timingSafeEqual } from "node:crypto";

/** DarkVolt audio/WebRTC telemetry. Records metrics only, never audio/SDP/IP/device IDs. */
type Runtime = { isLive:boolean; sessionId:string|null; broadcasterSocketId:string|null; viewerSocketIds:ReadonlySet<string> };
type Event = { at:number; sessionId:string; role:"publisher"|"viewer"; peer:string; connectionState:string;
  network?:{lossPct?:number;jitterMs?:number;rttMs?:number;kbps?:number;concealedPct?:number;route?:string};
  source?:{label?:string;peakDbfs?:number;clippingRatio?:number;silent?:boolean;settings?:Record<string,unknown>};issues:string[] };
const MAX_EVENTS=2500, RETENTION_MS=3600000;
const issuesAllowed=new Set(["rtc_disconnected","packet_loss","high_jitter","concealed_audio","source_clipping","source_silent","processing_enabled","wrong_device","audio_track_ended"]);
const states=new Set(["new","connecting","connected","disconnected","failed","closed"]);
const num=(v:unknown,lo:number,hi:number)=>typeof v==="number"&&Number.isFinite(v)&&v>=lo&&v<=hi?v:undefined;
const str=(v:unknown,max=100)=>typeof v==="string"?v.slice(0,max):undefined;
function authorize(req:Request):boolean {
  const expected=process.env.ADMIN_DIAGNOSTICS_TOKEN;
  if(!expected||expected.length<24)return false;
  const value=req.get("authorization")?.replace(/^Bearer\s+/i,"")??"";
  const a=Buffer.from(value),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function installStreamDiagnostics(app:Express,io:Server,runtime:()=>Runtime) {
  const events:Event[]=[],lastBySocket=new Map<string,number>();
  const trim=()=>{while(events.length&&(events.length>MAX_EVENTS||events[0].at<Date.now()-RETENTION_MS))events.shift();};
  io.on("connection",(socket:Socket)=>{
    socket.on("diagnostics:sample",(raw:any)=>{
      const st=runtime(),publisher=st.broadcasterSocketId===socket.id,viewer=st.viewerSocketIds.has(socket.id);
      if(!st.isLive||(!publisher&&!viewer)||!raw||raw.v!==1||!states.has(raw.connectionState))return;
      const at=Date.now();if(at-(lastBySocket.get(socket.id)??0)<3000)return;
      const n=raw.network&&typeof raw.network==="object"?raw.network:{};
      const s=raw.source&&typeof raw.source==="object"?raw.source:undefined;
      const settings=s?.settings&&typeof s.settings==="object"?s.settings:{};
      const entry:Event={at,sessionId:st.sessionId??"unknown",peer:socket.id,role:publisher?"publisher":"viewer",connectionState:raw.connectionState,
        network:{lossPct:num(n.lossPct,0,100),jitterMs:num(n.jitterMs,0,120000),rttMs:num(n.rttMs,0,120000),
          kbps:num(n.kbps,0,200000),concealedPct:num(n.concealedPct,0,100),route:["relay","direct","unknown"].includes(n.route)?n.route:undefined},
        issues:Array.isArray(raw.issues)?raw.issues.filter((x:unknown)=>typeof x==="string"&&issuesAllowed.has(x)).slice(0,8):[]};
      if(s)entry.source={label:str(s.label),peakDbfs:num(s.peakDbfs,-120,0),clippingRatio:num(s.clippingRatio,0,1),silent:s.silent===true,
        settings:{sampleRate:num(settings.sampleRate,8000,384000),channelCount:num(settings.channelCount,1,32),
          echoCancellation:settings.echoCancellation===true?true:settings.echoCancellation===false?false:undefined,
          noiseSuppression:settings.noiseSuppression===true?true:settings.noiseSuppression===false?false:undefined,
          autoGainControl:settings.autoGainControl===true?true:settings.autoGainControl===false?false:undefined}};
      lastBySocket.set(socket.id,at);events.push(entry);trim();
      if(entry.issues.length)console.warn("[DARKVOLT_STREAM_DIAGNOSTICS]",JSON.stringify({at:entry.at,sessionId:entry.sessionId,role:entry.role,issues:entry.issues,network:entry.network}));
    });
    socket.on("disconnect",()=>lastBySocket.delete(socket.id));
  });
  app.get("/api/internal/stream-diagnostics",(req:Request,res:Response)=>{
    if(!authorize(req))return res.status(403).json({error:"Forbidden"});
    trim();const selected=typeof req.query.sessionId==="string"?events.filter(x=>x.sessionId===req.query.sessionId):events;
    const samples=selected.slice(-500);
    return res.set("Cache-Control","no-store").json({schemaVersion:1,generatedAt:Date.now(),retentionMinutes:60,
      summary:{total:samples.length,publisher:samples.filter(x=>x.role==="publisher").length,viewers:samples.filter(x=>x.role==="viewer").length},
      samples});
  });
}