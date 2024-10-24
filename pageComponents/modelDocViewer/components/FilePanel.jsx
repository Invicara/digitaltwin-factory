import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

import { IafProj, IafItemSvc } from '@dtplatform/platform-api'
import { IafScriptEngine } from '@dtplatform/iaf-script-engine'

import UploadFileButton from './UploadFileButton'
import FileItemList from './FileItemList'
import FloatingModelDocViewer from './FloatingModelDocViewer'

import { ModelContext } from '../ModelDocView'

export const FileItemContext = createContext()

const FilePanel = ({selectedElement}) => {

   const { selectedModelElementsCollection } = useContext(ModelContext)

   const [ rootContainer, setRootContainer ] = useState()

   const [ fileItems, setFileItems ] = useState([])
   const [ selectedFileItems, setSelectedFileItems ] = useState([])

   useEffect(() => {
      getRootContainer()
   }, [])

   useEffect(() => {
      if (selectedElement && rootContainer) loadFileItems()
   }, [selectedElement, rootContainer])

   const getRootContainer = async () => {
      let project = await IafProj.getCurrent()
      let containers = await IafProj.getFileContainers(project._id)
     setRootContainer(containers._list.find(c => c._name === 'Root Container'))
   }

   const loadFileItems = async () => {

      // query the element collection as the parent
      // and follow relationships to any related documents
      let selectedModelElements = await IafScriptEngine.findWithRelated({
         parent: { 
            query: {package_id: selectedElement.package_id},
            collectionDesc: {_userItemId: selectedModelElementsCollection._userItemId, _userType: selectedModelElementsCollection._userType},
         },
         related: [
            {
               relatedDesc: { _relatedUserType: rootContainer._userType},
               as: 'documents'
            }
         ]
      })

      setFileItems(selectedModelElements._list[0].documents._list)
   }

   return <FileItemContext.Provider value={{rootContainer, loadFileItems, fileItems, selectedFileItems, setSelectedFileItems}}>
      <div className='file-panel'>
         {rootContainer && selectedElement && <UploadFileButton selectedElement={selectedElement} />}
         <FileItemList />
      </div>
      {!!selectedFileItems.length && createPortal(<FloatingModelDocViewer docIds={selectedFileItems.map(sf => { return { _fileId: sf._fileId} })}
         position={{x: 0, y: 0}}
      />, document.getElementById('simple-viewer-view'))}
   </FileItemContext.Provider>
}

export default FilePanel