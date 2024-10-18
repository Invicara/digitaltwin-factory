import React, { useContext } from 'react'

import './FileList.scss'

import { FilesContext } from '../SimpleDocView'

const FileList = (props) => {

   let { files, selectedFiles, setSelectedFiles } = useContext(FilesContext)

   const handleCheckbox = (e, f) => {

      if (e.currentTarget.checked) {
         // add a file to selectedFiles when checked
         setSelectedFiles([...selectedFiles, f])
      } else {
         // remove a file from selectedFiles when unchecked
         setSelectedFiles( selectedFiles.filter(sf => sf._id !== f._id))
      }

   }

   return <table className='file-list-table'>
      <colgroup>
         <col style={{width:'10%'}} />
         <col />
      </colgroup>
      <thead>
         <tr>
            <th colSpan='2'>View Files</th>
         </tr>
      </thead>
      <tbody>
         {files.sort((a,b) => a._name.localeCompare(b._name)).map(f => <tr key={f._id}>
            <td><input type="checkbox" onChange={(e) => handleCheckbox(e, f)} checked={!!selectedFiles.find(sf => sf._id === f._id)}></input></td>
            <td><a href={f._url}>{f._name}</a></td>
         </tr>)}
      </tbody>
   </table>

   
}

export default FileList