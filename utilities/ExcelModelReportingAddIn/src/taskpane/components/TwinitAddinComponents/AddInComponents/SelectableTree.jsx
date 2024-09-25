import * as React from "react"
import { useState } from "react"
import PropTypes from "prop-types"
import { makeStyles, FlatTree, FlatTreeItem, TreeItemLayout, useHeadlessFlatTree_unstable, tokens } from "@fluentui/react-components"

import SectionToggle from "./SectionToggle"

const useStyles = makeStyles({
   treeTop: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
   }
})

const SelectableTree = ({items, label, defaultCollapsed=false, onChange}) => {

   const styles = useStyles()

   const [ collapsed, setCollapsed ] = useState(defaultCollapsed)
   const [ checkedItems, setCheckedItems ] = useState([])

   const treeInfo = useHeadlessFlatTree_unstable(items, {
      selectionMode: 'multiselect',
      checkedItems
   });

   const allChildrenAreChecked = (parentValue, currentCheckedItems) => {

   let allChildItems = items.filter(i => i.parentValue === parentValue).map(i => i.value)

   return allChildItems.every(i => currentCheckedItems.find(ci => ci[0] === i))
   
   }

   const noChildrenAreChecked = (parentValue, currentCheckedItems) => {

      let allChildItems = items.filter(i => i.parentValue === parentValue).map(i => i.value)

      return !allChildItems.some(i => currentCheckedItems.find(ci => ci[0] === i))
   }

   const handleSelect = (e, data) => {

      let updatedChecks

      // if tree item is newly checked
      if (data.checked) {

         // add it to the list of checked items as checked
         updatedChecks = [...checkedItems]
         updatedChecks.push([data.value, true, data.itemType])

         // get the list of all existing checked values
         let existingCheckedValues = updatedChecks.map(i => i[0])

         if (data.itemType === 'branch') {

            // if the checked tree item is a branch check all child tree items
            // that are not already checked
            let childItems = items.filter(i => i.parentValue === data.value)
            
            childItems.forEach((c) => {
               if (!existingCheckedValues.includes(c.value)) {
                  updatedChecks.push([c.value, true, 'leaf'])
               }
            })

         } else {

            // if the checked tree item is a leaf
            let parent = data.value.split('|')[0].trim()
            updatedChecks = updatedChecks.filter(uc => uc[0] !== parent)

            if (allChildrenAreChecked(parent, updatedChecks)) {
               
               updatedChecks.push([parent, true, 'branch'])
               
            } else {
               updatedChecks.push([parent, 'mixed', 'branch'])
            }

         }
      } else {

         // if unchecked a tree item remove it from the checked list
         updatedChecks = checkedItems.filter(v => v[0] !== data.value)

         if (data.itemType === 'branch') {

            // if a branch was unchecked uncheck all child tree items
            let allChildItems = items.filter(i => i.parentValue === data.value).map(i => i.value)
            updatedChecks = updatedChecks.filter(ci => !allChildItems.includes(ci[0]))

         } else {

            let parent = data.value.split('|')[0].trim()

            updatedChecks = updatedChecks.filter(uc => uc[0] !== parent)

            // if no child items remain checked uncheck the parent
            if (!noChildrenAreChecked(parent, updatedChecks)) {
               
               updatedChecks.push([parent, 'mixed', 'branch'])

            }
         }

      }

      setCheckedItems(updatedChecks)

      if (onChange) {
         let checkedVals = updatedChecks.map(uc => uc[0])
         onChange(items.filter(i => checkedVals.includes(i.value)))
      }
      
   }

   return <div className={styles.treeTop}>
      <SectionToggle label={`${label} (${checkedItems.filter(ci => ci[2] !== 'branch').length})`} collapsed={collapsed} setCollapsed={setCollapsed} />
      {!collapsed && treeInfo && <FlatTree {...treeInfo.getTreeProps()} aria-label={label} onCheckedChange={handleSelect}>
         {Array.from(treeInfo.items(), (flatTreeItem) => {
            const { content, ...treeItemProps } = flatTreeItem.getTreeItemProps();
            return (
               <FlatTreeItem {...treeItemProps} key={flatTreeItem.value}>
                  <TreeItemLayout>{content}</TreeItemLayout>
               </FlatTreeItem>
            )
         })}
      </FlatTree>}
      
   </div>

}

SelectableTree.propTypes = {
   items: PropTypes.array,
   label: PropTypes.string,
   onChange: PropTypes.func
}

export default SelectableTree