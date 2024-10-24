import React, { useState, useEffect, useRef, createContext } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { SimpleTextThrobber } from '@invicara/ipa-core/modules/IpaControls'

import ModelSearchPanel from './components/ModelSearchPanel'
import PropertyTable from './components/PropertyTable'
import FilePanel from './components/FilePanel'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './modelDocView.scss'

export const ModelContext = createContext()

const VIEW_MODE_SEARCH = 'Search'
const VIEW_MODE_PROPS = 'Properties'
const VIEW_MODE_DOCS = 'Documents'

const modelDocView = (props) => {

   // used to access viewer commands, not used in this example
   const viewerRef = useRef()

   // the list of NamedCompositeItemns in the Item Service which represent imported models
   const [ availableModelComposites, setAvailableModelComposites ] = useState([])
   // the currently selected NamedCompositeItem (model) to display in the viewer
   const [ selectedModelComposite, setSelectedModelComposite ] = useState()
   const [ selectedModelElementsCollection, setSelectedModelElementsCollection ] = useState()
   const [ selectedModelTypeCollection, setSelectedModelTypeCollection ] = useState()
   const [ selectedModelPropCollection, setSelectedModelPropCollection ] = useState()

   // the ids of the selected elements in the 3D/2D view
   // this example enforces single element selection by only ever assigning
   // one id to this array
   const [ selection, setSelection ] = useState([])

   // if we are fetching individual element item data fom Twinit
   const [ loadingElement, setLoadingElement ] = useState(false)
   // the currently selected element in the model with element and property data
   const [ selectedElement, setSelectedElement ] = useState()

   const [ viewMode, setViewMode ] = useState(VIEW_MODE_SEARCH)

   // these are not used in this example, but must be provided to the viewer
   const [ sliceElementIds, setSliceElementIds ] = useState([])
   const [ colorGroups, setColorGroups ] = useState([])

   useEffect(() => {
      loadModels()
   }, [])

   const loadModels = async () => {
      let currentProject = await IafProj.getCurrent()
      let importedModelComposites = await IafProj.getModels(currentProject)
      setAvailableModelComposites(importedModelComposites)
   }

   const handleModelSelect = async (modelCompositeId) => {

      setSelectedModelComposite(null)

      let selectedModel = availableModelComposites.find(amc => amc._id === modelCompositeId)

      // get collections contained in the NamedCompositeItem representing the model
      let collectionsModelCompositeItem = (await IafItemSvc.getRelatedInItem(selectedModel._userItemId, {}))._list

      // elements collection
      setSelectedModelElementsCollection(collectionsModelCompositeItem.find(c => c._userType === 'rvt_elements'))

      // element instance properties collection
      setSelectedModelPropCollection(collectionsModelCompositeItem.find(c => c._userType === 'rvt_element_props'))

      // elements type properties collection
      setSelectedModelTypeCollection(collectionsModelCompositeItem.find(c => c._userType === 'rvt_type_elements'))

      setSelectedModelComposite(selectedModel)

   }

   const getSelectedElements = async (pkgids) => {

      setLoadingElement(true)
      setSelectedElement(null)

      let pkgid = parseInt(pkgids[0])
      setSelection([pkgid])

      // query the element collection as the parent
      // and follow relationships to the child instance and type properties
      let selectedModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {package_id: pkgid},
            collectionDesc: {_userItemId: selectedModelElementsCollection._userItemId, _userType: selectedModelElementsCollection._userType},
         },
         related: [
            {
               relatedDesc: { _relatedUserType: selectedModelPropCollection._userType},
               as: 'instanceProperties'
            },
            {
               relatedDesc: { _relatedUserType: selectedModelTypeCollection._userType},
               as: 'typeProperties'
            }
         ]
      })

      let userSelectedElement = selectedModelElements._list[0]
      userSelectedElement.typeProperties = userSelectedElement.typeProperties._list[0].properties
      userSelectedElement.instanceProperties = userSelectedElement.instanceProperties._list[0].properties

      setSelectedElement(selectedModelElements._list[0])
      setLoadingElement(false)

   }

   const handleViewModeChange = (e, toMode) => {
      e.preventDefault()

      setViewMode(toMode)
   }

   return <div className='simple-viewer-view' id='simple-viewer-view'>
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            sliceElementIds={sliceElementIds}
            colorGroups={colorGroups}
            selection={selection}
            OnSelectedElementChangeCallback={getSelectedElements}
         />}
      </div>
      <div className='viewer-sidebar'>
         <div>
            <label>Select a Model
               {!!availableModelComposites.length && <select onChange={(e) => handleModelSelect(e.target.value)}>
                  <option value={0} disabled selected>Select a Model to View</option>
                  {availableModelComposites.map(amc => <option key={amc._id} value={amc._id}>{amc._name}</option>)}
               </select>}
            </label>
         </div>
         <hr/>
         <ModelContext.Provider value={{selectedModelComposite, selectedModelElementsCollection, setSliceElementIds}}>
            <div className="element-info">
               {loadingElement && <SimpleTextThrobber throbberText='Loading Element Data' />}
               <div className='view-mode-select'>
                  <span className='mode-selector'>
                     {viewMode !== VIEW_MODE_SEARCH && selectedElement ?
                        <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_SEARCH)}>{VIEW_MODE_SEARCH}</a> :
                        <span className='mode-selector-disabled'>{VIEW_MODE_SEARCH}</span>
                     }
                  </span>
                  <span className='mode-selector'>
                     {viewMode !== VIEW_MODE_PROPS && selectedElement ?
                        <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_PROPS)}>{VIEW_MODE_PROPS}</a> :
                        <span className='mode-selector-disabled'>{VIEW_MODE_PROPS}</span>
                     }
                  </span>
                  <span className='mode-selector'>
                     {viewMode !== VIEW_MODE_DOCS && selectedElement ?
                        <a className='mode-selector-enabled' href="#" onClick={(e) => handleViewModeChange(e, VIEW_MODE_DOCS)}>{VIEW_MODE_DOCS}</a> :
                        <span className='mode-selector-disabled'>{VIEW_MODE_DOCS}</span>
                     }
                  </span>
               </div>
               <div style={{display:selectedModelComposite && viewMode === VIEW_MODE_SEARCH ? 'block' : 'none'}}><ModelSearchPanel /></div>
               {selectedElement && viewMode === VIEW_MODE_PROPS && <PropertyTable selectedElement={selectedElement} />}
               {selectedElement && viewMode === VIEW_MODE_DOCS && <FilePanel selectedElement={selectedElement} />}
               
            </div>
         </ModelContext.Provider>
      </div>
   </div>

}

export default modelDocView