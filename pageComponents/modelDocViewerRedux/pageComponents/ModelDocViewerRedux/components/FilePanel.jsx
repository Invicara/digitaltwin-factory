import React, { useEffect, useContext } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import { loadFileItems } from '../../../redux/documentsSlice'

import UploadFileButton from './UploadFileButton'
import FileItemList from './FileItemList'

const FilePanel = () => {

   const rootContainer = useSelector((state) => state.documentsSlice.rootContainer)
   const selectedModelElementsCollection = useSelector((state) => state.modelSlice.selectedModelElementCollection)
   const selectedElement = useSelector((state) => state.modelSlice.selectedElement)
   const dispatch = useDispatch()


   useEffect(() => {
      if (selectedElement && rootContainer) dispatch(loadFileItems({pkgid: selectedElement.package_id, selectedModelElementsCollection}))
   }, [selectedElement, rootContainer])


   return <div>
      <div className='file-panel'>
         {rootContainer && selectedElement && <UploadFileButton />}
         <FileItemList />
      </div>
   </div>
}

export default FilePanel