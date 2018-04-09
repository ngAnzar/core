import { LayerOptions } from "./layer.options"
import { LayerRef } from "./layer-ref"


export class LayerService {
    show(component, options?: LayerOptions): LayerRef {
        return new LayerRef()
    }
}
