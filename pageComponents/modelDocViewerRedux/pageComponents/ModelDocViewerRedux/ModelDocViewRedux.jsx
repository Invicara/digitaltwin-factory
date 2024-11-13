import React, { useState, useEffect, useRef, createContext } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import { loadAllModels, setCurrentModel, setCurrentModelElement } from '../../redux/modelSlice'
import { loadRootContainer, unselectAllDocuments } from '../../redux/documentsSlice'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { SimpleTextThrobber } from '@invicara/ipa-core/modules/IpaControls'

import FloatingModelDocViewer from './components/FloatingModelDocViewer'
import ModelSearchPanel from './components/ModelSearchPanel'
import PropertyTable from './components/PropertyTable'
import FilePanel from './components/FilePanel'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './modelDocViewRedux.scss'

const VIEW_MODE_SEARCH = 'Search'
const VIEW_MODE_PROPS = 'Properties'
const VIEW_MODE_DOCS = 'Documents'

const modelDocViewRedux = (props) => {

   // used to access viewer commands, not used in this example
   const viewerRef = useRef()

   const selectedFileItems = useSelector((state) => state.documentsSlice.selectedDocuments)

   // the list of NamedCompositeItemns in the Item Service which represent imported models
   const availableModelComposites = useSelector((state) => state.modelSlice.allModels)

   // the currently selected NamedCompositeItem (model) to display in the viewer
   const selectedModelComposite = useSelector((state) => state.modelSlice.selectedModel)

   // the currently selected element in the model with element and property data
   const selectedElement = useSelector((state) => state.modelSlice.selectedElement)

   // if we are fetching individual element item data fom Twinit
   const loadingElement = useSelector((state) => state.modelSlice.loadingElement)

   const sliceElementIds = useSelector((state) => state.modelSlice.sliceIds)

   const dispatch = useDispatch()

   const [ viewMode, setViewMode ] = useState(VIEW_MODE_SEARCH)


   useEffect(() => {

      dispatch(loadRootContainer())
      dispatch(loadAllModels())

   }, [])

   const handleModelSelect = async (modelCompositeId) => {

      dispatch(setCurrentModel(null))
      dispatch(setCurrentModel(modelCompositeId))

   }

   const getSelectedElements = async (pkgids) => {

      dispatch(setCurrentModelElement(null))
      dispatch(setCurrentModelElement(parseInt(pkgids[0])))

   }

   const onCloseDocViewer = async () => {
      dispatch(unselectAllDocuments())
   }

   const handleViewModeChange = (e, toMode) => {
      e.preventDefault()

      setViewMode(toMode)
   }

   return <div className='simple-viewer-view' id='simple-viewer-view'>
      {!!selectedFileItems.length && <FloatingModelDocViewer docIds={selectedFileItems.map(sf => { return { _fileId: sf._fileId} })}
         position={{x: 0, y: 0}}
         onClose={onCloseDocViewer}
      />}
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            sliceElementIds={sliceElementIds}
            colorGroups={[]}
            selection={selectedElement ? [selectedElement.package_id] : []}
            OnSelectedElementChangeCallback={getSelectedElements}
         />}
      </div>
      <div className='viewer-sidebar'>
         <div>
            <label>Select a Model
               {!!availableModelComposites.length && <select onChange={(e) => handleModelSelect(e.target.value)} value={selectedModelComposite ? selectedModelComposite._id : 0}>
                  <option value={0} disabled selected>Select a Model to View</option>
                  {availableModelComposites.map(amc => <option key={amc._id} value={amc._id}>{amc._name}</option>)}
               </select>}
            </label>
         </div>
         <hr/>
            <div className="element-info">
               {loadingElement && <SimpleTextThrobber throbberText='Loading Element Data' />}
               <div className='view-mode-select'>
                  <span className='mode-selector'>
                     {viewMode === VIEW_MODE_SEARCH ?
                        <span className='mode-selector-current'>{VIEW_MODE_SEARCH}</span> :
                        viewMode !== VIEW_MODE_SEARCH && selectedElement ?
                           <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_SEARCH)}>{VIEW_MODE_SEARCH}</a> :
                           <span className='mode-selector-disabled'>{VIEW_MODE_SEARCH}</span>
                     }
                  </span>
                  <span className='mode-selector'>
                  {viewMode === VIEW_MODE_PROPS ?
                        <span className='mode-selector-current'>{VIEW_MODE_PROPS}</span> :
                        viewMode !== VIEW_MODE_PROPS && selectedElement ?
                           <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_PROPS)}>{VIEW_MODE_PROPS}</a> :
                           <span className='mode-selector-disabled'>{VIEW_MODE_PROPS}</span>
                     }
                  </span>
                  <span className='mode-selector'>
                  {viewMode === VIEW_MODE_DOCS ?
                        <span className='mode-selector-current'>{VIEW_MODE_DOCS}</span> :
                        viewMode !== VIEW_MODE_DOCS && selectedElement ?
                           <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_DOCS)}>{VIEW_MODE_DOCS}</a> :
                           <span className='mode-selector-disabled'>{VIEW_MODE_DOCS}</span>
                     }
                  </span>
               </div>
               <div style={{display:selectedModelComposite && viewMode === VIEW_MODE_SEARCH ? 'block' : 'none'}}><ModelSearchPanel /></div>
               {selectedElement && viewMode === VIEW_MODE_PROPS && <PropertyTable />}
               {selectedElement && viewMode === VIEW_MODE_DOCS && <FilePanel />}
            </div>

      </div>
   </div>

}

export default modelDocViewRedux