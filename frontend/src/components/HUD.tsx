import {
  Play,
  Pause,
  FastForward,
  Rocket,
  Droplets,
  Cpu,
  Flame,
  Sparkles,
  Navigation,
  Ban,
  RotateCcw,
  Pickaxe,
  ShieldAlert,
  Bot,
  X,
  Compass,
} from 'lucide-react';
import { useSimulationStore, analyzeLifePossibility } from '../store/useSimulationStore';
import { CuriosityPanel } from './CuriosityPanel';

export function HUD() {
  const {
    year,
    speed,
    cameraTarget,
    selectedId,
    bodies,
    civResources,
    originId,
    destId,
    excludedIds,
    computedPath,
    pathDistance,
    pathCost,
    missionLog,
    aiAdvice,
    aiLoading,
    setSpeed,
    setCameraTarget,
    selectBody,
    setRoute,
    toggleExcludeBody,
    clearExclusions,
    deployOrHarvest,
    launchPathMission,
    requestAiStrategy,
  } = useSimulationStore();

  const selected = bodies.find((b) => b.id === selectedId);
  const lifeCheck = selected ? analyzeLifePossibility(selected) : null;
  const isSelectedInPath = selected ? computedPath.includes(selected.id) : false;
  const isSelectedExcluded = selected ? excludedIds.includes(selected.id) : false;
  const canSkipSelected = selected && selected.id !== originId && selected.id !== destId;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 font-sans">
      {/* TOP COMMAND BAR */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-white">ASTRALIS</h1>
            <p className="text-[10px] font-mono text-slate-400">UNIFIED COSMIC OS · YEAR {Math.floor(year)}</p>
          </div>
        </div>

        {/* GLOBAL CIVILIZATION RESOURCE POOL */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-mono">
          <span className="flex items-center gap-1 text-sky-400" title="Water Ice">
            <Droplets className="h-3.5 w-3.5" /> {civResources.water}
          </span>
          <span className="flex items-center gap-1 text-slate-300" title="Metals & Ore">
            <Cpu className="h-3.5 w-3.5" /> {civResources.metals}
          </span>
          <span className="flex items-center gap-1 text-amber-400" title="Helium-3 Fusion Fuel">
            <Flame className="h-3.5 w-3.5" /> {civResources.helium3}
          </span>
          <span className="flex items-center gap-1 text-purple-400" title="Exotic Matter (Multiverse Fuel)">
            <Sparkles className="h-3.5 w-3.5" /> {civResources.exotic}
          </span>
        </div>

        {/* QUICK-ZOOM SCALE PRESETS (All on the same map!) */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-white/10 text-[11px]">
          {[
            { id: 'solar', label: 'Solar Scale' },
            { id: 'galaxy', label: 'Milky Way' },
            { id: 'multiverse', label: 'Multiverse' },
          ].map((z) => (
            <button
              key={z.id}
              onClick={() => setCameraTarget(z.id as 'solar' | 'galaxy' | 'multiverse')}
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                cameraTarget === z.id
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* TIME CONTROLS */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-1">
          <button onClick={() => setSpeed(0)} className={`rounded p-1.5 ${speed === 0 ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setSpeed(1)} className={`rounded p-1.5 ${speed === 1 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            <Play className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setSpeed(5)} className={`rounded px-2 py-1 text-[11px] font-mono ${speed === 5 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            5x
          </button>
          <button onClick={() => setSpeed(15)} className={`rounded p-1.5 ${speed === 15 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            <FastForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* MIDDLE PANELS */}
      <div className="flex flex-1 items-start justify-between py-3 overflow-hidden gap-4">
        {/* LEFT PANEL: DYNAMIC ORBITAL ROUTE PLANNER ("DELIVERY MAN" ROUTER) */}
        <aside className="pointer-events-auto w-76 max-h-[72vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Navigation className="h-3.5 w-3.5" /> Live Orbital Router
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse">AUTO-UPDATING</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400">FROM (X)</label>
              <select
                value={originId}
                onChange={(e) => setRoute(e.target.value, destId)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none"
              >
                {bodies.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400">TO (Y)</label>
              <select
                value={destId}
                onChange={(e) => setRoute(originId, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none"
              >
                {bodies.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LIVE COMPUTED PATH WAYPOINTS */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span>OPTIMAL STEPPING-STONE PATH</span>
              <span className="text-amber-400">{pathDistance} AU-eq</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {computedPath.map((id, i) => {
                const b = bodies.find((x) => x.id === id);
                return (
                  <div key={id} className="flex items-center gap-1">
                    <button
                      onClick={() => selectBody(id)}
                      className="rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-mono text-cyan-100 hover:bg-cyan-500/30"
                    >
                      {b?.name}
                    </button>
                    {i < computedPath.length - 1 && <span className="text-slate-500 text-xs">→</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXCLUDED / SKIPPED PLANETS */}
          {excludedIds.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/25 p-2 text-[11px]">
              <div className="flex items-center justify-between text-red-300 font-mono text-[10px] mb-1">
                <span>SKIPPED FROM PATH ({excludedIds.length})</span>
                <button onClick={clearExclusions} className="flex items-center gap-1 text-slate-300 hover:text-white">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {excludedIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleExcludeBody(id)}
                    className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-200 hover:bg-red-500/40"
                  >
                    ✕ {bodies.find((b) => b.id === id)?.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REQUIRED RESOURCES TO EXECUTE ROUTE */}
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-2.5 text-[11px] font-mono space-y-1">
            <div className="text-[10px] text-slate-400">MISSION FUEL & RESOURCE COST</div>
            <div className="grid grid-cols-2 gap-1">
              <span className={civResources.water >= pathCost.water ? 'text-sky-400' : 'text-red-400'}>
                H2O: {pathCost.water}
              </span>
              <span className={civResources.metals >= pathCost.metals ? 'text-slate-300' : 'text-red-400'}>
                Metals: {pathCost.metals}
              </span>
              <span className={civResources.helium3 >= pathCost.helium3 ? 'text-amber-400' : 'text-red-400'}>
                He-3: {pathCost.helium3}
              </span>
              <span className={civResources.exotic >= pathCost.exotic ? 'text-purple-400' : 'text-red-400'}>
                Exotic: {pathCost.exotic}
              </span>
            </div>
          </div>

          <button
            onClick={launchPathMission}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition"
          >
            Launch Mission Along Path
          </button>

          <p className="text-[11px] text-slate-400 leading-snug border-t border-white/10 pt-2">
            {missionLog}
          </p>
        </aside>

        {/* RIGHT PANEL: SELECTED CELESTIAL BODY INSPECTOR */}
        {selected && (
          <aside className="pointer-events-auto w-84 max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl space-y-3">
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400">
                  {selected.zone}
                </span>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <p className="text-[11px] font-mono text-cyan-400">{selected.type}</p>
              </div>
              <button onClick={() => selectBody(null)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">{selected.description}</p>
            {/* LIFE VIABILITY / HABITABILITY CHECKER */}
            {lifeCheck && (
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Life Possibility Scan
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      lifeCheck.verdict === 'Natural Life Possible'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : lifeCheck.verdict === 'Enclosed Habitat Required'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {lifeCheck.verdict} ({lifeCheck.score}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{lifeCheck.summary}</p>
                <div className="space-y-1 pt-1">
                  {lifeCheck.checks.map((c) => (
                    <div key={c.label} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">{c.label}</span>
                      <span
                        className={
                          c.status === 'PASS'
                            ? 'text-emerald-400'
                            : c.status === 'WARN'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }
                      >
                        [{c.status}] {c.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ENVIRONMENT CONDITIONS */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="rounded-lg bg-slate-900/90 p-2 border border-white/5">
                <div className="text-[9px] text-slate-400">GRAVITY</div>
                <div className="text-white font-semibold">{selected.gravity}</div>
              </div>
              <div className="rounded-lg bg-slate-900/90 p-2 border border-white/5">
                <div className="text-[9px] text-slate-400">TEMPERATURE</div>
                <div className="text-amber-300 font-semibold">{selected.tempC}</div>
              </div>
              <div className="col-span-2 rounded-lg bg-slate-900/90 p-2 border border-white/5">
                <div className="text-[9px] text-slate-400">ATMOSPHERE</div>
                <div className="text-cyan-200">{selected.atmosphere}</div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/25 p-2.5 text-[11px] text-amber-200">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{selected.hazards}</span>
            </div>

            {/* SKIP / REMOVE FROM PATH BUTTON */}
            {canSkipSelected && (
              <button
                onClick={() => toggleExcludeBody(selected.id)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition ${
                  isSelectedExcluded
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                    : isSelectedInPath
                    ? 'border-red-400/60 bg-red-500/20 text-red-200 hover:bg-red-500/30'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-red-400/50'
                }`}
              >
                <Ban className="h-3.5 w-3.5" />
                {isSelectedExcluded
                  ? 'Restore Planet to Pathfinding'
                  : 'Skip / Remove from Path'}
              </button>
            )}

            {/* HARVESTABLE RESOURCES */}
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span>RESOURCE YIELD PER HARVEST</span>
                <span>{selected.colonized ? `EXTRACTORS: ${selected.extractors}` : 'UNCOLONIZED'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-mono">
                <div className="rounded bg-slate-900/80 py-1 text-sky-400">H2O +{selected.yields.water}</div>
                <div className="rounded bg-slate-900/80 py-1 text-slate-300">Met +{selected.yields.metals}</div>
                <div className="rounded bg-slate-900/80 py-1 text-amber-400">He3 +{selected.yields.helium3}</div>
                <div className="rounded bg-slate-900/80 py-1 text-purple-400">Exo +{selected.yields.exotic}</div>
              </div>
              <button
                onClick={() => deployOrHarvest(selected.id)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Pickaxe className="h-3.5 w-3.5" />
                {selected.colonized ? 'Harvest Resources & Upgrade Rig' : 'Deploy Habitat & Start Harvesting'}
              </button>
            </div>

            {/* AI STRATEGIST */}
            <div className="rounded-xl border border-indigo-500/35 bg-indigo-950/30 p-3">
              <button
                onClick={() => requestAiStrategy(selected.id)}
                disabled={aiLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-1.5 text-xs font-bold text-white hover:bg-indigo-400"
              >
                <Bot className="h-4 w-4" />
                {aiLoading ? 'Analyzing...' : 'Ask AI Mission Strategist'}
              </button>
              {aiAdvice && (
                <p className="mt-2 text-[11px] text-indigo-100 whitespace-pre-line leading-relaxed">
                  {aiAdvice.recommendation}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* CURIOSITY PANEL */}
      <CuriosityPanel
        topic={selected ? selected.name : 'The Unified Universe'}
        context={selected ? `${selected.type}. ${selected.description}` : 'Solar System, Milky Way Exoplanets, and the Multiverse Horizon.'}
      />

      {/* BOTTOM HINT */}
      <footer className="pointer-events-auto hidden xl:flex items-center gap-2 mx-auto rounded-full border border-white/10 bg-slate-950/75 px-4 py-1.5 text-[11px] font-mono text-slate-400 backdrop-blur-md">
        <Compass className="h-3.5 w-3.5 text-cyan-400" />
        Scroll out to zoom from Solar System → Milky Way → Multiverse · Click any planet on the path to inspect or skip it
      </footer>
    </div>
  );
}