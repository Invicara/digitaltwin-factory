import * as React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import PropTypes from "prop-types"
import { makeStyles } from "@fluentui/react-components"

import ProjectModelPicker from './AddInComponents/ProjectModelPicker/ProjectModelPicker'
import ModelPropSelect from './AddInComponents/ModelPropSelect/ModelPropSelect'
import FilterBuilder from "./AddInComponents/FilterBuilder/FilterBuilder"
import QueryMaker from "./AddInComponents/QueryMaker/QueryMaker"

import { TwinitContext } from '../App'

export const ModelContext = createContext()
export const QueryContext = createContext()

const useStyles = makeStyles({
   addinBody: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "0px 10px 10px 10px"
   }
})

const Addin = (props) => {

   const styles = useStyles()

   const { workspace } = useContext(TwinitContext)

   // Model Context
   const [ selectedModel, setSelectedModel ] = useState()
   const [ modelElementsCollection, setModelElementsCollection ] = useState()
   const [ modelTypePropCollection, setModelTypePropCollection ] = useState()
   const [ modelInstPropCollection, setModelInstPropCollection ] = useState()
   const [ modelTotalElements, setModelTotalElements ] = useState()
   const [ selectedTypeProps, setSelectedTypeProps ] = useState()
   const [ selectedInstProps, setSelectedInstProps ] = useState()

   // Query Context
   const [ typePartials, setTypePartials ] = useState({})
   const [ instPartials, setInstPartials ] = useState({})

   useEffect(() => {
      setSelectedModel(null)
   }, [workspace])

   const receiveSelectedProps = (typeOfProp, selections) => {
      if (typeOfProp === 'type') {
         setSelectedTypeProps(selections)
      } else {
         setSelectedInstProps(selections)
      }
   }

   return (
      <ModelContext.Provider value={{
         selectedModel,
         modelElementsCollection,
         modelTypePropCollection,
         modelInstPropCollection,
         modelTotalElements,
         selectedTypeProps,
         selectedInstProps,
         setSelectedModel, 
         setModelElementsCollection, 
         setModelTypePropCollection,
         setModelInstPropCollection,
         setModelTotalElements }}
      >
         <QueryContext.Provider value={{
            typePartials,
            instPartials,
            setTypePartials,
            setInstPartials
         }}>
            <div className={styles.addinBody}>
               <ProjectModelPicker />
               <ModelPropSelect onSelect={receiveSelectedProps}/>
               <FilterBuilder />
               <QueryMaker />
            </div>
         </QueryContext.Provider>
      </ModelContext.Provider>
   )
}

Addin.propTypes = {
  
}

export default Addin
