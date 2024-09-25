import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types' 

import { makeStyles, tokens, Spinner } from '@fluentui/react-components'

import { useDebounce } from 'use-debounce'

import { IafItemSvc } from '@dtplatform/platform-api'

import ReportButtons from './ReportButtons'

import { TwinitContext } from '../../../App'
import { ModelContext } from '../../Addin'
import { QueryContext } from '../../Addin'

const useStyles = makeStyles({
   queryMakerTop: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      marginBottom: "10px"
   },
   queryMaker: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%"
   },
   textSpace: {
      marginLeft: "3px"
   },
   textSpaceValue: {
      marginLeft: "3px",
      fontWeight: tokens.fontWeightBold
   }
})

const QueryMaker = (props) => {

   const styles = useStyles()

   const { getTwinitCtx } = useContext(TwinitContext)
   const { modelTotalElements,
      modelElementsCollection,
      modelTypePropCollection,
      modelInstPropCollection,
      selectedTypeProps,
      selectedInstProps
    } = useContext(ModelContext)
   const { instPartials, typePartials } = useContext(QueryContext)
   
   const [ localQuery, setLocalQuery ] = useState()
   const [ debouncedQuery ] = useDebounce(localQuery, 1500)

   const [ isCounting, setIsCounting ] = useState(false)
   const [ queryCount, setQueryCount ] = useState()
   const [ queryIds, setQueryIds ] = useState()

   useEffect(() => {
      setBaseQuery()
   }, [])

   useEffect(() => {

      updateQuery()

   }, [instPartials, typePartials])

   useEffect(() => {

      getQueryCount()

   }, [debouncedQuery])

   useEffect(() => {
      setQueryCount(modelTotalElements)
   }, [modelTotalElements])

   useEffect(() => {
      setBaseQuery()
   }, [modelElementsCollection, modelInstPropCollection, modelTypePropCollection])

   const setBaseQuery = () => {

      if (modelElementsCollection && modelInstPropCollection && modelTypePropCollection) {
         let baseQuery ={
            $findWithRelated: {
               parent: {
                  collectionDesc: { _userItemId: modelElementsCollection._userItemId, _userType: modelElementsCollection._userType },
                  query: {},
                  options: {
                     project: {
                        _id: 1
                     }
                  }
               },
               relatedFilter: {
                  $and: [
                     {
                        relatedDesc: { _relatedUserType: modelInstPropCollection._userType },
                        options: {
                           project: {
                              properties: 1
                           }
                        },
                        as: "instanceProps"
                     },
                     {
                        relatedDesc: { _relatedUserType: modelTypePropCollection._userType },
                        options: {
                           project: {
                              properties: 1
                           }
                        },
                        as: "typeProps"
                     }
                  ]
               }
            }
         }
  
         setLocalQuery(baseQuery)
      }

   }

   const updateQuery = () => {

      setQueryIds(null)

      if (instPartials || typePartials) {
         // we only need to update the localQuery count if there are relatedFilters

         let validInstPartials = getValidPartials(instPartials)
         let validTypePartials = getValidPartials(typePartials)

         if (validInstPartials?.length || validTypePartials?.length) {

            let parent = {
               collectionDesc: { _userItemId: modelElementsCollection._userItemId, _userType: modelElementsCollection._userType },
               query: {},
               options: {
                  project: {
                     _id: 1
                  }
               }
            }

            let relatedFilter = {
               $and: []
            }

            relatedFilter.$and.push({
               relatedDesc: { _relatedUserType: modelInstPropCollection._userType },
               query: validInstPartials.length ? {$and: validInstPartials} : {},
               options: {
                  project: {
                     properties: 1
                  }
               },
               as: "instanceProps"
            })

            relatedFilter.$and.push({
               relatedDesc: { _relatedUserType: modelTypePropCollection._userType },
               query: validTypePartials.length ? {$and: validTypePartials} : {},
               options: {
                  project: {
                     properties: 1
                  }
               },
               as: "typeProps"
            })

            let newQuery = {
               $findWithRelated: {
                  parent,
                  relatedFilter
               }
            }

            setLocalQuery(newQuery)

         } else {
            setBaseQuery()
            setQueryIds(null)
         }
      }

   }

   const getQueryCount = async () => {

      if (debouncedQuery && hasRelatedFilters(debouncedQuery)) {
         setIsCounting(true)

         let ctx = getTwinitCtx()

         let _pageSize = 1000
         let totalPages = Math.floor(modelTotalElements/_pageSize)+1
         let pages = []

         let ids = []

         for (let i = 0 ; i < totalPages; i++) {
            pages.push({_offset: i*_pageSize, _pageSize})
         }

         let allCountPromises = []
         let filteredCounts = []

         for (let i = 0; i < pages.length; i++) {

            let pagedQuery = structuredClone(debouncedQuery)
            pagedQuery.$findWithRelated.parent.options.page = pages[i]

            allCountPromises.push(IafItemSvc.searchRelatedItems(pagedQuery, ctx). then((res) => {
               filteredCounts.push(res._list[0]._versions[0]._relatedItems._filteredSize)
               ids.push(...res._list[0]._versions[0]._relatedItems._list.map(l => l._id))
            }))
         }
         

         Promise.all(allCountPromises).then(() => {
            setQueryCount(filteredCounts.reduce((acc, curr) => acc + curr), 0)
            setQueryIds(ids)
            setIsCounting(false)

            console.log(ids)
         })
      } else {
         setQueryCount(modelTotalElements)
         setQueryIds(null)
         setIsCounting(false)
      }

   }

   const hasRelatedFilters = (queryToCheck) => {

      if (!queryToCheck)
         return false
      else
         return !!queryToCheck['$findWithRelated'].relatedFilter['$and'][0].query || !!queryToCheck['$findWithRelated'].relatedFilter['$and'][1].query

   }

   // filter the partials for null values and return valid partials 
   const getValidPartials = (partialsToTest) => {

      let queryPartials = Object.values(partialsToTest)
      return queryPartials ? queryPartials.filter(qp => qp && !!qp[Object.keys(qp)[0]]) : []

   }

   return <div className={styles.queryMakerTop}>
      {(selectedTypeProps || selectedInstProps) && <div className={styles.queryMakerTop}>
         <div className={styles.queryMaker}>
            {isCounting && <Spinner size='tiny' />}
            {!isCounting && <span className={styles.textSpaceValue}>{queryCount}</span>}
            <span className={styles.textSpace}>of</span>
            <span className={styles.textSpaceValue}>{modelTotalElements}</span>
            <span className={styles.textSpace}>total elements</span>
         </div>
         <ReportButtons query={debouncedQuery} ids={queryIds} disabled={isCounting}/>
      </div>}

   </div>
}

QueryMaker.propTypes = {

}

export default QueryMaker