import React, { useContext, useState } from 'react'

import { makeStyles, Button } from '@fluentui/react-components'

import { TwinitContext } from '../../../App'
import { ModelContext } from '../../Addin'

import { IafItemSvc } from '@dtplatform/platform-api'

const useStyles = makeStyles({
   reportButtonsTop: {
      display: "flex",
      flexDirection: "column",
      alignContent: "center",
      width: "100%",
      marginBottom: "50px",
      marginTop: "10px"
   },
   reportButtons: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-evenly"
   },
   button: {
      width: "40%"
   }
})

const ReportButtons =({query, ids, disabled}) => {

   const styles = useStyles()

   const { getTwinitCtx } = useContext(TwinitContext)
   const { modelTotalElements, selectedTypeProps, selectedInstProps } = useContext(ModelContext)

   const [ errorMsg, setErrorMsg ] = useState()
   const [ busy, setBusy ] = useState(false)

   const writeToSheet = async (sheet) => {

      setErrorMsg(null)
      setBusy(true)

      let tableData = await queryModel()

      let activeSheet, activeRange

      if (sheet === 'new') {
         try {
            await Excel.run(async (context) => {

               const sheets = context.workbook.worksheets

               activeSheet = sheets.add()
               activeSheet.load('name, position')
               activeSheet.activate()

               activeRange = activeSheet.getRange('A1')
               activeRange.load('address')
               activeRange.select()

               await context.sync()

               let tableRange = activeRange.getAbsoluteResizedRange(1, tableData.columns)
               tableRange.load('address')

               await context.sync()

               let tableName = "ModelReport"+Math.floor(Math.random()*1001).toString()

               let modelTable = activeSheet.tables.add(tableRange.address, true)
               modelTable.name = tableName

               modelTable.getHeaderRowRange().values = [tableData.headers]
               modelTable.rows.add(null, tableData.rowData, true)

               if (Office.context.requirements.isSetSupported("ExcelApi", "1.2")) {
                  activeSheet.getUsedRange().format.autofitColumns();
                  activeSheet.getUsedRange().format.autofitRows();
               }

               await context.sync()
            });
         } catch (error) {
            console.log("Error creating new sheet: " + error)
            console.log("tableData -->", tableData)
            setErrorMsg('Error creating new sheet')
            return
         }
      } else {
         try {
            await Excel.run(async (context) => {
               activeSheet = context.workbook.worksheets.getActiveWorksheet()
               activeSheet.load('name, position')
               activeRange = context.workbook.getSelectedRange()
               activeRange.load('address')

               await context.sync()

               if (activeRange.address.includes(':')) {
                  throw('Range Selected')
               }

               let tableRange = activeRange.getAbsoluteResizedRange(1, tableData.columns)
               tableRange.load('address')

               await context.sync()

               let tableName = "ModelReport"+Math.floor(Math.random()*1001).toString()

               let modelTable = activeSheet.tables.add(tableRange.address, true)
               modelTable.name = tableName
               modelTable.getHeaderRowRange().values = [tableData.headers]
               modelTable.rows.add(null, tableData.rowData, true)

               await context.sync()

            });
         } catch (error) {
            console.log("Error getting range on active sheet: " + error)

            if (error === 'Range Selected')
               setErrorMsg('Select an individual cell at which to insert the table')

            setBusy(false)
            return
         }

      }

      setBusy(false)

   }

   const queryModel = async () => {

      let ctx = getTwinitCtx()

      let _pageSize = 1000
      let totalPages = ids ? Math.floor(ids.length/_pageSize)+1 : Math.floor(modelTotalElements/_pageSize)+1

      let pages = []

      for (let i = 0 ; i < totalPages; i++) {
         pages.push({_offset: i*_pageSize, _pageSize, idList: ids ? ids.slice(i*_pageSize, i*_pageSize+_pageSize) : []})
      }

      let allPromises = []
      let results = []

      for (let i = 0; i < pages.length; i++) {

         let pagedQuery = structuredClone(query)
        
         pagedQuery['$findWithRelated'].relatedFilter.includeResult = true

         if (ids) {
            pagedQuery['$findWithRelated'].parent.query = {_id: {$in: pages[i].idList}}
            pagedQuery['$findWithRelated'].parent.options.page = {_offset: 0, _pageSize: pages[i].idList.length}
         } else {
            pagedQuery['$findWithRelated'].parent.options.page = {_offset: pages[i]._offset, _pageSize: pages[i]._pageSize}
         }

         allPromises.push(IafItemSvc.searchRelatedItems(pagedQuery, ctx). then((res) => {
            results.push(...res._list[0]._versions[0]._relatedItems._list)
         }))
      }

      await Promise.all(allPromises)

      console.log('results', results)
      let tableData = convertItemsToTableData(results)
      console.log('tableData', tableData)

      return tableData

   }

   const convertItemsToTableData = (items) => {

      let selectedTypePropsOnly = selectedTypeProps ? selectedTypeProps.filter(stp => stp.parentValue) : []
      let selectedInstPropsOnly = selectedInstProps ? selectedInstProps.filter(sip => sip.parentValue) : []

      let columns = selectedTypePropsOnly.length + selectedInstPropsOnly.length + 1

      let rows = items.length + 1

      let headers = ['_id', ...selectedTypePropsOnly.map(stp => stp.value), ...selectedInstPropsOnly.map(stp => stp.value)]

      let rowData = items.map((i) => {
         let row = []
         row.push(i._id)
         selectedTypePropsOnly.forEach(stp => row.push(getActualPropVal(i.typeProps._list[0].properties, stp.key)))
         selectedInstPropsOnly.forEach(sip => row.push(getActualPropVal(i.instanceProps._list[0].properties, sip.key)))
         return row
      })

      let tableData = {
         columns,
         rows,
         headers,
         rowData
      }

      return tableData
   }

   const getActualPropVal = (properties, key) => {

      // a property can:
      // 1. Not exist for an element => show as blank
      // 2. Exist but have no value => show as blank
      // 3. Exist and have a value => show value

      let emptyValue = ''

      if (Object.hasOwn(properties, key)) {
         if (Object.hasOwn(properties[key], 'val')) {
            if (typeof properties[key].val === 'boolean') {
               return properties[key].val.toString()
            } else {
               return properties[key].val
            }
         } else {
            return emptyValue
         }
      }
      else {
         return emptyValue
      }

   }

   return <div className={styles.reportButtonsTop}>
      <div className={styles.reportButtons}>
         <Button appearance="outline"size="medium"  onClick={() => writeToSheet('insert')} disabled={busy || disabled}>
            Insert at Selection
         </Button>
         <Button appearance="outline"size="medium" onClick={() => writeToSheet('new')} disabled={busy || disabled}>
            Insert New Sheet
         </Button>
      </div>
      {errorMsg && <div>{errorMsg}</div>}
   </div>

}

export default ReportButtons