import cubeastCsv from "../Assets/CubeastCsv.png";
import cubeastDownload from "../Assets/CubeastDownload.png";
import acubemyCsv from "../Assets/AcubemyCsv.png";
import analyzerSteps from "../Assets/AnalyzerSteps.png";
import { InfoTip } from '../../../shared/Components/InfoTip';
import { TOOLTIPS } from '../../../shared/tooltips';

export function HelpPanel() {
    return <div className="mt-3">
        <h3 className="h5">Export your solves<InfoTip>{TOOLTIPS.helpPanel.overview}</InfoTip></h3>
        <h4 className="h6">From Cubeast</h4>
        <img className="img-fluid d-block mb-3" src={cubeastCsv} alt="Cubeast export solves as CSV" />
        <img className="img-fluid d-block mb-3" src={cubeastDownload} alt="Cubeast download CSV exports page" />
        <h4 className="h6">From Acubemy<InfoTip>{TOOLTIPS.helpPanel.cubeastExport}</InfoTip></h4>
        <img className="img-fluid mb-3" src={acubemyCsv} alt="Acubemy export solves as CSV" />
        <h3 className="h5">Preview CSV files<InfoTip>{TOOLTIPS.helpPanel.combinedFiles}</InfoTip></h3>
        <img className="img-fluid mb-3" src={analyzerSteps} alt="Steps to upload CSV files into Smartcube Analyzer" />
        <h3 className="h5">Make the most of your stats<InfoTip>{TOOLTIPS.helpPanel.charts}</InfoTip></h3>
    </div>;
}
