import { Suspense, type ReactNode } from "react";
import { FitToSlot } from "./FitToSlot";
import { GltfLandmark } from "./GltfLandmark";
import { AeroportoSalvadorLandmark } from "./AeroportoSalvadorLandmark";
import { CoelbaLandmark } from "./CoelbaLandmark";
import { FerryBoatLandmark } from "./FerryBoatLandmark";
import { MetroDeSalvadorLandmark } from "./MetroDeSalvadorLandmark";
import { CarnavalLandmark } from "./CarnavalLandmark";
import { PedagioLinhaVerdeLandmark } from "./PedagioLinhaVerdeLandmark";
import { PelourinhoLandmark } from "./PelourinhoLandmark";
import { PlanoInclinadoLandmark } from "./PlanoInclinadoLandmark";
import { QuartelPoliciaLandmark } from "./QuartelPoliciaLandmark";
import { Box, Cone, Cyl, Group, Sphere } from "./primitives";

type Props = {
  index: number;
  accent?: boolean;
  slotWidth?: number;
  slotDepth?: number;
};

export function Landmark({ index, accent = false, slotWidth, slotDepth }: Props) {
  const isGltf =
    index === 0 ||
    index === 4 ||
    index === 5 ||
    index === 10 ||
    index === 12 ||
    index === 15 ||
    index === 20 ||
    index === 25 ||
    index === 27 ||
    index === 28 ||
    index === 30 ||
    index === 35 ||
    index === 39;
  const fitWidth = (slotWidth ?? 1.2) * (isGltf ? 0.98 : 0.95);
  const fitDepth = (slotDepth ?? 1.2) * (isGltf ? 0.98 : 0.55);

  if (index === 0) {
    return <AeroportoSalvadorLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 4) {
    return <PedagioLinhaVerdeLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 5) {
    return <FerryBoatLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 10) {
    const forteFit = Math.min(slotWidth ?? 1.2, slotDepth ?? 1.2) * 0.85;
    return <ForteSaoMarcelo accent={accent} fitWidth={forteFit} fitDepth={forteFit} />;
  }
  if (index === 12) {
    return <CoelbaLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 15) {
    return <ElevadorLacerda accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 20) {
    return <CarnavalLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 25) {
    return <PlanoInclinadoLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 27) {
    return <FarolDaBarra accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 28) {
    return <Embasa accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 30) {
    const quartelFit = Math.min(slotWidth ?? 1.2, slotDepth ?? 1.2) * 0.9;
    return (
      <QuartelPoliciaLandmark
        accent={accent}
        fitWidth={quartelFit}
        fitDepth={quartelFit}
      />
    );
  }
  if (index === 35) {
    return <MetroDeSalvadorLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 39) {
    return <PelourinhoLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }

  return (
    <FitToSlot fitWidth={fitWidth} fitDepth={fitDepth}>
      <LandmarkMesh index={index} />
    </FitToSlot>
  );
}

function LandmarkMesh({ index }: { index: number }): ReactNode {
  switch (index) {
    case 1:
      return <IlhaDeMare />;
    case 2:
    case 17:
    case 33:
      return <Benca />;
    case 3:
      return <Paripe />;
    case 6:
      return <Feira />;
    case 7:
    case 22:
    case 36:
      return <Fitinha />;
    case 8:
      return <Cachoeira />;
    case 9:
      return <Valenca />;
    case 11:
      return <Ilheus />;
    case 13:
      return <Itacare />;
    case 14:
      return <MorroSaoPaulo />;
    case 16:
      return <Lencois />;
    case 18:
      return <Mucuge />;
    case 19:
      return <ValeDoCapao />;
    case 21:
      return <Trancoso />;
    case 23:
      return <Arraial />;
    case 24:
      return <Caraiva />;
    case 26:
      return <RioVermelho />;
    case 29:
      return <Pituba />;
    case 31:
      return <PraiaDoForte />;
    case 32:
      return <CostaSauipe />;
    case 34:
      return <PortoSeguro />;
    case 37:
      return <CorredorVitoria />;
    case 38:
      return <Abada />;
    default:
      return <Box args={[0.4, 0.4, 0.4]} position={[0, 0.2, 0]} color="#aaaaaa" />;
  }
}

function IlhaDeMare() {
  return (
    <Group>
      <Cyl args={[0.55, 0.65, 0.18, 10]} position={[0, 0.08, 0]} color="#f6e58d" />
      <Cyl args={[0.08, 0.08, 0.55, 6]} position={[-0.15, 0.4, 0.1]} color="#6d4c41" />
      <Cone args={[0.28, 0.45, 7]} position={[-0.15, 0.75, 0.1]} color="#27ae60" />
      <Cyl args={[0.06, 0.06, 0.4, 6]} position={[0.2, 0.32, -0.1]} color="#6d4c41" />
      <Cone args={[0.22, 0.35, 7]} position={[0.2, 0.58, -0.1]} color="#1e8449" />
      <Box args={[1.4, 0.05, 1.4]} position={[0, 0.02, 0]} color="#3498db" />
    </Group>
  );
}

function Benca() {
  return (
    <Group>
      <Box args={[0.45, 0.35, 0.3]} position={[0, 0.2, 0]} color="#c0392b" />
      <Box args={[0.5, 0.08, 0.35]} position={[0, 0.42, 0]} color="#f1c40f" />
      <Sphere args={[0.08]} position={[0, 0.55, 0]} color="#f39c12" />
    </Group>
  );
}

function Paripe() {
  return (
    <Group>
      <Box args={[0.5, 0.35, 0.4]} position={[-0.2, 0.2, 0]} color="#e67e22" />
      <Cone args={[0.4, 0.25, 4]} position={[-0.2, 0.5, 0]} color="#922b21" />
      <Box args={[0.35, 0.28, 0.3]} position={[0.25, 0.16, 0.1]} color="#f5cba7" />
      <Box args={[0.8, 0.04, 0.5]} position={[0, 0.02, 0.35]} color="#5dade2" />
    </Group>
  );
}

function Feira() {
  return (
    <Group>
      <Box args={[0.35, 0.25, 0.35]} position={[-0.3, 0.15, 0]} color="#e74c3c" />
      <Box args={[0.4, 0.05, 0.4]} position={[-0.3, 0.3, 0]} color="#f39c12" />
      <Box args={[0.35, 0.25, 0.35]} position={[0.25, 0.15, 0.1]} color="#27ae60" />
      <Box args={[0.4, 0.05, 0.4]} position={[0.25, 0.3, 0.1]} color="#f1c40f" />
      <Cyl args={[0.04, 0.04, 0.45, 6]} position={[-0.3, 0.45, 0]} color="#6d4c41" />
      <Cyl args={[0.04, 0.04, 0.45, 6]} position={[0.25, 0.45, 0.1]} color="#6d4c41" />
    </Group>
  );
}

function Fitinha() {
  return (
    <Group>
      <Box args={[0.55, 0.45, 0.4]} position={[0, 0.25, 0]} color="#fdfefe" />
      <Cone args={[0.35, 0.35, 4]} position={[0, 0.65, 0]} color="#1abc9c" />
      <Cyl args={[0.04, 0.04, 0.5, 6]} position={[0.35, 0.35, 0]} color="#e74c3c" />
      <Box args={[0.02, 0.25, 0.12]} position={[0.35, 0.55, 0]} color="#e74c3c" />
      <Box args={[0.02, 0.2, 0.1]} position={[0.42, 0.5, 0.05]} color="#3498db" />
      <Box args={[0.02, 0.22, 0.1]} position={[0.28, 0.52, -0.05]} color="#f1c40f" />
    </Group>
  );
}

function Cachoeira() {
  return (
    <Group>
      <Box args={[0.7, 0.55, 0.35]} position={[0, 0.3, -0.1]} color="#7f8c8d" />
      <Box args={[0.2, 0.5, 0.12]} position={[0, 0.28, 0.15]} color="#5dade2" />
      <Box args={[0.55, 0.08, 0.4]} position={[0, 0.05, 0.25]} color="#3498db" />
      <Cone args={[0.18, 0.3, 6]} position={[-0.35, 0.55, -0.15]} color="#1e8449" />
    </Group>
  );
}

function Valenca() {
  return (
    <Group>
      <Box args={[0.7, 0.4, 0.5]} position={[0, 0.22, 0]} color="#f5cba7" />
      <Box args={[0.75, 0.08, 0.55]} position={[0, 0.46, 0]} color="#922b21" />
      <Cyl args={[0.08, 0.08, 0.35, 8]} position={[0.35, 0.65, 0]} color="#f5cba7" />
      <Cone args={[0.12, 0.18, 6]} position={[0.35, 0.9, 0]} color="#922b21" />
    </Group>
  );
}

function ForteSaoMarceloFallback() {
  return (
    <Group>
      <Cyl args={[0.55, 0.6, 0.45, 12]} position={[0, 0.25, 0]} color="#a04000" />
      <Cyl args={[0.35, 0.35, 0.25, 10]} position={[0, 0.55, 0]} color="#6e2c00" />
      <Box args={[1.5, 0.05, 1.5]} position={[0, 0.02, 0]} color="#1a5276" />
      <Box args={[0.12, 0.2, 0.12]} position={[0.35, 0.72, 0.2]} color="#5d4037" />
      <Box args={[0.12, 0.2, 0.12]} position={[-0.3, 0.72, -0.15]} color="#5d4037" />
    </Group>
  );
}

function ForteSaoMarcelo({
  accent,
  fitWidth,
  fitDepth,
}: {
  accent?: boolean;
  fitWidth: number;
  fitDepth: number;
}) {
  return (
    <Suspense fallback={<ForteSaoMarceloFallback />}>
      <GltfLandmark
        url="/models/forte-sao-marcelo.gltf"
        fitWidth={fitWidth}
        fitDepth={fitDepth}
        fitIncludesPads
        hideFootprintAbove={12}
        polish
        accent={accent}
      />
    </Suspense>
  );
}

function Ilheus() {
  return (
    <Group>
      {/* Catedral / cacau */}
      <Box args={[0.55, 0.5, 0.4]} position={[0, 0.28, 0]} color="#fad7a0" />
      <Cone args={[0.28, 0.4, 4]} position={[0, 0.7, 0]} color="#6c3483" />
      <Box args={[0.06, 0.25, 0.06]} position={[0, 0.95, 0]} color="#f7f9f9" />
      <Box args={[0.18, 0.18, 0.18]} position={[0.4, 0.12, 0.25]} color="#6e2c00" />
      <Sphere args={[0.1]} position={[0.4, 0.28, 0.25]} color="#1e8449" />
    </Group>
  );
}

function Itacare() {
  return (
    <Group>
      <Box args={[0.8, 0.35, 0.35]} position={[0, 0.2, -0.15]} color="#5d6d7e" />
      <Box args={[0.9, 0.08, 0.5]} position={[0, 0.05, 0.25]} color="#1abc9c" />
      <Box args={[0.35, 0.04, 0.12]} position={[0.15, 0.2, 0.2]} rotation={[0, 0, 0.5]} color="#f5b041" />
      <Cone args={[0.2, 0.35, 6]} position={[-0.3, 0.5, -0.2]} color="#196f3d" />
    </Group>
  );
}

function MorroSaoPaulo() {
  return (
    <Group>
      <Cone args={[0.55, 0.7, 6]} position={[0, 0.35, 0]} color="#d5d8dc" />
      <Cyl args={[0.08, 0.1, 0.45, 8]} position={[0, 0.85, 0]} color="#f5b7b1" />
      <Box args={[0.18, 0.08, 0.18]} position={[0, 1.1, 0]} color="#e74c3c" />
      <Box args={[0.9, 0.05, 0.5]} position={[0, 0.03, 0.35]} color="#5dade2" />
    </Group>
  );
}

function ElevadorLacerdaFallback() {
  return (
    <Group>
      <Box args={[0.35, 1.15, 0.35]} position={[-0.22, 0.6, 0]} color="#bdc3c7" />
      <Box args={[0.35, 1.15, 0.35]} position={[0.22, 0.6, 0]} color="#aeb6bf" />
      <Box args={[0.15, 0.9, 0.12]} position={[-0.22, 0.55, 0.2]} color="#5dade2" />
      <Box args={[0.15, 0.9, 0.12]} position={[0.22, 0.55, 0.2]} color="#5dade2" />
      <Box args={[0.9, 0.12, 0.45]} position={[0, 1.25, 0]} color="#85929e" />
    </Group>
  );
}

function ElevadorLacerda({
  accent,
  fitWidth,
  fitDepth,
}: {
  accent?: boolean;
  fitWidth: number;
  fitDepth: number;
}) {
  return (
    <Suspense fallback={<ElevadorLacerdaFallback />}>
      <GltfLandmark
        url="/models/elevador-lacerda.gltf"
        fitWidth={fitWidth}
        fitDepth={fitDepth}
        polish
        accent={accent}
      />
    </Suspense>
  );
}

function Lencois() {
  return (
    <Group>
      <Box args={[0.35, 0.55, 0.3]} position={[-0.25, 0.3, 0]} color="#d5d8dc" />
      <Box args={[0.4, 0.75, 0.35]} position={[0.2, 0.4, -0.05]} color="#aeb6bf" />
      <Box args={[0.25, 0.4, 0.25]} position={[0, 0.22, 0.25]} color="#cacfd2" />
      <Cone args={[0.15, 0.25, 5]} position={[-0.4, 0.55, 0.2]} color="#1e8449" />
    </Group>
  );
}

function Mucuge() {
  return (
    <Group>
      <Box args={[0.5, 0.4, 0.4]} position={[0, 0.22, 0]} color="#fdebd0" />
      <Box args={[0.55, 0.1, 0.45]} position={[0, 0.48, 0]} color="#922b21" />
      <Box args={[0.12, 0.2, 0.05]} position={[0, 0.2, 0.22]} color="#5d4037" />
      <Cyl args={[0.06, 0.06, 0.3, 8]} position={[0.3, 0.6, 0]} color="#fdebd0" />
    </Group>
  );
}

function ValeDoCapao() {
  return (
    <Group>
      <Cone args={[0.45, 0.7, 5]} position={[-0.25, 0.35, 0]} color="#27ae60" />
      <Cone args={[0.55, 0.9, 5]} position={[0.25, 0.45, -0.1]} color="#1e8449" />
      <Box args={[0.5, 0.08, 0.25]} position={[0, 0.06, 0.3]} color="#5dade2" />
    </Group>
  );
}

function Trancoso() {
  return (
    <Group>
      <Box args={[0.45, 0.4, 0.35]} position={[0, 0.22, 0]} color="#fdfefe" />
      <Cone args={[0.3, 0.3, 4]} position={[0, 0.55, 0]} color="#1abc9c" />
      <Box args={[0.9, 0.04, 0.7]} position={[0, 0.02, 0]} color="#f9e79f" />
      <Box args={[0.25, 0.2, 0.25]} position={[0.4, 0.12, 0.25]} color="#e8daef" />
    </Group>
  );
}

function Arraial() {
  return (
    <Group>
      <Box args={[0.4, 0.3, 0.35]} position={[-0.2, 0.18, 0]} color="#f5b7b1" />
      <Box args={[0.35, 0.28, 0.3]} position={[0.25, 0.16, 0.1]} color="#aed6f1" />
      <Box args={[1.0, 0.05, 0.55]} position={[0, 0.03, 0.35]} color="#48c9b0" />
      <Cyl args={[0.05, 0.05, 0.4, 6]} position={[0.4, 0.35, -0.15]} color="#6d4c41" />
      <Cone args={[0.18, 0.3, 6]} position={[0.4, 0.6, -0.15]} color="#196f3d" />
    </Group>
  );
}

function Caraiva() {
  return (
    <Group>
      <Box args={[0.7, 0.12, 0.3]} position={[0, 0.15, 0]} color="#d35400" />
      <Box args={[0.35, 0.15, 0.2]} position={[0, 0.28, 0]} color="#f5cba7" />
      <Box args={[1.1, 0.05, 0.7]} position={[0, 0.02, 0]} color="#1a5276" />
      <Cone args={[0.15, 0.25, 5]} position={[-0.35, 0.35, 0.25]} color="#27ae60" />
    </Group>
  );
}

function RioVermelho() {
  return (
    <Group>
      <Box args={[0.45, 0.4, 0.4]} position={[-0.15, 0.22, 0]} color="#f5b7b1" />
      <Cyl args={[0.1, 0.12, 0.7, 8]} position={[0.3, 0.4, 0]} color="#fdfefe" />
      <Box args={[0.22, 0.1, 0.22]} position={[0.3, 0.8, 0]} color="#c0392b" />
      <Box args={[0.7, 0.05, 0.4]} position={[0, 0.03, 0.35]} color="#5dade2" />
    </Group>
  );
}

function FarolDaBarraFallback() {
  return (
    <Group>
      <Cyl args={[0.18, 0.22, 1.0, 10]} position={[0, 0.55, 0]} color="#fdfefe" />
      <Box args={[0.08, 0.55, 0.35]} position={[0, 0.55, 0]} color="#c0392b" />
      <Box args={[0.35, 0.12, 0.35]} position={[0, 1.1, 0]} color="#2c3e50" />
      <Sphere args={[0.08]} position={[0, 1.25, 0]} color="#f4d03f" />
      <Box args={[0.7, 0.2, 0.5]} position={[0, 0.1, 0.35]} color="#5d6d7e" />
    </Group>
  );
}

function FarolDaBarra({
  accent,
  fitWidth,
  fitDepth,
}: {
  accent?: boolean;
  fitWidth: number;
  fitDepth: number;
}) {
  return (
    <Suspense fallback={<FarolDaBarraFallback />}>
      <GltfLandmark
        url="/models/farol-da-barra.gltf"
        fitWidth={fitWidth}
        fitDepth={fitDepth}
        polish
        accent={accent}
      />
    </Suspense>
  );
}

function EmbasaFallback() {
  return (
    <Group>
      <Cyl args={[0.35, 0.35, 0.55, 16]} position={[-0.25, 0.3, 0]} color="#5dade2" />
      <Cyl args={[0.28, 0.28, 0.45, 16]} position={[0.3, 0.25, 0.1]} color="#3498db" />
      <Box args={[0.9, 0.08, 0.5]} position={[0, 0.05, 0]} color="#85929e" />
    </Group>
  );
}

function Embasa({
  accent,
  fitWidth,
  fitDepth,
}: {
  accent?: boolean;
  fitWidth: number;
  fitDepth: number;
}) {
  return (
    <Suspense fallback={<EmbasaFallback />}>
      <GltfLandmark
        url="/models/hidrometro.gltf"
        fitWidth={fitWidth}
        fitDepth={fitDepth}
        polish
        accent={accent}
      />
    </Suspense>
  );
}

function Pituba() {
  return (
    <Group>
      <Box args={[0.35, 0.9, 0.35]} position={[-0.25, 0.45, 0]} color="#aed6f1" />
      <Box args={[0.4, 1.1, 0.4]} position={[0.25, 0.55, 0]} color="#85c1e9" />
      <Box args={[0.25, 0.6, 0.25]} position={[0, 0.3, 0.3]} color="#d4e6f1" />
    </Group>
  );
}

function PraiaDoForte() {
  return (
    <Group>
      <Box args={[0.7, 0.35, 0.5]} position={[0, 0.2, 0]} color="#a04000" />
      <Box args={[0.15, 0.25, 0.15]} position={[-0.25, 0.45, 0.15]} color="#6e2c00" />
      <Box args={[0.15, 0.25, 0.15]} position={[0.25, 0.45, 0.15]} color="#6e2c00" />
      <Box args={[1.0, 0.05, 0.55]} position={[0, 0.03, 0.4]} color="#f9e79f" />
      <Box args={[1.0, 0.04, 0.35]} position={[0, 0.02, 0.7]} color="#5dade2" />
    </Group>
  );
}

function CostaSauipe() {
  return (
    <Group>
      <Box args={[0.8, 0.35, 0.45]} position={[0, 0.2, 0]} color="#fdfefe" />
      <Box args={[0.5, 0.25, 0.35]} position={[0, 0.48, 0]} color="#48c9b0" />
      <Cyl args={[0.06, 0.06, 0.5, 6]} position={[-0.4, 0.35, 0.3]} color="#6d4c41" />
      <Cone args={[0.22, 0.35, 6]} position={[-0.4, 0.65, 0.3]} color="#27ae60" />
      <Box args={[0.9, 0.04, 0.4]} position={[0, 0.02, 0.45]} color="#f9e79f" />
    </Group>
  );
}

function PortoSeguro() {
  return (
    <Group>
      <Box args={[0.08, 0.7, 0.08]} position={[0, 0.4, 0]} color="#6d4c41" />
      <Box args={[0.45, 0.08, 0.08]} position={[0, 0.65, 0]} color="#6d4c41" />
      <Box args={[0.35, 0.25, 0.3]} position={[0.3, 0.15, 0.2]} color="#f5cba7" />
      <Box args={[0.8, 0.04, 0.5]} position={[0, 0.02, 0.35]} color="#f9e79f" />
    </Group>
  );
}

function CorredorVitoria() {
  return (
    <Group>
      <Box args={[0.45, 0.7, 0.4]} position={[-0.25, 0.35, 0]} color="#f5cba7" />
      <Box args={[0.4, 0.85, 0.4]} position={[0.25, 0.45, 0]} color="#fad7a0" />
      <Box args={[0.5, 0.1, 0.45]} position={[-0.25, 0.75, 0]} color="#1a5276" />
      <Box args={[0.45, 0.1, 0.45]} position={[0.25, 0.95, 0]} color="#1a5276" />
      <Box args={[0.15, 0.25, 0.05]} position={[-0.25, 0.2, 0.22]} color="#5d4037" />
    </Group>
  );
}

function Abada() {
  return (
    <Group>
      <Box args={[0.55, 0.08, 0.4]} position={[0, 0.35, 0]} color="#e74c3c" />
      <Box args={[0.5, 0.35, 0.08]} position={[0, 0.2, 0]} color="#f1c40f" />
      <Box args={[0.35, 0.3, 0.08]} position={[0, 0.18, 0.12]} color="#9b59b6" />
      <Sphere args={[0.08]} position={[0, 0.5, 0]} color="#3498db" />
    </Group>
  );
}

