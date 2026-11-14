import { useEffect, useContext } from 'react';
import { FileInput } from './FileInput';
import { Footer, PageVisible } from '@cuberplus/navigation';
import "../CSS/Style.css";
import ReactGA from 'react-ga4';

export default function App() {
  const visible = useContext(PageVisible);
  useEffect(() => { ReactGA.initialize('G-BHXNCQ3K0D'); }, []);
  useEffect(() => { if (visible) ReactGA.send({ hitType: 'pageview', page: window.location.pathname }); }, [visible]);
  return <div className="App cuberplus-page"><FileInput /><Footer /></div>;
}
