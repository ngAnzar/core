import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"


import { LayerModule } from "./layer.module"
import { ButtonModule } from "./button.module"

import { DialogService } from "./dialog/dialog.service"

import { DialogComponent } from "./dialog/dialog.component"
import { MessageDialog } from "./dialog/message.dialog"

export { DialogService }
export {
    BUTTON_OK, BUTTON_CANCEL, BUTTON_DELETE, BUTTON_ERROR, BUTTON_SEPARATOR, BUTTON_SAVE,
    DialogEvent
} from "./dialog/dialog.service"


@NgModule({
    imports: [
        CommonModule,
        LayerModule,
        PortalModule,
        ButtonModule
    ],
    declarations: [
        DialogComponent,
        MessageDialog
    ],
    exports: [
        DialogComponent,
        LayerModule,
        PortalModule,
        ButtonModule
    ],
    providers: [
        DialogService
    ],
    entryComponents: [
        DialogComponent,
        MessageDialog
    ]
})
export class DialogModule {

}
