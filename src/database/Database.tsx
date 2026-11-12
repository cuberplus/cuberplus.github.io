import { useEffect, useState } from 'react';
import Navigation, { Footer } from '@cuberplus/navigation';
import { algorithms, categories, type Category } from './algorithms';
import caseImages from './caseImages.json';
import { CATALOG_CHANGED, getAlgorithms, readCustomAlgorithms, saveCustomAlgorithms } from './customAlgorithms';
import CaseImage, { CategoryImage, usePreloadCaseImages } from './CaseImage';
import { caseGroup, compareCases } from './caseGroups';
import { favoriteId, useAlgorithmPreferences } from './favorites';
import { formatAlgorithm } from './formatAlgorithm';
import { AlgorithmNotification, DiscoverAlgorithms, type AlgorithmNotice } from './DiscoverAlgorithms';
import './database.css';

const categoryName = (category: Category) => category === 'AF2L' ? 'Advanced F2L' : category === 'OF2L' ? 'Other F2L' : category;
export default function Database({ caseKey }: { caseKey?: string } = {}) {
  usePreloadCaseImages();
  const [catalog, setCatalog] = useState(getAlgorithms);
  const { favorites, unlearn, setFavorites, setUnlearn, error } = useAlgorithmPreferences();
  const [open, setOpen] = useState<Set<string>>(() => new Set([(caseKey ?? location.hash.slice(1)).split('-')[0]]));
  const [expandedCases, setExpandedCases] = useState<Set<string>>(() => new Set());
  const [openProperties, setOpenProperties] = useState<Set<string>>(() => {
    const key = caseKey ?? location.hash.slice(1), entry = catalog.find(entry => `${entry.category}-${entry.id}` === key);
    return new Set(entry ? [`${entry.category}:${caseGroup(entry)}`] : []);
  });
  const [linked, setLinked] = useState(() => location.hash.slice(1));
  const [adding, setAdding] = useState(false), [category, setCategory] = useState<Category>('F2L');
  const [notice, setNotice] = useState<AlgorithmNotice | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'F2L' | 'OLL' | 'PLL' | ''>('');
  const [caseId, setCaseId] = useState('1'), [algorithm, setAlgorithm] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const customAlgorithms = readCustomAlgorithms();
  const entries = catalog.map(entry => ({ ...entry, ...caseImages[`${entry.category}-${entry.id}` as keyof typeof caseImages] }));
  const tokens = search.toLowerCase().replace(/-/g, ' ').trim().split(/\s+/).filter(Boolean);
  const favoritesOnly = tokens.some(token => /^favorites?$/.test(token)), finding = !!search.trim();
  const query = tokens.filter(token => !/^favorites?$/.test(token));
  const pllCase = query.join(' ').match(/^(?:pll\s+([a-z]+)|([a-z]+)\s+perm(?:utation)?)$/)?.slice(1).find(Boolean);
  const matches = entries.filter(entry => caseKey ? `${entry.category}-${entry.id}` === caseKey :
    (!selectedCategory || (selectedCategory === 'F2L' ? entry.category.endsWith('F2L') : entry.category === selectedCategory)) &&
    (!pllCase || entry.category === 'PLL' && entry.id.toLowerCase().startsWith(pllCase)) &&
    (!favoritesOnly || entry.options.some(algorithm => favorites.has(favoriteId(entry, algorithm)))) &&
    query.every(token => `${categoryName(entry.category)} ${entry.category} ${entry.id} ${entry.category === 'PLL' ? 'perm permutation' : ''} ${caseGroup(entry)} ${entry.options.join(' ')}`.toLowerCase().includes(token)));
  useEffect(() => {
    const refresh = () => setCatalog(getAlgorithms());
    window.addEventListener(CATALOG_CHANGED, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CATALOG_CHANGED, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  useEffect(() => {
    if (caseKey) return;
    function revealCase() {
      const key = location.hash.slice(1);
      if (!catalog.some(entry => `${entry.category}-${entry.id}` === key)) return;
      setLinked(key); setOpen(previous => new Set([...previous, key.split('-')[0]]));
      setSearch(''); setSelectedCategory('');
      const entry = catalog.find(entry => `${entry.category}-${entry.id}` === key)!;
      setOpenProperties(previous => new Set([...previous, `${entry.category}:${caseGroup(entry)}`]));
    }
    revealCase();
    window.addEventListener('hashchange', revealCase);
    return () => window.removeEventListener('hashchange', revealCase);
  }, [catalog, caseKey]);
  useEffect(() => { if (!caseKey && linked) document.getElementById(linked)?.scrollIntoView({ block: 'start' }); }, [linked, open, caseKey]);
  function toggleFavorite(id: string) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFavorites(next);
  }
  function deleteAlgorithm(key: string, algorithm: string) {
    try {
      const custom = readCustomAlgorithms(), id = `${key}:${algorithm}`;
      custom[key] = (custom[key] ?? []).filter(saved => saved !== algorithm);
      if (!custom[key].length) delete custom[key];
      saveCustomAlgorithms(custom);
      if (favorites.has(id)) setFavorites(new Set([...favorites].filter(saved => saved !== id)));
      if (unlearn.has(id)) setUnlearn(new Set([...unlearn].filter(saved => saved !== id)));
      setMessage('Algorithm deleted.');
    } catch { setMessage('Algorithm could not be deleted.'); }
  }
  async function addAlgorithm() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const [{ loadCube }, { validateUserAlgorithm }] = await Promise.all([
        import('../../timer/src/Core/puzzle'), import('../../timer/src/Analysis/favoriteAlgorithms'),
      ]);
      const entry = catalog.find(entry => entry.category === category && entry.id === caseId)!;
      const canonical = validateUserAlgorithm(entry, algorithm, await loadCube());
      if (entry.options.includes(canonical)) { setMessage('This algorithm is already in the database.'); return; }
      const custom = readCustomAlgorithms(), key = `${category}-${caseId}`;
      custom[key] = [...(custom[key] ?? []), canonical];
      saveCustomAlgorithms(custom); setAlgorithm(''); setMessage('Algorithm added.');
      setOpen(previous => new Set([...previous, category])); setLinked(key);
      setOpenProperties(previous => new Set([...previous, `${category}:${caseGroup(entry)}`]));
      setExpandedCases(previous => new Set([...previous, key]));
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Algorithm could not be saved.'); }
    finally { setBusy(false); }
  }
  return <div className="cuberplus-page database-page">
    {!caseKey && <header className="cuberplus-header"><Navigation current="database" /></header>}
    <main className="container py-4 database-main">
      {!caseKey && <><div className="database-heading"><h1 className="route-heading mb-0">Algorithm database</h1>
        <span className="text-secondary small">{favorites.size} favorites</span>
      </div>
      <section className="database-finder" aria-label="Find algorithms">
        <label htmlFor="algorithm-search">Search cases or algorithms<input id="algorithm-search" className="form-control" type="search" autoCorrect="off" autoCapitalize="off" spellCheck={false} placeholder="e.g. PLL-T, favorite, R U R'" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className="d-flex align-items-center gap-3">
          <nav className="d-flex flex-shrink-0 gap-2" aria-label="Algorithm categories">{(['F2L', 'OLL', 'PLL'] as const).map(value => <button key={value} className={`btn btn-sm ${selectedCategory === value ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={selectedCategory === value} onClick={() => { setSelectedCategory(selectedCategory === value ? '' : value); setOpen(new Set(categories.filter(category => value === 'F2L' ? category.endsWith('F2L') : category === value))); }}>{value}</button>)}</nav>
          <p aria-live="polite" className="small text-secondary mb-0">{matches.length} matching cases{!matches.length ? '. Try another search or clear the filters.' : ''}</p>
        </div>
        {(finding || selectedCategory) && <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setSelectedCategory(''); }}>Clear filters</button>}
      </section>
      <details className="database-tools">
        <summary>Algorithm tools</summary>
        <div className="database-tool-groups">
        <section><h3 className="h6">Your algorithms</h3>
          <button type="button" className="btn btn-primary btn-sm" aria-expanded={adding} onClick={() => setAdding(value => !value)}>Add your own algorithm</button>
        </section>
        <section><h3 className="h6">From your solves</h3>
          <div className="d-flex flex-wrap gap-2"><DiscoverAlgorithms notify={setNotice} /><DiscoverAlgorithms learn notify={setNotice} /></div>
        </section>
        <section><h3 className="h6">Reset favorites</h3>
        <button type="button" className="btn btn-outline-danger btn-sm" disabled={!favorites.size} onClick={() => {
          if (window.confirm('Un-favorite all algorithms? Your algorithms and Unlearn selections will be kept.')) setFavorites(new Set());
        }}>Un-Favorite All</button>
        </section></div>
      </details></>}
      {adding && <form className="card p-3 mb-3" onSubmit={event => { event.preventDefault(); void addAlgorithm(); }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="h5 mb-0">Add your own algorithm</h3>
          <button type="button" className="btn-close" aria-label="Close add algorithm" onClick={() => { setAdding(false); setMessage(''); }} />
        </div>
        <label>Algorithm group<select className="form-select" value={category} onChange={event => {
          const next = event.target.value as Category; setCategory(next); setCaseId(catalog.find(entry => entry.category === next)!.id);
        }}>{categories.map(category => <option key={category} value={category}>{categoryName(category)}</option>)}</select></label>
        <label className="mt-2">Case<select className="form-select" value={caseId} onChange={event => setCaseId(event.target.value)}>
          {catalog.filter(entry => entry.category === category).map(entry => <option key={entry.id}>{entry.id}</option>)}
        </select></label>
        <label className="mt-2">Algorithm<input className="form-control" required maxLength={1000} value={algorithm} onChange={event => setAlgorithm(event.target.value)} /></label>
        <button className="btn btn-primary mt-3" disabled={busy}>{busy ? 'Adding...' : 'Add algorithm'}</button>
      </form>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {categories.filter(category => matches.some(entry => entry.category === category)).map(category => <details className="card database-group" key={category} open={finding || open.has(category)}
        onToggle={event => {
          if (finding) return;
          const expanded = event.currentTarget.open;
          setOpen(previous => {
            if (previous.has(category) === expanded) return previous;
            const next = new Set(previous); if (expanded) next.add(category); else next.delete(category); return next;
          });
        }}>
        <summary>
          <CategoryImage category={category} />
          <span>{categoryName(category)}</span><span className="database-count">{matches.filter(entry => entry.category === category).length} cases</span>
        </summary>
        <div className="database-group-content">
          {(finding || open.has(category)) && [...new Set(matches.filter(entry => entry.category === category).sort(compareCases).map(caseGroup))].map(property => {
            const propertyKey = `${category}:${property}`;
            const cases = matches.filter(entry => entry.category === category && caseGroup(entry) === property).sort(compareCases);
            return <details key={property} className="database-property" open={!!caseKey || finding || openProperties.has(propertyKey)} onToggle={event => {
              if (finding) return;
              const expanded = event.currentTarget.open;
              setOpenProperties(previous => {
                if (previous.has(propertyKey) === expanded) return previous;
                const next = new Set(previous); if (expanded) next.add(propertyKey); else next.delete(propertyKey); return next;
              });
            }}>
              <summary>{property || 'Other cases'}<span className="database-count">{cases.length} cases</span></summary>
              {(caseKey || finding || openProperties.has(propertyKey)) && cases.map(entry => {
            const key = `${category}-${entry.id}`;
            const builtInOptions = algorithms.find(base => base.category === category && base.id === entry.id)!.options;
            const options = entry.options.map((algorithm, index) => ({ algorithm, index }))
              .filter(({ algorithm }) => !favoritesOnly || favorites.has(favoriteId(entry, algorithm)))
              .sort((a, b) => Number(favorites.has(favoriteId(entry, b.algorithm))) - Number(favorites.has(favoriteId(entry, a.algorithm))));
            return <article className={`database-case${linked === key ? ' database-case--linked' : ''}`} id={key} key={key} aria-label={`${category} ${entry.id}`}>
              {entry.facelets ? <CaseImage {...entry} /> : <div className="database-case-image" />}
              <div className="database-algorithms">
                <h3>{categoryName(category)} {entry.id}</h3>
                {options.slice(0, expandedCases.has(key) ? undefined : 3).map(({ algorithm, index }) => {
                  const id = favoriteId(entry, algorithm), favorite = favorites.has(id);
                  const custom = customAlgorithms[key]?.includes(algorithm) && !builtInOptions.includes(algorithm);
                  return <div className={`database-algorithm${custom ? ' database-algorithm--custom' : ''}`} key={algorithm}>
                    <button className="database-star" type="button" aria-pressed={favorite}
                      aria-label={`${favorite ? 'Unfavorite' : 'Favorite'} ${category} ${entry.id} algorithm ${index + 1}`}
                      onClick={() => toggleFavorite(id)} title={favorite ? 'Remove favorite' : 'Mark as favorite'}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" /></svg>
                    </button>
                    {custom && <button className="database-delete" type="button"
                      aria-label={`Delete ${category} ${entry.id} algorithm ${index + 1}`} title="Delete your algorithm"
                      onClick={() => deleteAlgorithm(key, algorithm)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></svg>
                    </button>}
                    <button className="database-unlearn" type="button" aria-pressed={unlearn.has(id)}
                      aria-label={`${unlearn.has(id) ? 'Keep' : 'Unlearn'} ${category} ${entry.id} algorithm ${index + 1}`}
                      title={unlearn.has(id) ? 'Stop marking this algorithm as a mistake' : 'Unlearn alg: mark its use as a mistake'}
                      onClick={() => { const next = new Set(unlearn); if (next.has(id)) next.delete(id); else next.add(id); setUnlearn(next); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m6 18 12-12" /></svg>
                    </button>
                    <p>{formatAlgorithm(algorithm)}</p>
                  </div>;
                })}
                {options.length > 3 && <button type="button" className="btn btn-outline-secondary btn-sm mt-2"
                  aria-expanded={expandedCases.has(key)}
                  aria-label={`${expandedCases.has(key) ? 'Show fewer' : 'Show all'} ${category} ${entry.id} algorithms`}
                  onClick={() => setExpandedCases(previous => {
                    const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next;
                  })}>
                  {expandedCases.has(key) ? 'Show fewer' : `Show all ${options.length} algorithms`}
                </button>}
              </div>
            </article>;
              })}
            </details>;
          })}
        </div>
      </details>)}
      <AlgorithmNotification notice={notice} close={() => setNotice(null)} />
    </main>
    {!caseKey && <Footer />}
  </div>;
}
