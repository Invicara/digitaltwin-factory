// version dtf-1.0

import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj } from '@dtplatform/platform-api'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerSavedView.scss'

const SimpleViewerSavedView = (props) => {

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

   // the name of the view to save
   const [ newViewName, setNewViewName ] = useState('')

   // the array of saved view data
   const [ savedViews, setSavedViews ] = useState([])

   // the view settings of the current view
   const [ selectedViewDetails, setSelectedViewDetails ] = useState()

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

   const handleModelSelect = (modelCompositeId) => {
      let selectedModel = availableModelComposites.find(amc => amc._id === modelCompositeId)
      setSelectedModelComposite(selectedModel)
   }

   // get the camera view from the viewer using the getCamera command
   const saveView = async () => {

      let commands = _.get(viewerRef, "current.iafviewerRef.current.commands")
      if (commands && commands.getCamera) {
         let camera = await commands.getCamera()
         let updatedViews = [{name: newViewName, camera}, ...savedViews]

         setSavedViews(updatedViews)
         setSelectedViewDetails({name: newViewName, camera})
         setNewViewName('')

         // this is where you could also persist this view in the item service
         // to allow the views to persist past refreshes
         // but for this example we just keep the saved views in page state

      }

   }

   // set the view using the viewer's setCamera command
   const setView = async (view) => {

      let commands = _.get(viewerRef, "current.iafviewerRef.current.commands")
      if (commands && commands.setCamera) {
         await commands.setCamera(view.camera)
         setSelectedViewDetails(view)
      }

   }

   return <div className='simple-viewer-view'>
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            sliceElementIds={sliceElementIds}
            colorGroups={colorGroups}
            selection={selection}
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
         <div className="saved-views">
            <div className='saved-view-new-name'>
               <div>New View Name</div>
               <input type='text' value={newViewName} onChange={(e) => setNewViewName(e.target.value)}/>
            </div>
            <GenericMatButton onClick={saveView}>Save Camera View</GenericMatButton>
            <hr />
            {savedViews.map((sv, i) => <GenericMatButton customClasses='view-btn' key={i} onClick={(e) => setView(sv)}>{sv.name}</GenericMatButton>)}
            <hr />
            <pre>
               <code>
                  {selectedViewDetails && JSON.stringify(selectedViewDetails, null, 3)}
               </code>
            </pre>
         </div>
      </div>
   </div>

}

export default SimpleViewerSavedView