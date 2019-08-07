import { NgModule, ModuleWithProviders } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzAnimationModule } from "./animation.module"
import { NzCommonModule } from "./common.module"
import { NzDataModule } from "./data.module"
import { NzFormModule } from "./form.module"
import { NzGridModule } from "./grid.module"
import { NzLayerModule, LayerService } from "./layer.module"
import { NzLayoutModule } from "./layout.module"
import { NzListHeaderModule } from "./list-header.module"
import { NzListModule } from "./list.module"
import { NzViewportModule } from "./viewport.module"


export * from "./animation.module"
export * from "./common.module"
export * from "./data.module"
export * from "./form.module"
export * from "./grid.module"
export * from "./layer.module"
export * from "./layout.module"
export * from "./list-header.module"
export * from "./list.module"
export * from "./viewport.module"


const modules: any[] = [
    NzAnimationModule,
    NzCommonModule,
    NzDataModule,
    NzFormModule,
    NzGridModule,
    NzLayerModule,
    NzLayoutModule,
    NzListHeaderModule,
    NzListModule,
    NzViewportModule
]

@NgModule({
    imports: [CommonModule, ...modules],
    exports: modules
})
export class NzModule {
    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: NzModule,
            providers: [
                LayerService
            ]
        }
    }
}
