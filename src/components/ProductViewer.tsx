import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, ContactShadows, Environment, Html, Lightformer, useGLTF } from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';
import { Cuboid, Rotate3D, SlidersHorizontal, SunMedium, X } from 'lucide-react';
import * as THREE from 'three';

const MODEL_URL = '/api/model';

type CameraPreset = 'perspective' | 'front' | 'side' | 'back' | 'detail';
type LightingPreset = 'daylight' | 'studio' | 'evening';
type Panel = 'camera' | 'finish' | 'lighting';

interface ProductViewerProps {
  onClose: () => void;
}

interface SelectedSurface {
  id: string;
  label: string;
}

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  perspective: [3.4, 2.1, 4.2],
  front: [0, 0.35, 4.7],
  side: [4.7, 0.35, 0],
  back: [0, 0.35, -4.7],
  detail: [2.25, 1.35, 2.45],
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
    floor: '#cad3c7',
    ambient: 0.74,
    key: 1.2,
    fill: 0.45,
    rim: 0.82,
    keyColor: '#fff8ee',
    fillColor: '#dfeaff',
    rimColor: '#ffffff',
    exposure: 1.03,
  },
  studio: {
    label: 'Studio',
    background: 'from-[#deded9] to-[#adb4ae]',
    floor: '#c5c7c2',
    ambient: 0.54,
    key: 1.48,
    fill: 0.7,
    rim: 1.08,
    keyColor: '#ffffff',
    fillColor: '#e9eef4',
    rimColor: '#ffffff',
    exposure: 1,
  },
  evening: {
    label: 'Evening',
    background: 'from-[#42544d] to-[#172823]',
    floor: '#283b34',
    ambient: 0.34,
    key: 0.98,
    fill: 0.28,
    rim: 1.2,
    keyColor: '#ffd9a6',
    fillColor: '#9db7c8',
    rimColor: '#ffc883',
    exposure: 0.92,
  },
};

const FINISHES = [
  { key: 'original', label: 'Original', color: 'transparent' },
  { key: 'oat', label: 'Oat', color: '#d8d0c4' },
  { key: 'sage', label: 'Sage', color: '#98a48f' },
  { key: 'charcoal', label: 'Charcoal', color: '#3f4543' },
  { key: 'clay', label: 'Clay', color: '#a36e58' },
  { key: 'sand', label: 'Sand', color: '#c8b795' },
];

function CameraRig({ preset }: { preset: CameraPreset }) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    const [x, y, z] = CAMERA_POSITIONS[preset];
    ref.current.setLookAt(x, y, z, 0, 0, 0, true);
  }, [preset]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={2}
      maxDistance={7.5}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.84}
      dollyToCursor
      smoothTime={0.32}
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

function ModelError() {
  return (
    <Html center>
      <div className="w-64 rounded-2xl border border-white/70 bg-white/90 px-5 py-4 text-center text-brand-green shadow-xl backdrop-blur-md">
        <Cuboid className="mx-auto mb-2 h-6 w-6" />
        <p className="text-xs font-semibold">3D model could not be loaded.</p>
        <p className="mt-1 text-[10px] text-gray-500">Close the viewer and try again.</p>
      </div>
    </Html>
  );
}

function ConfigurableModel({
  overrides,
  onSelectSurface,
}: {
  overrides: Record<string, string>;
  onSelectSurface: (surface: SelectedSurface) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);

  const prepared = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const cloneMaterial = (material: THREE.Material) => {
        const clonedMaterial = material.clone();

        if (clonedMaterial instanceof THREE.MeshStandardMaterial) {
          clonedMaterial.userData.originalColor = clonedMaterial.color.getHexString();
        }

        return clonedMaterial;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(cloneMaterial);
      } else if (mesh.material) {
        mesh.material = cloneMaterial(mesh.material);
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;

    cloned.position.sub(center);

    return {
      object: cloned,
      scale: 2.7 / maxDimension,
    };
  }, [scene]);

  useEffect(() => {
    prepared.object.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;

        const originalColor = material.userData.originalColor;
        if (typeof originalColor === 'string') {
          material.color.set(`#${originalColor}`);
        }

        const override = overrides[mesh.uuid];
        if (override) {
          material.color.set(override);
        }

        material.needsUpdate = true;
      });
    });
  }, [overrides, prepared.object]);

  return (
    <group scale={prepared.scale}>
      <primitive
        object={prepared.object}
        onPointerDown={(event: any) => {
          event.stopPropagation();

          const mesh = event.object as THREE.Mesh;
          const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const rawLabel = mesh.name || material?.name || 'Selected surface';

          onSelectSurface({
            id: mesh.uuid,
            label: rawLabel.replace(/[_-]+/g, ' ').slice(0, 34),
          });
        }}
      />
    </group>
  );
}

function Scene({
  cameraPreset,
  lightingPreset,
  intensity,
  overrides,
  onSelectSurface,
}: {
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;
  intensity: number;
  overrides: Record<string, string>;
  onSelectSurface: (surface: SelectedSurface) => void;
}) {
  const lighting = LIGHTING[lightingPreset];

  return (
    <>
      <RendererSettings exposure={lighting.exposure} />

      <ambientLight intensity={lighting.ambient * intensity} />
      <directionalLight
        castShadow
        position={[4.5, 7, 4]}
        intensity={lighting.key * intensity}
        color={lighting.keyColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-4, 3.5, -4]}
        intensity={lighting.fill * intensity}
        color={lighting.fillColor}
      />
      <spotLight
        position={[5, 6, -3]}
        angle={0.38}
        penumbra={0.9}
        intensity={lighting.rim * intensity}
        color={lighting.rimColor}
      />

      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.7 * intensity} color={lighting.keyColor} position={[0, 5, -8]} scale={[8, 8, 1]} />
        <Lightformer form="ring" intensity={1.05 * intensity} color={lighting.fillColor} position={[-5, 2, -1]} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={0.78 * intensity} color={lighting.rimColor} position={[7, 1, 2]} scale={[7, 7, 1]} />
      </Environment>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]} receiveShadow>
        <circleGeometry args={[4.4, 80]} />
        <meshStandardMaterial color={lighting.floor} roughness={0.94} />
      </mesh>

      <ErrorBoundary fallbackRender={() => <ModelError />}>
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 text-brand-green shadow-xl backdrop-blur-md">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-green/20 border-t-brand-green/80" />
                <span className="text-[10px] font-semibold tracking-[0.18em]">LOADING 3D</span>
              </div>
            </Html>
          }
        >
          <ConfigurableModel overrides={overrides} onSelectSurface={onSelectSurface} />
        </Suspense>
      </ErrorBoundary>

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={lightingPreset === 'evening' ? 0.5 : 0.36}
        scale={8}
        blur={2.5}
        far={4}
      />

      <CameraRig preset={cameraPreset} />
    </>
  );
}

export function ProductViewer({ onClose }: ProductViewerProps) {
  const [panel, setPanel] = useState<Panel>('camera');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('daylight');
  const [intensity, setIntensity] = useState(1);
  const [selectedSurface, setSelectedSurface] = useState<SelectedSurface | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const lighting = LIGHTING[lightingPreset];

  const applyFinish = (key: string, color: string) => {
    if (!selectedSurface) return;

    setOverrides((current) => {
      const next = { ...current };

      if (key === 'original') {
        delete next[selectedSurface.id];
      } else {
        next[selectedSurface.id] = color;
      }

      return next;
    });
  };

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${lighting.background}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: CAMERA_POSITIONS.perspective, fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene
          cameraPreset={cameraPreset}
          lightingPreset={lightingPreset}
          intensity={intensity}
          overrides={overrides}
          onSelectSurface={(surface) => {
            setSelectedSurface(surface);
            setPanel('finish');
          }}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-6">
        <div className="pointer-events-auto rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-brand-green shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Cuboid className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Interactive 3D</span>
          </div>
          <p className="mt-1 text-[10px] text-gray-600">Drag to orbit · wheel or pinch to zoom</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green text-white shadow-xl transition-transform hover:scale-105"
          aria-label="Close 3D viewer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 md:p-6">
        <div className="pointer-events-auto w-full max-w-[650px] overflow-hidden rounded-2xl border border-white/75 bg-white/88 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-3 border-b border-brand-green/10">
            <button
              type="button"
              onClick={() => setPanel('camera')}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                panel === 'camera' ? 'bg-brand-green text-white' : 'text-brand-green hover:bg-brand-green/5'
              }`}
            >
              <Rotate3D className="h-4 w-4" />
              Camera
            </button>
            <button
              type="button"
              onClick={() => setPanel('finish')}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                panel === 'finish' ? 'bg-brand-green text-white' : 'text-brand-green hover:bg-brand-green/5'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Finish
            </button>
            <button
              type="button"
              onClick={() => setPanel('lighting')}
              className={`flex items-center justify-center gap-2 px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                panel === 'lighting' ? 'bg-brand-green text-white' : 'text-brand-green hover:bg-brand-green/5'
              }`}
            >
              <SunMedium className="h-4 w-4" />
              Lighting
            </button>
          </div>

          <div className="min-h-[76px] px-4 py-4">
            {panel === 'camera' && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(['perspective', 'front', 'side', 'back', 'detail'] as CameraPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCameraPreset(preset)}
                    className={`rounded-lg px-3 py-2 text-[10px] font-semibold capitalize transition-colors ${
                      cameraPreset === preset
                        ? 'bg-brand-green text-white'
                        : 'bg-brand-green/5 text-brand-green hover:bg-brand-green/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {panel === 'finish' && (
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-green">
                    {selectedSurface ? selectedSurface.label : 'Select a surface on the chair'}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {selectedSurface ? 'Finish changes affect only the selected surface.' : 'Click the model, then choose a finish.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {FINISHES.map((finish) => (
                    <button
                      key={finish.key}
                      type="button"
                      disabled={!selectedSurface}
                      onClick={() => applyFinish(finish.key, finish.color)}
                      title={finish.label}
                      aria-label={finish.label}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-35 ${
                        finish.key === 'original' ? 'border-dashed border-brand-green/50 bg-white' : 'border-white'
                      }`}
                      style={finish.key === 'original' ? undefined : { backgroundColor: finish.color }}
                    >
                      {finish.key === 'original' && <span className="text-[9px] font-bold text-brand-green">↺</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {panel === 'lighting' && (
              <div className="grid items-center gap-3 sm:grid-cols-[auto_1fr]">
                <div className="flex justify-center gap-2">
                  {(Object.keys(LIGHTING) as LightingPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLightingPreset(preset)}
                      className={`rounded-lg px-3 py-2 text-[10px] font-semibold ${
                        lightingPreset === preset
                          ? 'bg-brand-green text-white'
                          : 'bg-brand-green/5 text-brand-green hover:bg-brand-green/10'
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
                    value={intensity}
                    onChange={(event) => setIntensity(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-brand-green/20 accent-brand-green"
                    aria-label="Light intensity"
                  />
                  <span className="min-w-[38px] text-right text-[10px] font-semibold text-brand-green">
                    {Math.round(intensity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
