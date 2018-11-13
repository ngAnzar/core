import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"

import { ToastService } from "./toast.service"
export { ToastService }

import { ToastComponent } from "./toast.component"
import { ToastMessageComponent } from "./toast-message.component"


@NgModule({
    imports: [
        CommonModule,
        PortalModule
    ],
    declarations: [
        ToastComponent,
        ToastMessageComponent
    ],
    exports: [

    ],
    providers: [
        ToastService
    ],
    entryComponents: [
        ToastComponent,
        ToastMessageComponent
    ]
})
export class ToastModule {

}
