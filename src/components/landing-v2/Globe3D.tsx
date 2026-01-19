/**
 * CassKai Landing V2 - Globe 3D Interactif
 * Visualisation 3D des pays et normes comptables supportés
 */

import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Données des pays avec leurs positions sur le globe (lat, lon)
const COUNTRIES_DATA = [
  // Europe
  { name: 'France', lat: 46.2276, lon: 2.2137, standard: 'PCG 2025', flag: '🇫🇷', color: '#3B82F6' },
  { name: 'Belgique', lat: 50.5039, lon: 4.4699, standard: 'PCMN', flag: '🇧🇪', color: '#3B82F6' },
  { name: 'Suisse', lat: 46.8182, lon: 8.2275, standard: 'CO/IFRS', flag: '🇨🇭', color: '#3B82F6' },
  { name: 'Luxembourg', lat: 49.8153, lon: 6.1296, standard: 'PCN', flag: '🇱🇺', color: '#3B82F6' },

  // Afrique de l'Ouest - OHADA
  { name: 'Sénégal', lat: 14.4974, lon: -14.4524, standard: 'SYSCOHADA', flag: '🇸🇳', color: '#10B981' },
  { name: 'Côte d\'Ivoire', lat: 7.5400, lon: -5.5471, standard: 'SYSCOHADA', flag: '🇨🇮', color: '#10B981' },
  { name: 'Mali', lat: 17.5707, lon: -3.9962, standard: 'SYSCOHADA', flag: '🇲🇱', color: '#10B981' },
  { name: 'Burkina Faso', lat: 12.2383, lon: -1.5616, standard: 'SYSCOHADA', flag: '🇧🇫', color: '#10B981' },
  { name: 'Bénin', lat: 9.3077, lon: 2.3158, standard: 'SYSCOHADA', flag: '🇧🇯', color: '#10B981' },
  { name: 'Togo', lat: 8.6195, lon: 0.8248, standard: 'SYSCOHADA', flag: '🇹🇬', color: '#10B981' },
  { name: 'Niger', lat: 17.6078, lon: 8.0817, standard: 'SYSCOHADA', flag: '🇳🇪', color: '#10B981' },
  { name: 'Guinée', lat: 9.9456, lon: -9.6966, standard: 'SYSCOHADA', flag: '🇬🇳', color: '#10B981' },

  // Afrique Centrale - OHADA
  { name: 'Cameroun', lat: 7.3697, lon: 12.3547, standard: 'SYSCOHADA', flag: '🇨🇲', color: '#10B981' },
  { name: 'Gabon', lat: -0.8037, lon: 11.6094, standard: 'SYSCOHADA', flag: '🇬🇦', color: '#10B981' },
  { name: 'Congo', lat: -0.2280, lon: 15.8277, standard: 'SYSCOHADA', flag: '🇨🇬', color: '#10B981' },
  { name: 'RD Congo', lat: -4.0383, lon: 21.7587, standard: 'SYSCOHADA', flag: '🇨🇩', color: '#10B981' },
  { name: 'Tchad', lat: 15.4542, lon: 18.7322, standard: 'SYSCOHADA', flag: '🇹🇩', color: '#10B981' },
  { name: 'RCA', lat: 6.6111, lon: 20.9394, standard: 'SYSCOHADA', flag: '🇨🇫', color: '#10B981' },
  { name: 'Guinée Équatoriale', lat: 1.6508, lon: 10.2679, standard: 'SYSCOHADA', flag: '🇬🇶', color: '#10B981' },
  { name: 'Comores', lat: -11.6455, lon: 43.3333, standard: 'SYSCOHADA', flag: '🇰🇲', color: '#10B981' },

  // Maghreb
  { name: 'Maroc', lat: 31.7917, lon: -7.0926, standard: 'PCM/IFRS', flag: '🇲🇦', color: '#F59E0B' },
  { name: 'Algérie', lat: 28.0339, lon: 1.6596, standard: 'SCF', flag: '🇩🇿', color: '#F59E0B' },
  { name: 'Tunisie', lat: 33.8869, lon: 9.5375, standard: 'SCE', flag: '🇹🇳', color: '#F59E0B' },

  // Autres
  { name: 'Madagascar', lat: -18.7669, lon: 46.8691, standard: 'PCG 2005', flag: '🇲🇬', color: '#8B5CF6' },
  { name: 'Maurice', lat: -20.3484, lon: 57.5522, standard: 'IFRS', flag: '🇲🇺', color: '#8B5CF6' },
  { name: 'Canada', lat: 56.1304, lon: -106.3468, standard: 'IFRS', flag: '🇨🇦', color: '#8B5CF6' },
];

// Convertir lat/lon en coordonnées 3D sur une sphère
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Composant pour un point de pays sur le globe
function CountryPoint({ country, globeRadius, onHover, onLeave, isSelected }: {
  country: typeof COUNTRIES_DATA[0];
  globeRadius: number;
  onHover: (country: typeof COUNTRIES_DATA[0] | null) => void;
  onLeave: () => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(
    () => latLonToVector3(country.lat, country.lon, globeRadius + 0.02),
    [country.lat, country.lon, globeRadius]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const scale = isSelected ? 1.5 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => onHover(country)}
        onPointerOut={onLeave}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={country.color}
          emissive={country.color}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
        />
      </mesh>

      {isSelected && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[200px] transform -translate-x-1/2 -translate-y-full -mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{country.flag}</span>
              <span className="font-bold text-white">{country.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">Norme: </span>
              <span className="text-blue-400 font-medium">{country.standard}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Cliquez pour voir les fonctionnalités
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Composant principal du globe
function GlobeScene({ onCountryHover }: { onCountryHover: (country: typeof COUNTRIES_DATA[0] | null) => void }) {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredCountry, setHoveredCountry] = useState<typeof COUNTRIES_DATA[0] | null>(null);
  const globeRadius = 2;

  useFrame((state) => {
    if (globeRef.current && !hoveredCountry) {
      globeRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const handleHover = (country: typeof COUNTRIES_DATA[0] | null) => {
    setHoveredCountry(country);
    onCountryHover(country);
  };

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.2} />

      {/* Directional lights */}
      <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#3B82F6" />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Globe */}
      <group ref={globeRef}>
        {/* Earth sphere */}
        <Sphere args={[globeRadius, 64, 64]}>
          <meshStandardMaterial
            color="#1E293B"
            metalness={0.3}
            roughness={0.7}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Wireframe overlay */}
        <Sphere args={[globeRadius + 0.01, 32, 32]}>
          <meshBasicMaterial
            color="#3B82F6"
            wireframe
            transparent
            opacity={0.1}
          />
        </Sphere>

        {/* Glow effect */}
        <Sphere args={[globeRadius + 0.1, 32, 32]}>
          <meshBasicMaterial
            color="#3B82F6"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Country points */}
        {COUNTRIES_DATA.map((country, index) => (
          <CountryPoint
            key={index}
            country={country}
            globeRadius={globeRadius}
            onHover={handleHover}
            onLeave={() => handleHover(null)}
            isSelected={hoveredCountry?.name === country.name}
          />
        ))}
      </group>

      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
        autoRotate={!hoveredCountry}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Composant wrapper avec section
export function Globe3D() {
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES_DATA[0] | null>(null);

  // Statistiques par norme
  const standards = useMemo(() => {
    const map: Record<string, { count: number; color: string; countries: string[] }> = {};
    COUNTRIES_DATA.forEach(c => {
      if (!map[c.standard]) {
        map[c.standard] = { count: 0, color: c.color, countries: [] };
      }
      map[c.standard].count++;
      map[c.standard].countries.push(c.name);
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, []);

  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden" id="countries">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Une plateforme,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              tous vos marchés
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            26 pays, 5 normes comptables, 12 devises. CassKai s'adapte à votre contexte réglementaire.
          </p>
        </motion.div>

        {/* Globe and Legend */}
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Legend - Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4 order-2 lg:order-1"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Normes supportées</h3>
            {standards.map((standard, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: standard.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-white">{standard.name}</div>
                  <div className="text-xs text-slate-500">{standard.count} pays</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* 3D Globe - Center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[500px] lg:col-span-1 order-1 lg:order-2"
          >
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
              <Suspense fallback={null}>
                <GlobeScene onCountryHover={setSelectedCountry} />
              </Suspense>
            </Canvas>
          </motion.div>

          {/* Features - Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4 order-3"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Fonctionnalités'}
            </h3>

            {selectedCountry ? (
              <div className="space-y-3">
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Norme comptable</div>
                  <div className="text-lg font-semibold text-blue-400">{selectedCountry.standard}</div>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-sm text-slate-400 mb-2">Documents générés</div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Bilan comptable</li>
                    <li>• Compte de résultat</li>
                    <li>• Balance générale</li>
                    <li>• Liasse fiscale</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: '📊', title: 'Multi-normes', desc: 'PCG, SYSCOHADA, IFRS, SCF...' },
                  { icon: '💱', title: 'Multi-devises', desc: 'EUR, XOF, XAF, MAD, USD...' },
                  { icon: '📄', title: 'Documents légaux', desc: '35+ types de documents' },
                  { icon: '🔄', title: 'Mise à jour auto', desc: 'Conformité temps réel' },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <div className="font-medium text-white">{feature.title}</div>
                      <div className="text-sm text-slate-500">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Globe3D;
