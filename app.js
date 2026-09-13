const state = { mode:"text", ratio:"16:9", current:null, lang:"en" };

const copy = {
  en:{title:"Create something worth watching.",subtitle:"Describe your idea and generate a real AI video.",textToVideo:"Text to video",imageToVideo:"Image to video",yourIdea:"Your idea",imageHelp:"Upload an image to animate it.",subtitles:"Automatic subtitles",music:"Background music",generate:"Generate video",result:"Your video"},
  so:{title:"Samee muuqaal mudan in la daawado.",subtitle:"Qor fikraddaada oo samee muuqaal AI oo dhab ah.",textToVideo:"Qoraal → muuqaal",imageToVideo:"Sawir → muuqaal",yourIdea:"Fikraddaada",imageHelp:"Soo geli sawir si loo dhaqaajiyo.",subtitles:"Qoraal-hoosaad otomaatig ah",music:"Muusig gadaal",generate:"Samee muuqaal",result:"Muuqaalkaaga"},
  ar:{title:"أنشئ فيديو يستحق المشاهدة.",subtitle:"اكتب فكرتك وأنشئ فيديو حقيقي بالذكاء الاصطناعي.",textToVideo:"نص إلى فيديو",imageToVideo:"صورة إلى فيديو",yourIdea:"فكرتك",imageHelp:"ارفع صورة لتحريكها.",subtitles:"ترجمة تلقائية",music:"موسيقى خلفية",generate:"إنشاء الفيديو",result:"فيديوك"}
};

function setLanguage(lang){
  state.lang=lang; const c=copy[lang];
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=c[el.dataset.i18n]);
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
}
function setMode(mode){
  state.mode=mode;
  textTab.classList.toggle("active",mode==="text");
  imageTab.classList.toggle("active",mode==="image");
  imageBox.classList.toggle("hidden",mode!=="image");
}
document.querySelectorAll(".ratio").forEach(b=>b.onclick=()=>{
  state.ratio=b.dataset.ratio;
  document.querySelectorAll(".ratio").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
});

async function generateVideo(){
  const prompt = document.getElementById("prompt").value.trim();
  if(!prompt) return setStatus(state.lang==="so"?"Fadlan geli fikrad muuqaal.":"Please enter a video idea.");
  const btn=document.getElementById("generate"); btn.disabled=true;
  setStatus(state.lang==="so"?"Muuqaalka waa la samaynayaa…":"Generating a real AI video…");
  try{
    const r=await fetch("/api/videos/generate",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt,aspectRatio:state.ratio,duration:Number(duration.value),mode:state.mode})});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Generation failed");
    let result=data;
    while(["starting","processing"].includes(result.status)){
      await new Promise(x=>setTimeout(x,2500));
      const s=await fetch("/api/videos/"+data.id); result=await s.json();
      setStatus((state.lang==="so"?"Horumar: ":"Status: ")+result.status);
    }
    if(result.status!=="succeeded" || !result.output) throw new Error(result.error||"Video generation did not succeed.");
    state.current={url:result.output,prompt};
    video.src=result.output; download.href=result.output; resultBox.classList.remove("hidden");
    setStatus(state.lang==="so"?"Muuqaalka waa diyaar!":"Video is ready!");
    saveCurrent();
  }catch(e){setStatus("❌ "+e.message)}finally{btn.disabled=false}
}
function setStatus(x){document.getElementById("status").textContent=x}
function saveCurrent(){
  if(!state.current)return;
  const h=JSON.parse(localStorage.getItem("myai-history")||"[]");
  h.unshift({url:state.current.url,prompt:state.current.prompt,date:new Date().toLocaleString()});
  localStorage.setItem("myai-history",JSON.stringify(h.slice(0,30)));
}
function showHistory(){
  history.classList.remove("hidden"); resultBox.classList.add("hidden");
  const h=JSON.parse(localStorage.getItem("myai-history")||"[]");
  historyList.innerHTML=h.length?h.map(x=>`<div class="historyitem"><div>${escapeHtml(x.prompt)}</div><small>${x.date}</small><br><a href="${x.url}" target="_blank">Open video</a></div>`).join(""):"No saved videos yet.";
}
function hideHistory(){history.classList.add("hidden")}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

const textTab=document.getElementById("textTab"), imageTab=document.getElementById("imageTab"), imageBox=document.getElementById("imageBox");
const resultBox=document.getElementById("result"), video=document.getElementById("video"), download=document.getElementById("download");
const duration=document.getElementById("duration"), history=document.getElementById("history"), historyList=document.getElementById("historyList");
