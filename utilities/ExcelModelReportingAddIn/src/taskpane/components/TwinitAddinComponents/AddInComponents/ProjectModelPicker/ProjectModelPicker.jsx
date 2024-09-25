import * as React from "react"
import { useState, useEffect, useContext } from 'react'
import PropTypes from "prop-types"
import { makeStyles, tokens, Text } from "@fluentui/react-components"

import ProjectPicker from "./ProjectPicker"
import ModelPicker from"./ModelPicker"
import SectionToggle from "../SectionToggle"

import { ModelContext } from '../../Addin'

const useStyles = makeStyles({
   projectModelPicker: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "5px 10px 5px 10px",
      width: "100%"
   },
   pickerCtrls: {
      width: "100%"
   },
   collapsedContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
   },
   rule: {
      width: "100%",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
   }
})

const useSectionStyles = makeStyles({
   ruledText: {
      width: "100%",
      textAlign: "center",
      borderBottom: "2px solid #C71784",
      lineHeight: "0.1rem",
      margin: "10px 0px 20px 0px",
      color: "#C71784"
   }
})

const ProjectModelPicker = (props) => {

   const styles = useStyles()
   const sectionStyles = useSectionStyles()

   const { selectedModel } = useContext(ModelContext)

   const [ collapsed, setCollapsed ] = useState(false)

   return (
      <div id='projectmodelpicker' className={styles.projectModelPicker}>
         <SectionToggle label='Select Model' collapsed={collapsed} setCollapsed={setCollapsed} propStyles={sectionStyles}/>
         {!collapsed && <div id='projectmodelpicker_ctrls' className={styles.pickerCtrls}>
            <ProjectPicker />
            <ModelPicker />
         </div>}
         {collapsed && <div id='projectmodelpicker_collapsed' className={styles.collapsedContainer}>
            {selectedModel && <div><Text>{selectedModel._name}</Text></div>}
            {!selectedModel && <div><Text>Expand to select a Model</Text></div>}
         </div>}
      </div>
   )
}

ProjectModelPicker.propTypes = {
  
}

export default ProjectModelPicker
