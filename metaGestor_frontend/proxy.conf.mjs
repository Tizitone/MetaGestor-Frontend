/**
 * Proxy de desarrollo hacia el backend real en Railway.
 *
 * Se usa un archivo `.mjs` (y no JSON) porque el backend rechaza cualquier
 * peticion que lleve `Origin: http://localhost:4200`. El hook `configure`
 * elimina esa cabecera antes de reenviar, de modo que Spring la trata como una
 * llamada entre servidores y no aplica CORS. El navegador solo ve peticiones
 * al mismo origen (`localhost:4200`).
 */
const URL_BACKEND = 'https://proyecto-final-progra3-production.up.railway.app';

export default {
  '/api': {
    target: URL_BACKEND,
    changeOrigin: true,
    secure: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
    },
  },
};
