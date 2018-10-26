import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


import { ServicesModule } from "./services.module"
import { LayerService } from "./layer/layer.service"
import { LayerContainer } from "./layer/layer-container"
import { LayerComponent } from "./layer/layer-component"

export { LayerRef, ComponentLayerRef, TemplateLayerRef, LayerEvent } from "./layer/layer-ref"
export { ModalLayer, DropdownLayer, MenuLayer } from "./layer/layer-behavior"
export { LayerOptions, LevitateOptions, DropdownLayerOptions } from "./layer/layer-options"
export { LayerService }
export { LayerComponent }


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [LayerComponent],
    exports: [LayerComponent],
    providers: [
        LayerService,
        LayerContainer,
        ServicesModule
    ]
})
export class LayerModule {

}
