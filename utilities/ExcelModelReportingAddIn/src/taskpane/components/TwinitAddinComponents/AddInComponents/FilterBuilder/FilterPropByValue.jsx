import React, { useEffect, useState, useContext } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, tokens, Dropdown, Option } from "@fluentui/react-components"

import { TwinitContext } from '../../../App'
import { ModelContext } from '../../Addin'
import FilterNumberInput from './FilterNumberInput'

import { IafItemSvc } from '@dtplatform/platform-api'

const numValueTypes = [ 'DOUBLE', 'FLOAT', 'INTEGER', 'LONG' ]

const useStyles = makeStyles({
   filterByPropValueBody: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      marginBottom: "10px",
      marginTop: "10px",
      alignItems: "center"
   },
   label: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      fontWeight: tokens.fontWeightBold
   },
   novalues: {
      color: "gray"
   }
})

const FilterPropByValue = ({property, propertyType, onSelect}) => {

   const styles = useStyles()

   const { getTwinitCtx } = useContext(TwinitContext)
   const { modelTypePropCollection, modelInstPropCollection } = useContext(ModelContext)

   const [ isDisabled, setIsDisabled ] = useState(false)

   const [ stringPropVals, setStringPropVals ] = useState([])
   const [ selectedStringPropVals, setSelectedStringPropVals ] = useState([])

   useEffect(() => {

      if (property) {
         getPropertyVals()
      }

   }, [property])

   const handleSelect = (data) => {

      if (property.valueType === 'STRING') {
         setSelectedStringPropVals(data.selectedOptions)

         if (onSelect) {
            let queryPartial = {}
            queryPartial[`properties.${property.key}.val`] = {$in: data.selectedOptions}
            onSelect(property, propertyType, data.selectedOptions.length ? queryPartial : null)
         }
      } else if (numValueTypes.includes(property.valueType)) {
         
         if (onSelect) {
            let queryPartial = {}

            if (data.mode === 'equals') {
               queryPartial[`properties.${property.key}.val`] = data.valOne
            } else if (data.mode === 'greater than') {
               queryPartial[`properties.${property.key}.val`] = {$gt: data.valOne}
            } else if (data.mode === 'less than') {
               queryPartial[`properties.${property.key}.val`] = {$lt: data.valOne}
            } else if (data.mode === 'between' || data.mode === 'outside') {
               queryPartial[`properties.${property.key}.val`] = {$gt: data.valOne, $lt: data.valTwo}
            } 

            onSelect(property, propertyType, queryPartial)
         }
      }
   }

   const getPropertyVals = () => {
      setIsDisabled(true)
      let ctx = getTwinitCtx()

      if (property.valueType === 'STRING') {
         let propCollection = propertyType === 'type' ? modelTypePropCollection : modelInstPropCollection

         let propSetQuery = {}
         if (property.parentValue && property.parentValue !== "No Property Set") {
            propSetQuery[`properties.${property.key}.psDispName`] = property.parentValue
         }

         let query = {
            $distinctRelatedItemField: {
               collectionDesc: { _userItemId: propCollection._userItemId, _userType: propCollection._userType},
               field: `properties.${property.key}.val`,
               query: propSetQuery
            }
         }

         IafItemSvc.searchRelatedItems(query, ctx).then((res) => {
            setStringPropVals(res._list[0]._versions[0]._relatedItems[`properties.${property.content}.val`])
            setIsDisabled(false)
         })
      }

      setIsDisabled(false)

   }

   return <div className={styles.filterByPropValueBody}>
         <label id={`${propertyType} | ${property.value}`} className={styles.label}>{`${propertyType} | ${property.value}`}</label>

         {property.valueType === 'STRING' && stringPropVals && !!stringPropVals.length && <Dropdown
            className='propertyDrop'
            aria-labelledby={`${propertyType} | ${property.value}`}
            placeholder="Select values to filter by"
            multiselect={true}
            disabled={isDisabled}
            inlinePopup={true}
            selectedOptions={selectedStringPropVals || []}
            onOptionSelect={(e, data) => handleSelect(data)}
            value={selectedStringPropVals ? selectedStringPropVals.join(', ') : ''}
         >
            {stringPropVals && stringPropVals.map((sp) => <Option key={sp} value={sp}>{sp}</Option>)}
         </Dropdown>}
         {(property.valueType === 'STRING' && !!stringPropVals && stringPropVals.length === 0) && <div className={styles.novalues}>Property has no values</div>}
         
         {numValueTypes.includes(property.valueType) && <FilterNumberInput id={`${propertyType} | ${property.value}`} onChange={handleSelect}/>}

         {['DATE', 'BOOLEAN'].includes(property.valueType) && <div className={styles.novalues}>Property is not yet supported for filtering</div>}
   </div>
}

FilterPropByValue.propTypes = {
   property: PropTypes.object,
   propertyType: PropTypes.string,
   onSelect: PropTypes.func
}

export default FilterPropByValue