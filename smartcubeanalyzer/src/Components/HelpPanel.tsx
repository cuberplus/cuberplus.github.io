import cubeastCsv from "../Assets/CubeastCsv.png";
import cubeastDownload from "../Assets/CubeastDownload.png";
import acubemyCsv from "../Assets/AcubemyCsv.png";
import analyzerSteps from "../Assets/AnalyzerSteps.png";
import { InfoTip } from '../../../shared/Components/InfoTip';

export function HelpPanel() {
    return <div className="mt-3">
        <h3 className="h5">Export your solves<InfoTip>Import CSVs in Options to keep them in CuberPlus, or preview CSV files here for temporary analysis. Your saved solves load automatically; an empty database loads Dev Solves instead.</InfoTip></h3>
        <h4 className="h6">From Cubeast</h4>
        <a href="https://app.cubeast.com/log/solves">Export solves as CSV<img className="img-fluid d-block mb-3" src={cubeastCsv} alt="Cubeast export solves as CSV" /></a>
        <a href="https://app.cubeast.com/exports">Download CSV exports<img className="img-fluid d-block mb-3" src={cubeastDownload} alt="Cubeast download CSV exports page" /></a>
        <h4 className="h6">From Acubemy<InfoTip>Export your solves from Settings &gt; Export Data (requires a premium account).</InfoTip></h4>
        <img className="img-fluid mb-3" src={acubemyCsv} alt="Acubemy export solves as CSV" />
        <h3 className="h5">Preview CSV files<InfoTip>Choose one or more CSV files to see combined stats, then filter by source, method, session, or solve step.</InfoTip></h3>
        <img className="img-fluid mb-3" src={analyzerSteps} alt="Steps to upload CSV files into Smartcube Analyzer" />
        <h3 className="h5">Make the most of your stats<InfoTip>Explore what causes your worst solves, which steps and cases are slowest, and what separates your good solves from your bad ones.</InfoTip></h3>
    </div>;
}
