import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
// import { FlexLayoutModule } from "@angular/flex-layout"
import { ReactiveFormsModule } from "@angular/forms"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzAnimationModule } from "../animation.module"
import { NzLayoutModule } from "../layout.module"
import { NzLayerModule } from "../layer.module"
import { NzFormModule } from "../form.module"
import { NzListModule } from "../list.module"
import { NzListHeaderModule } from "../list-header.module"


import { GridComponent } from "./grid/grid.component"
import { CheckboxColumnComponent } from "./checkbox-column/checkbox-column.component"
import { GridCellDirective } from "./grid/grid-cell.directive"
import { GridRowDirective } from "./grid/grid-row.directive"
export { GridComponent }


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        // FlexLayoutModule,
        NzCommonModule,
        NzDataModule,
        NzAnimationModule,
        NzLayoutModule,
        NzLayerModule,
        NzFormModule,
        NzListModule,
        NzListHeaderModule
    ],
    declarations: [
        GridComponent,
        GridCellDirective,
        GridRowDirective,

        CheckboxColumnComponent
    ],
    exports: [
        GridComponent,
        CheckboxColumnComponent
    ]
})
export class NzGridModule { }
