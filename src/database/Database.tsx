import { useEffect, useState } from 'react';
import Navigation, { Footer } from '@cuberplus/navigation';
import { loadCube } from '../../timer/src/puzzle';
import { algorithms, categories, illustrateCases, type IllustratedCase } from './algorithms';
import CaseImage, { CategoryImage } from './CaseImage';
import { favoriteId, useAlgorithmPreferences } from './favorites';
import { formatAlgorithm } from './formatAlgorithm';
import './database.css';

export default function Database() {
  const [cases, setCases] = useState<IllustratedCase[]>([]);
  const { favorites, setFavorites, error } = useAlgorithmPreferences();
  const [imageError, setImageError] = useState(false);
  const entries = cases.length ? cases : algorithms.map(entry => ({ ...entry, facelets: '', visibleStickers: [] }));
  useEffect(() => {
    let active = true;
    loadCube().then(cube => { if (active) setCases(illustrateCases(cube)); })
      .catch(() => { if (active) setImageError(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!cases.length) return;
    function revealCase() {
      const target = document.getElementById(location.hash.slice(1)), group = target?.closest('details');
      if (!target || !group) return;
      group.open = true;
      target.scrollIntoView({ block: 'start' });
      target.classList.remove('database-case--linked');
      void target.offsetWidth;
      target.classList.add('database-case--linked');
    }
    revealCase();
    window.addEventListener('hashchange', revealCase);
    return () => window.removeEventListener('hashchange', revealCase);
  }, [cases]);
  function toggleFavorite(id: string) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFavorites(next);
  }
  return <div className="cuberplus-page database-page">
    <header className="cuberplus-header"><Navigation current="database" /></header>
    <main className="container py-4 database-main">
      <h2>Algorithm database</h2>
      {error && <p role="alert">{error}</p>}
      {imageError && <p role="alert">Case images could not load. Reload the page to try again.</p>}
      {!cases.length && !imageError && <p role="status">Loading case images...</p>}
      {categories.map(category => <details className="card database-group" key={category}>
        <summary>
          <CategoryImage category={category} example={category === 'PLL' ? cases.find(entry => entry.category === 'PLL' && entry.id === 'T') : undefined} />
          <span>{category === 'AF2L' ? 'Advanced F2L' : category}</span><span className="database-count">{algorithms.filter(entry => entry.category === category).length} cases</span>
        </summary>
        <div className="database-group-content">
          {entries.filter(entry => entry.category === category).map(entry => {
            const key = `${category}-${entry.id}`;
            return <article className="database-case" id={key} key={key} aria-label={`${category} ${entry.id}`}>
              {entry.facelets ? <CaseImage {...entry} /> : <div className="database-case-image" />}
              <div className="database-algorithms">
                <h3>{category} {entry.id}</h3>
                {entry.options.map((algorithm, index) => {
                  const id = favoriteId(entry, algorithm), favorite = favorites.has(id);
                  return <div className="database-algorithm" key={algorithm}>
                    <button className="database-star" type="button" aria-pressed={favorite}
                      aria-label={`${favorite ? 'Unfavorite' : 'Favorite'} ${category} ${entry.id} algorithm ${index + 1}`}
                      onClick={() => toggleFavorite(id)} title={favorite ? 'Remove favorite' : 'Mark as favorite'}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" /></svg>
                    </button>
                    <p>{formatAlgorithm(algorithm)}</p>
                  </div>;
                })}
              </div>
            </article>;
          })}
        </div>
      </details>)}
    </main>
    <Footer />
  </div>;
}
