import * as React from "react"
import { useState, useEffect, useContext } from 'react'
import PropTypes from "prop-types"
import { Dropdown, Option, makeStyles, tokens } from "@fluentui/react-components"

import { TwinitContext } from '../../../App'
import { ModelContext } from '../../Addin'

import { IafItemSvc } from '@dtplatform/platform-api'

const useStyles = makeStyles({
   modelPicker: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "10px"
   },
   noModels: {
      color: tokens.colorStatusDangerForeground1,
      fontSize: tokens.fontSizeBase200
   }
})

const ModelPicker = (props) => {

   const styles = useStyles()

   const { getTwinitCtx, workspace } = useContext(TwinitContext)
   const { selectedModel, setSelectedModel } = useContext(ModelContext)

   const [ allModels, setAllModels ] = useState()

   useEffect(() => {
      getImportedModels()
   }, [workspace])

   const getImportedModels = () => {

      if (workspace) {
         IafItemSvc.getNamedUserItems({query: {_itemClass: 'NamedCompositeItem', _userType: 'bim_model_version'}}, getTwinitCtx()).then((compItems) => {
            setAllModels(compItems._list)
         })
      }

   }

   const handleModelChange = (e, option) => {
      setSelectedModel(allModels.find(m => m._id === option.optionValue))
   }

   return (
      <div className={styles.modelPicker}>
         <Dropdown
            className={styles.modSelect}
            aria-labelledby="model-drop"
            placeholder="Select a Model"
            onOptionSelect={handleModelChange}
            disabled={!workspace || !allModels}
            value={selectedModel ? selectedModel._name : ''}
         >
            {allModels && allModels.map((ws) => <Option key={ws._name} value={ws._id}>{ws._name}</Option>)}
        </Dropdown>
        {selectedModel && <div>Version {selectedModel._tipVersion} of {selectedModel._versionsCount}</div>}
        {allModels && !allModels.length && <div className={styles.noModels}>No Models Found</div>}
      </div>
   );
};

ModelPicker.propTypes = {

}

export default ModelPicker
