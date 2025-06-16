import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import App from './App.tsx';
import './index.css';

import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono';

createRoot(document.getElementById("root")!).render(<App />);
