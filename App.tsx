
import React, { useState, useRef } from 'react';
import { StoryboardData } from './types';
import { developStoryConcept, generateStoryboardFromText, generatePageImage } from './geminiService';
import { CharacterChip } from './components/CharacterChip';


type AppStep = 'input' | 'development' | 'storyboard';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [mode, setMode] = useState<'quick' | 'creative'>('creative');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [developedStory, setDevelopedStory] = useState<{ story: string; screenplay: string } | null>(null);
  const [data, setData] = useState<StoryboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRenderingAll, setIsRenderingAll] = useState(false);
  
  const storyboardRef = useRef<HTMLDivElement>(null);
  const devRef = useRef<HTMLDivElement>(null);

  const handleStartProduction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'creative') {
        const result = await developStoryConcept(input);
        setDevelopedStory(result);
        setStep('development');
        setTimeout(() => devRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        const result = await generateStoryboardFromText(input);
        setData(result);
        setStep('storyboard');
        setTimeout(() => storyboardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        renderAllPages(result);
      }
    } catch (err: any) {
      setError(err.message || 'Error initializing production. Try again with a clearer prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildManga = async () => {
    if (!developedStory) return;
    setLoading(true);
    setError(null);

    try {
      const result = await generateStoryboardFromText(developedStory.screenplay);
      setData(result);
      setStep('storyboard');
      setTimeout(() => storyboardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      renderAllPages(result);
    } catch (err: any) {
      setError(err.message || 'Error generating storyboard data. The scale might be too large; try a shorter seed.');
    } finally {
      setLoading(false);
    }
  };

  const renderAllPages = async (currentData: StoryboardData) => {
    setIsRenderingAll(true);
    const pages = [...currentData.pages];
    
    for (let i = 0; i < pages.length; i++) {
      setData(prev => prev ? {
        ...prev,
        pages: prev.pages.map((p, idx) => idx === i ? { ...p, isGenerating: true } : p)
      } : null);

      try {
        const imageUrl = await generatePageImage(pages[i], currentData.characters);
        setData(prev => prev ? {
          ...prev,
          pages: prev.pages.map((p, idx) => idx === i ? { ...p, imageUrl, isGenerating: false } : p)
        } : null);
      } catch (err) {
        console.error("Failed to render page", i, err);
        setData(prev => prev ? {
          ...prev,
          pages: prev.pages.map((p, idx) => idx === i ? { ...p, isGenerating: false } : p)
        } : null);
      }
    }
    setIsRenderingAll(false);
  };

  const handleGeneratePage = async (pageId: string) => {
    if (!data) return;
    setData(prev => prev ? {
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, isGenerating: true } : p)
    } : null);

    try {
      const target = data.pages.find(p => p.id === pageId);
      if (!target) return;
      const imageUrl = await generatePageImage(target, data.characters);
      setData(prev => prev ? {
        ...prev,
        pages: prev.pages.map(p => p.id === pageId ? { ...p, imageUrl, isGenerating: false } : p)
      } : null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f1a] text-slate-200">
      <header className="py-4 px-8 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-lg shadow-lg">
              <i className="fas fa-clapperboard"></i>
            </div>
            <h1 className="text-lg font-bebas tracking-widest uppercase text-white">Infinite Vision Studio</h1>
          </div>
          <nav className="flex items-center gap-6">
            <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-all ${step === 'input' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}>1. Vision</div>
            <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-all ${step === 'development' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}>2. Deep Screenplay</div>
            <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded transition-all ${step === 'storyboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}>3. 100-Panel Matrix</div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {step === 'input' && (
          <section className="max-w-3xl mx-auto flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-6xl font-bold text-white mb-6 tracking-tight">
              Direct the <span className="text-indigo-500 italic">Future.</span>
            </h2>
            <p className="text-slate-400 text-xl mb-10 leading-relaxed">
              Generate massive 10-page sequences (100 panels total) with professional cinematic flow and minimalist technical drafting.
            </p>

            <div className="w-full bg-slate-900/40 p-1 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm">
              <div className="flex border-b border-white/5 p-2 gap-2">
                <button onClick={() => setMode('creative')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'creative' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/5'}`}>Extended Production</button>
                <button onClick={() => setMode('quick')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'quick' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/5'}`}>Direct Matrix</button>
              </div>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'creative' ? "Describe your cinematic vision in high detail..." : "Paste script or summary..."} className="w-full h-48 bg-transparent p-6 text-slate-200 focus:outline-none resize-none text-lg" />
              <div className="p-4 flex justify-between items-center bg-black/20 rounded-b-xl border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic text-left max-w-xs">Minimum 10 pages / 100 panels generation</span>
                <button onClick={handleStartProduction} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Initiate Session'}
                </button>
              </div>
            </div>
            {error && <div className="mt-4 text-red-400 text-sm font-bold uppercase bg-red-900/20 px-6 py-3 rounded-xl border border-red-500/20"><i className="fas fa-exclamation-triangle mr-2"></i> {error}</div>}
          </section>
        )}

        {step === 'development' && developedStory && (
          <section ref={devRef} className="animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="grid lg:grid-cols-[1fr_400px] gap-12">
              <div className="space-y-12">
                <div>
                  <h3 className="text-3xl font-bebas tracking-widest text-indigo-500 mb-4 uppercase">Narrative Framework</h3>
                  <div className="bg-slate-900/40 p-10 rounded-3xl border border-white/5 text-slate-300 text-xl italic leading-relaxed shadow-xl ring-1 ring-white/5">{developedStory.story}</div>
                </div>
                <div>
                  <h3 className="text-3xl font-bebas tracking-widest text-indigo-500 mb-4 uppercase">Extended Cinematic Screenplay</h3>
                  <div className="bg-slate-950 p-10 rounded-3xl border border-white/10 font-mono text-xs text-slate-400 whitespace-pre-wrap min-h-[700px] max-h-[1400px] overflow-y-auto custom-scrollbar shadow-2xl ring-1 ring-indigo-500/20 relative">
                    <div className="sticky top-0 bg-slate-950/95 py-4 border-b border-white/5 mb-8 z-10 flex justify-between items-center">
                       <span className="uppercase text-indigo-500 font-black tracking-[0.3em]">Official Draft Sequence</span>
                       <span className="text-[9px] text-slate-600 font-bold uppercase">{developedStory.screenplay.length} Characters Generated</span>
                    </div>
                    {developedStory.screenplay}
                    <div className="mt-12 pt-8 border-t border-white/5 text-center italic text-slate-600 text-[10px] uppercase tracking-[0.4em]">End of Screenplay Block</div>
                  </div>
                </div>
              </div>
              <div className="lg:sticky lg:top-24 h-fit bg-slate-900/60 p-8 rounded-3xl border border-indigo-500/20 space-y-8 shadow-[0_40px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                <div>
                  <h4 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                    <i className="fas fa-microchip text-indigo-500"></i> Logic Synthesis
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Gemini has synthesized an exhaustive screenplay. Character blocking and environmental continuity are verified for high-density 100-panel production.
                  </p>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     <span>Scale Intensity</span>
                     <span className="text-indigo-400">100 Panels</span>
                   </div>
                   <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-gradient-to-r from-indigo-700 to-indigo-400 h-full w-full animate-pulse"></div>
                   </div>
                   <div className="grid grid-cols-5 gap-1 pt-2">
                      {[...Array(10)].map((_, i) => <div key={i} className="h-1 bg-indigo-500/40 rounded-full"></div>)}
                   </div>
                   <p className="text-[9px] text-slate-500 uppercase font-bold text-center italic tracking-widest">Minimum 10 Pages Validated</p>
                </div>

                <button onClick={handleBuildManga} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-white flex items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-600/40 transform hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-[0.2em]">
                  {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <><i className="fas fa-film"></i> Draft 100-Panel Matrix</>}
                </button>
                <button onClick={() => setStep('input')} className="w-full text-slate-600 hover:text-white text-[10px] font-black uppercase transition-colors tracking-[0.4em] py-2 border-t border-white/5 pt-6">Abort Production</button>
              </div>
            </div>
          </section>
        )}

        {step === 'storyboard' && data && (
          <div ref={storyboardRef} className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-12 gap-8">
              <div>
                <span className="text-indigo-500 font-black text-xs uppercase tracking-[0.5em] mb-3 block">High-Fidelity Technical Draft</span>
                <h2 className="text-6xl font-bebas tracking-wider text-white uppercase leading-none">{data.title}</h2>
              </div>
              <div className="flex flex-wrap gap-4">
                {data.characters.map(char => <CharacterChip key={char.id} character={char} />)}
              </div>
            </div>

            <div className="space-y-40">
              {data.pages.map((page) => (
                <div key={page.id} className="grid lg:grid-cols-[1fr_520px] gap-16 items-start border-b border-white/5 pb-32 last:border-0">
                  {/* Manga Page Container */}
                  <div className="bg-white p-8 md:p-14 shadow-[0_100px_150px_rgba(0,0,0,1)] rounded-sm flex flex-col ring-1 ring-slate-200 relative group">
                    <div className="absolute -top-10 left-0 text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em]">Sequence Page {page.pageNumber} / {data.pages.length}</div>
                    
                    <div className="flex justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest mb-8">
                      <span>PROJECT MATRIX: {data.title.slice(0, 20)}</span>
                      <span>10 PANEL GRID REV A</span>
                    </div>
                    
                    <div className="relative aspect-[3/4] bg-slate-100 border-[4px] border-slate-900 overflow-hidden shadow-2xl">
                      {page.imageUrl ? (
                        <img src={page.imageUrl} className="w-full h-full object-cover filter contrast-150 grayscale brightness-110 transition-transform duration-700 hover:scale-105" alt={`Sequence Page ${page.pageNumber}`} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200">
                          {page.isGenerating ? (
                            <div className="flex flex-col items-center gap-6">
                              <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
                              <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] text-center px-16 max-w-sm">Generating 10-Panel High-Density Matrix for Page {page.pageNumber}...</span>
                            </div>
                          ) : (
                            <button onClick={() => handleGeneratePage(page.id)} className="text-sm font-black text-slate-900 hover:bg-slate-900 hover:text-white border-4 border-slate-900 px-10 py-5 rounded uppercase transition-all tracking-[0.3em] bg-white shadow-xl transform active:scale-95">Inscribe Page</button>
                          )}
                        </div>
                      )}
                      {page.imageUrl && (
                        <button onClick={() => handleGeneratePage(page.id)} className="absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all border border-indigo-500/50 shadow-3xl uppercase tracking-[0.3em] transform translate-y-4 group-hover:translate-y-0">
                          Redraft Technical Matrix
                        </button>
                      )}
                    </div>
                    <div className="mt-8 flex justify-between items-center px-4 border-t border-slate-100 pt-6">
                       <span className="text-[11px] font-black text-slate-900 uppercase opacity-20">Matrix Draft Page_{page.pageNumber}</span>
                       <div className="flex gap-1.5">
                          {[...Array(10)].map((_, i) => <div key={i} className="w-2 h-2 rounded-sm bg-slate-900/10"></div>)}
                       </div>
                    </div>
                  </div>

                  {/* Panel Details List */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between mb-6">
                       <h4 className="text-sm font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-4">
                         <i className="fas fa-layer-group"></i> Technical Breakdown
                       </h4>
                       <span className="bg-indigo-900/40 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Sequence Segment {page.pageNumber}</span>
                    </div>
                    
                    <div className="grid gap-5 max-h-[1100px] overflow-y-auto pr-4 custom-scrollbar">
                      {page.scenes.map(scene => (
                        <div key={scene.id} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-4 hover:border-indigo-500/40 transition-all group backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-3 group-hover:text-indigo-400 transition-colors">
                            <span>Panel {scene.sceneNumber}</span>
                            <span className="truncate ml-4 max-w-[200px]">{scene.location}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                            <span className="text-indigo-600 font-black mr-3 opacity-50">#</span> {scene.action}
                          </p>
                          {scene.dialogue && (
                            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mt-2 border-l-4 border-l-indigo-500/60">
                              <p className="text-[12px] text-slate-400 font-bold italic leading-relaxed">"{scene.dialogue}"</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                             <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-white/5">CAM: Technical</div>
                             <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-white/5">BEAT: Connected</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-8 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white"><i className="fas fa-compass"></i></div>
                         <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Spatial Intent</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed italic border-l-3 border-indigo-500/50 pl-6">{page.pageLayoutDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-48 flex flex-col items-center gap-10">
              <div className="text-center space-y-4">
                 <p className="text-indigo-500 text-[11px] font-black uppercase tracking-[1em] animate-pulse">Production Sequence Complete</p>
                 <div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-indigo-900 to-transparent mx-auto"></div>
              </div>
              <button onClick={() => {
                setStep('input');
                setData(null);
                setDevelopedStory(null);
              }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-20 py-6 rounded-full font-black transition-all border border-white/10 shadow-[0_30px_60px_rgba(79,70,229,0.4)] transform hover:scale-105 active:scale-95 text-xs uppercase tracking-[0.5em]">
                New Production Vision
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-white/5 bg-slate-950 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        <p className="text-slate-700 text-[11px] font-black tracking-[0.6em] uppercase opacity-40 mb-2">Infinite Vision Studio // Directed by AI Multimodal Core</p>
        <p className="text-slate-800 text-[9px] font-bold uppercase tracking-[0.3em]">Scalable 100-Panel Matrix Draft Engine</p>
      </footer>
    </div>
  );
};

export default App;
