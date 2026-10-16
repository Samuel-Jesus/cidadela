import { useState } from "react";
import { BoardCanvas } from "./scene/BoardCanvas";
import { BoardHud } from "./ui/BoardHud";

export function App() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#120c08]">
      <BoardCanvas selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      <BoardHud selectedIndex={selectedIndex} />
      <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-xs text-[#c9ada7]/80">
        Arraste para orbitar · scroll para zoom · clique numa casa
      </p>
    </div>
  );
}
