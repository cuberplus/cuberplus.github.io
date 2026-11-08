import React from "react";
import { HelpPanelProps, HelpPanelState } from "../Helpers/Types";
import { Modal } from "react-bootstrap";
import cubeastCsv from "../Assets/CubeastCsv.png";
import cubeastDownload from "../Assets/CubeastDownload.png";
import acubemyCsv from "../Assets/AcubemyCsv.png";
import analyzerSteps from "../Assets/AnalyzerSteps.png";
import { PageVisible } from '@cuberplus/navigation';
import { InfoTip } from '../../../timer/src/InfoTip';

export class HelpPanel extends React.Component<HelpPanelProps, HelpPanelState> {
    static contextType = PageVisible;
    render() {
        return (
            <Modal
                show={this.props.showHelpPanel && this.context !== false}
                container={document.querySelector<HTMLElement>('.site-page--smartcubeanalyzer') ?? document.body}
                onHide={() => { this.props.onCloseHandler() }}
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Smartcube Analyzer</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <section className="mb-4">
                        <h5>Export your solves<InfoTip>Import CSVs in Options to keep them in CuberPlus, or choose CSV files in Analyzer for a temporary analysis. Your saved solves load automatically; an empty database loads Dev Solves instead.</InfoTip></h5>

                        <div className="mb-4">
                            <h6>From Cubeast</h6>
                            <a href="https://app.cubeast.com/log/solves">Export solves as CSV</a>
                            <div className="text-center">
                                <a href="https://app.cubeast.com/log/solves">
                                    <img className="img-fluid w-75" src={cubeastCsv} alt="Cubeast export solves as CSV" />
                                </a>
                            </div>
                        </div>

                        <div className="mb-4">
                            <a href="https://app.cubeast.com/exports">Download CSV exports</a>
                            <div className="text-center">
                                <a href="https://app.cubeast.com/exports">
                                    <img className="img-fluid w-75" src={cubeastDownload} alt="Cubeast download CSV exports page" />
                                </a>
                            </div>
                        </div>

                        <div className="mb-3">
                            <h6>From Acubemy<InfoTip>Export your solves from Settings &gt; Export Data (requires a premium account).</InfoTip></h6>
                        </div>
                        <div className="text-center">
                            <img className="img-fluid w-75" src={acubemyCsv} alt="Acubemy export solves as CSV" />
                        </div>
                    </section>

                    <section className="mb-4">
                        <h5>Upload to Smartcube Analyzer<InfoTip>Choose one or more CSV files to see combined stats, then filter by source, method, session, or solve step.</InfoTip></h5>
                        <div className="text-center">
                            <img className="img-fluid w-75" src={analyzerSteps} alt="Steps to upload CSV files into Smartcube Analyzer" />
                        </div>
                    </section>

                    <section>
                        <h5>Make the most of your stats<InfoTip>Explore what causes your worst solves, which steps and cases are slowest, and what separates your good solves from your bad ones.</InfoTip></h5>
                    </section>
                </Modal.Body>
            </Modal>
        )
    }
}
