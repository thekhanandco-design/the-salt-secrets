import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminUser } from "@/lib/admin-auth";

function esc(value:unknown){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c))}
function htmlBody(message:string){return `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#251f22;max-width:720px;margin:auto"><div style="border-top:4px solid #a51f43;padding-top:24px"><h2 style="font-family:Georgia,serif;color:#17171a">The Salt Origin</h2>${message.split("\n").map(line=>`<p>${esc(line)||"&nbsp;"}</p>`).join("")}<p style="font-size:12px;color:#777;margin-top:30px">You are receiving this because you subscribed to The Salt Origin updates.</p></div></div>`}

export async function POST(request:Request){
  try{
    const{client,identity}=await requireAdminUser(request);
    const body=await request.json();
    const subject=String(body.subject||"").trim();
    const message=String(body.message||"").trim();
    const audience=String(body.audience||"subscribed").trim();
    if(!subject||!message)return NextResponse.json({error:"Subject and message are required."},{status:400});
    if(!process.env.RESEND_API_KEY)return NextResponse.json({error:"RESEND_API_KEY is not configured."},{status:409});
    const from=process.env.RESEND_FROM_EMAIL||process.env.EMAIL_FROM;
    if(!from)return NextResponse.json({error:"RESEND_FROM_EMAIL or EMAIL_FROM is not configured."},{status:409});
    let query=client.from("newsletter_subscribers").select("id,email,status,language,source");
    if(audience==="subscribed"||audience==="confirmed")query=query.eq("status","subscribed");
    const subscribers=await query.limit(1000);
    if(subscribers.error)throw new Error(subscribers.error.message);
    const recipients=(subscribers.data||[]).map(row=>String(row.email||"").trim().toLowerCase()).filter(email=>email.includes("@"));
    if(!recipients.length)return NextResponse.json({error:"No eligible newsletter subscribers found."},{status:409});
    const resend=new Resend(process.env.RESEND_API_KEY);
    const sent:string[]=[]; const failed:{email:string;error:string}[]=[];
    for(let index=0;index<recipients.length;index+=25){
      const batch=recipients.slice(index,index+25);
      const results=await Promise.all(batch.map(async email=>{const result=await resend.emails.send({from,to:email,subject,html:htmlBody(message)});return{email,result}}));
      for(const item of results){if(item.result.error)failed.push({email:item.email,error:item.result.error.message});else sent.push(item.email)}
    }
    if(body.campaignId){await client.from("marketing_campaigns").update({status:failed.length?"partial":"completed",updated_at:new Date().toISOString()}).eq("id",String(body.campaignId))}
    await client.from("b2b_activities").insert({activity_type:"newsletter_campaign_sent",module:"Newsletter",record_id:String(body.campaignId||""),title:`Newsletter sent to ${sent.length} subscriber${sent.length===1?"":"s"}`,description:subject,actor_id:identity.id,actor_email:identity.email,metadata:{sent:sent.length,failed:failed.length}});
    return NextResponse.json({success:sent.length>0,sent:sent.length,failed:failed.length,failures:failed.slice(0,20)});
  }catch(error){if(error instanceof Response)return error;return NextResponse.json({error:error instanceof Error?error.message:"Newsletter could not be sent."},{status:500})}
}
