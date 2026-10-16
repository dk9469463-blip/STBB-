import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyAppPreferences, getAppPreferences } from './utils/appPreferences';

// Apply saved display preferences before the first React render to avoid a theme flash.
applyAppPreferences(getAppPreferences());

createRoot(document.getElementById('root')!).render(<App />);
