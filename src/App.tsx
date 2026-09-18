/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="vite/client" />

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, User, Cuboid, Moon, Sun } from 'lucide-react';
import { ProductViewer } from './components/ProductViewer';

const dayImage = '/hero-day.png';
const nightImage = '/hero-night.png';

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
                <motion.button
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                  type="button"
                  onClick={() => setShow3D(true)}
                  className="mt-3 flex self-start items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-sm md:hidden"
                >
                  <Cuboid className="h-4 w-4" />
                  VIEW IN 3D
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
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.getAttribute('data-error-handled')) {
                      target.setAttribute('data-error-handled', 'true');
                      target.src = isDarkMode ? nightImage : dayImage;
                    }
                  }}
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

        <AnimatePresence>
          {show3D && (
            <motion.div
              key="3d-viewer"
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-0 z-[100] bg-[#d9e0d7] md:absolute md:inset-0 md:rounded-3xl"
            >
              <ProductViewer onClose={() => setShow3D(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}