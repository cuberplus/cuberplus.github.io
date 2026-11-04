import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CSS/index.css';
import '../timer/src/style.css';
import '../timer/src/AverageDialog.css';
import '@cuberplus/navigation/style.css';
import Site from './Site';
import { registerWorker } from './pwa';

createRoot(document.getElementById('root')!).render(<Site />);
void registerWorker(import.meta.env.PROD);
