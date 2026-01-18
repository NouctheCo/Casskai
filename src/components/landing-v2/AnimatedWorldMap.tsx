/**
 * CassKai Landing V2 - Carte du monde animée avec zoom automatique
 * Animation automatique qui parcourt les pays avec transitions fluides
 */

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useLocale } from '@/contexts/LocaleContext';

// Données des pays avec leurs positions (latitude, longitude)
const COUNTRIES = [
  // Europe
  { name: 'France', code: 'FR', standard: 'PCG 2025', flag: '🇫🇷', color: '#3B82F6', position: [2.2, 46.2], region: 'Europe', currency: 'EUR', features: ['Facturation électronique', 'FEC', 'Liasse fiscale', 'TVA FR'] },
  { name: 'Belgique', code: 'BE', standard: 'PCMN', flag: '🇧🇪', color: '#3B82F6', position: [4.4, 50.5], region: 'Europe', currency: 'EUR', features: ['Plan comptable minimum', 'TVA BE', 'Déclarations', 'Balance analytique'] },
  { name: 'Suisse', code: 'CH', standard: 'CO/IFRS', flag: '🇨🇭', color: '#3B82F6', position: [8.2, 46.8], region: 'Europe', currency: 'CHF', features: ['Code des obligations', 'TVA CH', 'Multi-devises', 'Consolidation'] },
  { name: 'Luxembourg', code: 'LU', standard: 'PCN', flag: '🇱🇺', color: '#3B82F6', position: [6.1, 49.8], region: 'Europe', currency: 'EUR', features: ['Plan comptable normalisé', 'RESA', 'eCDF', 'FAIA'] },

  // Afrique de l'Ouest - OHADA
  { name: 'Sénégal', code: 'SN', standard: 'SYSCOHADA', flag: '🇸🇳', color: '#10B981', position: [-14.4, 14.5], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'DSF', 'Liasse fiscale', 'BCEAO'] },
  { name: 'Côte d\'Ivoire', code: 'CI', standard: 'SYSCOHADA', flag: '🇨🇮', color: '#10B981', position: [-5.5, 7.5], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'DGI', 'e-Tax', 'Facture normalisée'] },
  { name: 'Mali', code: 'ML', standard: 'SYSCOHADA', flag: '🇲🇱', color: '#10B981', position: [-4.0, 17.6], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'DGI Mali', 'BCEAO', 'Trésorerie'] },
  { name: 'Burkina Faso', code: 'BF', standard: 'SYSCOHADA', flag: '🇧🇫', color: '#10B981', position: [-1.6, 12.2], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'DGI BF', 'BCEAO', 'Déclarations'] },
  { name: 'Bénin', code: 'BJ', standard: 'SYSCOHADA', flag: '🇧🇯', color: '#10B981', position: [2.3, 9.3], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'DGI Bénin', 'BCEAO', 'Douanes'] },
  { name: 'Togo', code: 'TG', standard: 'SYSCOHADA', flag: '🇹🇬', color: '#10B981', position: [0.8, 8.6], region: 'Afrique de l\'Ouest', currency: 'XOF', features: ['SYSCOHADA Révisé', 'OTR', 'BCEAO', 'e-Filing'] },

  // Afrique Centrale - OHADA
  { name: 'Cameroun', code: 'CM', standard: 'SYSCOHADA', flag: '🇨🇲', color: '#34D399', position: [12.4, 7.4], region: 'Afrique Centrale', currency: 'XAF', features: ['SYSCOHADA Révisé', 'DGI Cameroun', 'BEAC', 'e-Filing'] },
  { name: 'Gabon', code: 'GA', standard: 'SYSCOHADA', flag: '🇬🇦', color: '#34D399', position: [11.6, -0.8], region: 'Afrique Centrale', currency: 'XAF', features: ['SYSCOHADA Révisé', 'DGI Gabon', 'BEAC', 'Pétrole & Gaz'] },
  { name: 'Congo', code: 'CG', standard: 'SYSCOHADA', flag: '🇨🇬', color: '#34D399', position: [15.8, -0.2], region: 'Afrique Centrale', currency: 'XAF', features: ['SYSCOHADA Révisé', 'DGI Congo', 'BEAC', 'Ressources'] },
  { name: 'RD Congo', code: 'CD', standard: 'SYSCOHADA', flag: '🇨🇩', color: '#34D399', position: [21.8, -4.0], region: 'Afrique Centrale', currency: 'CDF', features: ['SYSCOHADA Révisé', 'DGI RDC', 'Mines', 'Multi-devises'] },

  // Maghreb
  { name: 'Maroc', code: 'MA', standard: 'PCM/IFRS', flag: '🇲🇦', color: '#F59E0B', position: [-7.1, 31.8], region: 'Maghreb', currency: 'MAD', features: ['Code général normalisé', 'TVA', 'IS/IR', 'Facturation Maroc'] },
  { name: 'Algérie', code: 'DZ', standard: 'SCF', flag: '🇩🇿', color: '#F59E0B', position: [1.7, 28.0], region: 'Maghreb', currency: 'DZD', features: ['Système comptable financier', 'G50', 'Bilan social', 'TVA DZ'] },
  { name: 'Tunisie', code: 'TN', standard: 'SCE', flag: '🇹🇳', color: '#F59E0B', position: [9.5, 33.9], region: 'Maghreb', currency: 'TND', features: ['Système comptable tunisien', 'Liasse fiscale', 'e-Tax TN', 'Déclarations'] },

  // Océan Indien
  { name: 'Madagascar', code: 'MG', standard: 'PCG 2005', flag: '🇲🇬', color: '#8B5CF6', position: [46.9, -18.8], region: 'Océan Indien', currency: 'MGA', features: ['PCG Malgache', 'DGI Madagascar', 'Déclarations', 'Liasse'] },
  { name: 'Maurice', code: 'MU', standard: 'IFRS', flag: '🇲🇺', color: '#8B5CF6', position: [57.6, -20.3], region: 'Océan Indien', currency: 'MUR', features: ['IFRS complet', 'MRA', 'Offshore', 'Multi-devises'] },

  // Amérique du Nord
  { name: 'Canada', code: 'CA', standard: 'IFRS', flag: '🇨🇦', color: '#EC4899', position: [-106.3, 56.1], region: 'Amérique du Nord', currency: 'CAD', features: ['IFRS/ASPE', 'CRA', 'GST/HST', 'Bilingue FR/EN'] },
];

// Convertir lat/lon en coordonnées normalisées pour la texture
function geoToTexture(lon: number, lat: number): [number, number] {
  const x = (lon + 180) / 360;
  const y = (90 - lat) / 180;
  return [x, y];
}

// Marqueur de pays avec animation
function CountryMarker({
  country,
  isActive,
  isHovered,
  onHover,
  onLeave,
  scale,
  position
}: {
  country: typeof COUNTRIES[0];
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  scale: number;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const baseScale = isActive ? 2 : isHovered ? 1.5 : 1;
      const pulse = isActive ? Math.sin(state.clock.elapsedTime * 4) * 0.3 : 0;
      meshRef.current.scale.setScalar((baseScale + pulse) * scale);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar((1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3) * scale);
      glowRef.current.rotation.z = state.clock.elapsedTime * (isActive ? 2 : 0.5);
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef} position={[0, 0, -0.01]}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial color={country.color} transparent opacity={isActive ? 0.6 : 0.2} />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
        onPointerOut={onLeave}
      >
        <circleGeometry args={[0.06, 32]} />
        <meshBasicMaterial color={country.color} transparent opacity={isActive || isHovered ? 1 : 0.8} />
      </mesh>

      {(isActive || isHovered) && (
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.1, 0.14, 32]} />
          <meshBasicMaterial color={country.color} transparent opacity={0.4} />
        </mesh>
      )}

      {isHovered && !isActive && (
        <Html distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-3 shadow-2xl min-w-[180px] transform -translate-x-1/2 -translate-y-full -mt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{country.flag}</span>
              <span className="font-bold text-white text-sm">{country.name}</span>
            </div>
            <div className="text-xs text-slate-400">
              Norme: <span className="font-medium" style={{ color: country.color }}>{country.standard}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Scène 3D avec animation de caméra
function AnimatedMapScene({
  currentCountryIndex,
  hoveredCountryCode,
  onCountryHover
}: {
  currentCountryIndex: number;
  hoveredCountryCode: string | null;
  onCountryHover: (code: string | null) => void;
}) {
  const { camera } = useThree();
  const texture = useTexture('/textures/world-map-texture.jpg');
  const targetPosition = useRef(new THREE.Vector3(0, 0, 3));
  const currentPosition = useRef(new THREE.Vector3(0, 0, 3));
  const mapRef = useRef<THREE.Group>(null);

  // Dimensions de la carte - utiliser un ratio 2:1 pour projection équirectangulaire
  const MAP_WIDTH = 12;
  const MAP_HEIGHT = 6;

  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  useEffect(() => {
    const country = COUNTRIES[currentCountryIndex];
    const [x, y] = geoToTexture(country.position[0], country.position[1]);
    // Utiliser les coordonnées normalisées directement avec les bonnes dimensions
    const targetX = (x - 0.5) * MAP_WIDTH;
    const targetY = (0.5 - y) * MAP_HEIGHT;
    // Camera plus proche pour meilleur zoom
    targetPosition.current.set(targetX, targetY, 2.5);
  }, [currentCountryIndex]);

  useFrame(() => {
    // Animation fluide de la caméra
    currentPosition.current.lerp(targetPosition.current, 0.03);
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentPosition.current.x, currentPosition.current.y, 0);

    // Rotation très subtile de la carte pour dynamisme
    if (mapRef.current) {
      mapRef.current.rotation.z = Math.sin(Date.now() * 0.0001) * 0.01;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />

      <group ref={mapRef}>
        {/* Fond sombre très large pour couvrir tout l'écran */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* Carte du monde avec texture - ratio 2:1 équirectangulaire */}
        <mesh>
          <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
          <meshBasicMaterial map={texture} transparent opacity={0.85} />
        </mesh>

        {/* Overlay gradient pour effet de focus */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
          <meshBasicMaterial
            transparent
            opacity={0.2}
            color="#000000"
            blending={THREE.MultiplyBlending}
          />
        </mesh>

        {/* Marqueurs des pays - positionnés selon les coordonnées géographiques réelles */}
        {COUNTRIES.map((country, index) => {
          const [x, y] = geoToTexture(country.position[0], country.position[1]);
          const position: [number, number, number] = [(x - 0.5) * MAP_WIDTH, (0.5 - y) * MAP_HEIGHT, 0.02];

          return (
            <CountryMarker
              key={country.code}
              country={{...country, position}}
              isActive={index === currentCountryIndex}
              isHovered={country.code === hoveredCountryCode}
              onHover={() => onCountryHover(country.code)}
              onLeave={() => onCountryHover(null)}
              scale={index === currentCountryIndex ? 1.5 : 1}
              position={position}
            />
          );
        })}
      </group>
    </>
  );
}

// Panneau d'informations animé
function CountryInfoPanel({ country, t }: { country: typeof COUNTRIES[0]; t: (key: string) => string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={country.code}
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -50, scale: 0.95 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="relative"
      >
        <div
          className="absolute inset-0 rounded-2xl blur-xl opacity-30"
          style={{ backgroundColor: country.color }}
        />

        <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-5xl"
            >
              {country.flag}
            </motion.div>
            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white"
              >
                {country.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm"
              >
                {country.region}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: `${country.color}20` }}
          >
            <span className="text-slate-300 text-sm">{t('landing.worldMap.accountingStandard')}</span>
            <span className="font-bold text-lg" style={{ color: country.color }}>
              {country.standard}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
          >
            <span className="text-slate-300 text-sm">💱 {t('landing.worldMap.localCurrency')}</span>
            <span className="font-bold text-white">{country.currency}</span>
          </motion.div>

          <div>
            <motion.h4
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm font-semibold text-slate-400 mb-3"
            >
              ✨ {t('landing.worldMap.availableFeatures')}
            </motion.h4>
            <div className="grid grid-cols-2 gap-2">
              {country.features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: country.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 pt-4 border-t border-slate-700/50"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">{t('landing.worldMap.compliant')}</span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Composant principal
export function AnimatedWorldMap() {
  const { t } = useLocale();
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentCountryIndex((prev) => (prev + 1) % COUNTRIES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentCountry = COUNTRIES[currentCountryIndex];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-950 to-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {t('landing.worldMap.title')}{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('landing.worldMap.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            {t('landing.worldMap.description', { countries: COUNTRIES.length })}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[600px] rounded-2xl overflow-hidden"
          >
            <div
              className="absolute inset-0 rounded-2xl blur-2xl opacity-20 transition-colors duration-1000"
              style={{ backgroundColor: currentCountry.color }}
            />

            <div className="relative h-full bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
              <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
                <AnimatedMapScene
                  currentCountryIndex={currentCountryIndex}
                  hoveredCountryCode={hoveredCountryCode}
                  onCountryHover={setHoveredCountryCode}
                />
              </Canvas>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-4 py-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-full text-white text-sm hover:bg-slate-800 transition-colors"
                >
                  {isPaused ? `▶️ ${t('landing.worldMap.resume')}` : `⏸️ ${t('landing.worldMap.pause')}`}
                </button>
                <div className="text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {currentCountryIndex + 1} / {COUNTRIES.length}
                </div>
              </div>

              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {COUNTRIES.map((country, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentCountryIndex(index);
                      setIsPaused(true);
                    }}
                    aria-label={`Voir ${country.name}`}
                    title={country.name}
                    className={`h-2 rounded-full transition-all ${
                      index === currentCountryIndex ? 'w-8 opacity-100' : 'w-2 opacity-30 hover:opacity-60'
                    }`}
                    style={{
                      backgroundColor: index === currentCountryIndex ? currentCountry.color : '#94a3b8',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <CountryInfoPanel country={currentCountry} t={t} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16"
        >
          {[
            { value: COUNTRIES.length, label: t('landing.worldMap.stats.countries'), color: '#3B82F6', icon: '🌍' },
            { value: '5', label: t('landing.worldMap.stats.standards'), color: '#10B981', icon: '📊' },
            { value: '12', label: t('landing.worldMap.stats.currencies'), color: '#F59E0B', icon: '💱' },
            { value: '35+', label: t('landing.worldMap.stats.documents'), color: '#8B5CF6', icon: '📄' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: stat.color }}
              />
              <div className="relative text-center p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl hover:border-slate-700 transition-all">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold mb-2" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default AnimatedWorldMap;
