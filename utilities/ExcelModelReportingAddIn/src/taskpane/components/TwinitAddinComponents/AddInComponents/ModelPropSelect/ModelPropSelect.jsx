import * as React from "react"
import { useState, useEffect, useContext } from 'react'
import PropTypes from "prop-types"
import { makeStyles, Spinner, Text } from "@fluentui/react-components"

import { TwinitContext } from '../../../App'
import { ModelContext } from '../../Addin'

import SelectableTree from "../SelectableTree"
import SectionToggle from "../SectionToggle"

import { IafItemSvc } from '@dtplatform/platform-api'

const useStyles = makeStyles({
   queryCtrls: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
   }
})

const useSectionStyles = makeStyles({
   ruledText: {
      width: "100%",
      textAlign: "center",
      borderBottom: "2px solid #00a99e",
      lineHeight: "0.1rem",
      margin: "10px 0px 20px 0px",
      color: "#00a99e"
   }
})


const ModelPropSelect = ({onSelect}) => {

   const styles = useStyles()
   const sectionStyles = useSectionStyles()

   const { selectedModel, 
      setModelElementsCollection, 
      setModelTypePropCollection, 
      setModelInstPropCollection,
      setModelTotalElements } = useContext(ModelContext)

   const { getTwinitCtx } = useContext(TwinitContext)

   const [ loadingModel, setLoadingModel ] = useState(false)

   const [ instProps, setInstProps ] = useState()
   const [ typeProps, setTypeProps ] = useState()

   useEffect(() => {

      if (selectedModel) {
         setInstProps(null)
         setTypeProps(null)
         setModelTotalElements(null)
         onSelect('type', null)
         onSelect('instance', null)
         getModelCompositeItems()
      }

   }, [selectedModel])

   const getAllPropsInCollection = async (collection, twinitCtx) => {

      let _pageSize = 1000
      let _offset = 0
      let _total = 1

      let properties = []
      let propSetMap = {}
      let propMap = {}

      while (_offset < _total) {

         let page = await IafItemSvc.getRelatedItems(collection._userItemId, {}, twinitCtx, {
            project: {
               properties: 1
            },
            page: {_pageSize, _offset}
         })
         _total = page._total
         _offset += _pageSize
         
         page._list.forEach((type) => {
            Object.entries(type.properties).forEach(([key, value]) => {

               let propSetName = value.psDispName || 'No Property Set'
               let propMapName = `${propSetName} | ${value.dName}`

               if (!propSetMap[propSetName]) {
                  propSetMap[propSetName] = true
                  properties.push({value: propSetName, content: propSetName})
               }

               if (!propMap[propMapName]) {
                  propMap[propMapName]= true

                  properties.push({key, value: `${propSetName} | ${value.dName}`, parentValue: propSetName, content: value.dName, valueType: value.srcType})
               }
            })
         })

      }

      return properties

   }

   const getModelCompositeItems = async () => {

      setLoadingModel(true)

      const twinitCtx = getTwinitCtx()

      IafItemSvc.getRelatedInItem(selectedModel._userItemId, {}, twinitCtx).then(async (res) => {

         let elementColl = res._list.find(coll => coll._userType === 'rvt_elements')
         
         IafItemSvc.getRelatedItems(elementColl._userItemId, {}, twinitCtx, {page: {_pageSize: 0}}).then((count) => {
            setModelTotalElements(count._total)
         })

         let instPropColl = res._list.find(coll => coll._userType === 'rvt_element_props')
         let instProps = await getAllPropsInCollection(instPropColl, twinitCtx)
         let typePropsColl = res._list.find(coll => coll._userType === 'rvt_type_elements')
         let typeProps = await getAllPropsInCollection(typePropsColl, twinitCtx)
         
         setModelElementsCollection(elementColl)
         setModelInstPropCollection(instPropColl)
         setModelTypePropCollection(typePropsColl)
         setInstProps(instProps.sort((a,b) => a.value.localeCompare(b.value)))
         setTypeProps(typeProps.sort((a,b) => a.value.localeCompare(b.value)))
         setLoadingModel(false)
      })

   }

   return (
      <div id='ModelQuery' className={styles.queryCtrls} >
         {loadingModel && <Spinner label="Loading Model Version" labelPosition="below" />}
         {(!loadingModel && typeProps || instProps) && <SectionToggle label='Add Properties to Report' propStyles={sectionStyles}/>}
         {typeProps && <SelectableTree label='Type Properties' 
            items={typeProps}
            defaultCollapsed={true}
            onChange={(changes) => onSelect('type', changes)} 
         />}
         {instProps && <SelectableTree label='Instance Properties' 
            items={instProps} 
            defaultCollapsed={true}
            onChange={(changes) => onSelect('instance', changes)} 
         />}
      </div>
   )
}

ModelPropSelect.propTypes = {
   onSelect: PropTypes.func
}

export default ModelPropSelect
