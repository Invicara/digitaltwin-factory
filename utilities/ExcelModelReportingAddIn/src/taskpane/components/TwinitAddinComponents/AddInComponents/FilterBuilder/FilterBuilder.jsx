import React, { useEffect, useState, useContext } from 'react'
import propTypes from 'prop-types'

import { makeStyles } from "@fluentui/react-components"

import { ModelContext, QueryContext } from '../../Addin'

import SectionToggle from '../SectionToggle'
import FilterPropMultiSelect from './FilterPropMultiSelect'
import FilterPropByValue from './FilterPropByValue'

const useStyles = makeStyles({
   filterBuilderTop: {
      width: "100%",
   },
   filterSep: {
      width: "80%",
      backgroundColor: "#f49911",
      color: "#f49911",
      borderTop: "1px solid #f49911" 
   },
   filterBottom: {
      borderTop: "2px solid #f49911",
      width: "100%"
   }
})

const useSectionStyles = makeStyles({
   ruledText: {
      width: "100%",
      textAlign: "center",
      borderBottom: "2px solid #f49911",
      lineHeight: "0.1rem",
      margin: "10px 0px 20px 0px",
      color: "#f49911"
   }
})

const FilterBuilder = (props) => {

   const styles = useStyles()
   const sectionStyles = useSectionStyles()

   const { selectedModel, selectedTypeProps, selectedInstProps } = useContext(ModelContext)

   const { typePartials, instPartials, setTypePartials, setInstPartials } = useContext(QueryContext)

   const [ filteredTypeProps, setFilteredTypeProps ] = useState()
   const [ filteredInstProps, setFilteredInstProps ] = useState()

   const [ filterOnTypeProps, setFilterOnTypeProps ] = useState()
   const [ filterOnInstProps, setFilterOnInstProps ] = useState()

   useEffect(() => {

      if (selectedModel) {
         setFilterOnTypeProps(null)
         setFilterOnInstProps(null)
         setTypePartials({})
         setInstPartials({})
         setFilteredTypeProps(null)
         setFilteredInstProps(null)
      }

   }, [selectedModel])

   useEffect(() => {
      if (selectedTypeProps) {
         let onlyProps = selectedTypeProps.filter(p => p.parentValue)

         if (filterOnTypeProps) {
            let updatedFilteredOnTypeProps = filterOnTypeProps.filter(ftp => !!onlyProps.find(op => op.value === ftp.value))

            let updatedTypePartials = structuredClone(typePartials)
            let partialTypeKeys = Object.keys(typePartials)
            partialTypeKeys.forEach((ptk) => {
               if (!updatedFilteredOnTypeProps.find(p => p.key === ptk)) {
                  updatedTypePartials[ptk] = null
                  setTypePartials(updatedTypePartials)
               }
            })

            setFilterOnTypeProps(updatedFilteredOnTypeProps)
         }

         setFilteredTypeProps(onlyProps)
      }
   }, [selectedTypeProps])

   useEffect(() => {
      if (selectedInstProps) {
         let onlyProps = selectedInstProps.filter(p => p.parentValue)

         if (filterOnInstProps) {
            let updatedFilteredOnInstProps = filterOnInstProps.filter(fip => !!onlyProps.find(op => op.value === fip.value))

            let updatedInstPartials = structuredClone(instPartials)
            let partialInstKeys = Object.keys(instPartials)
            partialInstKeys.forEach((pik) => {
               if (!updatedFilteredOnInstProps.find(p => p.key === pik)) {
                  updatedInstPartials[pik] = null
                  setInstPartials(updatedInstPartials)
               }
            })

            setFilterOnInstProps(updatedFilteredOnInstProps)
         }

         setFilteredInstProps(onlyProps)
      }
   }, [selectedInstProps])

   const onSelect = (propertyType, propInfos) => {

      let sourceProps, setFunc, partials
      if (propertyType === 'type') {
         sourceProps = selectedTypeProps
         setFunc = setFilterOnTypeProps
         partials = typePartials
      } else {
         sourceProps = selectedInstProps
         setFunc = setFilterOnInstProps
         partials = instPartials
      }

      let filterProps = sourceProps.filter(sp => propInfos.includes(sp.value))
      let partialKeys = Object.keys(partials)
      partialKeys.forEach((pk) => {
         if (!filterProps.find(fp => fp.key === pk)) {
            receiveQueryPartials({key: pk}, propertyType, null)
         }
      })
      setFunc(filterProps)

   }

   const receiveQueryPartials = (property, propertyType, partial) => {

      let updatedPartials, setFunc
      if (propertyType === 'type') {
         updatedPartials = structuredClone(typePartials)
         setFunc = setTypePartials
      } else {
         updatedPartials = structuredClone(instPartials)
         setFunc = setInstPartials
      }

      updatedPartials[property.key] = partial
      setFunc(updatedPartials)
   }

   return <div className={styles.filterBuilderTop}>
      {(selectedInstProps || selectedTypeProps) && <SectionToggle label='Filter Report' propStyles={sectionStyles} />}
      <FilterPropMultiSelect
         properties={filteredTypeProps}
         label="Add Type Props to Filter"
         placeholder="Select Type Properties"
         id='filter-type-props'
         onSelect={(propInfos) => onSelect('type', propInfos)}
      />
      <FilterPropMultiSelect
         properties={filteredInstProps}
         label="Add Instance Props to Filter"
         placeholder="Select Instance Properties"
         id='filter-inst-props'
         onSelect={(propInfos) => onSelect('instance', propInfos)}
      />
      {(filterOnTypeProps || filterOnInstProps) && <hr className={styles.filterSep} />}
      {filterOnTypeProps && filterOnTypeProps.map(ftp => <FilterPropByValue key={ftp.value} 
         property={ftp} 
         propertyType='type' 
         onSelect={receiveQueryPartials} 
      />)}
      {filterOnInstProps && filterOnInstProps.map(fip => <FilterPropByValue key={fip.value} 
         property={fip} 
         propertyType='instance'
         onSelect={receiveQueryPartials} 
      />)}
      {(selectedInstProps || selectedTypeProps) && <hr className={styles.filterBottom} />}
   </div>

}

FilterBuilder.propTypes = {

}

export default FilterBuilder