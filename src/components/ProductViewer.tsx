import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  useGLTF,
} from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';
import { Cuboid, Eye, EyeOff, Rotate3D, SunMedium, X } from 'lucide-react';
import * as THREE from 'three';

const MODEL_URL = '/model.glb';

type CameraPreset = 'perspective' | 'front' | 'side' | 'back' | 'detail';
type LightingPreset = 'daylight' | 'studio' | 'evening';
type FinishKey = 'oat' | 'sage' | 'charcoal';
type FrameKey = 'graphite' | 'bronze' | 'ivory';
type AccentKey = 'brass' | 'black' | 'chrome';

interface ProductViewerProps {
  onClose: () => void;
  compact?: boolean;
}

interface FinishConfig {
  upholstery: FinishKey;
  frame: FrameKey;
  accent: AccentKey;
}

const UPHOLSTERY: Record<FinishKey, { label: string; color: string }> = {
  oat: { label: 'Oat', color: '#d7d0c5' },
  sage: { label: 'Sage', color: '#9ba790' },
  charcoal: { label: 'Charcoal', color: '#3d4240' },
};

const FRAME: Record<FrameKey, { label: string; color: string }> = {
  graphite: { label: 'Graphite', color: '#1c211f' },
  bronze: { label: 'Bronze', color: '#6b5642' },
  ivory: { label: 'Ivory', color: '#d9d5ca' },
};

const ACCENT: Record<AccentKey, { label: string; color: string }> = {
  brass: { label: 'Brass', color: '#c7a267' },
  black: { label: 'Black', color: '#171817' },
  chrome: { label: 'Chrome', color: '#bfc4c2' },
};

const LIGHTING: Record<
  LightingPreset,
  {
    label: string;
    background: string;
    floor: string;
    ambient: number;
    key: number;
    fill: number;
    rim: number;
    keyColor: string;
    fillColor: string;
    rimColor: string;
    exposure: number;
  }
> = {
  daylight: {
    label: 'Daylight',
    background: 'from-[#dce4da] to-[#b8c8b4]',
    floor: '#cbd4c8',
    ambient: 0.75,
    key: 1.25,
    fill: 0.48,
    rim: 0.85,
    keyColor: '#fff7ea',
    fillColor: '#dfeaff',
    rimColor: '#ffffff',
    exposure: 1.05,
  },
  studio: {
    label: 'Studio',
    background: 'from-[#d7d7d2] to-[#aeb4ae]',
    floor: '#c5c7c2',
    ambient: 0.55,
    key: 1.55,
    fill: 0.72,
    rim: 1.1,
    keyColor: '#ffffff',
    fillColor: '#e9eef4',
    rimColor: '#ffffff',
    exposure: 1.0,
  },
  evening: {
    label: 'Evening',
    background: 'from-[#42544d] to-[#172823]',
    floor: '#283b34',
    ambient: 0.36,
    key: 1.0,
    fill: 0.28,
    rim: 1.25,
    keyColor: '#ffd9a6',
    fillColor: '#9db7c8',
    rimColor: '#ffc883',
    exposure: 0.92,
  },
};

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  perspective: [3.4, 2.1, 4.2],
  front: [0, 0.35, 4.6],
  side: [4.6, 0.35, 0],
  back: [0, 0.35, -4.6],
  detail: [2.3, 1.4, 2.5],
};

function classifyMaterial(name: string) {
  const key = name.toLowerCase();
  if (key.includes('brass') || key.includes('accent')) return 'accent';
  if (key.includes('frame') || key.includes('metal')) return 'frame';
  return 'upholstery';
}

function FallbackChair() {
  const fabric = '#d7d0c5';
  const metal = '#1c211f';

  return (
    <group>
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.34, 1.65]} />
        <meshStandardMaterial color={fabric} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.78, -0.68]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.75, 1.25, 0.28]} />
        <meshStandardMaterial color={fabric} roughness={0.8} />
      </mesh>
      {[
        [-0.68, -0.78, 0.55],
        [0.68, -0.78, 0.55],
        [-0.68, -0.78, -0.55],
        [0.68, -0.78, -0.55],
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 1.05, 16]} />
          <meshStandardMaterial color={metal} roughness={0.28} metalness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function ConfigurableModel({
  finishes,
  onSelectPart,
}: {
  finishes: FinishConfig;
  onSelectPart: (part: string) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);

  const prepared = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => material.clone());
      } else if (mesh.material) {
        mesh.material = mesh.material.clone();
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    cloned.position.sub(center);

    return { object: cloned, scale: 2.55 / maxDimension };
  }, [scene]);

  useEffect(() => {
    prepared.object.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;

        const group = classifyMaterial(material.name || mesh.name || '');

        if (group === 'accent') {
          material.color.set(ACCENT[finishes.accent].color);
          material.roughness = finishes.accent === 'chrome' ? 0.16 : 0.3;
          material.metalness = 0.9;
        } else if (group === 'frame') {
          material.color.set(FRAME[finishes.frame].color);
          material.roughness = finishes.frame === 'ivory' ? 0.48 : 0.28;
          material.metalness = finishes.frame === 'ivory' ? 0.28 : 0.82;
        } else {
          material.color.set(UPHOLSTERY[finishes.upholstery].color);
          material.roughness = 0.82;
          material.metalness = 0.02;
        }

        material.needsUpdate = true;
      });
    });
  }, [finishes, prepared.object]);

  return (
    <group scale={prepared.scale}>
      <primitive
        object={prepared.object}
        onPointerDown={(event: any) => {
          event.stopPropagation();
          const material = event.object?.material;
          const firstMaterial = Array.isArray(material) ? material[0] : material;
          onSelectPart(classifyMaterial(firstMaterial?.name || event.object?.name || ''));
        }}
      />
    </group>
  );
}

function CameraRig({ preset }: { preset: CameraPreset }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const [x, y, z] = CAMERA_POSITIONS[preset];
    controls.setLookAt(x, y, z, 0, 0, 0, true);
  }, [preset]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={2.2}
      maxDistance={7}
      minPolarAngle={Math.PI * 0.12}
      maxPolarAngle={Math.PI * 0.82}
      dollyToCursor
      smoothTime={0.35}
    />
  );
}

function RendererSettings({ exposure }: { exposure: number }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return null;
}

function Hotspot({
  position,
  title,
  detail,
  active,
  onClick,
}: {
  position: [number, number, number];
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Html position={position} center distanceFactor={7.5}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="group relative flex items-center"
        aria-label={`Inspect ${title}`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-brand-green text-[9px] font-bold text-white shadow-lg">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
          <span className="relative">+</span>
        </span>
        <span
          className={`ml-2 min-w-[130px] rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-left text-[10px] text-brand-green shadow-xl backdrop-blur-md transition-all ${
            active ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
          }`}
        >
          <strong className="block text-[9px] uppercase tracking-[0.14em]">{title}</strong>
          <span className="mt-0.5 block text-gray-600">{detail}</span>
        </span>
      </button>
    </Html>
  );
}

function Scene({
  finishes,
  cameraPreset,
  lightingPreset,
  lightIntensity,
  showHotspots,
  activeHotspot,
  setActiveHotspot,
  setSelectedPart,
}: {
  finishes: FinishConfig;
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;
  lightIntensity: number;
  showHotspots: boolean;
  activeHotspot: string | null;
  setActiveHotspot: (value: string | null) => void;
  setSelectedPart: (value: string) => void;
}) {
  const lighting = LIGHTING[lightingPreset];

  return (
    <>
      <RendererSettings exposure={lighting.exposure} />
      <ambientLight intensity={lighting.ambient * lightIntensity} />
      <directionalLight
        castShadow
        position={[4.5, 7, 4]}
        intensity={lighting.key * lightIntensity}
        color={lighting.keyColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-4, 3.5, -4]}
        intensity={lighting.fill * lightIntensity}
        color={lighting.fillColor}
      />
      <spotLight
        position={[5, 6, -3]}
        angle={0.38}
        penumbra={0.9}
        intensity={lighting.rim * lightIntensity}
        color={lighting.rimColor}
      />

      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.8 * lightIntensity} color={lighting.keyColor} position={[0, 5, -8]} scale={[8, 8, 1]} />
        <Lightformer form="ring" intensity={1.15 * lightIntensity} color={lighting.fillColor} position={[-5, 2, -1]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={0.8 * lightIntensity} color={lighting.rimColor} position={[7, 1, 2]} scale={[7, 7, 1]} />
      </Environment>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.36, 0]} receiveShadow>
        <circleGeometry args={[4.2, 80]} />
        <meshStandardMaterial color={lighting.floor} roughness={0.92} metalness={0.02} />
      </mesh>

      <ErrorBoundary fallback={<FallbackChair />}>
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 px-5 py-4 text-brand-green shadow-xl backdrop-blur-md">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-green/20 border-t-brand-green/80" />
                <span className="text-[10px] font-semibold tracking-[0.18em]">LOADING 3D</span>
              </div>
            </Html>
          }
        >
          <ConfigurableModel finishes={finishes} onSelectPart={setSelectedPart} />
        </Suspense>
      </ErrorBoundary>

      {showHotspots && (
        <>
          <Hotspot
            position={[0.02, 0.68, 0.72]}
            title="Upholstery"
            detail="Soft-touch textile finish"
            active={activeHotspot === 'upholstery'}
            onClick={() => setActiveHotspot(activeHotspot === 'upholstery' ? null : 'upholstery')}
          />
          <Hotspot
            position={[0.8, -0.58, 0.42]}
            title="Frame"
            detail="Structural metal support"
            active={activeHotspot === 'frame'}
            onClick={() => setActiveHotspot(activeHotspot === 'frame' ? null : 'frame')}
          />
          <Hotspot
            position={[-0.67, -0.95, 0.5]}
            title="Accent"
            detail="Metal detail finish"
            active={activeHotspot === 'accent'}
            onClick={() => setActiveHotspot(activeHotspot === 'accent' ? null : 'accent')}
          />
        </>
      )}

      <ContactShadows
        position={[0, -1.34, 0]}
        opacity={lightingPreset === 'evening' ? 0.52 : 0.38}
        scale={8}
        blur={2.4}
        far={4}
      />

      <CameraRig preset={cameraPreset} />
    </>
  );
}

function SwatchRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<string, { label: string; color: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</span>
      <div className="flex gap-1.5">
        {Object.entries(options).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={option.label}
            aria-label={`${label}: ${option.label}`}
            className={`h-5 w-5 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
              value === key ? 'scale-110 border-brand-green' : 'border-white'
            }`}
            style={{ backgroundColor: option.color }}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductViewer({ onClose }: ProductViewerProps) {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('daylight');
  const [lightIntensity, setLightIntensity] = useState(1);
  const [showHotspots, setShowHotspots] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState('upholstery');
  const [finishes, setFinishes] = useState<FinishConfig>({
    upholstery: 'oat',
    frame: 'graphite',
    accent: 'brass',
  });

  const lighting = LIGHTING[lightingPreset];

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${lighting.background}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: CAMERA_POSITIONS.perspective, fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene
          finishes={finishes}
          cameraPreset={cameraPreset}
          lightingPreset={lightingPreset}
          lightIntensity={lightIntensity}
          showHotspots={showHotspots}
          activeHotspot={activeHotspot}
          setActiveHotspot={setActiveHotspot}
          setSelectedPart={setSelectedPart}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-5">
        <div className="pointer-events-auto rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-brand-green shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Cuboid className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Interactive 3D</span>
          </div>
          <p className="mt-1 text-[10px] text-gray-600">Drag to orbit · wheel or pinch to zoom</p>
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => setShowHotspots((value) => !value)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 text-[10px] font-semibold text-brand-green shadow-xl backdrop-blur-md hover:bg-white"
            aria-label={showHotspots ? 'Hide 3D hotspots' : 'Show 3D hotspots'}
          >
            {showHotspots ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{showHotspots ? 'Hide points' : 'Show points'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white shadow-xl transition-transform hover:scale-105"
            aria-label="Close 3D viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 md:p-5">
        <div className="pointer-events-auto grid max-h-[46vh] gap-2 overflow-y-auto rounded-2xl border border-white/70 bg-white/80 p-3 shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_1.15fr_1fr]">
          <div className="min-w-0 rounded-xl bg-white/55 p-3">
            <div className="mb-2 flex items-center gap-2 text-brand-green">
              <Rotate3D className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Camera</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['perspective', 'front', 'side', 'back', 'detail'] as CameraPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCameraPreset(preset)}
                  className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold capitalize transition-colors ${
                    cameraPreset === preset
                      ? 'bg-brand-green text-white'
                      : 'bg-white text-brand-green hover:bg-brand-green/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-xl bg-white/55 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-green">Materials</span>
              <span className="text-[9px] capitalize text-gray-500">Selected: {selectedPart}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <SwatchRow
                label="Fabric"
                options={UPHOLSTERY}
                value={finishes.upholstery}
                onChange={(value) => setFinishes((current) => ({ ...current, upholstery: value as FinishKey }))}
              />
              <SwatchRow
                label="Frame"
                options={FRAME}
                value={finishes.frame}
                onChange={(value) => setFinishes((current) => ({ ...current, frame: value as FrameKey }))}
              />
              <SwatchRow
                label="Accent"
                options={ACCENT}
                value={finishes.accent}
                onChange={(value) => setFinishes((current) => ({ ...current, accent: value as AccentKey }))}
              />
            </div>
          </div>

          <div className="min-w-0 rounded-xl bg-white/55 p-3">
            <div className="mb-2 flex items-center gap-2 text-brand-green">
              <SunMedium className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Lighting</span>
            </div>
            <div className="mb-2 flex gap-1.5">
              {(Object.keys(LIGHTING) as LightingPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLightingPreset(preset)}
                  className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold transition-colors ${
                    lightingPreset === preset
                      ? 'bg-brand-green text-white'
                      : 'bg-white text-brand-green hover:bg-brand-green/10'
                  }`}
                >
                  {LIGHTING[preset].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.55"
                max="1.55"
                step="0.05"
                value={lightIntensity}
                onChange={(event) => setLightIntensity(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-brand-green/20 accent-brand-green"
                aria-label="Light intensity"
              />
              <span className="min-w-[34px] text-right text-[9px] font-semibold text-brand-green">
                {Math.round(lightIntensity * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
