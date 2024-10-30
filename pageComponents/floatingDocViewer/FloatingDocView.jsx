// version dtf-1.0

import React, { useState, useEffect, createContext } from 'react'

import { IafFileSvc, IafProj } from '@dtplatform/platform-api'

import FloatingDocViewer from './components/FloatingDocViewer'
import UploadDocButton from './components/UploadDocButton'
import FileList from './components/FileList'

import './FloatingDocView.scss'

export const FilesContext = createContext()

const SimpleDocView = (props) => {

   // the complete list of files in the current project loaded from the File Service
   // minus the files related to the 3D/2D models that may exist
   const [ files, setFiles ] = useState([])

   // the list of files selected to be displayed in the doc viewer
   const [ selectedFiles, setSelectedFiles ] = useState([])

   useEffect(() => {
      loadFiles()
   }, [])

   const loadFiles = async () => {

      let project = IafProj.getCurrent()
		const allFileSearchCriteria = {
			_namespaces: project._namespaces,
			_parents: 'root'
		}

      // https://twinit.dev/docs/apis/javascript/iaffilesvc#getfiles
      // the last parameter when true will return a url to the file fro download
      let allFiles =  await IafFileSvc.getFiles(allFileSearchCriteria, null, {page: {_pageSize: 1000}}, true)

      // remove the .bimpk and geometryData files from the list
      setFiles(allFiles._list.filter(f => !f._name.includes('.bimpk') && !f._name.includes('geometryData')))
   }
   
   return <FilesContext.Provider value={{files, selectedFiles, setSelectedFiles, loadFiles}}>
      <div className='simple-doc-view'>
         <div className='viewer'>
            {!!selectedFiles.length && <FloatingDocViewer
               docIds={selectedFiles.map(sf => { return { _fileId: sf._id} })}
   
    
            />}
         </div>
         <div className='viewer-sidebar'>
            <UploadDocButton />
            <FileList />
         </div>
      </div>
   </FilesContext.Provider>

}

export default SimpleDocView