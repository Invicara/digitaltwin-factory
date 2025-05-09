export class TextMarkup extends window.Communicator.Markup.MarkupItem {

   _viewer
   _position
   _radius
   _text = new window.Communicator.Markup.Shape.Text()
   _textElement
   _textValue

   constructor({viewer, position, radius, text, textColor, textSize = 12}) {
      super();
      this._viewer = viewer
      this._position = position
      this._radius = radius
      this._textSize = textSize
      this._textValue = text
      this._text.setText(text)
      this._text.setFontSize(textSize)
      this._text.setFillOpacity(1)
      this._text.setFillColor(textColor)
      this._text.setStrokeColor(textColor)
      this._text.setStrokeWidth(1)
   }

   draw() {

      if (this._text) {
         const center = this._viewer.view.projectPoint(this._position)
         const textSize = this._viewer.markupManager.getRenderer().measureText(this._text._text, this._text)
         center.x -= (textSize.x / 2)
         center.y -= (this._radius - (textSize.y * 0.25))
         this._text.setPosition(window.Communicator.Point2.fromPoint3(center))
         this._textElement = this._viewer.markupManager.getRenderer().drawText(this._text)
      }

   }

}
