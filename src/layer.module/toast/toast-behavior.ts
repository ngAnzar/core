import { LayerBehavior } from "../layer/layer-behavior"
import { LayerOptions } from "../layer/layer-options"
import { LayerRef } from "../layer/layer-ref"

import { fade, slide } from "./toast-animations"


export class ToastLayer<O extends LayerOptions = LayerOptions> extends LayerBehavior<O> {
    public initShow(layer: LayerRef): void {
        super.initShow(layer)
        const style = layer.container.style as any
        style.borderRadius = "3px"
        style.overflow = "hidden"

        style["-webkit-backface-visibility"] = "hidden"
        style["backface-visibility"] = "hidden"
        style["outline"] = "1px solid transparent"
    }

    public animateShow(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, this._animation().show)
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, this._animation().hide)
            .then(() => super.animateHide(layer))
    }

    private _animation() {
        const origin = this.levitate.position.origin
        if (origin.horizontal === "center" && origin.vertical === "center") {
            return fade
        } else {
            return slide
        }
    }
}
