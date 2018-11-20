import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"

import { NzCommonModule } from "../common.module"
import { NzLayoutModule } from "../layout.module"
import { NzAnimationModule } from "../animation.module"


import { LayerService } from "./layer/layer.service"
import { LayerContainer, LayerContainerRef, LayerOutletRef } from "./layer/layer-container"
import { LayerComponent } from "./layer/layer-component"
export { LayerService, LayerContainer, LayerContainerRef, LayerOutletRef, LayerComponent }
export { LayerRef, ComponentLayerRef, TemplateLayerRef, LayerEvent } from "./layer/layer-ref"
export { LayerOptions, DropdownLayerOptions, LevitateOptions, BackdropOptions } from "./layer/layer-options"
export { LayerBehavior, DropdownLayer, MenuLayer, ModalLayer, TooltipLayer } from "./layer/layer-behavior"
export { LayerBackdropRef } from "./layer/layer-backdrop"


import { LevitateService } from "./levitate/levitate.service"
export { LevitateService }
export { Anchor, Levitating, Constraint } from "./levitate/levitate-options"


import { DialogService, DialogEvent } from "./dialog/dialog.service"
import { DialogComponent } from "./dialog/dialog.component"
export { DialogService, DialogEvent }


import { MaskService } from "./mask/mask.service"
export { MaskService }
export { MaskRef } from "./mask/mask-ref"


import { ToastService } from "./toast/toast.service"
import { ToastComponent } from "./toast/toast.component"
import { ToastProgressComponent } from "./toast/toast-progress.component"
export { ToastService }
export { ToastOptions, ToastProgressOptions } from "./toast/toast-options"
export { ToastLayer } from "./toast/toast-behavior"


import { LayerMessageComponent } from "./_shared/message-component"
export { LAYER_BUTTONS, LAYER_CONTENT, LAYER_MESSAGE, LAYER_OPTIONS, LAYER_TITLE } from "./_shared/di-tokens"
export {
    BUTTON_CANCEL, BUTTON_DELETE, BUTTON_ERROR, BUTTON_OK, BUTTON_SAVE, BUTTON_SEPARATOR,
    ButtonList, ButtonOption
} from "./_shared/buttons"


@NgModule({
    imports: [
        CommonModule,
        PortalModule,
        NzCommonModule,
        NzLayoutModule,
        NzAnimationModule
    ],
    declarations: [
        LayerComponent,
        DialogComponent,
        ToastComponent,
        ToastProgressComponent,
        LayerMessageComponent
    ],
    exports: [
        LayerComponent
    ],
    providers: [
        LevitateService,
        LayerService,
        LayerContainer,
        DialogService,
        MaskService,
        ToastService
    ],
    entryComponents: [
        DialogComponent,
        ToastComponent,
        ToastProgressComponent,
        LayerMessageComponent
    ]
})
export class NzLayerModule { }
