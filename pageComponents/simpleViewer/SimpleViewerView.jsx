import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { SimpleTextThrobber } from '@invicara/ipa-core/modules/IpaControls'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerView.scss'

const SimpleViewerView = (props) => {

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

   // if we are fetching individual element item data fom Twinit
   const [ loadingElement, setLoadingElement ] = useState(false)
   // the currently selected element in the model with element and property data
   const [ selectedElement, setSelectedElement ] = useState()

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

   const getSelectedElements = async (pkgids) => {

      setLoadingElement(true)
      setSelectedElement(null)

      let pkgid = parseInt(pkgids[0])
      setSelection([pkgid])

      // get collections contained in the NamedCompositeItem representing the model
      let collectionsModelCompositeItem = (await IafItemSvc.getRelatedInItem(selectedModelComposite._userItemId, {}))._list

      // elements collection
      let elementCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_elements')

      // element instance properties collection
      let elementPropCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_element_props')

      // elements type properties collection
      let elementTypePropCollection = collectionsModelCompositeItem.find(c => c._userType === 'rvt_type_elements')

      // query the element collection as the parent
      // and follow relationships to the child instance and type properties
      let selectedModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {package_id: pkgid},
            collectionDesc: {_userItemId: elementCollection._userItemId, _userType: elementCollection._userType},
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

      let userSelectedElement = selectedModelElements._list[0]
      userSelectedElement.typeProperties = userSelectedElement.typeProperties._list[0].properties
      userSelectedElement.instanceProperties = userSelectedElement.instanceProperties._list[0].properties

      setSelectedElement(selectedModelElements._list[0])
      setLoadingElement(false)

   }

   return <div className='simple-viewer-view'>
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
         <div className="element-info">
            {loadingElement && <SimpleTextThrobber throbberText='Loading Element Data' />}
            {selectedElement && <table className='element-info-table'>
               <tbody>
               <tr>
                     <td className='prop-name'>Package Id</td>
                     <td>{selectedElement.package_id}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Revit Family</td>
                     <td>{selectedElement.revitFamily?.val}</td>
                  </tr>
                  <tr>
                     <td className='prop-name'>Revit Type</td>
                     <td>{selectedElement.revitType?.val}</td>
                  </tr>
                  <tr>
                     <td colSpan='2' className='prop-type'>Type Properties</td>
                  </tr>
                  {Object.keys(selectedElement.typeProperties).sort().map((tp, i) => <tr key={`t${i}`}>
                     <td className='prop-name'>{selectedElement.typeProperties[tp].dName}</td>
                     <td>{selectedElement.typeProperties[tp].val}</td>
                  </tr>)}
                  <tr>
                     <td colSpan='2' className='prop-type'>Instance Properties</td>
                  </tr>
                  {Object.keys(selectedElement.instanceProperties).sort().map((ip, i) => <tr key={`t${i}`}>
                     <td className='prop-name'>{selectedElement.instanceProperties[ip].dName}</td>
                     <td>{selectedElement.instanceProperties[ip].val}</td>
                  </tr>)}
               </tbody>
            </table>}
         </div>
      </div>
   </div>

}

export default SimpleViewerView