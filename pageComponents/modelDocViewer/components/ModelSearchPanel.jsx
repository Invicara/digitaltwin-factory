import React, { useState, useEffect, useContext } from 'react'
import Select from 'react-select'
 
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'
import { IafItemSvc } from '@dtplatform/platform-api'

import { ModelContext } from '../ModelDocView'

import './ModelSearchPanel.scss'

const ModelSearchPanel = (props) => {

   const { selectedModelElementsCollection, setSliceElementIds } = useContext(ModelContext)

   // currently one levl fo search as Revit Family
   // but can be extended to support further targeting other properties like Revit Type
   // or other properties for non-Revit models.
   const [ searchLevelOne, setSearchLevelOne ] = useState([])
   const [ selectedSearchLevelOne, setSelectedSearchLevelOne ] = useState([])

   useEffect(() => {
      getSearchLevelOneValues()
   }, [selectedModelElementsCollection])

   const getSearchLevelOneValues = async () => {

      // get all the unique Revit Families in the model
      if (selectedModelElementsCollection) {
         let distinctLevelOne = await IafScriptEngine.getDistinct({
         collectionDesc: { _userType: selectedModelElementsCollection._userType, _userItemId: selectedModelElementsCollection._userItemId },
         query: {},
         field: 'revitFamily.val'
         })

         setSearchLevelOne(distinctLevelOne)
      }

   }

   // Search for model elements that match the selected families
   // Matchs will be sent to the viewer as a slice to render them
   // while the rest of the model is in glass mode
   const handleLevelOne = async (selections) => {

      setSelectedSearchLevelOne(selections)

      if (!selections) {
         setSliceElementIds([])
      } else {
         let families = selections.map(s => s.value)

         let _offset = 0
         let _pageSize = 1000
         let total = 1
   
         let elementIds = []
   
         while (_offset < total) {
   
            let pageResults = await IafItemSvc.getRelatedItems(selectedModelElementsCollection._userItemId, {
               query: {'revitFamily.val': {$in: families}}
            }, null, {
               page: {_pageSize, _offset},
               project: { _id: 1, package_id: 1 }
            })

            elementIds.push(...pageResults._list.map(r => r.package_id))

            total = pageResults._total
            _offset += _pageSize
   
         }

         setSliceElementIds(elementIds)
      }

      

   }

   return <div className='model-search-panel'>

      <div>Revit Family</div>
      <Select options={searchLevelOne.map(lone => {return {value: lone, label: lone}})}
         isMulti={true}
         isDisabled={false}
         isSearchable={true}
         onChange={handleLevelOne}
         value={selectedSearchLevelOne}
      />
   </div>

}

export default ModelSearchPanel