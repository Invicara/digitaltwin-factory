import React from 'react'

import './ImportStatusList.scss'

const ImportStatusList = ({ data }) => {

return <ul className='import-status-list'>
   {data.map(item => <li key={item.id} className='import-status-list-item'>
      {item._name
          ? item._status + ': ' + item._name
          : (item.step_run_message === '{}' ? item.step_run_status + ' ' : '') +
            (item.step_run_message !== '{}' ? item.step_run_message : item.step_run_name)}
   </li>)}
</ul>


}

export default ImportStatusList