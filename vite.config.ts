import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	loggerError(msg, options);
}

export default defineConfig(({ mode }) => ({
	customLogger: logger,
	plugins: [
		react({
			// Optimize React runtime
			jsxRuntime: 'automatic',
			babel: {
				plugins: mode === 'production' ? ['babel-plugin-react-remove-properties'] : [],
			},
		}),
		// Bundle compression for production
		mode === 'production' && compression({
			algorithm: 'gzip',
			exclude: [/\.(br)$/, /\.(gz)$/],
		}),
		mode === 'production' && compression({
			algorithm: 'brotliCompress',
			exclude: [/\.(br)$/, /\.(gz)$/],
		}),
		// Bundle analysis tool (optional)
		mode === 'production' && process.env.ANALYZE && visualizer({
			filename: 'dist/stats.html',
			open: true,
			gzipSize: true,
			brotliSize: true,
		}),
	].filter(Boolean),
	
	css: {
		postcss: './postcss.config.js',
		devSourcemap: true,
	},
	
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	
	// Enhanced dependency optimization
	optimizeDeps: {
		include: [
			'react',
			'react-dom',
			'react-router-dom',
			'@supabase/supabase-js',
			'i18next',
			'react-i18next', 
			'i18next-browser-languagedetector',
			'date-fns',
			'lucide-react',
			'sonner',
			'framer-motion',
			'recharts',
			'clsx',
			'tailwind-merge',
			'class-variance-authority',
		],
		exclude: ['@tensorflow/tfjs'], // Heavy libs that should be loaded on-demand
		force: true, // Force pre-bundling to avoid runtime issues
	},
	
	build: {
		target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
		sourcemap: mode !== 'production',
		// Enhanced build options
		cssCodeSplit: true,
		minify: true, // Re-enable minification for production builds
		terserOptions: mode === 'production' ? {
			compress: {
				drop_console: true, // Drop console logs in production
				drop_debugger: true,
				pure_funcs: ['console.info'],
			},
			mangle: {
				keep_fnames: false, // Mangle function names for size reduction
			}
		} : {},
		rollupOptions: {
			// Enhanced output configuration
			output: {
				// Conservative chunking strategy to avoid loading issues
				manualChunks: (id: string) => {
					// Keep critical libraries together in vendor
					if (id.includes('node_modules/react') || 
						id.includes('node_modules/react-dom') ||
						id.includes('recharts') || 
						id.includes('d3-') || 
						id.includes('chart.js') ||
						id.includes('framer-motion')) {
						return 'vendor';
					}
					
					// Large libraries that can be separate
					if (id.includes('node_modules/@supabase/') || id.includes('node_modules/supabase')) {
						return 'auth-db';
					}
					
					if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react')) {
						return 'ui-framework';
					}
					
					if (id.includes('jspdf') || id.includes('xlsx') || id.includes('exceljs')) {
						return 'documents';
					}
					
					// Everything else in vendor for safety
					if (id.includes('node_modules/')) {
						return 'vendor';
					}
				},
				
				// Optimize chunk naming for caching
				chunkFileNames: (chunkInfo) => {
					const facadeModuleId = chunkInfo.facadeModuleId ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId)) : 'chunk';
					return `assets/[name]-[hash].js`;
				},
				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split('.');
					let extType = info[info.length - 1];
					
					// Group assets by type
					if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
						extType = 'images';
					} else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
						extType = 'fonts';
					} else if (/\.(css)$/i.test(assetInfo.name)) {
						extType = 'css';
					}
					
					return `assets/${extType}/[name]-[hash][extname]`;
				},
			},
			
			// External dependencies that should be loaded via CDN in production
			external: mode === 'production' ? [] : [],
		},
		
		// Build size warnings
		chunkSizeWarningLimit: 1000,
		reportCompressedSize: mode === 'production',
		
		commonjsOptions: {
			include: [/node_modules/],
			transformMixedEsModules: true,
		},
	},
	
	// Enhanced preview configuration
	preview: {
		port: 3000,
		cors: true,
	},
	
	// Performance-oriented esbuild configuration
	esbuild: {
		// Remove console.log in production
		drop: mode === 'production' ? ['console', 'debugger'] : [],
		legalComments: 'none',
	},
}));