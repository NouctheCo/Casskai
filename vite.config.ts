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
			'react/jsx-runtime',
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
		esbuildOptions: {
			// Ensure React is properly resolved
			mainFields: ['module', 'main'],
			resolveExtensions: ['.mjs', '.js', '.ts', '.tsx', '.json'],
		},
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
				// ENABLE manual chunking for better bundle splitting
				manualChunks: (id) => {
					// React and core libraries
					if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
						return 'react-vendor';
					}
					
					// UI libraries
					if (id.includes('node_modules/@radix-ui') || 
						id.includes('node_modules/lucide-react') ||
						id.includes('node_modules/framer-motion')) {
						return 'ui-vendor';
					}
					
					// Charts and data visualization
					if (id.includes('node_modules/recharts') || 
						id.includes('node_modules/d3')) {
						return 'charts-vendor';
					}
					
					// Supabase
					if (id.includes('node_modules/@supabase')) {
						return 'supabase-vendor';
					}
					
					// PDF and Excel generation (heavy libraries)
					if (id.includes('node_modules/jspdf') ||
						id.includes('node_modules/xlsx') ||
						id.includes('node_modules/html2canvas')) {
						return 'reports-vendor';
					}
					
					// Large application chunks
					if (id.includes('src/pages/AccountingPage') || 
						id.includes('src/components/accounting')) {
						return 'accounting-chunk';
					}
					
					if (id.includes('src/pages/BanksPage') || 
						id.includes('src/components/banking')) {
						return 'banking-chunk';
					}
					
					// Large application chunks - separate pages into individual chunks
					if (id.includes('src/pages/AccountingPage')) {
						return 'accounting-page-chunk';
					}
					
					if (id.includes('src/pages/BanksPage')) {
						return 'banks-page-chunk';
					}
					
					if (id.includes('src/pages/InventoryPage')) {
						return 'inventory-page-chunk';
					}
					
					if (id.includes('src/pages/InvoicingPage')) {
						return 'invoicing-page-chunk';
					}
					
					if (id.includes('src/pages/SalesCrmPage')) {
						return 'sales-crm-page-chunk';
					}
					
					if (id.includes('src/pages/SettingsPage')) {
						return 'settings-page-chunk';
					}
					if (id.includes('node_modules/@tensorflow') || 
						id.includes('node_modules/openai') ||
						id.includes('node_modules/ml-matrix') ||
						id.includes('node_modules/simple-statistics')) {
						return 'ai-ml-vendor';
					}
					
					// Calendar and scheduling
					if (id.includes('node_modules/react-big-calendar') ||
						id.includes('node_modules/react-day-picker')) {
						return 'calendar-vendor';
					}
					
					// Grid and layout libraries
					if (id.includes('node_modules/react-grid-layout') ||
						id.includes('node_modules/react-resizable')) {
						return 'layout-vendor';
					}
					
					// Form and validation libraries
					if (id.includes('node_modules/react-hook-form') ||
						id.includes('node_modules/@hookform')) {
						return 'forms-vendor';
					}
					
					// Internationalization
					if (id.includes('node_modules/i18next') ||
						id.includes('node_modules/react-i18next')) {
						return 'i18n-vendor';
					}
					
					// Utility libraries
					if (id.includes('node_modules/date-fns') ||
						id.includes('node_modules/clsx') ||
						id.includes('node_modules/class-variance-authority') ||
						id.includes('node_modules/tailwind-merge')) {
						return 'utils-vendor';
					}
					
					// Payment processing
					if (id.includes('node_modules/@stripe') ||
						id.includes('node_modules/stripe')) {
						return 'payment-vendor';
					}
					
					// Email and notifications
					if (id.includes('node_modules/@sendgrid') ||
						id.includes('node_modules/sonner') ||
						id.includes('node_modules/react-toastify')) {
						return 'notifications-vendor';
					}
					
					// Error monitoring
					if (id.includes('node_modules/@sentry')) {
						return 'monitoring-vendor';
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