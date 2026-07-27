/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="vite/client" />

import { useState, useRef, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, User, Cuboid, Moon, Sun, X } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls, ContactShadows, useGLTF, Center, Html, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { ErrorBoundary } from 'react-error-boundary';
import dayImage from './assets/images/day.png';
import nightImage from './assets/images/night.png';
import modelUrl from './assets/model.glb';

// --- Fallback 3D Component ---
function FallbackShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.2}>
      <torusKnotGeometry args={[1.2, 0.4, 128, 32]} />
      <meshPhysicalMaterial 
        color="#0a2e24" 
        metalness={0.2} 
        roughness={0.1} 
        transmission={0.9} 
        thickness={0.5}
        envMapIntensity={2}
        clearcoat={1}
      />
    </mesh>
  );
}

// Helper to create procedural wood texture for chair legs
function createWoodTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base warm wood tone
  ctx.fillStyle = '#9c5e33';
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain lines
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * 512;
    const height = Math.random() * 2 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(65, 34, 15, 0.15)' : 'rgba(210, 155, 100, 0.12)';
    ctx.fillRect(0, y, 512, height);
  }

  // Fine wood rings / curves
  ctx.strokeStyle = 'rgba(50, 25, 10, 0.08)';
  ctx.lineWidth = 2;
  for (let r = 20; r < 700; r += 12) {
    ctx.beginPath();
    ctx.ellipse(256, 256, r, r * 0.25, 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  return texture;
}

// --- 3D Model Component ---
function Model() {
  const { scene } = useGLTF(modelUrl || '/model.glb');
  
  const processedScene = useMemo(() => {
    const cloned = scene.clone(true);
    const woodTex = createWoodTexture();

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#9e6238'), // Warm natural oak wood tone
      roughness: 0.38,
      metalness: 0.05,
      map: woodTex || undefined,
    });

    const seatMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f5f2eb'), // Warm off-white boucle cream
      roughness: 0.85,
      metalness: 0.02,
    });

    const meshesToReplace: THREE.Mesh[] = [];
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshesToReplace.push(child as THREE.Mesh);
      }
    });

    meshesToReplace.forEach((mesh) => {
      const parent = mesh.parent;
      const geom = mesh.geometry;
      const pos = geom.attributes.position;
      const index = geom.index;

      if (pos && parent) {
        const seatIndices: number[] = [];
        const legIndices: number[] = [];

        const faceCount = index ? index.count / 3 : pos.count / 3;
        for (let i = 0; i < faceCount; i++) {
          let i1: number, i2: number, i3: number;
          if (index) {
            i1 = index.getX(i * 3);
            i2 = index.getX(i * 3 + 1);
            i3 = index.getX(i * 3 + 2);
          } else {
            i1 = i * 3;
            i2 = i * 3 + 1;
            i3 = i * 3 + 2;
          }
          const y1 = pos.getY(i1);
          const y2 = pos.getY(i2);
          const y3 = pos.getY(i3);
          const avgY = (y1 + y2 + y3) / 3;

          if (avgY < -0.08) {
            legIndices.push(i1, i2, i3);
          } else {
            seatIndices.push(i1, i2, i3);
          }
        }

        if (seatIndices.length > 0) {
          const seatGeom = geom.clone();
          seatGeom.setIndex(seatIndices);
          const seatMesh = new THREE.Mesh(seatGeom, seatMaterial);
          seatMesh.position.copy(mesh.position);
          seatMesh.rotation.copy(mesh.rotation);
          seatMesh.scale.copy(mesh.scale);
          seatMesh.castShadow = true;
          seatMesh.receiveShadow = true;
          parent.add(seatMesh);
        }

        if (legIndices.length > 0) {
          const legsGeom = geom.clone();
          legsGeom.setIndex(legIndices);
          const legsMesh = new THREE.Mesh(legsGeom, woodMaterial);
          legsMesh.position.copy(mesh.position);
          legsMesh.rotation.copy(mesh.rotation);
          legsMesh.scale.copy(mesh.scale);
          legsMesh.castShadow = true;
          legsMesh.receiveShadow = true;
          parent.add(legsMesh);
        }

        parent.remove(mesh);
      }
    });

    return cloned;
  }, [scene]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={processedScene} scale={50} />
      </Center>
    </group>
  );
}

try {
  useGLTF.preload(modelUrl);
  useGLTF.preload('/model.glb');
} catch (e) {
  // Preload fallback ignore
}

function CanvasLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center gap-3">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-brand-green/20 border-t-brand-green/80 rounded-full"
        />
        <span className="text-brand-green/80 text-sm font-medium tracking-wider">LOADING</span>
      </div>
    </Html>
  );
}

const slides = [
  {
    id: 0,
    title1: "Archi",
    title2: "tecture",
    subtitle: "Interior",
    description: "Building a good interior design adds value to the living. So, for interior designer is well aware of the types of fixtures, lighting, drapes, paint, sofa designs, and carpeting that you should put in various parts of a house."
  },
  {
    id: 1,
    title1: "Furni",
    title2: "ture",
    subtitle: "Collection",
    description: "Discover our premium furniture collection designed to elevate your living spaces with modern aesthetics and unmatched comfort. Handcrafted details meet contemporary design."
  },
  {
    id: 2,
    title1: "Ligh",
    title2: "ting",
    subtitle: "Ambiance",
    description: "Illuminate your home with our carefully curated lighting fixtures. From minimalist pendants to striking chandeliers, find the perfect glow for every room."
  }
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const slideImages = [
    isDarkMode ? nightImage : dayImage,
    dayImage,
    nightImage
  ];

  const currentImage = slideImages[currentSlide] || (isDarkMode ? nightImage : dayImage);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      {/* Main Container - Hero Card */}
      <div className="relative w-full max-w-[1200px] h-[750px] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col md:flex-row">
        
        {/* Left Column (Green) */}
        <div className="w-full md:w-[40%] h-full bg-brand-green p-10 md:p-14 flex flex-col justify-center relative z-10 text-white">
          <div className="flex flex-col gap-6 mt-10 w-full relative h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                variants={{
                  initial: { opacity: 0 },
                  animate: { opacity: 1, transition: { staggerChildren: 0.15 } },
                  exit: { opacity: 0, transition: { duration: 0.3 } }
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex flex-col gap-6"
              >
                {/* Heading Hierarchy */}
                <motion.div variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }} className="flex flex-col gap-2 relative z-20">
                  <span className="text-white/70 uppercase tracking-[0.15em] text-sm font-medium pl-1">
                    {slide.subtitle}
                  </span>
                  <div className="flex items-center mt-2 whitespace-nowrap">
                    <h1 className="text-6xl md:text-[80px] font-poly text-white drop-shadow-md leading-none">
                      {slide.title1}
                    </h1>
                    <div className="relative inline-block z-10 ml-4">
                      {/* Glassmorphism background behind title part */}
                      <div className="absolute -inset-y-4 -inset-x-6 bg-[#0a2e24]/70 backdrop-blur-[20px] border border-white/10 rounded-xl shadow-[0_24px_40px_rgba(0,0,0,0.5)] -z-10 translate-x-2 translate-y-1"></div>
                      <h1 className="text-6xl md:text-[80px] font-poly text-white drop-shadow-xl relative z-10 leading-none">
                        {slide.title2}
                      </h1>
                    </div>
                  </div>
                </motion.div>

                {/* Body Copy */}
                <motion.p variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }} className="text-white/80 text-sm md:text-base leading-relaxed mt-4 max-w-sm">
                  {slide.description}
                </motion.p>

                {/* CTA Button */}
                <motion.button variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }} className="mt-8 self-start px-8 py-3.5 bg-black/20 hover:bg-black/30 text-white text-sm font-medium tracking-wide rounded-xl backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300">
                  EXPLORE NOW
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination / Dots indicator */}
          <div className="absolute bottom-10 left-14 flex items-center gap-4 text-white/50 z-20">
            <button 
              onClick={prevSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-xl leading-none">&lsaquo;</span>
            </button>
            <button 
              onClick={nextSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <span className="text-xl leading-none">&rsaquo;</span>
            </button>
            <div className="flex gap-2 ml-4">
              {slides.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Image & 3D) */}
        <div className="relative w-full md:w-[60%] h-full hidden md:block overflow-hidden bg-[#e0e5db]">
          <AnimatePresence mode="wait">
            {!show3D ? (
              <motion.div
                key="image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img 
                  key={currentSlide + (isDarkMode ? 'dark' : 'light')}
                  src={currentImage} 
                  alt="Modern Interior" 
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = dayImage; }}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-brand-green/20 pointer-events-none"></div>

                {/* Hotspots & Tooltips */}
                
                {/* Hotspot A */}
                <div className="absolute top-[15%] left-[45%] group">
                  <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-75 z-10 pointer-events-none" style={{ animationDuration: '2s' }}></span>
                  <button 
                    onClick={() => setActiveHotspot(activeHotspot === 'A' ? null : 'A')}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-[0_4px_10px_rgba(0,0,0,0.25)] cursor-pointer hover:scale-110 hover:bg-white/30 transition-all relative z-20"
                  >
                    A
                  </button>
                  <AnimatePresence>
                    {activeHotspot === 'A' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, filter: 'blur(8px)', scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                        exit={{ opacity: 0, y: 15, filter: 'blur(8px)', scale: 0.9 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute top-12 left-1/2 -translate-x-1/2 w-[280px] bg-white/40 backdrop-blur-2xl border border-white/50 p-2.5 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex gap-4 items-center z-10"
                      >
                        <div className="w-20 h-20 shrink-0 overflow-hidden rounded-[18px] shadow-sm">
                          <img src={currentImage} alt="Product Thumbnail" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-1 text-left pr-2 py-1">
                          <h4 className="text-[10px] font-bold tracking-widest text-gray-800 uppercase mb-0.5">Pendant Lamp</h4>
                          <p className="text-xs text-gray-600 mb-2 leading-tight">Minimalist drop lighting</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">$129.00</span>
                            <button className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold tracking-widest uppercase rounded-md transition-all shadow-md hover:shadow-lg cursor-pointer">
                              Add
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hotspot B */}
                <div className="absolute bottom-[30%] left-[45%] group">
                  <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-75 z-10 pointer-events-none" style={{ animationDuration: '2s' }}></span>
                  <button 
                    onClick={() => setActiveHotspot(activeHotspot === 'B' ? null : 'B')}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-[0_4px_10px_rgba(0,0,0,0.25)] cursor-pointer hover:scale-110 hover:bg-white/30 transition-all relative z-20"
                  >
                    B
                  </button>
                  <AnimatePresence>
                    {activeHotspot === 'B' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -15, filter: 'blur(8px)', scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                        exit={{ opacity: 0, y: -15, filter: 'blur(8px)', scale: 0.9 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[280px] bg-white/40 backdrop-blur-2xl border border-white/50 p-2.5 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex gap-4 items-center z-10"
                      >
                        <div className="w-20 h-20 shrink-0 overflow-hidden rounded-[18px] shadow-sm">
                          <img src={currentImage} alt="Product Thumbnail" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-1 text-left pr-2 py-1">
                          <h4 className="text-[10px] font-bold tracking-widest text-gray-800 uppercase mb-0.5">Dining Table</h4>
                          <p className="text-xs text-gray-600 mb-2 leading-tight">Modern oak dining table</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">$899.00</span>
                            <button className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold tracking-widest uppercase rounded-md transition-all shadow-md hover:shadow-lg cursor-pointer">
                              Add
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hotspot C (Opens 3D) */}
                <div className="absolute top-[60%] right-[18%] group">
                  <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-75 z-10 pointer-events-none" style={{ animationDuration: '2s' }}></span>
                  <button 
                    onClick={() => setShow3D(true)}
                    className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-[0_4px_10px_rgba(0,0,0,0.25)] cursor-pointer hover:scale-110 hover:bg-white/30 transition-all relative z-20"
                  >
                    C
                  </button>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-32 bg-white/10 backdrop-blur-[15px] border border-white/20 p-2 rounded-xl shadow-xl flex flex-col items-center z-10 pointer-events-none">
                    <span className="text-white text-xs font-medium text-center">View 3D Model</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="3d-model"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#d4dcd2] to-[#b3c2ae] flex items-center justify-center"
              >
                <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
                  <ambientLight intensity={0.8} />
                  <directionalLight position={[5, 8, 5]} intensity={1.2} />
                  <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#e0e8ff" />
                  <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} />
                  <PresentationControls 
                      global
                      rotation={[0, -Math.PI / 4, 0]}
                      polar={[-Math.PI / 4, Math.PI / 4]}
                      azimuth={[-Math.PI / 2, Math.PI / 2]}
                      snap
                      damping={0.2}
                    >
                      <ErrorBoundary fallback={<FallbackShape />}>
                        <Suspense fallback={<CanvasLoader />}>
                          <Model />
                        </Suspense>
                      </ErrorBoundary>
                    </PresentationControls>
                    <Environment resolution={256}>
                      <group rotation={[-Math.PI / 3, 0, 1]}>
                        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 5, -9]} scale={[10, 10, 1]} target={[0, 0, 0]} />
                        <Lightformer form="ring" intensity={1.5} color="#e6f0fa" position={[-5, 2, -1]} scale={[10, 10, 1]} target={[0, 0, 0]} />
                        <Lightformer form="rect" intensity={1} color="#ffffff" position={[10, 0, 1]} scale={[10, 10, 1]} target={[0, 0, 0]} />
                      </group>
                    </Environment>
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                  </Canvas>
                
                {/* Overlay instructions for user */}
                <div className="absolute bottom-8 right-8 max-w-xs p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/60 text-brand-green text-xs shadow-lg flex items-center justify-between gap-4 z-20">
                  <div>
                    <p className="font-semibold mb-0.5">3D Viewer Active</p>
                    <p className="text-gray-700">Drag to rotate the interior model.</p>
                  </div>
                  <button 
                    onClick={() => setShow3D(false)}
                    className="px-3 py-1.5 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    Close 3D
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Floating Navbar (Spans across both) */}
        <div className="absolute top-0 left-0 w-full p-8 px-10 flex justify-center z-30 pointer-events-none">
          {/* Unified Glassmorphism Navbar */}
          <div className="hidden md:flex items-center justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 px-10 py-3 rounded-xl gap-16 pointer-events-auto shadow-sm hover:shadow-md w-full max-w-5xl">
            
            {/* Nav Links */}
            <div className="flex items-center gap-8">
              <a href="#" className="text-white text-xs font-semibold tracking-wider">HOME</a>
              <a href="#" className="text-white/70 hover:text-white text-xs font-medium tracking-wider transition-colors">EXPLORE</a>
              <a href="#" className="text-white/70 hover:text-white text-xs font-medium tracking-wider transition-colors">SHOP</a>
              <a href="#" className="text-white/70 hover:text-white text-xs font-medium tracking-wider transition-colors">ABOUT US</a>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="bg-white text-brand-green text-xs px-4 py-2.5 pr-8 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-brand-green/50 placeholder:text-gray-400"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <button className="text-white hover:text-brand-orange transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </button>
              <button className="text-white hover:text-brand-orange transition-colors">
                <User className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/20"></div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-white hover:text-brand-orange transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="w-px h-6 bg-white/20"></div>
              <motion.button 
                onClick={() => setShow3D(!show3D)}
                whileHover={{ 
                  y: [-2, 2, -2], 
                  transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
                }}
                className="bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/40 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Cuboid className="w-4 h-4" />
                {show3D ? 'Back to Photo' : 'View 3D Model'}
              </motion.button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
