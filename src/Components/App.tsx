import React from 'react';
import '../CSS/App.css';
import analyzerScreenshot from '../Assets/SmartcubeAnalyzer.png';
import scramblerScreenshot from '../Assets/Scrambler.png';

const tools = [
  {
    id: 'analyzer',
    name: 'Smartcube Analyzer',
    category: 'Understand your solves',
    href: '/smartcubeanalyzer/',
    image: analyzerScreenshot,
    alt: 'Smartcube Analyzer showing demo charts for solve times, recognition, and execution.',
    description: 'Turn your Cubeast or Acubemy exports into clear charts. Find patterns in your recognition, execution, and progress over time.',
    features: ['Solve-by-solve insights', 'Recognition & execution'],
    action: 'Open analyzer',
  },
  {
    id: 'scrambler',
    name: 'Scrambler',
    category: 'Make practice intentional',
    href: '/scrambler/',
    image: scramblerScreenshot,
    alt: 'Scrambler showing a generated worksheet with cube diagrams and optimal solutions.',
    description: 'Build a practice sheet around your next goal. Explore optimal Cross, X-Cross, XX-Cross, and 2x2 block solutions, then print and practice.',
    features: ['Optimal solutions', 'Print-ready worksheets'],
    action: 'Open scrambler',
  },
];

function App() {
  return (
    <div className="homepage">
      <a className="skip-link" href="#tools">Skip to tools</a>
      <header className="site-header page-width">
        <h1 className="site-title"><a className="wordmark" href="/" aria-label="CuberPlus home">CuberPlus</a></h1>
      </header>
      <main className="page-width">
        <section className="tools" id="tools" aria-label="Cubing tools" tabIndex={-1}>
          {tools.map(tool => <article key={tool.id}>
            <a className="tool-card" href={`https://cuberplus.com${tool.href}`} aria-labelledby={`${tool.id}-title`} aria-describedby={`${tool.id}-description`}>
              <div className="tool-preview">
                <div className="preview-bar" aria-hidden="true">
                  <span className="window-dots"><i /><i /><i /></span>
                  <span>cuberplus.com{tool.href}</span>
                </div>
                <img src={tool.image} alt={tool.alt} width={1440} height={900} decoding="async" />
              </div>
              <div className="tool-copy">
                <p className="tool-category">{tool.category}</p>
                <h2 id={`${tool.id}-title`}>{tool.name}</h2>
                <p className="tool-description" id={`${tool.id}-description`}>{tool.description}</p>
                <ul className="tool-features" aria-label={`${tool.name} features`}>
                  {tool.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
                <span className="open-tool">{tool.action}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </div>
            </a>
          </article>)}
          <article className="coming-soon-card" aria-labelledby="coming-soon-title">
            <span className="coming-soon-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div>
              <h2 id="coming-soon-title">More coming soon</h2>
              <p>More cubing tools are on the way.</p>
            </div>
          </article>
        </section>
      </main>
      <footer className="site-footer page-width">
        <span>CuberPlus</span>
        <p>More insight. More intentional practice.</p>
      </footer>
    </div>
  );
}

export default App;
