import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.js',fullyParallel:false,workers:1,timeout:120000,
  use:{baseURL:'http://127.0.0.1:4174/habitos/',headless:true,actionTimeout:15000,viewport:{width:390,height:844},trace:'retain-on-failure'},
  webServer:{command:'VITE_USE_FIREBASE_EMULATORS=true npm run build -- --outDir dist-test && npm run preview -- --outDir dist-test --host 127.0.0.1 --port 4174',url:'http://127.0.0.1:4174/habitos/',reuseExistingServer:false,timeout:120000},
});
