import React from 'react'

import { useSelector } from 'react-redux'

import './PropertyTable.scss'

const PropertyTable = () => {

   const selectedElement = useSelector((state) => state.modelSlice.selectedElement)

   return <table className='element-info-table'>
   {!selectedElement && <tbody>
      <tr>
         <td colSpan='2'>No Selected Element</td>
      </tr>
   </tbody>}
   {selectedElement && <tbody>
      <tr>
         <td className='prop-name'>Package Id</td>
         <td>{selectedElement.package_id}</td>
      </tr>
      <tr>
         <td className='prop-name'>Revit Family</td>
         <td>{selectedElement.revitFamily?.val}</td>
      </tr>
      <tr>
         <td className='prop-name'>Revit Type</td>
         <td>{selectedElement.revitType?.val}</td>
      </tr>
      <tr>
         <td colSpan='2' className='prop-type'>Type Properties</td>
      </tr>
      {Object.keys(selectedElement.typeProperties).sort().map((tp, i) => <tr key={`t${i}`}>
         <td className='prop-name'>{selectedElement.typeProperties[tp].dName}</td>
         <td>{selectedElement.typeProperties[tp].val}</td>
      </tr>)}
      <tr>
         <td colSpan='2' className='prop-type'>Instance Properties</td>
      </tr>
      {Object.keys(selectedElement.instanceProperties).sort().map((ip, i) => <tr key={`t${i}`}>
         <td className='prop-name'>{selectedElement.instanceProperties[ip].dName}</td>
         <td>{selectedElement.instanceProperties[ip].val}</td>
      </tr>)}
   </tbody>}
</table>
}

export default PropertyTable