import { LayerBehavior } from "../layer/layer-behavior"
import { LayerRef } from "../layer/layer-ref"

import { qtipAnimation } from "./qtip.animation"


export class QtipBehavior extends LayerBehavior {
    public animateShow(layer: LayerRef): Promise<void> {
        let params = {
            origin: `${this.levitate.position.origin.vertical} ${this.levitate.position.origin.horizontal}`
        }
        return this.playAnimation(layer, qtipAnimation.show, { params })
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, qtipAnimation.hide)
            .then(() => super.animateHide(layer))
    }
}
