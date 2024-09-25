import * as React from "react"
import { useState, useEffect, useContext } from 'react'
import PropTypes from "prop-types"
import { Dropdown, Option, makeStyles, tokens } from "@fluentui/react-components"

import { TwinitContext } from '../../../App'
import { IafPassSvc } from '@dtplatform/platform-api'

const useStyles = makeStyles({
   projectPicker: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "10px"
   },
   noWorkspaces: {
      color: tokens.colorStatusDangerForeground1,
      fontSize: tokens.fontSizeBase200
   }
})

const ProjectPicker = (props) => {

   const styles = useStyles()

   const { getTwinitCtx, workspace, setWorkspace } = useContext(TwinitContext)

   const [ allWorkspaces, setAllWorkspaces ] = useState()

   useEffect(() => {
      getWorkspaces()
   }, [])

   const getWorkspaces = () => {

      IafPassSvc.getWorkspaces({}, getTwinitCtx(), {_pageSize: 1000}).then((worksps) => {
         setAllWorkspaces(worksps._list)
      })

   }

   const handleWorkspaceChange = (e, option) => {

      setWorkspace(allWorkspaces.find(ws => ws._id === option.optionValue))
   }

   return (
      <div className={styles.projectPicker}>
         <Dropdown
            className={styles.projSelect}
            aria-labelledby="workspace-drop"
            placeholder="Select a Workspace"
            onOptionSelect={handleWorkspaceChange}
            disabled={allWorkspaces && !allWorkspaces.length}
            value={workspace ? workspace._name : ''}
         >
            {allWorkspaces && allWorkspaces.map((ws) => <Option key={ws._name} value={ws._id}>{ws._name}</Option>)}
        </Dropdown>
        {allWorkspaces && !allWorkspaces.length && <div className={styles.noWorkspaces}>No Workspaces Found</div>}
      </div>
   );
};

ProjectPicker.propTypes = {
  
}

export default ProjectPicker
