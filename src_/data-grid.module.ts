import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { DirectivesModule } from "./directives.module"
import { ScrollerModule } from "./scroller.module"
import { SelectionModule } from "./selection.module"
import { CheckboxModule } from "./checkbox.module"

import { DataGridComponent } from "./components/data-grid/data-grid.component"
import { ColumnsComponent } from "./components/data-grid/columns.component"
import { ColumnComponent } from "./components/data-grid/column.component"
import { DataGridCellDirective } from "./components/data-grid/cell.directive"
import { DataGridRowDirective } from "./components/data-grid/row.directive"
import { CheckboxColumnComponent } from "./components/data-grid/checkbox-column.component"


export { DataGridComponent }


const content = [
    ColumnComponent,
    ColumnsComponent,
    DataGridComponent,
    CheckboxColumnComponent
]


@NgModule({
    imports: [
        CommonModule,
        ScrollerModule,
        DirectivesModule,
        SelectionModule,
        CheckboxModule
    ],
    declarations: [
        DataGridCellDirective,
        DataGridRowDirective,
        ...content
    ],
    exports: content
})
export class DataGridModule {

}
