import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectDocument, unselectDocument } from '../../../redux/documentsSlice'

import './FileItemList.scss'

const FileList = () => {

   const fileItems = useSelector((state) => state.documentsSlice.allDocuments)
   const selectedFileItems = useSelector((state) => state.documentsSlice.selectedDocuments)
   const dispatch = useDispatch()

   const handleCheckbox = (e, f) => {

      if (e.currentTarget.checked) {
         // add a file to selectedFiles when checked
         dispatch(selectDocument(f))
      } else {
         // remove a file from selectedFiles when unchecked
         dispatch(unselectDocument(f))
      }

   }

   return <table className='file-list-table'>
      <colgroup>
         <col style={{width:'10%'}} />
         <col />
         <col style={{width:'15%'}} />
      </colgroup>
      <thead>
         <tr>
            <th colSpan='2'>Related Files</th>
            <th>ver</th>
         </tr>
      </thead>
      <tbody>
         {!fileItems.length && <tr><td colSpan='3'>No Files Attached to Element</td></tr>}
         {fileItems.map(f => <tr key={f._id}>
            <td><input type="checkbox" onChange={(e) => handleCheckbox(e, f)} checked={!!selectedFileItems.find(sf => sf._id === f._id)}></input></td>
            <td>{f.name}</td>
            <td>{f.tipVersionNumber}</td>
         </tr>)}
      </tbody>
   </table>
}

export default FileList