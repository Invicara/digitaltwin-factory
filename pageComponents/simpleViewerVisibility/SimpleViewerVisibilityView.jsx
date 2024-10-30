// version dtf-1.0

import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj } from '@dtplatform/platform-api'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerVisibilityView.scss'

const SimpleViewerThemeView = (props) => {

   // used to access viewer commands, not used in this example
   const viewerRef = useRef()

   // the list of NamedCompositeItemns in the Item Service which represent imported models
   const [ availableModelComposites, setAvailableModelComposites ] = useState([])
   // the currently selected NamedCompositeItem (model) to display in the viewer
   const [ selectedModelComposite, setSelectedModelComposite ] = useState()

   // the ids of the selected elements in the 3D/2D view
   // this example enforces single element selection by only ever assigning
   // one id to this array
   const [ selection, setSelection ] = useState([])

   // elements to render while everything else is in glass mode
   const [ sliceElementIds, setSliceElementIds ] = useState([])

   // elements to be hidden from the view
   const [ hiddenElementIds, setHiddenElementIds ] = useState([])

   // this is not used in this example, but must be provided to the viewer
   const [ colorGroups, setColorGroups ] = useState([])

   useEffect(() => {
      loadModels()
   }, [])

   const loadModels = async () => {
      let currentProject = await IafProj.getCurrent()
      let importedModelComposites = await IafProj.getModels(currentProject)
      setAvailableModelComposites(importedModelComposites)
   }

   const handleModelSelect = (modelCompositeId) => {
      let selectedModel = availableModelComposites.find(amc => amc._id === modelCompositeId)
      setSelectedModelComposite(selectedModel)
   }

   // add the newly selected model element to the selection set
   // by selecting consecutve elements the user can build a selection set
   // to add to a color group
   const addToSelection = async (pkgids) => {

      let newSelection = [...selection, ...pkgids.map(pid => parseInt(pid))]
      setSelection(newSelection)

   }

   const resetVisibility = () => {

      setSelection([])
      setSliceElementIds([])
      setHiddenElementIds([])

   }

   const sliceSelection = () => {

      setSliceElementIds([...sliceElementIds, ...selection])
      setSelection([])

   }

   const hideSelection = () => {

      setHiddenElementIds([...hiddenElementIds, ...selection])
      setSelection([])

   }
   
   return <div className='simple-viewer-view'>
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            sliceElementIds={sliceElementIds}
            hiddenElementIds={hiddenElementIds}
            colorGroups={colorGroups}
            OnSelectedElementChangeCallback={addToSelection}
            selection={selection}
            enableFocusMode={false}
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
         <div className="vis-btns">
           <GenericMatButton onClick={resetVisibility} className='clear-button' customClasses='clear-button'>Reset</GenericMatButton>
           <GenericMatButton onClick={sliceSelection} className='clear-button' customClasses='clear-button'>
               Slice Selections {sliceElementIds.length ? `(${sliceElementIds.length})` : ''}
            </GenericMatButton>
           <GenericMatButton onClick={hideSelection} className='clear-button' customClasses='clear-button'>
               Hide Selections {hiddenElementIds.length ? `(${hiddenElementIds.length})` : ''}
            </GenericMatButton>
         </div>
      </div>
   </div>

}

export default SimpleViewerThemeView