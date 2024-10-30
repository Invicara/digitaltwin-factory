// version dtf-1.0

import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerSpaceView.scss'

const SimpleViewerSpaceView = (props) => {

   // used to access viewer commands, not used in this example
   const viewerRef = useRef()

   // the list of NamedCompositeItemns in the Item Service which represent imported models
   const [ availableModelComposites, setAvailableModelComposites ] = useState([])
   // the currently selected NamedCompositeItem (model) to display in the viewer
   const [ selectedModelComposite, setSelectedModelComposite ] = useState()

   // the list of spaces in the currently selected model
   // this is used to populate the sliceElementIds property on the viewer
   // this will render the spaces with the rest of the model in glass mode
   // see getSpaces() below for we fetch the space elements from the imported model
   const [ modelSpaces, setModelSpaces ] = useState([])

   // whether to show spaces in the 3D/2D view or not
   const [ showSpaces, setShowSpaces ] = useState(false)

   // the current selected space by the user
   const [ selectedSpace, setSelectedSpace ] = useState()

   // the ids of the selected elements in the 3D/2D view
   // this example enforces single element selection by only ever assigning
   // one id to this array
   const [ selection, setSelection ] = useState([])

   // this is not used in this example, but must be provided to the viewer
   const [ colorGroups, setColorGroups ] = useState([])
   const [ hiddenElementIds, setHiddenElementIds ] = useState([])

   useEffect(() => {
      loadModels()
   }, [])

   useEffect(() => {
      if (selectedModelComposite) getSpaces()
   }, [selectedModelComposite])

   const loadModels = async () => {
      let currentProject = await IafProj.getCurrent()
      let importedModelComposites = await IafProj.getModels(currentProject)
      setAvailableModelComposites(importedModelComposites)
   }

   const handleModelSelect = (modelCompositeId) => {
      let selectedModel = availableModelComposites.find(amc => amc._id === modelCompositeId)
      setSelectedModelComposite(selectedModel)
   }

   const getSpaces = async () => {
      // here we fetch the space elements from the model
      // this code works for Revit, models produced by other CAD authoring tools may
      // represent spaces in their models differently and you may need to
      // expand this code

      // get collections contained in the NamedCompositeItem representing the model
      let collectionsModelCompositeItem = (await IafItemSvc.getRelatedInItem(selectedModelComposite._userItemId, {}))._list

      // elements collection
      let elementCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_elements')

      // element instance properties collection
      let elementPropCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_element_props')

      // elements type properties collection
      let elementTypePropCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_type_elements')

      // query the element collection for spaces type element
      // THIS MAY NOT WORK IF YOU USD A DIFFERENT IMPORT SCRIPT THAN IN THE TRAINING
      // the training importHelper script puts the Revit Category, Ravt Famly, and Revit Type on the
      // the element items directly making elements easier to query
      // and follow relationships to the child instance and type properties
      let spaceModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {"revitCategory.val": {$in: [ //these are the various Revit Categories that identify spaces in the model
            "OST_Rooms",
            "OST_Spaces",
            "OST_Zones",
            "OST_Areas",
            "OST_MEPSpaces"
            ]}},
            collectionDesc: {_userItemId: elementCollection._userItemId, _userType: elementCollection._userType},
            options: { page: { _pageSize: 1000 }} // just getting the first 100 spaces, in reality you will want to page all results
         },
         related: [
         {
            relatedDesc: { _relatedUserType: elementPropCollection._userType},
            as: 'instanceProperties'
         },
         {
            relatedDesc: { _relatedUserType: elementTypePropCollection._userType},
            as: 'typeProperties'
         }
         ]
      })

      let spaceElements = spaceModelElements._list
      spaceElements.forEach(se => {
         se.typeProperties = se.typeProperties._list[0].properties
         se.instanceProperties = se.instanceProperties._list[0].properties
      })
 
      setModelSpaces(spaceElements)
   }

   // add the newly selected model element to the selection set
   // the below suppors single select of a space
   const addToSelection = async (pkgids) => {

      let pkgid = parseInt(pkgids[0])
      let spaceElement = modelSpaces.find(se => se.package_id === pkgid)

      if (spaceElement) {
         setSelection([pkgid])
         setSelectedSpace(spaceElement)
      }
   }
   
   return <div className='simple-viewer-view'>
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            hiddenElementIds={hiddenElementIds}
            sliceElementIds={showSpaces ? modelSpaces.map(sme => sme.package_id) : []}
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
           <GenericMatButton onClick={() => setShowSpaces(!showSpaces)} className='clear-button' customClasses='clear-button'>{showSpaces ? 'Hide Spaces' : 'Show Spaces'}</GenericMatButton>
         </div>
         <div className="element-info">
            {selectedSpace && <table className='element-info-table'>
               <tbody>
               <tr>
                     <td className='prop-name'>Package Id</td>
                     <td>{selectedSpace.package_id}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Name</td>
                     <td>{selectedSpace.instanceProperties?.Name?.val}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Number</td>
                     <td>{selectedSpace.instanceProperties?.Number?.val}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Level</td>
                     <td>{selectedSpace.instanceProperties?.Level?.val}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Department</td>
                     <td>{selectedSpace.instanceProperties?.Department?.val}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Occupancy</td>
                     <td>{selectedSpace.instanceProperties?.Occupancy?.val}</td>
                  </tr>
               </tbody>
            </table>}
         </div>
      </div>
   </div>

}

export default SimpleViewerSpaceView