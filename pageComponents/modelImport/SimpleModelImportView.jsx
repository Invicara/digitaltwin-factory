// version dtf-1.2

import React from 'react';
import Select from 'react-select';
import _ from 'lodash';

import { IafProj, IafFileSvc, IafDataSource, IafItemSvc } from '@dtplatform/platform-api';
import { IafScriptEngine } from '@dtplatform/iaf-script-engine';
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls';

import ImportStatusList from './components/ImportStatusList';

import './SimpleModelImportView.scss'

import {
  constructModelFileVersions,
  getCurrentFileNameFromSelect,
  getFileNameAndExtension,
  getSelectedBimpkVersions,
  isImported,
  isTipVersion,
  onVersionChecked,
  validateFile,
} from './helpers';

// navis exports are no currently supported so do not allow sgpk files to be uploaded
const VALID_FILE_EXT = ['.bimpk'/*, '.sgpk'*/];

class SimpleModelImportView extends React.Component {

  constructor(props) {
    super(props);
    this.DEFAULT_PAGE_NAME = 'Model Import';
    this.fileUpload = React.createRef();

    this.state = {
      isPageLoading: false, //is the page doign an initial loading
      isPageWorking: false, //is the page doing an operation like import
      project: null,
      handler: null,
      bimpks: [], //list of bimpk files in the project with their versions
      bimpkOptions: [], //options for the file select dropdown
      selectedBimpk: null, //selected option from the file select dropdown
      selectedBimpkVersions: [], //the versions of teh selected bimpk file
      importedModelVersions: [], // the list of all imported model NamedCompositeItems
      selectedVersionToImport: null, //the version fo the bimpk file which has been selected
      throbberMessage: '',
      bimpkOrch: null, //the bimpk orchestrator in the project
      sgpkOrch: null, //the sgpk orchestrator for navisworks models
      importIntervalId: null, //interval for polling the import orchestrator
      orchRunStatus: null, //current status fo the orchestrator
      orchStepRunStatus: [], //current status of the current step of the orchestrator
      stepStatus: [], //the current step status of import and link
      errorMessage: '', //the error message if any
      uploadProcessAvailable: true, // UPLOAD File - Make Btn Click available
      uploadPercentage: 0, // % Uploading new model
      onSuccess: false, // Upload success
    };
  }


  async componentDidMount() {
    this.setState({ isPageLoading: true });

    await this._loadAsyncData();

    //create options for dropdown menu for model
    let bimpkOptions = [];

    if (this.state.bimpks.length) {
      bimpkOptions = this.state.bimpks.map((bimpk) => ({ value: bimpk._id, label: bimpk.nameNoExt }));
    } else {
      bimpkOptions = { value: 'none', label: 'No Models in Project' };
    }

    //make sure the file which is selected by default is the currently loaded model
    //if no model or if it cant be found use first file
    let defaultSelection = bimpkOptions[0];

    let bversions = []
    if (defaultSelection !== undefined && defaultSelection?.value !== 'none') {
      //get the version of the model for display
      bversions = getSelectedBimpkVersions(this.state.bimpks, defaultSelection.value);
    }
    

    this.setState(
      {
        bimpkOptions: bimpkOptions,
        selectedBimpk: defaultSelection,
        selectedBimpkVersions: bversions,
        isPageLoading: false
      },
      this.props.onLoadComplete
    );

    console.log('state', this.state);
    console.log('props', this.props);
  }

  _loadAsyncData = async () => {
    //Loads data necessary for displaying the page
    const handler = this.props.handler;

    const project = this.props.selectedItems.selectedProject;

    this._getOrchs();

    const bimpkCriteria = {
      _namespaces: project._namespaces,
      _parents: 'root',
      _name: '.*bimpk',
    };

    const sgpkCriteria = {
      _namespaces: project._namespaces,
      _parents: 'root',
      _name: '.*sgpk',
    };
    
    //get all bimpk files in the current project
    const fetchedBimpks = await IafFileSvc.getFiles(bimpkCriteria, null, { _pageSize: 100 });
    const bimpks = fetchedBimpks._list;

    //get all sgpk files in the current project
    const fetchedSgpks = await IafFileSvc.getFiles(sgpkCriteria, null, { _pageSize: 100 });
    const sgpks = fetchedSgpks._list;

    const modelFiles = await constructModelFileVersions([...bimpks, ...sgpks]);

    const selectedBimpkVersions = getSelectedBimpkVersions(modelFiles, this.state.selectedBimpk?.value);

    let importedModels = await IafProj.getModels(project);

    let importedModelVersions = []
    let importedVersions =[]
    if (importedModels) {
      for (const imported of importedModels) {
        importedVersions = await IafItemSvc.getNamedUserItemVersions(imported._userItemId)

        importedVersions._list.forEach((iv) => {
          importedModelVersions.push(iv._userAttributes.bimpk)
        })
      }
    }

    //update the UI while we load the script after
    await this.setState({ handler, project, bimpks: modelFiles, selectedBimpkVersions, allImportedModelVersions: importedModelVersions });
  };

  _getOrchs = async () => {
    //get the import orchestrators
    let bimpkOrch = null;
    let sgpkOrch = null;

    const datasources = await IafDataSource.getOrchestrators();

    let bimpkUserType = this.props.handler.config?.bimpkUserType || 'bimpk_uploader'
    let sgpkUserType = this.props.handler.config?.sgpkUserType || 'sgpk_uploader'
    if (datasources) {
      bimpkOrch = _.find(datasources._list, { _userType: bimpkUserType });
      sgpkOrch = _.find(datasources._list, { _userType: sgpkUserType });
    }

    this.setState({ bimpkOrch, sgpkOrch });
  };

  onModelChange = (selectedOption) => {
    const { selectedBimpk, bimpks } = this.state;
    //when a new model is changed get the selected model's versions for the table
    if (selectedOption.value !== selectedBimpk.value) {
      this.uncheckAllVersions();

      let bversions = [];

      for (let i = 0; i < bimpks.length; i++) {
        if (selectedOption.value === bimpks[i]._id) {
          bversions = bimpks[i].versions;
          break;
        }
      }

      this.setState({ selectedBimpk: selectedOption, selectedBimpkVersions: bversions });
    }
  };

  uncheckAllVersions = () => {
    const { bimpks } = this.state;

    bimpks.forEach((bimpk) => {
      bimpk.versions.forEach((ver) => {
        ver.checked = false;
      });
    });

    this.setState({ bimpks: bimpks, selectedVersionToImport: null });
  };

  onImport = async () => {
    const { selectedBimpk, selectedVersionToImport, bimpkOrch, sgpkOrch, bimpks } = this.state;
    /*
             1. Get the model file extension to know what type of import to run
             2. Get the correct orchestrator to run from the state
             3. From the orchestrator get the task sequence type id
             4. call IafDataSource.runOrchestrator with the orchectrator id, sequence type id, fileid, and fileversionid and get a runid back
             5. poll IafDataSource.getOrchRunStatus(runid) and IafDataSource.getOrchRunStepStatus(runid) to find out when the orchestrator has completed
         */

    this.setState({ isPageWorking: true, orchRunStatus: null, orchStepRunStatus: [], throbberMessage: 'Importing Model' });

    //get the currently selected model file to import from state
    const modelFile = _.find(bimpks, { _id: selectedBimpk.value });
    const modelFileExtension = (modelFile.nameNoExt = modelFile._name.split('.').pop());

    let orch = null;
    let orchStepName = null;
    if (modelFileExtension === 'bimpk') {
      orch = bimpkOrch;
      orchStepName = 'bimpk_file_extractor';
    } else if (modelFileExtension === 'sgpk') {
      orch = sgpkOrch;
      orchStepName = 'generic_compressed_file_extractor';
    }

    const task = _.find(orch.orchsteps, {_sequenceno: 1 });
    const seqTypeId = task._compid;

    const req = {
      orchestratorId: orch.id,
      _actualparams: [
        {
          sequence_type_id: seqTypeId,
          params: {
            _fileId: modelFile._id,
            _fileVersionId: selectedVersionToImport.fileVersionId ? selectedVersionToImport.fileVersionId : selectedVersionToImport._id,
          },
        },
      ],
    };

    const ctx = { isFormData: false };

    this.runOrchestrator(orch, req, ctx);
  };

  runOrchestrator = async (orchestrator, req, ctx) => {
    try {
      const result = await IafDataSource.runOrchestrator(orchestrator.id, req, ctx);
      if (result) {
        if (result.hasOwnProperty('id')) {
          await this.getOrchStatus(result.id);

          //poll the orchestrator and the step statuses
          const interval = setInterval(async () => {
            const { orchRunStatus, orchStepRunStatus, project, importIntervalId } = this.state;
            const errStatus = orchStepRunStatus.filter((run_status) => run_status._status === 'ERROR');
            const queuedStatus = orchStepRunStatus.filter((run_status) => run_status._status === 'QUEUED');
            const runningStatus = orchStepRunStatus.filter((run_status) => run_status._status === 'RUNNING');

            console.log('1-->', orchStepRunStatus, orchRunStatus);
            console.log('2-->',errStatus, queuedStatus, runningStatus);
            if (orchRunStatus._status === 'ERROR') {
              const steps = [...this.state.orchStepRunStatus];

              let errMsg = steps.map(s => s._statusmsg ? s._statusmsg : '')
              errMsg = errMsg.join(', ')

              steps.unshift({ id: 'error1000', step_run_message: errMsg });
              //when import is complete kill the polling
              clearInterval(importIntervalId);

            } else if (!_.isEmpty(errStatus) || (_.isEmpty(queuedStatus) && _.isEmpty(runningStatus))) {
              if (_.isEmpty(errStatus)) {
                orchStepRunStatus.forEach((step) => (step.status = 'COMPLETED'));
                this.setState({ orchStepRunStatus });
              }

              //when import is complete kill the polling
              clearInterval(importIntervalId);

              //reset the currently selected model to the one we just imported
              //note: this is kept on the app itself - thus the setSelectedItems
              //not on the local state of the page
              //setSelectedItems will trigger the app to update the 3D view of the model
              let models = await IafProj.getModels(project);
              if (models) {
                let lastUploadedModel = _.sortBy(models, (m) => m._metadata._updatedAt);
                let selectedModel = _.last(lastUploadedModel);
                this.props.actions.setSelectedItems({ selectedModel: selectedModel });
              }
              await this._loadAsyncData();
              this.setState({ isPageWorking: false });
            }
            await this.getOrchStatus(result.id);
          }, 30000);

          this.setState({ importIntervalId: interval });
        }
      }
    } catch (error) {
      console.log(error);
      this.handleError();
      return;
    }
  };

  getOrchStatus = async (runid) => {
    //get the stasus needed to update the UI for the import
    const orchRunStatus = await IafDataSource.getOrchRunStatus(runid);

    const orchStepRunStatus = orchRunStatus[0].orchrunsteps;

    await this.setState({ orchRunStatus: orchRunStatus, orchStepRunStatus: orchStepRunStatus });
  };

  handleError = () => {
    let status = this.state.orchRunStatus;
    if (!status) status = true; //if there is not yet a status sset to true so status will display in UI

    const steps = [...this.state.orchStepRunStatus];
    steps.unshift({ id: 'error1000', step_run_message: 'AN ERROR WAS ENCOUNTERED IMPORTING THE MODEL. IMPORT ABORTED.' });

    this.setState({ isPageWorking: false, orchRunStatus: status, orchStepRunStatus: steps });
  };

  openFilePicker = () => {
    if (!this.state.uploadProcessAvailable) {
      this.setState({ errorMessage: 'A current upload process is running. Please wait.' });
      return false;
    }

    this.fileUpload.current.click();
  };

  // Getting File and Uploaded at FileUpload Element
  setNewFile = async () => {
    let project = this.props.selectedItems.selectedProject;
    let valid_process = true; // Escape/Validation variable

    let dropdownFileName = getCurrentFileNameFromSelect(this.state.selectedBimpk); // { validFile: false } | { currFileName: currFileName, currFileType: currFileType, validFile: true };
    let filesToUpload = this.fileUpload.current.files;

    if (!filesToUpload.length) {
      valid_process = false;
      return;
    }

    const file = filesToUpload[0];
    console.log('File To Upload ===>', file);

    const { fileName, fileExtension } = getFileNameAndExtension(file);

    if (valid_process) {
      const { isValid, errorMessage } = validateFile(fileName, fileExtension, dropdownFileName);

      if (!isValid) {
        valid_process = false;
        this.setState({ errorMessage: errorMessage });
      }
    }

    // If everything goes well, we upload the file
    if (valid_process) {
      this.setState({ uploadProcessAvailable: !this.state.uploadProcessAvailable, errorMessage: '' });

      const formData = new FormData();
      formData.append('newFile', file, fileName);

      const ctx = { isFormData: false, _namespaces: project._namespaces };

      const onProgress = (bytesUploaded, bytesTotal) => {
        let percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        this.setState({ uploadPercentage: percentage });
        console.log(`${bytesUploaded}kb of ${bytesTotal}kb | ${percentage}%`);
      };

      const onSuccess = (...args) => {
        this.setState({ uploadPercentage: 0 });
        this.setState({ uploadProcessAvailable: !this.state.uploadProcessAvailable });
        this._loadAsyncData();
      };

      try {
        const fileContainer = {
          name: file.name,
          fileObj: file,
        };

        await IafScriptEngine.uploadFile(fileContainer, ctx, onProgress, onSuccess);
      } catch (error) {
        console.log(error);
        this.handleError();
      }
    } else {
      console.log('do nothing');

      return;
    }
  };

  canImport = () => {

    if (!this.state.selectedBimpk) return false

    const { currFileType } = getCurrentFileNameFromSelect(this.state.selectedBimpk)

    if (currFileType === 'sgpk' && this.state.sgpkOrch)
      return true
    else if (currFileType === 'bimpk' && this.state.bimpkOrch)
      return true
    else
      return false

  };

  render() {
    const {
      isPageLoading,
      isPageWorking,
      bimpkOptions,
      bimpks,
      selectedBimpk,
      selectedBimpkVersions,
      allImportedModelVersions,
      bimpkOrch,
      sgpkOrch,
      uploadProcessAvailable,
      uploadPercentage,
      errorMessage,
      orchRunStatus,
      orchStepRunStatus,
      throbberMessage
    } = this.state;

    return (
      <div>
        {!isPageLoading && (
          <div className="tableContainer" style={{ width: '50%', margin: 'auto', paddingTop: '20px' }}>
            <CtrlFlxp validFExt={VALID_FILE_EXT} setNewFile={this.setNewFile} innerRef={this.fileUpload} />

            <div className='download-notice'>
              <div>Plugins for publishing models directly from supported CAD authoring tools can be downloaded <a href='https://apps.invicara.com/ipaplugins/' target='_blank'>here</a>.</div>
              <div>If you already have a published model bimpk file, you can upload it using the button below. A sample bimpk file is available in the <a href='https://github.com/Invicara/digitaltwin-factory/raw/refs/heads/master/sampleFiles/General%20Medical%20-%20Architecture.bimpk' target='_blank'>digitaltwin-factory GitHub repo</a>.</div>
              <GenericMatButton
                  onClick={() => this.openFilePicker()}
                  disabled={(!bimpkOrch && !sgpkOrch) || isPageLoading || isPageWorking || !uploadProcessAvailable}
                  styles={{ marginRight: '15px', width: '90px' }}
                >
                  {uploadPercentage > 0 && uploadPercentage < 100 ? `${uploadPercentage}%` : 'UPLOAD'}
                </GenericMatButton>
            </div>

            <h4>Select Model</h4>
            <Select
              name="modelSelect"
              options={bimpkOptions}
              value={selectedBimpk}
              className="basic-single"
              classNamePrefix="select"
              onChange={this.onModelChange}
              isDisabled={isPageLoading || isPageWorking || !bimpkOptions.length}
            />

            <div style={{ width: '60%', margin: 'auto' }}>
              <h4>Select Model Version</h4>

              <table className='import-version-table'>
                <thead>
                  <tr>
                    <th></th>
                    <th>Version</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBimpkVersions.map(bv => <tr key={bv._id}>
                    <td>
                      {isTipVersion(bv, bimpks, selectedBimpk) && !isImported(bv, allImportedModelVersions) && <input
                        type="checkbox"
                        checked={bv.checked}
                        onChange={() =>
                          onVersionChecked(bv, this.state.bimpks, (bimpks, checkedVer) =>
                            this.setState({ bimpks: bimpks, selectedVersionToImport: checkedVer })
                          )
                        }
                        disabled={this.state.isPageWorking}
                      />}
                      {isImported(bv, allImportedModelVersions) && <i className="fas fa-check-circle"></i>}
                      {!isTipVersion(bv, bimpks, selectedBimpk) && !isImported(bv, allImportedModelVersions) && <span>--</span>}
                    </td>
                    <td>{bv._version}</td>
                    <td>{bv.displayCreateDate}</td>
                  </tr>)}
                  <tr>
                    <td colSpan='3'>Only tip version may be imported. Imported verions will display with a check mark.</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'right', marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                <GenericMatButton
                  onClick={this.onImport}
                  disabled={!this.canImport() || isPageLoading || isPageWorking}
                  styles={{ marginRight: '15px' }}
                >
                  {this.canImport() ? 'Import' : 'Import Orch Missing'}
                </GenericMatButton>
              </div>
              {errorMessage && <p style={{ color: 'red', marginTop: '15px' }}>{errorMessage}</p>}

              {!!orchRunStatus && (
                <div>
                  <hr />
                  <div>
                    {orchRunStatus && isPageWorking && (
                      <div>
                        <MessageThrobber message={throbberMessage} />
                        <span style={{ color: 'red' }}>This is a long running operation. Please do not refresh or leave the page.</span>
                      </div>
                    )}
                    {!!orchRunStatus && !isPageWorking && <h3>Import Complete</h3>}

                    <ImportStatusList data={orchStepRunStatus} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default SimpleModelImportView;

class MessageThrobber extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dots: '.',
      interval: null,
    };
  }

  componentDidMount() {
    if (!this.state.interval) {
      let interval = setInterval(() => {
        let { dots } = this.state;

        if (dots.length === 8) dots = '.';
        else dots += ' .';

        this.setState({ dots: dots });
      }, 700);
      this.setState({ interval: interval });
    }
  }

  componentDidUpdate() {
    if (this.state.dots.length > 16) this.setState({ dots: '.' });
  }

  componentWillUnmount() {
    clearInterval(this.state.interval);
  }

  render() {
    return (
      <h3>
        {this.props.message} {this.state.dots}
      </h3>
    );
  }
}

const CtrlFlxp = ({ validFExt, setNewFile, innerRef }) => (
  <input
    ref={innerRef}
    type="file"
    name="nwFLVers"
    accept={validFExt.join(',')}
    style={{ display: 'none' }}
    onChange={setNewFile}
    // to fire the onChange event in case user selects same invalid file again
    onClick={(event) => {
      event.target.value = null;
    }}
  />
);
