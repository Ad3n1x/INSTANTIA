import { useState } from 'react';
import { ArrowUpRight, Boxes, Check, ChevronRight, Cloud, FileText, FlaskConical, History, LoaderCircle, LockKeyhole, Plus, Sparkles, Trash2, UploadCloud, Zap } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
type Tool = { id: string; name: string; description: string; category: string; mode: string; status: string };
type Notice = { tone: 'good' | 'warn' | 'bad'; text: string } | null;

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [decision, setDecision] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [plan, setPlan] = useState<any | null>(null);
  const [capabilities] = useState<Tool[]>([
    { id: 'image-to-pdf', name: 'Image to PDF', description: 'Combine images into one clean, downloadable PDF.', category: 'DOCUMENTS', mode: 'VERIFIED', status: 'ready' },
    { id: 'csv-summary', name: 'CSV quick analysis', description: 'Get useful summaries from rows and columns.', category: 'DATA', mode: 'VERIFIED', status: 'planned' },
    { id: 'custom-tool', name: 'Your custom tool', description: 'Describe a capability and route it through a future generation pipeline.', category: 'CUSTOM', mode: 'GENERATED', status: 'not-configured' }
  ]);
  async function routeRequest(value = prompt) {
    if (!value.trim()) { setNotice({ tone: 'warn', text: 'Describe what you want INSTANTIA to do first.' }); return; }
    setBusy(true); setNotice(null); setPlan(null); setDecision(false);
    try {
      const res = await fetch(API + '/api/requests/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The request could not be routed.');
      setNotice({ tone: 'good', text: data.message || 'Verified capability selected.' });
      setPlan(data.plan || null);
      setPrompt(value);
    } catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : 'Could not reach the INSTANTIA API.' }); }
    finally { setBusy(false); }
  }
  async function createPdf() {
    if (!files.length) { setNotice({ tone: 'warn', text: 'Choose one or more PNG or JPEG images.' }); return; }
    setBusy(true); setNotice(null);
    try {
      const form = new FormData(); files.forEach(file => form.append('images', file));
      const res = await fetch(API + '/api/tools/image-to-pdf', { method: 'POST', body: form });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'PDF creation failed.'); }
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'instantia-document.pdf'; a.click(); URL.revokeObjectURL(url);
      setDecision(true); setHistory(old => ['Image to PDF · just now', ...old]);
      setNotice({ tone: 'good', text: 'Your PDF is ready. Decide whether to keep this tool in your workspace or dispose of it.' });
    } catch (e) { setNotice({ tone: 'bad', text: e instanceof Error ? e.message : 'Could not create PDF.' }); }
    finally { setBusy(false); }
  }
  function decide(keep: boolean) {
    setHistory(old => keep ? ['Image to PDF · kept', ...old] : old.filter(item => !item.startsWith('Image to PDF')));
    setDecision(false);
    setNotice({ tone: 'good', text: keep ? 'Tool marked to keep in this session. Persistent saving is not yet available.' : 'Temporary tool session disposed. No persistent tool was saved.' });
  }
  return <div className="shell">
    <aside className="rail"><div className="mark"><Boxes size={19}/></div><button className="rail-btn active" title="Workspace"><Zap size={17}/></button><button className="rail-btn" title="History"><History size={17}/></button><div className="rail-bottom"><LockKeyhole size={15}/></div></aside>
    <main className="main">
      <header className="topbar"><a className="wordmark" href="#"><span className="wordmark-icon"><Boxes size={17}/></span> INSTANTIA</a><div className="top-status"><span className="pulse"/> CLOUD WORKSPACE <span className="status-divider"/> MVP</div><button className="new-btn" onClick={() => {setPrompt('');setNotice(null);setFiles([]);setDecision(false)}}><Plus size={14}/> New tool</button></header>
      <section className="hero"><div className="eyebrow"><Sparkles size={13}/> SOFTWARE, ON DEMAND</div><h1>What do you need<br/><span>to get done?</span></h1><p className="sub">Describe the capability. INSTANTIA routes verified tools first and will add custom generation through isolated cloud testing.</p>
        <div className="composer"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Combine these images into one PDF…" rows={3}/><div className="composer-foot"><span><Cloud size={13}/> Runs in the cloud · no local engine</span><button className="primary" disabled={busy} onClick={()=>routeRequest()}>{busy?<LoaderCircle className="spin" size={15}/>:<ArrowUpRight size={15}/>} Find capability</button></div></div>
        <div className="suggestions"><span>TRY</span>{['Convert images to PDF','Analyze a CSV file','Build a custom booking tool'].map(s=><button key={s} onClick={()=>{setPrompt(s);if(s.includes('PDF'))setNotice({tone:'good',text:'Choose images in the Image to PDF card below, then create your PDF.'})}}>{s}<ChevronRight size={12}/></button>)}</div>
        {notice && <div className={'notice '+notice.tone}>{notice.text}</div>}
{plan && <div className="plan-panel">
  <div className="plan-head"><div><span className="eyebrow">REQUEST PLAN · NOT EXECUTED</span><h3>{plan.summary}</h3></div><span className="plan-category">{plan.category}</span></div>
  <div className="plan-columns"><div><strong>Proposed steps</strong><ol>{plan.steps.map((step: string, i: number) => <li key={i}>{step}</li>)}</ol></div>
  <div><strong>Inputs needed</strong><ul>{plan.requiredInputs.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul><strong>Verification</strong><ul>{plan.verification.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>{plan.risks.length > 0 && <><strong>Limitations</strong><ul>{plan.risks.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul></>}</div></div>
</div>}
      </section>
      <section className="section"><div className="section-head"><div><span className="eyebrow">CAPABILITY LIBRARY</span><h2>Tools at your fingertips</h2><p>Verified tools are labelled. Unavailable capabilities stay clearly marked.</p></div><span className="count">{capabilities.length} CAPABILITIES</span></div>
        <div className="cards">{capabilities.map((tool,i)=><article className="cap-card" key={tool.id}><div className={'cap-icon icon-'+i}>{i===0?<FileText size={19}/>:i===1?<FlaskConical size={19}/>:<Sparkles size={19}/>}<span className={'dot '+(tool.status==='ready'?'ready':'')}/></div><div className="meta">{tool.category}<span>{tool.mode}</span></div><h3>{tool.name}</h3><p>{tool.description}</p><div className="card-foot"><span className={tool.status==='ready'?'ready-text':'pending'}>{tool.status==='ready'?'● Ready':tool.status==='planned'?'◌ Planned':'◌ Not configured'}</span><button onClick={()=>tool.id==='image-to-pdf'?document.getElementById('pdf-tool')?.scrollIntoView({behavior:'smooth'}):setNotice({tone:'warn',text:tool.status==='planned'?'CSV analysis is listed but not implemented yet.':'Custom generation is not configured yet; this request will not be falsely marked complete.'})}>Open <ChevronRight size={13}/></button></div></article>)}</div>
      </section>
      <section className="tool" id="pdf-tool"><div className="tool-title"><div className="tool-large"><FileText size={20}/></div><div><h3>Image to PDF</h3><p>Combine PNG or JPEG images into a single downloadable PDF.</p></div><span className="badge-ready"><Check size={12}/> VERIFIED</span></div><label className="drop"><UploadCloud size={25}/><strong>Select images to combine</strong><span>PNG or JPEG · up to 20 images · max upload size configured by API</span><input type="file" accept="image/png,image/jpeg" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>{files.length>0&&<em>{files.length} image(s): {files.map(f=>f.name).join(', ')}</em>}</label><div className="tool-actions"><span><LockKeyhole size={13}/> Files processed in memory; not intentionally stored.</span><button className="primary" disabled={busy} onClick={createPdf}>{busy?<LoaderCircle className="spin" size={14}/>:<ArrowUpRight size={14}/>} Create PDF</button></div></section>
      {decision&&<section className="decision"><div><strong>Keep this tool or dispose of it?</strong><p>Your PDF has been generated. Keeping currently records the choice in this session; persistent saved tools are coming later.</p></div><button className="keep" onClick={()=>decide(true)}>Keep tool</button><button className="dispose" onClick={()=>decide(false)}><Trash2 size={13}/> Dispose</button></section>}
      <section className="section history"><div className="section-head"><div><span className="eyebrow">SESSION ACTIVITY</span><h2>Recent activity</h2><p>Session-only history for this MVP.</p></div></div>{history.length?<div className="history-list">{history.map((item,i)=><div key={i}><FileText size={15}/><span>{item}</span></div>)}</div>:<div className="empty"><History size={18}/><span><strong>Nothing here yet</strong><small>Your generated tool activity will appear here.</small></span></div>}</section>
      <footer><span className="wordmark"><span className="wordmark-icon"><Boxes size={14}/></span> INSTANTIA</span><span>Need it. Create it. Use it. Done.</span><span>Cloud-first by design · v0.1.0</span></footer>
    </main>
  </div>;
}