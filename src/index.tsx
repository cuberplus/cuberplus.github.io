import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CSS/index.css';
import '../timer/src/CSS/style.css';
import '../timer/src/CSS/AverageDialog.css';
import '@cuberplus/navigation/style.css';
import Site from './Site';
import { registerWorker } from './pwa/pwa';

createRoot(document.getElementById('root')!).render(<Site />);
void registerWorker(import.meta.env.PROD);
