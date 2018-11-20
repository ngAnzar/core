import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzAnimationModule } from "./animation.module"
import { NzCommonModule } from "./common.module"
import { NzDataModule } from "./data.module"
import { NzFormModule } from "./form.module"
import { NzLayerModule } from "./layer.module"
import { NzListModule } from "./list.module"


export * from "./animation.module"
export * from "./common.module"
export * from "./data.module"
export * from "./form.module"
export * from "./layer.module"


const modules: any[] = [
    NzAnimationModule,
    NzCommonModule,
    NzDataModule,
    NzFormModule,
    NzLayerModule,
    NzListModule
]

@NgModule({
    imports: [CommonModule, ...modules],
    exports: modules
})
export class NzModule { }
