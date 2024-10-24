import React, { useContext } from 'react'

import './FileItemList.scss'

import { FileItemContext } from './FilePanel'

const FileList = (props) => {

   let { fileItems, selectedFileItems, setSelectedFileItems } = useContext(FileItemContext)

   const handleCheckbox = (e, f) => {

      if (e.currentTarget.checked) {
         // add a file to selectedFiles when checked
         setSelectedFileItems( [...selectedFileItems, f] )
      } else {
         // remove a file from selectedFiles when unchecked
         setSelectedFileItems( selectedFileItems.filter(sf => sf._id !== f._id) )
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
         {fileItems.sort((a,b) => a._name.localeCompare(b._name)).map(f => <tr key={f._id}>
            <td><input type="checkbox" onChange={(e) => handleCheckbox(e, f)} checked={!!selectedFileItems.find(sf => sf._id === f._id)}></input></td>
            <td>{f.name}</td>
            <td>{f.tipVersionNumber}</td>
         </tr>)}
      </tbody>
   </table>
}

export default FileList