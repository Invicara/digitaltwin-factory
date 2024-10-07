import React, { useState, useEffect, useRef } from 'react'

import { IafViewerDBM } from '@dtplatform/iaf-viewer'
import { IafProj } from '@dtplatform/platform-api'
import { GenericMatButton } from '@invicara/ipa-core/modules/IpaControls'

import "@dtplatform/iaf-viewer/dist/iaf-viewer.css";
import './SimpleViewerThemeView.scss'

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

   // the color groups to apply to the model
   // we'll start with three default groups but the user can add more
   const [ colorGroups, setColorGroups ] = useState({
      groupName: "Sample Groups",
      colors: [
         {
            "color": "#E7217B",
            "opacity": 0.9,
            "title": "Pink",
            "colorName": "Pink",
            "elementIds": []
         },
         {
            "color": "#f49911",
            "opacity": 0.9,
            "title": "Orange",
            "colorName": "Orange",
            "elementIds": []
         },
         {
            "color": "#00A99F",
            "opacity": 0.9,
            "title": "Teal",
            "colorName": "Teal",
            "elementIds": []
         }
      ]
   })

   // settings for the new user group the user can create
   const [ newGroupName, setNewGroupName ] = useState()
   const [ newGroupColor, setNewGroupColor ] = useState()

    // this are not used in this example, but must be provided to the viewer
    const [ sliceElementIds, setSliceElementIds ] = useState([])

   useEffect(() => {
      loadModels()
      getNewRandomColor()
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

   const clearSelection = () => {

      setSelection([])

   }

   const getNewRandomColor = () => {

      setNewGroupColor('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'))

   }

   const addToColorGroup = (e, colorGrp) => {
      e.preventDefault()

      let newColorGroups = structuredClone(colorGroups)
      let color = newColorGroups.colors.find(cgc => cgc.title === colorGrp.title)
      color.elementIds.push(...selection)
      setColorGroups(newColorGroups)
      clearSelection()

   }
   
   const clearGroup = (e, colorGrp) => {
      e.preventDefault()

      let newColorGroups = structuredClone(colorGroups)
      let color = newColorGroups.colors.find(cgc => cgc.title === colorGrp.title)
      color.elementIds = []
      setColorGroups(newColorGroups)

   }

   const addGroup = (e) => {
      e.preventDefault()

      if (newGroupName && newGroupName.length > 0) {
         let newColorGroups = structuredClone(colorGroups)
         newColorGroups.colors.push({
            "color": newGroupColor,
            "opacity": 0.9,
            "title": newGroupName,
            "colorName": newGroupName,
            "elementIds": selection
         })
         setColorGroups(newColorGroups)
         clearSelection()
         getNewRandomColor()
         setNewGroupName('')
      }
      

   }

   return <div className='simple-viewer-view'>
      <div className='viewer'>
         {selectedModelComposite && <IafViewerDBM
            ref={viewerRef} model={selectedModelComposite}
            serverUri={endPointConfig.graphicsServiceOrigin}
            sliceElementIds={sliceElementIds}
            colorGroups={[colorGroups]}
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
         <div className="theme-info">
           <GenericMatButton onClick={clearSelection} customClasses='clear-button'>Clear Selections</GenericMatButton>
           <table className='group-table'>
            <thead>
               <tr>
                  <th colSpan='4'>Groups</th>
               </tr>
            </thead>
            <tbody>
               {colorGroups && colorGroups.colors.map(c => <tr key={c.title}>
                  <td>{c.title}</td>
                  <td>{c.elementIds.length} elements</td>
                  <td>
                  <a href="#" onClick={(e) => addToColorGroup(e, c)}>Add to Group</a>
                  </td>
                  <td>
                     <a href="#" onClick={(e) => clearGroup(e, c)}>Clear Group</a>
                  </td>
               </tr>)}
               <tr>
                  <td colSpan='2'>
                     <input type='text' className='new-group-name' placeholder='New Group Name' value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}></input>
                  </td>
                  <td>
                     <input type='color' value={newGroupColor} onChange={(e) => setNewGroupColor(e.target.value)}></input>
                  </td>
                  <td>
                     <a href="#" onClick={addGroup}>Add Group</a>
                  </td>
               </tr>

            </tbody>
           </table>
         </div>
      </div>
   </div>

}

export default SimpleViewerThemeView