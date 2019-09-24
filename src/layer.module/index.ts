import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"

import { NzCommonModule } from "../common.module"
import { NzLayoutModule } from "../layout.module"
import { NzAnimationModule } from "../animation.module"


import { LayerService } from "./layer/layer.service"
import { LayerContainer, LayerContainerRef, LayerOutletRef } from "./layer/layer-container"
import { LayerFactoryDirective, TargetAnchorDirective, LevitateAnchorDirective } from "./layer/layer-component"
export { LayerService, LayerContainer, LayerContainerRef, LayerOutletRef, LayerFactoryDirective, TargetAnchorDirective, LevitateAnchorDirective }
export { LayerRef, ComponentLayerRef, TemplateLayerRef, LayerEvent } from "./layer/layer-ref"
export { LayerOptions, DropdownLayerOptions, LevitateOptions, BackdropOptions, ClosingGuarded } from "./layer/layer-options"
export { LayerBehavior, DropdownLayer, ModalLayer, TooltipLayer } from "./layer/layer-behavior"
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


import { QtipDirective } from "./qtip/qtip.directive"
import { QtipComponent } from "./qtip/qtip.component"
import { QtipBehavior } from "./qtip/qtip.behavior"
import { QtipAlignDirective } from "./qtip/qtip-align.directive"
import { QtipManager } from "./qtip/qtip.manager"
export { QtipDirective, QtipComponent, QtipBehavior, QtipAlignDirective }


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


import { DeleteConfirmDialogComponent } from "./delete-confirm/delete-confirm-dialog.component"
import { DeleteConfirmDirective } from "./delete-confirm/delete-confirm.directive"
export { DeleteConfirmDialogComponent, DeleteConfirmDirective }


@NgModule({
    imports: [
        CommonModule,
        PortalModule,
        NzCommonModule,
        NzLayoutModule,
        NzAnimationModule
    ],
    declarations: [
        LayerFactoryDirective,
        TargetAnchorDirective,
        LevitateAnchorDirective,
        DialogComponent,
        QtipDirective,
        QtipComponent,
        QtipAlignDirective,
        ToastComponent,
        ToastProgressComponent,
        LayerMessageComponent,
        DeleteConfirmDialogComponent,
        DeleteConfirmDirective
    ],
    exports: [
        LayerFactoryDirective,
        TargetAnchorDirective,
        LevitateAnchorDirective,
        QtipDirective,
        QtipAlignDirective,
        DeleteConfirmDialogComponent,
        DeleteConfirmDirective
    ],
    providers: [
        LevitateService,
        LayerContainer,
        DialogService,
        MaskService,
        ToastService,
        QtipManager
    ],
    entryComponents: [
        DialogComponent,
        ToastComponent,
        ToastProgressComponent,
        LayerMessageComponent,
        QtipComponent,
        DeleteConfirmDialogComponent
    ]
})
export class NzLayerModule { }
