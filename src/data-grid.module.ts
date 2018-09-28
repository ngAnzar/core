import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { DirectivesModule } from "./directives.module"
import { ScrollerModule } from "./scroller.module"

import { DataGridComponent } from "./components/data-grid/data-grid.component"
import { ColumnsComponent } from "./components/data-grid/columns.component"
import { ColumnComponent } from "./components/data-grid/column.component"
import { CellDirective } from "./components/data-grid/cell.directive"


const content = [
    ColumnComponent,
    ColumnsComponent,
    DataGridComponent
]


@NgModule({
    imports: [
        CommonModule,
        ScrollerModule,
        DirectivesModule
    ],
    declarations: [
        CellDirective,
        ...content
    ],
    exports: content
})
export class DataGridModule {

}
