import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
// import { FlexLayoutModule } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzAnimationModule } from "../animation.module"
import { NzLayerModule } from "../layer.module"
import { NzLayoutModule } from "../layout.module"
import { NzFormModule } from "../form.module"
import { NzListModule } from "../list.module"

import { TreeComponent } from "./tree.component"
import { TreeItemComponent } from "./tree-item.component"
export { TreeComponent, TreeItemComponent }


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        // FlexLayoutModule,
        NzCommonModule,
        NzDataModule,
        NzAnimationModule,
        NzLayerModule,
        NzLayoutModule,
        NzFormModule,
        NzListModule,
    ],
    declarations: [
        TreeComponent,
        TreeItemComponent,
    ],
    exports: [
        TreeComponent,
    ],
    entryComponents: [

    ]
})
export class NzTreeModule { }
