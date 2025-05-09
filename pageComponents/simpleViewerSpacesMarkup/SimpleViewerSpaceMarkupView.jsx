import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import { createTempReadingMarkup, clearMarkups } from './markupComponents/markupUtils'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerSpaceMarkupView.scss'

const SimpleViewerSpaceMarkupView = (props) => {

   // used to access viewer capabilities to draw markups on the model view
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

   // a list of the levels in the model so we can show the spaces by level in the viewer
   const [ modelLevels, setModelLevels ] = useState([])

   // a map of levels to the package_ids and source_ids of the space model elements
   // example:
   // {
   //    "Ground Floor": [1234, 4567, 3456],
   //    "Frst Floor": [0987, 9874, 4857]
   // }
   const [ modelLevelSpaceMap, setModelLevelSpaceMap ] = useState()

   // whether to show spaces in the 3D/2D view or not
   const [ showSpaces, setShowSpaces ] = useState(false)

   // the list of the markup ids for the markups we will create to display the space
   // temperatures in the model viewer
   const [ tempMarkups, setTempMarkups ] = useState([])

   // the current selected space by the user
   const [ selectedSpace, setSelectedSpace ] = useState()

   // the ids of the selected elements in the 3D/2D view
   // this example enforces single element selection by only ever assigning
   // one id to this array
   const [ selection, setSelection ] = useState([])

   // package_ids and source_ids of the elements to hide in the model view
   // we use this to hide spaces on levels other than the level we have selected
   const [ hiddenElementIds, setHiddenElementIds ] = useState([])

   // this is not used in this example, but must be provided to the viewer
   const [ colorGroups, setColorGroups ] = useState([])

   useEffect(() => {
      loadModels()
   }, [])

   useEffect(() => {
      if (selectedModelComposite) getSpaces()
   }, [selectedModelComposite])

   useEffect(() => {
      if (!showSpaces) {
         setHiddenElementIds(null)

         // when we toggle Show Spaces off also clear all our temperature markups
         if (viewerRef?.current?.iafviewerRef) {
            let IafViewer = viewerRef.current.iafviewerRef.current
            clearMarkups(IafViewer, tempMarkups)
         }
      }
   }, [showSpaces])

   const loadModels = async () => {
      let currentProject = await IafProj.getCurrent()
      let importedModelComposites = await IafProj.getModels(currentProject)
      setAvailableModelComposites(importedModelComposites)
   }

   const handleModelSelect = (modelCompositeId) => {

      // when the model changes, clear all the temperature markups from the
      // previously selected model
      if (viewerRef?.current?.iafviewerRef) {
         let IafViewer = viewerRef.current.iafviewerRef.current
         clearMarkups(IafViewer, tempMarkups)
      }

      setSelectedModelComposite(undefined)

      // the model viewer needs this small delay inbetween changign models to allow its
      // internal state to update
      setTimeout(async () => {
         let selectedModel = availableModelComposites.find(amc => amc._id === modelCompositeId)
         setSelectedModelComposite(selectedModel)
      }, 1000)
      

   }

   const getSpaces = async () => {
      // here we fetch the space elements from the model
      // this code works for Revit. Models produced by other CAD authoring tools may
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
      // and follow relationships to the child instance and type properties
      // THIS MAY NOT WORK IF YOU USED A DIFFERENT IMPORT SCRIPT THAN IN THE TRAINING
      // the training importHelper script puts the Revit Category, Ravt Family, and Revit Type on the
      // the element items directly making elements easier to query
      let spaceModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {"revitCategory.val": {$in: [ //these are the various Revit Categories that identify spaces in the model
               "OST_Rooms", // Revit Specific -> you will need to change for non-Revit models
            ]}},
            collectionDesc: {_userItemId: elementCollection._userItemId, _userType: elementCollection._userType},
            options: { page: { _pageSize: 1000 }} // just getting the first 1000 spaces, in reality you will want to page all results
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

      let levels = []
      let levelSpaceMap = {}
      let spaceElements = spaceModelElements._list

      spaceElements.forEach(se => {

         // make type and instance properties more accesible on the elements
         se.typeProperties = se.typeProperties._list[0].properties
         se.instanceProperties = se.instanceProperties._list[0].properties

         // create list of unique level names and level to package_id and source_id map
         // the map includes pairs of ids in this order [ package_id, source_id ]
         // package_id is used for Revit and source_id is used for IFC models
         if (!levels.includes(se.instanceProperties.Level.val)) {
            levels.push(se.instanceProperties.Level.val)
            levelSpaceMap[se.instanceProperties.Level.val] = [se.package_id, se.source_id]
         } else {
            levelSpaceMap[se.instanceProperties.Level.val].push(...[se.package_id, se.source_id])
         }

      })

      setModelLevels(levels.sort())
      setModelLevelSpaceMap(levelSpaceMap)
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

   // when a user selects a level on which to view the space temperatures
   // hde all spaces on the other levels, and write the temperature markups
   // to the model view for spaces on the selected level
   const showSpacesByLevel = (level) => {

      let spacesOnOtherLevels = []
      let spacesOnSelectedLevel = []
      
      // retreive package_ids and source_id from modelLevelSpaceMap
      Object.keys(modelLevelSpaceMap).forEach(lvl => {
         if (lvl !== level) {
            spacesOnOtherLevels.push(...modelLevelSpaceMap[lvl])
         } else {
            spacesOnSelectedLevel = modelLevelSpaceMap[lvl]
         }
      })

      setHiddenElementIds(null) // clear all hidden elements in the viewer

      // clear all previous markups in the viewer
      let IafViewer = viewerRef.current.iafviewerRef.current
      clearMarkups(IafViewer, tempMarkups)

      setTimeout(() => {
         setHiddenElementIds(spacesOnOtherLevels)  // hide spaces on other levels
         drawTempsForSpaces(spacesOnSelectedLevel) // draw the temperature markups on the selected level
      }, 1000)
      
   }

   // draws a circle markup at the geometric center of each spaceId it is passed in the model
   // if the tempeerature is within the comfortable range, it will draw a small green circle
   // if the temperature is too hot or too cold, it will draw a larger red or blue circle
   // with the offending temperature within it
   const drawTempsForSpaces = async (spaceIds) => {

      let idPairs = []

      for ( let i = 0; i < spaceIds.length; i += 2) {
         idPairs.push(spaceIds.slice(i, i+2))
      }

      // idPairs is now a array of arrays
      // [ [package_id, source_id], [package_id, source_id], [package_id, source_id] ]
      // where each pair is the ids for a space

      let IafViewer = viewerRef.current.iafviewerRef.current
      
      let markupIds = []   // the ids of the created markups
                           // we track these so we can later use them to remove the markups
                           // from the viewer

      for (let i = 0; i < idPairs.length; i++) {

         let idPair = idPairs[i]

         // see ./markupComponents/markupUtils.js
         let tempMarkup = await createTempReadingMarkup(IafViewer, idPair)

         markupIds.push(...tempMarkup)

      }

      setTempMarkups(markupIds)
      
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
           <GenericMatButton onClick={() => setShowSpaces(!showSpaces)} className='clear-button' customClasses='clear-button' disabled={!selectedModelComposite}>{showSpaces ? 'Hide Spaces' : 'Show Spaces'}</GenericMatButton>
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
            {showSpaces && <div>
               <div className='temp-header'>
                  <span><i className="fas fa-thermometer-half fa-2x"></i> Show Temperatures for:</span>
               </div>
               <div className="temp-btns">
                  {modelLevels.map(lvl => <GenericMatButton onClick={() => showSpacesByLevel(lvl)} className='clear-button' customClasses='clear-button'>
                   {lvl}
                  </GenericMatButton>)}
               </div>
            </div>}
         </div>
      </div>
   </div>

}

export default SimpleViewerSpaceMarkupView