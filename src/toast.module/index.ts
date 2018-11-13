import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"

import { ProgressModule } from "../progress.module"

import { ToastService } from "./toast.service"
export { ToastService }

import { ToastComponent } from "./toast.component"
import { ToastProgressComponent } from "./toast-progress.component"
import { ToastMessageComponent } from "./toast-message.component"


@NgModule({
    imports: [
        CommonModule,
        PortalModule,
        ProgressModule
    ],
    declarations: [
        ToastComponent,
        ToastProgressComponent,
        ToastMessageComponent
    ],
    exports: [

    ],
    providers: [
        ToastService
    ],
    entryComponents: [
        ToastComponent,
        ToastProgressComponent,
        ToastMessageComponent
    ]
})
export class ToastModule {

}
