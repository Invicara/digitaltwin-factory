export class CircleMarkup extends window.Communicator.Markup.MarkupItem {

    _viewer
    _position
    _circle = new window.Communicator.Markup.Shape.Circle()
    _circleElement

    constructor({ viewer, position, radius, color, opacity = 1}) {
        super();
        this._viewer = viewer
        this._position = position
        this._circle.setRadius(radius)
        this._circle.setFillColor(color)
        this._circle.setStrokeColor(color)
        this._circle.setFillOpacity(opacity)
    }

    draw() {
        if (this._circle) {
            const center = this._viewer.view.projectPoint(this._position)
            this._circle.setCenter(window.Communicator.Point2.fromPoint3(center))
            this._circleElement = this._viewer.markupManager.getRenderer().drawCircle(this._circle)
        }
    }

}