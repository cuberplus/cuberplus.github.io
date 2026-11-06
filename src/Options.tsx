import { useContext } from 'react';
import Navigation, { Footer, SettingsContext } from '@cuberplus/navigation';
import { themeColors, type Theme } from '../shared/navigation/settings';
import { InstallControl } from './pwa';
import { CloudOptions } from './cloud/CloudOptions';

export default function Options() {
  const { theme, setTheme, precision, setPrecision, error } = useContext(SettingsContext);
  return <div className="cuberplus-page">
    <header className="cuberplus-header"><Navigation current="options" /></header>
    <main className="container py-4"><section className="card p-4">
      <h2>Options</h2>
      <label className="d-block mb-4">Theme<select className="form-select mt-2" value={theme} onChange={event => setTheme(event.target.value as Theme)}>
        {Object.keys(themeColors).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
      </select></label>
      <label className="d-block mb-4">Time precision<select aria-label="Time precision" className="form-select mt-2" value={precision} onChange={event => setPrecision(event.target.value === '3' ? 3 : 2)}>
        <option value="2">Hundredths (0.00)</option><option value="3">Thousandths (0.000)</option>
      </select></label>
      <InstallControl />
      <CloudOptions />
      {error && <p role="alert">{error}</p>}
    </section></main>
    <Footer />
  </div>;
}
