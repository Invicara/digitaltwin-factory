import React, { useEffect, useState, useContext } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, tokens, Dropdown, Option } from "@fluentui/react-components"

const useStyles = makeStyles({
   filterBuilderBody: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      marginBottom: "10px"
   },
   label: {
      fontWeight: tokens.fontWeightBold
   }
})

const FilterPropMultiSelect = ({properties, label, placeholder, id, onSelect}) => {

   const styles = useStyles()

   const [ selectedProps, setSelectedProps] = useState()
   const [ isDisabled, setIsDisabled ] = useState(false)

   const handlePropSelect = (e, data) => {

      setSelectedProps(data.selectedOptions)
      if (onSelect) onSelect(data.selectedOptions)
   }

   useEffect(() => {
      
      if (properties && selectedProps && selectedProps.length) {
         setIsDisabled(true)
         let allPropValues = properties.map(p => p.value)
         setSelectedProps(selectedProps.filter(sp => allPropValues.includes(sp)))
         setIsDisabled(false)
      }

   }, [properties])

   return <div>
      {properties && <div className={styles.filterBuilderBody}>
            <label id={id} className={styles.label}>{label}</label>
            <Dropdown
               className='propertyDrop'
               aria-labelledby={id}
               placeholder={placeholder}
               multiselect={true}
               onOptionSelect={handlePropSelect}
               selectedOptions={selectedProps || []}
               value={selectedProps ? selectedProps.join(', ') : ''}
               disabled={isDisabled}
               inlinePopup={true}
            >
               {properties && properties.map((p) => <Option key={p.value} value={p.value}>{p.value}</Option>)}
            </Dropdown>
         </div>}
   </div>


}

FilterPropMultiSelect.propTypes = {
   properties: PropTypes.array,
   label: PropTypes.string,
   placeholder: PropTypes.string,
   id: PropTypes.string
}

export default FilterPropMultiSelect