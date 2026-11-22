import { useEffect } from 'react';
import { UnifiedUniverse3D } from './components/UnifiedUniverse3D';
import { HUD } from './components/HUD';
import { useSimulationStore } from './store/useSimulationStore';

export default function App() {
  const tick = useSimulationStore((s) => s.tick);

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020510]">
      <UnifiedUniverse3D />
      <HUD />
    </main>
  );
}