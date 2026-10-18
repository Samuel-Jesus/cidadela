import type { ReactNode } from "react";
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
import { FarolDaBarraLandmark } from "./FarolDaBarraLandmark";
import { ForteSaoMarceloLandmark } from "./ForteSaoMarceloLandmark";
import { HidrometroLandmark } from "./HidrometroLandmark";
import { IlhaDeMareLandmark } from "./IlhaDeMareLandmark";
import { IgrejaUniversalLandmark } from "./IgrejaUniversalLandmark";
import { ParipeLandmark } from "./ParipeLandmark";
import { FeiraSaoJoaquimLandmark } from "./FeiraSaoJoaquimLandmark";
import { FitinhaDoBonfimLandmark } from "./FitinhaDoBonfimLandmark";
import { IlheusLandmark } from "./IlheusLandmark";
import { CachoeiraLandmark } from "./CachoeiraLandmark";
import { ValencaLandmark } from "./ValencaLandmark";
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
    index === 1 ||
    index === 2 ||
    index === 3 ||
    index === 4 ||
    index === 5 ||
    index === 6 ||
    index === 7 ||
    index === 8 ||
    index === 9 ||
    index === 10 ||
    index === 11 ||
    index === 22 ||
    index === 36 ||
    index === 12 ||
    index === 15 ||
    index === 17 ||
    index === 20 ||
    index === 25 ||
    index === 27 ||
    index === 28 ||
    index === 30 ||
    index === 33 ||
    index === 35 ||
    index === 39;
  const fitWidth = (slotWidth ?? 1.2) * (isGltf ? 0.98 : 0.95);
  const fitDepth = (slotDepth ?? 1.2) * (isGltf ? 0.98 : 0.55);

  if (index === 0) {
    return <AeroportoSalvadorLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 1) {
    return (
      <IlhaDeMareLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 2 || index === 17 || index === 33) {
    return (
      <IgrejaUniversalLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 3) {
    return (
      <ParipeLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 4) {
    return <PedagioLinhaVerdeLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 5) {
    return <FerryBoatLandmark accent={accent} fitWidth={fitWidth} fitDepth={fitDepth} />;
  }
  if (index === 6) {
    return (
      <FeiraSaoJoaquimLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 7 || index === 22 || index === 36) {
    return (
      <FitinhaDoBonfimLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 8) {
    return (
      <CachoeiraLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 9) {
    return (
      <ValencaLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 10) {
    const forteFit = Math.min(slotWidth ?? 1.2, slotDepth ?? 1.2) * 0.85;
    return (
      <ForteSaoMarceloLandmark
        accent={accent}
        fitWidth={forteFit}
        fitDepth={forteFit}
      />
    );
  }
  if (index === 11) {
    return (
      <IlheusLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
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
    return (
      <FarolDaBarraLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
  }
  if (index === 28) {
    return (
      <HidrometroLandmark
        accent={accent}
        fitWidth={fitWidth}
        fitDepth={fitDepth}
      />
    );
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
    <GltfLandmark
      url="/models/elevador-lacerda.gltf"
      fitWidth={fitWidth}
      fitDepth={fitDepth}
      polish
      accent={accent}
    />
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

