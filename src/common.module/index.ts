import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzAnimationModule } from "../animation.module"


@NgModule({
    imports: [
        CommonModule,
        NzAnimationModule
    ],
    exports: [
        CommonModule
    ]
})
export class NzCommonModule { }
