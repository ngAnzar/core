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


import { GridComponent } from "./grid/grid.component"
import { CheckboxColumnComponent } from "./checkbox-column/checkbox-column.component"
import { ColumnComponent } from "./column/column.component"
import { ColumnsComponent } from "./column/columns.component"
import { GridCellDirective } from "./grid/grid-cell.directive"
import { GridRowDirective } from "./grid/grid-row.directive"
// import { GridFilterDirective } from "./grid/filter/grid-filter.directive"
import { GridFilterText } from "./filter/text.component"
import { GridFilterChipComponent } from "./filter/grid-filter-chip.component"
export {
    GridComponent, ColumnComponent, ColumnsComponent, GridFilterText, GridFilterChipComponent
}


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
        NzListModule
    ],
    declarations: [
        GridComponent,
        ColumnComponent,
        ColumnsComponent,
        GridCellDirective,
        GridRowDirective,
        GridFilterText,
        GridFilterChipComponent,

        CheckboxColumnComponent
    ],
    exports: [
        GridComponent,
        ColumnComponent,
        ColumnsComponent,
        GridFilterText,

        CheckboxColumnComponent
    ]
})
export class NzGridModule { }
