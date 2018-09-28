import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


import { LayerService } from "./layer/layer.service"
import { LayerContainer } from "./layer/layer-container"

export { LayerRef } from "./layer/layer-ref"
export { ModalLayer, DropdownLayer } from "./layer/layer-behavior"
export { LayerOptions, DropdownLayerOptions } from "./layer/layer-options"
export { LayerService }


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [],
    exports: [],
    providers: [
        LayerService,
        LayerContainer
    ]
})
export class LayerModule {

}
