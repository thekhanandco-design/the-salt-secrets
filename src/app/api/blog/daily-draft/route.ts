import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList, stripResearchLinks } from "@/lib/content-quality";

type ContentType = "blog" | "article";
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}

async function createFeaturedImage(supabase:any,prompt:string,type:ContentType){
  if(!process.env.OPENAI_API_KEY||process.env.OPENAI_IMAGE_AUTOGENERATE==="false")return{url:"",warning:"Automatic image generation is not enabled."};
  try{
    const response=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||"gpt-image-1",prompt:`${prompt}. Premium editorial B2B export image for The Salt Origin. Himalayan pink salt, realistic product or trade context, elegant pink and neutral palette, no medical claim, no invented certification, no third-party logo, no readable text.`,size:"1536x1024",n:1}),cache:"no-store"});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload?.error?.message||"Image generation failed.");
    const item=payload?.data?.[0];
    if(item?.b64_json){const bytes=Uint8Array.from(Buffer.from(item.b64_json,"base64"));const path=`blog/${new Date().toISOString().slice(0,10)}/${type}-${crypto.randomUUID()}.png`;const upload=await supabase.storage.from("cms-media").upload(path,bytes,{contentType:"image/png",upsert:false});if(upload.error)throw new Error(upload.error.message);return{url:supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl,warning:""}}
    if(item?.url)return{url:String(item.url),warning:""};
    throw new Error("Image provider returned no image.");
  }catch(error){return{url:"",warning:error instanceof Error?error.message:"Image generation failed."}}
}

async function generateOne(supabase:any,type:ContentType,focus:string,language:string){
  const start=new Date();start.setUTCHours(0,0,0,0);const end=new Date(start);end.setUTCDate(end.getUTCDate()+1);
  const{data:existing}=await supabase.from("blog_posts").select("id,title,slug,content_type,featured_image,status,created_at,keywords,primary_keyword,seo_score,geo_score").gte("created_at",start.toISOString()).lt("created_at",end.toISOString()).in("status",["draft","review","approved","scheduled"]).eq("content_type",type).limit(1).maybeSingle();
  if(existing)return{skipped:true,reason:`Today's ${type} draft already exists.`,draft:existing};
  const length=type==="blog"?"900 to 1300":"1500 to 2200";
  const format=type==="blog"?"buyer-help blog with a focused practical angle and clear B2B action points":"authoritative SEO article with deeper supplier-selection, packaging, compliance and export guidance";
  const{text,model}=await runOpenAI({model:process.env.OPENAI_BLOG_MODEL,tools:[{type:"web_search",search_context_size:"medium"}],input:`Act as the daily research and publishing editor for The Salt Origin, a B2B Himalayan pink salt exporter and private-label supplier. Research current public buyer questions, supplier-search intent, packaging interests, importer concerns and content gaps related to: ${focus}.
Choose ONE timely topic that has real buyer usefulness and is not a duplicate of generic salt content. Create a ${language} ${format}.
Return valid JSON only with keys: title, excerpt, content, seo_title, seo_description, primary_keyword, secondary_keywords, target_country, category, image_prompt, internal_link_suggestions, reading_time.
Requirements:
- ${length} words.
- content must be clean semantic HTML using only h2, h3, p, ul, ol, li and strong tags.
- Do not use markdown heading symbols such as #, ## or ###.
- Do not include citations, source links, external URLs, markdown links or reference footnotes in the article.
- Research is for topic selection and factual framing only; the published article must read as an original editorial article.
- Include the researched primary keyword and useful secondary long-tail keywords naturally, without stuffing.
- Include concise FAQ question-and-answer sections for AI search visibility.
- Include a soft quotation/contact CTA.
- Explain facts clearly for importers, distributors, private-label brands, food manufacturers or wholesalers.
- Never invent company capacity, price, certification, client, laboratory result or legal claim.
- No medical claims.
- Keep the record as a human-review draft; do not publish.`});
  const result=parseJsonResponse(text);const title=stripResearchLinks(result.title).trim();const content=stripResearchLinks(result.content).trim();if(!title||!content)throw new Error(`The research provider did not return a complete ${type} draft.`);
  let slug=slugify(title);const{data:duplicate}=await supabase.from("blog_posts").select("id").eq("slug",slug).maybeSingle();if(duplicate)slug=`${slug}-${type}-${new Date().toISOString().slice(0,10)}`;
  const keywords=normalizeKeywordList(result.primary_keyword,result.secondary_keywords,title);const primaryKeyword=String(result.primary_keyword||keywords[0]||"").trim();
  const excerpt=stripResearchLinks(result.excerpt);
  const seoTitle=stripResearchLinks(result.seo_title||title);
  const seoDescription=stripResearchLinks(result.seo_description||excerpt);
  const targetCountry=String(result.target_country||"Global");
  const image=await createFeaturedImage(supabase,String(result.image_prompt||title),type);
  const internalLinks=Array.isArray(result.internal_link_suggestions)?result.internal_link_suggestions.map(stripResearchLinks).filter(Boolean).slice(0,20):[];
  const seoScore=calculateSeoScore({title,slug,excerpt,content,seoTitle,seoDescription,primaryKeyword,secondaryKeywords:keywords,featuredImage:image.url});
  const geoScore=calculateGeoScore({title,excerpt,content,primaryKeyword,targetCountry});
  const{data,error}=await supabase.from("blog_posts").insert({title,slug,excerpt,content,status:"draft",approval_status:"Draft",seo_title:seoTitle,seo_description:seoDescription,featured_image:image.url,published_at:null,content_type:type,keywords,primary_keyword:primaryKeyword,target_country:targetCountry,category:String(result.category||"Buyer Guide"),seo_score:seoScore,geo_score:geoScore,image_prompt:String(result.image_prompt||title),internal_links:internalLinks,reading_time:String(result.reading_time||`${Math.max(1,Math.ceil(content.replace(/<[^>]+>/g," ").split(/\s+/).filter(Boolean).length/220))} min read`),research_model:model}).select("id,title,slug,status,content_type,keywords,primary_keyword,target_country,seo_score,geo_score,featured_image,image_prompt,internal_links,reading_time,created_at").single();
  if(error)throw new Error(error.message);
  return{success:true,draft:data,model,image_warning:image.warning||null,editorial:{image_prompt:result.image_prompt||"",internal_link_suggestions:internalLinks,reading_time:result.reading_time||"",seo_score:seoScore,geo_score:geoScore}};
}

async function createDailyDrafts(request:Request){
  const isCron=request.method==="GET";if(isCron&&process.env.CRON_SECRET&&request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:"Supabase server environment variables are missing."},{status:500});
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const{data:settings}=await supabase.from("blog_automation_settings").select("*").limit(1).maybeSingle();if(settings&&!settings.enabled&&isCron)return NextResponse.json({skipped:true,reason:"Blog automation is disabled."});
  const focus=settings?.topic_focus||"Himalayan pink salt sourcing, private-label packaging, food-industry specifications, importer questions and export guidance";const language=settings?.default_language||"English";
  const[blog,article]=await Promise.all([generateOne(supabase,"blog",focus,language),generateOne(supabase,"article",focus,language)]);return NextResponse.json({success:true,blog,article,approval_required:true});
}
export async function GET(request:Request){try{return await createDailyDrafts(request)}catch(error){return NextResponse.json({error:publicApiError(error,"Daily content generation failed.")},{status:500})}}
export async function POST(request:Request){try{return await createDailyDrafts(request)}catch(error){return NextResponse.json({error:publicApiError(error,"Daily content generation failed.")},{status:500})}}
