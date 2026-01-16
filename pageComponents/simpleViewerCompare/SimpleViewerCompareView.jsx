// version dtf-1.0

import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";

import { IafViewerDBM } from "@dtplatform/iaf-viewer";
import { IafItemSvc, IafProj } from "@dtplatform/platform-api";
import { StackableDrawer } from '@invicara/ipa-core/modules/IpaControls';

import CompareView from "./CompareView";
import { Panel, PanelGroup } from "react-resizable-panels";

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import "./SimpleViewerCompareView.scss";

const SimpleViewerCompareView = (props) => {
    return <SimpleViewerComparePage {...props} />
};

const SimpleViewerComparePage = () => {
    const [viewerMode, setViewerMode] = useState('overlay');

    const [availableModelComposites, setAvailableModelComposites] = useState([]);

    useEffect(() => {
        const getModels = async () => {
            const project = await IafProj.getCurrent();
            const models = await IafProj.getModels(project);
            setAvailableModelComposites(models);
        };

        getModels();
    }, []);

    const viewerOne = useRef();
    const viewerTwo = useRef();

    const [cameraState, setCameraState] = useState(undefined);
    const [cameraSyncEnabled, setCameraSyncEnabled] = useState(true);

    const [selectModelOne, setSelectModelOne] = useState("");
    const [selectModelTwo, setSelectModelTwo] = useState("");
    const [selectModelOneVersion, setSelectModelOneVersion] = useState("");
    const [selectModelTwoVersion, setSelectModelTwoVersion] = useState("");

    const [modelOne, setModelOne] = useState(null);
    const [modelTwo, setModelTwo] = useState(null);
    const [modelOneWithVersions, setModelOneWithVersions] = useState(null);
    const [modelTwoWithVersions, setModelTwoWithVersions] = useState(null);

    const handleCameraUpdate = useCallback((camera) => {
        setCameraState(prev => {
            const isChanged = JSON.stringify(camera) !== JSON.stringify(prev);
            return isChanged ? camera : prev;
        });
    }, []);

    const viewerCamera = useMemo(() => ({
        enable: true,
        showToolbar: false,
        camera: cameraState,
        onCameraUpdate: {
            delay: 300,
            callback: cameraSyncEnabled ? handleCameraUpdate : null,
        }
    }), [cameraState, handleCameraUpdate, cameraSyncEnabled]);

    useEffect(() => {
        if (Array.isArray(availableModelComposites) && availableModelComposites.length > 0 && selectModelOne !== "") {
            setModelOne(availableModelComposites.find(item => item._name === selectModelOne));
        }
    }, [selectModelOne, availableModelComposites]);

    useEffect(() => {
        if (Array.isArray(availableModelComposites) && availableModelComposites.length > 0 && selectModelTwo !== "") {
            setModelTwo(availableModelComposites.find(item => item._name === selectModelTwo));
        }
    }, [selectModelTwo, availableModelComposites]);

    useEffect(() => {
        const getModelVersion = async (model) => {
            const versions = await IafItemSvc.getNamedUserItemVersions(model._userItemId);

            if (Array.isArray(versions._list)) {
                setModelOneWithVersions({ ...modelOne, fetchedVersions: versions });
            }
        };

        setSelectModelOneVersion("");

        if (modelOne) { getModelVersion(modelOne); }
    }, [modelOne]);

    useEffect(() => {
        const getModelVersion = async (model) => {
            const versions = await IafItemSvc.getNamedUserItemVersions(model._userItemId);

            if (Array.isArray(versions._list)) {
                setModelTwoWithVersions({ ...modelTwo, fetchedVersions: versions });
            }
        };

        setSelectModelTwoVersion("");

        if (modelTwo) { getModelVersion(modelTwo); }
    }, [modelTwo]);

    return (
        availableModelComposites?.length > 1 && (
            <div className="viewerWrapper">
                <PanelGroup autoSaveId="modelComp" direction="vertical">
                    <Panel id="model-comp-panel" collapsible={false} order={1}>
                        <div className="panel-row">
                            <StackableDrawer level={1} iconKey='fa-search' tooltip='Search'>
                                <div className='viewer-sidebar'>
                                    <label htmlFor="model-one" className="model-select-label">Select Model One:</label>
                                    <select id="model-one" value={selectModelOne} onChange={(e) => setSelectModelOne(e.target.value)}>
                                        <option value="">--Please choose an option--</option>
                                        {availableModelComposites.map(({ _name }, key) => <option key={key} value={_name}>{_name}</option>)}
                                    </select>
                                </div>
                                {modelOneWithVersions?.fetchedVersions?._list?.length > 0 && (
                                    <div className='viewer-sidebar'>
                                        <label htmlFor="model-one-version" className="model-select-label">Select Model One Version:</label>
                                        <select id="model-one-version" value={selectModelOneVersion} onChange={(e) => setSelectModelOneVersion(e.target.value)}>
                                            <option value="">--Please choose an option--</option>
                                            {modelOneWithVersions.fetchedVersions._list.map(({ _version }, key) => <option key={key} value={_version}>{_version}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className='viewer-sidebar'>
                                    <label htmlFor="model-two" className="model-select-label">Select Model Two:</label>
                                    <select id="model-two" value={selectModelTwo} onChange={(e) => setSelectModelTwo(e.target.value)}>
                                        <option value="">--Please choose an option--</option>
                                        {availableModelComposites.map(({ _name }, key) => <option key={key} value={_name}>{_name}</option>)}
                                    </select>
                                </div>
                                {modelTwoWithVersions?.fetchedVersions?._list?.length > 0 && (
                                    <div className='viewer-sidebar'>
                                        <label htmlFor="model-two-version" className="model-select-label">Select Model Two Version:</label>
                                        <select id="model-two-version" value={selectModelTwoVersion} onChange={(e) => setSelectModelTwoVersion(e.target.value)}>
                                            <option value="">--Please choose an option--</option>
                                            {modelTwoWithVersions.fetchedVersions._list.map(({ _version }, key) => <option key={key} value={_version}>{_version}</option>)}
                                        </select>
                                    </div>)}
                                <div className="viewer-sidebar">
                                    <label htmlFor="camera-synch" className="synch-check">Enable Camera Sync</label>
                                    <input
                                        id="camera-synch"
                                        type="checkbox"
                                        checked={cameraSyncEnabled}
                                        onChange={() => setCameraSyncEnabled(prev => !prev)}
                                    />
                                </div>
                                <div className="viewerMode">
                                    <label>
                                        <input
                                            type="radio"
                                            value="parallel"
                                            checked={viewerMode === 'parallel'}
                                            onChange={() => setViewerMode('parallel')}
                                        />
                                        Parallel Mode
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="overlay"
                                            checked={viewerMode === 'overlay'}
                                            onChange={() => setViewerMode('overlay')}
                                        />
                                        Overlay Mode
                                    </label>
                                </div>
                            </StackableDrawer>
                            {modelOneWithVersions && modelTwoWithVersions && selectModelOneVersion !== "" && selectModelTwoVersion !== "" &&
                                <div className="viewers">
                                    <CompareView mode={viewerMode}>
                                        <IafViewerDBM
                                            ref={viewerOne}
                                            serverUri={endPointConfig.graphicsServiceOrigin}
                                            model={modelOneWithVersions}
                                            modelVersionId={modelOneWithVersions.fetchedVersions._list.find(({ _version }) => _version == selectModelOneVersion)._id}
                                            highlightedElementIds={[]}
                                            isolatedElementIds={[]}
                                            spaceElementIds={[]}
                                            selection={[]}
                                            title={"Left Model"}
                                            view3d={viewerCamera}
                                            view2d={{
                                                enable: false
                                            }}
                                        />
                                        <IafViewerDBM
                                            ref={viewerTwo}
                                            serverUri={endPointConfig.graphicsServiceOrigin}
                                            model={modelTwoWithVersions}
                                            modelVersionId={modelTwoWithVersions.fetchedVersions._list.find(({ _version }) => _version == selectModelTwoVersion)._id}
                                            highlightedElementIds={[]}
                                            isolatedElementIds={[]}
                                            spaceElementIds={[]}
                                            selection={[]}
                                            title={"Right Model"}
                                            view3d={viewerCamera}
                                            view2d={{
                                                enable: false
                                            }}
                                        />
                                    </CompareView>
                                </div>
                            }
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        )
    );

}

export default SimpleViewerCompareView;
