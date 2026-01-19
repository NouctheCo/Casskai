/**
 * CassKai Landing V2 - World Map 3D
 * Carte du monde 3D interactive avec les pays supportés
 * Remplace le globe pour une meilleure visibilité des continents
 */

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Données des pays avec leurs coordonnées centrales et formes simplifiées
const SUPPORTED_COUNTRIES = [
  // Europe
  {
    name: 'France',
    code: 'FR',
    standard: 'PCG 2025',
    flag: '🇫🇷',
    color: '#3B82F6',
    center: { x: 2.2, y: 46.2 },
    region: 'europe'
  },
  {
    name: 'Belgique',
    code: 'BE',
    standard: 'PCMN',
    flag: '🇧🇪',
    color: '#3B82F6',
    center: { x: 4.4, y: 50.5 },
    region: 'europe'
  },
  {
    name: 'Suisse',
    code: 'CH',
    standard: 'CO/IFRS',
    flag: '🇨🇭',
    color: '#3B82F6',
    center: { x: 8.2, y: 46.8 },
    region: 'europe'
  },
  {
    name: 'Luxembourg',
    code: 'LU',
    standard: 'PCN',
    flag: '🇱🇺',
    color: '#3B82F6',
    center: { x: 6.1, y: 49.8 },
    region: 'europe'
  },

  // Afrique de l'Ouest - OHADA
  { name: 'Sénégal', code: 'SN', standard: 'SYSCOHADA', flag: '🇸🇳', color: '#10B981', center: { x: -14.4, y: 14.5 }, region: 'west-africa' },
  { name: 'Côte d\'Ivoire', code: 'CI', standard: 'SYSCOHADA', flag: '🇨🇮', color: '#10B981', center: { x: -5.5, y: 7.5 }, region: 'west-africa' },
  { name: 'Mali', code: 'ML', standard: 'SYSCOHADA', flag: '🇲🇱', color: '#10B981', center: { x: -4.0, y: 17.6 }, region: 'west-africa' },
  { name: 'Burkina Faso', code: 'BF', standard: 'SYSCOHADA', flag: '🇧🇫', color: '#10B981', center: { x: -1.6, y: 12.2 }, region: 'west-africa' },
  { name: 'Bénin', code: 'BJ', standard: 'SYSCOHADA', flag: '🇧🇯', color: '#10B981', center: { x: 2.3, y: 9.3 }, region: 'west-africa' },
  { name: 'Togo', code: 'TG', standard: 'SYSCOHADA', flag: '🇹🇬', color: '#10B981', center: { x: 0.8, y: 8.6 }, region: 'west-africa' },
  { name: 'Niger', code: 'NE', standard: 'SYSCOHADA', flag: '🇳🇪', color: '#10B981', center: { x: 8.1, y: 17.6 }, region: 'west-africa' },
  { name: 'Guinée', code: 'GN', standard: 'SYSCOHADA', flag: '🇬🇳', color: '#10B981', center: { x: -9.7, y: 9.9 }, region: 'west-africa' },

  // Afrique Centrale - OHADA
  { name: 'Cameroun', code: 'CM', standard: 'SYSCOHADA', flag: '🇨🇲', color: '#10B981', center: { x: 12.4, y: 7.4 }, region: 'central-africa' },
  { name: 'Gabon', code: 'GA', standard: 'SYSCOHADA', flag: '🇬🇦', color: '#10B981', center: { x: 11.6, y: -0.8 }, region: 'central-africa' },
  { name: 'Congo', code: 'CG', standard: 'SYSCOHADA', flag: '🇨🇬', color: '#10B981', center: { x: 15.8, y: -0.2 }, region: 'central-africa' },
  { name: 'RD Congo', code: 'CD', standard: 'SYSCOHADA', flag: '🇨🇩', color: '#10B981', center: { x: 21.8, y: -4.0 }, region: 'central-africa' },
  { name: 'Tchad', code: 'TD', standard: 'SYSCOHADA', flag: '🇹🇩', color: '#10B981', center: { x: 18.7, y: 15.5 }, region: 'central-africa' },
  { name: 'RCA', code: 'CF', standard: 'SYSCOHADA', flag: '🇨🇫', color: '#10B981', center: { x: 20.9, y: 6.6 }, region: 'central-africa' },
  { name: 'Guinée Équatoriale', code: 'GQ', standard: 'SYSCOHADA', flag: '🇬🇶', color: '#10B981', center: { x: 10.3, y: 1.7 }, region: 'central-africa' },
  { name: 'Comores', code: 'KM', standard: 'SYSCOHADA', flag: '🇰🇲', color: '#10B981', center: { x: 43.3, y: -11.6 }, region: 'indian-ocean' },

  // Maghreb
  { name: 'Maroc', code: 'MA', standard: 'PCM/IFRS', flag: '🇲🇦', color: '#F59E0B', center: { x: -7.1, y: 31.8 }, region: 'maghreb' },
  { name: 'Algérie', code: 'DZ', standard: 'SCF', flag: '🇩🇿', color: '#F59E0B', center: { x: 1.7, y: 28.0 }, region: 'maghreb' },
  { name: 'Tunisie', code: 'TN', standard: 'SCE', flag: '🇹🇳', color: '#F59E0B', center: { x: 9.5, y: 33.9 }, region: 'maghreb' },

  // Autres
  { name: 'Madagascar', code: 'MG', standard: 'PCG 2005', flag: '🇲🇬', color: '#8B5CF6', center: { x: 46.9, y: -18.8 }, region: 'indian-ocean' },
  { name: 'Maurice', code: 'MU', standard: 'IFRS', flag: '🇲🇺', color: '#8B5CF6', center: { x: 57.6, y: -20.3 }, region: 'indian-ocean' },
  { name: 'Canada', code: 'CA', standard: 'IFRS', flag: '🇨🇦', color: '#8B5CF6', center: { x: -106.3, y: 56.1 }, region: 'north-america' },
];

// Contours simplifiés des continents (coordonnées longitude, latitude)
const CONTINENT_PATHS = {
  africa: `M -17 35 L 12 37 L 35 30 L 52 12 L 50 0 L 42 -12 L 50 -26 L 35 -35 L 20 -35 L 12 -25 L 18 -5 L 10 5 L -5 5 L -17 15 Z`,
  europe: `M -10 35 L 0 40 L 10 45 L 30 50 L 40 55 L 60 55 L 70 45 L 50 40 L 40 38 L 30 40 L 10 38 Z`,
  northAmerica: `M -170 55 L -140 70 L -100 75 L -60 65 L -50 45 L -80 25 L -90 15 L -105 20 L -115 30 L -125 35 L -130 55 L -165 60 Z`,
  southAmerica: `M -80 10 L -60 5 L -35 -5 L -35 -25 L -50 -40 L -70 -55 L -75 -40 L -80 -20 L -75 0 Z`,
  asia: `M 35 5 L 40 30 L 60 45 L 80 55 L 100 65 L 120 70 L 145 65 L 160 55 L 150 40 L 130 30 L 120 15 L 100 10 L 80 20 L 60 15 L 45 0 Z`,
  oceania: `M 110 -10 L 155 -10 L 155 -45 L 115 -40 L 110 -25 Z`,
};

// Convertir lat/lon en coordonnées 3D pour une carte plate
function geoToWorld(lon: number, lat: number, scale: number = 0.06): [number, number, number] {
  return [lon * scale, lat * scale, 0];
}

// Composant pour dessiner les contours des continents
function ContinentOutlines() {
  const continentMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: '#334155',
    transparent: true,
    opacity: 0.4
  }), []);

  return (
    <group>
      {Object.values(CONTINENT_PATHS).map((pathData, index) => {
        const points: THREE.Vector3[] = [];
        const commands: string[] = pathData.match(/[MLZHV][^MLZHV]*/gi) || [];

        commands.forEach(cmd => {
          const type = cmd[0].toUpperCase();
          const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

          if (type === 'M' || type === 'L') {
            for (let i = 0; i < coords.length; i += 2) {
              const [x, y, z] = geoToWorld(coords[i], coords[i + 1]);
              points.push(new THREE.Vector3(x, y, z));
            }
          } else if (type === 'Z' && points.length > 0) {
            points.push(points[0].clone());
          }
        });

        if (points.length < 2) return null;

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineObj = new THREE.Line(geometry, continentMaterial);

        return (
          <primitive key={index} object={lineObj} />
        );
      })}
    </group>
  );
}

// Composant pour un point de pays
function CountryMarker({
  country,
  isHovered,
  isAnimating,
  onHover,
  onLeave,
  animationDelay
}: {
  country: typeof SUPPORTED_COUNTRIES[0];
  isHovered: boolean;
  isAnimating: boolean;
  onHover: () => void;
  onLeave: () => void;
  animationDelay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [position] = useState(() => geoToWorld(country.center.x, country.center.y));
  const [visible, setVisible] = useState(false);

  // Animation d'apparition progressive
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  useFrame((state) => {
    if (meshRef.current) {
      const baseScale = isHovered ? 1.8 : 1;
      const pulse = isAnimating ? Math.sin(state.clock.elapsedTime * 3 + animationDelay * 0.01) * 0.2 : 0;
      meshRef.current.scale.setScalar(baseScale + pulse);
    }
    if (ringRef.current && isHovered) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      {/* Point principal */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
        onPointerOut={onLeave}
      >
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial
          color={country.color}
          transparent
          opacity={isHovered ? 1 : 0.8}
        />
      </mesh>

      {/* Halo lumineux */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial
          color={country.color}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Ring animé au hover */}
      {isHovered && (
        <mesh ref={ringRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial
            color={country.color}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Tooltip au hover */}
      {isHovered && (
        <Html distanceFactor={15} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[200px] transform -translate-x-1/2 -translate-y-full -mt-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{country.flag}</span>
              <span className="font-bold text-white">{country.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">Norme: </span>
              <span className="font-medium" style={{ color: country.color }}>{country.standard}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Lignes de connexion entre les pays
function ConnectionLines({ hoveredCountry }: { hoveredCountry: typeof SUPPORTED_COUNTRIES[0] | null }) {
  const linesRef = useRef<THREE.Group>(null);

  const connections = useMemo(() => {
    if (!hoveredCountry) return [];

    // Trouver les pays de la même norme
    const sameStandard = SUPPORTED_COUNTRIES.filter(
      c => c.standard === hoveredCountry.standard && c.name !== hoveredCountry.name
    );

    return sameStandard.map(target => ({
      start: geoToWorld(hoveredCountry.center.x, hoveredCountry.center.y),
      end: geoToWorld(target.center.x, target.center.y),
      color: hoveredCountry.color
    }));
  }, [hoveredCountry]);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.LineBasicMaterial;
          material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.2;
        }
      });
    }
  });

  return (
    <group ref={linesRef}>
      {connections.map((conn, index) => {
        const points = [
          new THREE.Vector3(...conn.start),
          new THREE.Vector3(...conn.end)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: conn.color,
          transparent: true,
          opacity: 0.3
        });

        const lineObj = new THREE.Line(geometry, material);
        return <primitive key={index} object={lineObj} />;
      })}
    </group>
  );
}

// Scène principale de la carte
function MapScene({ onCountryHover }: { onCountryHover: (country: typeof SUPPORTED_COUNTRIES[0] | null) => void }) {
  const [hoveredCountry, setHoveredCountry] = useState<typeof SUPPORTED_COUNTRIES[0] | null>(null);
  const [animating, setAnimating] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  // Stopper l'animation après quelques secondes
  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Rotation douce de la carte
  useFrame((state) => {
    if (groupRef.current && !hoveredCountry) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  const handleHover = (country: typeof SUPPORTED_COUNTRIES[0]) => {
    setHoveredCountry(country);
    onCountryHover(country);
  };

  const handleLeave = () => {
    setHoveredCountry(null);
    onCountryHover(null);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      <group ref={groupRef}>
        {/* Contours des continents */}
        <ContinentOutlines />

        {/* Grille de fond */}
        <gridHelper
          args={[30, 30, '#1e293b', '#1e293b']}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, -0.5]}
        />

        {/* Lignes de connexion */}
        <ConnectionLines hoveredCountry={hoveredCountry} />

        {/* Marqueurs des pays */}
        {SUPPORTED_COUNTRIES.map((country, index) => (
          <CountryMarker
            key={country.code}
            country={country}
            isHovered={hoveredCountry?.code === country.code}
            isAnimating={animating}
            onHover={() => handleHover(country)}
            onLeave={handleLeave}
            animationDelay={index * 80}
          />
        ))}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={true}
        enableRotate={false}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        panSpeed={0.5}
      />
    </>
  );
}

// Composant wrapper avec section
export function WorldMap3D() {
  const [selectedCountry, setSelectedCountry] = useState<typeof SUPPORTED_COUNTRIES[0] | null>(null);

  // Statistiques par norme
  const standards = useMemo(() => {
    const map: Record<string, { count: number; color: string; countries: string[] }> = {};
    SUPPORTED_COUNTRIES.forEach(c => {
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

        {/* Map and Legend */}
        <div className="grid lg:grid-cols-4 gap-8 items-start">
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
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: standard.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{standard.name}</div>
                  <div className="text-xs text-slate-500">{standard.count} pays</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* 3D Map - Center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[500px] lg:col-span-2 order-1 lg:order-2 relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl blur-xl" />

            <div className="relative h-full bg-slate-900/30 rounded-2xl border border-slate-800/50 overflow-hidden">
              <Canvas
                camera={{ position: [0, 0, 15], fov: 50 }}
                style={{ background: 'transparent' }}
              >
                <Suspense fallback={null}>
                  <MapScene onCountryHover={setSelectedCountry} />
                </Suspense>
              </Canvas>

              {/* Instruction overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Survolez un pays pour voir les détails
              </div>
            </div>
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
                  <div className="text-lg font-semibold" style={{ color: selectedCountry.color }}>
                    {selectedCountry.standard}
                  </div>
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
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">Région</div>
                  <div className="text-sm text-white capitalize">
                    {selectedCountry.region.replace('-', ' ')}
                  </div>
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

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12"
        >
          {[
            { value: '26', label: 'Pays supportés', color: '#3B82F6' },
            { value: '5', label: 'Normes comptables', color: '#10B981' },
            { value: '12', label: 'Devises', color: '#F59E0B' },
            { value: '35+', label: 'Documents légaux', color: '#8B5CF6' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-4 bg-slate-900/30 rounded-xl border border-slate-800/50"
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default WorldMap3D;
