import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
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
		react(),
		// Compression Gzip
		compression({
			algorithm: 'gzip',
			ext: '.gz',
			threshold: 1024,
			compressionOptions: {
				level: 9,
			},
			filter: /\.(js|mjs|json|css|html|svg)$/i,
		}),
		// Compression Brotli (meilleure compression)
		compression({
			algorithm: 'brotliCompress',
			ext: '.br',
			threshold: 1024,
			compressionOptions: {
				level: 11, // Maximum compression
			},
			filter: /\.(js|mjs|json|css|html|svg)$/i,
		}),
	],
	css: {
		postcss: './postcss.config.js'
	},
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	
	optimizeDeps: {
		include: ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
	},
	
	build: {
		target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
		sourcemap: mode !== 'production',
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom'],
					'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
					'supabase-vendor': ['@supabase/supabase-js'],
					'chart-vendor': ['recharts'],
					'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
					'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge']
				}
			}
		},
		chunkSizeWarningLimit: 1000,
		commonjsOptions: {
			include: [/node_modules/]
		}
	},
	
	define: {
		'process.env.NODE_ENV': JSON.stringify(mode),
	}
}));