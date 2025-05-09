import { CircleMarkup } from "./CircleMarkup"
import { TextMarkup } from "./TextMarkup"

// RGB settings for varous colors we use in the markups
const COLORS = {
   RED: [255, 0, 0],
   GREEN: [0,255,0],
   BLUE: [30, 144, 255],
   WHITE: [255, 255, 255],
   DEFAULT: [0, 0, 0] // black
}

const MARKUP_RADIUS_TEXT = 15    // radius of markup when text is included in the markup
const MARKUP_TEXT_SIZE = 12      // size of the text in the markups
const MARKUP_RADIUS_NO_TEXT = 8  // radius of markup when text is NOT included in the markup

// generates a random temperature between 13 and 33 Celsius
// this is used for demo purposes only - in reality you would be fetching
// temperature data from the Twinit Item Service (Telemetry Data) or from
// an external BMS/IOT API
const _getRandomTemperature = () => {

   const min = 20
   const max = 26

   // get a random temp between 20 and 26 inclusive
   let randomTemp = Math.floor(Math.random() * (max - min +1) + min)

   // pick a random number
   let randomChance = Math.random()
   
   // if the random number is greater then 0.9 the room is too hot so add 7 degrees
   // if the random number is less then 0.1 the room is too cold so subtract 7 degrees
   // bascally there's a 20% chance the random temp will fall outside of the comfortable
   // range of 20 to 26 degrees Celsius
   if (randomChance > 0.9) {
      randomTemp += 7
   } else if (randomChance < 0.1) {
      randomTemp -= 7
   }

   return randomTemp
}

// in order to reference a model element in the viewer (so that we can draw a markup on it)
// we need to get the node id of the graphics element in the viewer
// (this is different than the package_id or source_id that we use to select elements)
// the viewer maintains two lists of package_id or source_id to node id mappings
// For this function IafViewer is taken from the viewerRef in SimpleViewerSpaceMarkupView
// let IafViewer = viewerRef.current.iafviewerRef.current
// the IafViewer.props.idMapping contains two arrays
// IafViewer.props.idMapping[0] = node id -> package_id/source_id
// IafViewer.props.idMapping[1] = package_id/source_id -> node id
// this function retrieves a model elements node id when given an array of [package_id, source_id]
const _getNodeFromPkgId = (IafViewer, ids) => {

   let nodeId = parseInt(IafViewer.props.idMapping[1][ids[0]])
   if (!nodeId) {
      nodeId = parseInt(IafViewer.props.idMapping[1][ids[1]])
   }

   return nodeId

}

// in this example we are going to draw a markup at the geometric center of a space
// to do that we need to get the center of a model element node in the viewer
// this function takes an array of a model elements [package_id, source_id]
// and returns the center coordinates for it based off its geometric bounding box
const _getBoundingBoxCenter = async (IafViewer, ids) => {

   // the node id for the model eement in the viewer
   let node = _getNodeFromPkgId(IafViewer, ids)

   if (node) {
      try {
         // get the nodes geometric bounding box and return its center point
         let boundingbox = await IafViewer._viewer.model.getNodeRealBounding(node)
         return boundingbox.center()
      } catch (error) {
         console.error(`ERROR: no node or bounding box found for ${ids}`)
         return null
      }
   }

}

// creates a new circle markup component given the point at which to draw it in the model,
// the color to make the circle as an rgb array, and an optional radius for the circle
const _createCircleMarkup = (IafViewer, point, color, radius=15) => {

   let myColor = new window.Communicator.Color(color[0], color[1], color[2])
   let circleMarkup = new CircleMarkup({ viewer: IafViewer._viewer, position: point, radius, color: myColor })
   return circleMarkup

}

// creates a new text markup component given the point at which to draw it in the model,
// the text to display, and the color to make the text as an rgb array
const _createTextMarkup = (IafViewer, point, text, textColor) => {

   let myColor = new window.Communicator.Color(textColor[0], textColor[1], textColor[2])
   let textMarkup = new TextMarkup({ viewer: IafViewer._viewer, position: point, radius: MARKUP_RADIUS_TEXT, text, textColor: myColor, textSize: MARKUP_TEXT_SIZE })
   return textMarkup

}

// creates and registers (displays) a temperature markup with the viewer for a given model element
// and returns the ids for the markup(s), given an array of id for an element as [package_id, source_id]
// the temperature used is random, in the range between 13 and 33 Celsius, with 20 to 26 considered comfortable
// and any temp higher as too hot and any temp lower as too cold
// if the temp is in the comfortable range the viewer markup will be a small green circle
// if the temp is too cold, it will be a large blue circle with the offending temp text inside it
// if the temp is too hot, it will be a large red circle with the offending temp text inside it
export const createTempReadingMarkup = async (IafViewer, ids) => {

   let result = []

   // get the geometric center point of the model element
   let markupCenter = await _getBoundingBoxCenter(IafViewer, ids)

   if (markupCenter) {

      // get a random temp which could be ousid the comfortable range
      let temp = _getRandomTemperature()

      // pick the color based off the temp and the comfortable range
      let markupColorName = temp < 20 ? 'BLUE' : temp > 26 ? 'RED' : 'GREEN'
      let markupColor = COLORS[markupColorName]

      // set the markup radius based off the comfortable range
      let circleRadius = markupColorName === 'GREEN' ? MARKUP_RADIUS_NO_TEXT : MARKUP_RADIUS_TEXT

      // create the circle markup for the space
      let circle = _createCircleMarkup(IafViewer, markupCenter, markupColor, circleRadius)

      // register the markup with the viewer to display it
      let circleId = IafViewer._viewer.markupManager.registerMarkup(circle)

      // capture the id of the registered markup to return
      result.push(circleId)

      // if the random temp was outside of the comfrotable range add the temp text as an additional markup
      // at the same point as the circle markup just created
      if (markupColorName !== 'GREEN') {

         // create text markup
         let text = _createTextMarkup(IafViewer, markupCenter, `${temp}\u00B0`, COLORS.DEFAULT)

         // register the markup with the viewer to display it
         let textId = IafViewer._viewer.markupManager.registerMarkup(text)

         // capture the id of the registered markup to return
         result.push(textId)
      }

   }

   // result can be:
   // [] : an empty array if no boundingbox center was found for the model element
   // [ circleMarkupId ] : if the temp was in the comfortable range
   // [ circleMarkupId, textMarkupId ] : if the temp was outside the comfortable range
   return result

}

// clears all the current markups from th viewer using the markupids
// which were returned when the markups were registered by the viewer
export const clearMarkups = (IafViewer, markupIds) => {

   markupIds.forEach(id => {
      IafViewer._viewer.markupManager.unregisterMarkup(id);
  })

}

