import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PortalModule } from "@angular/cdk/portal"

export { AbstractProgressComponent, ProgressEvent } from "./progress-base"

import { CircleProgressComponent } from "./circle.component"
export { CircleProgressComponent }



@NgModule({
    imports: [
        CommonModule,
        PortalModule
    ],
    declarations: [
        CircleProgressComponent
    ],
    exports: [
        CircleProgressComponent
    ],
    providers: [

    ],
    entryComponents: [
        // CircleComponent
    ]
})
export class ProgressModule {

}
