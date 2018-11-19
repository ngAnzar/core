import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzCommonModule } from "../common.module"

import { GridComponent } from "./grid/grid.component"
import { CheckboxColumnComponent } from "./grid/checkbox-column.component"
import { ColumnComponent } from "./grid/column.component"
import { ColumnsComponent } from "./grid/columns.component"
import { GridCellDirective } from "./grid/grid-cell.directive"
import { GridRowDirective } from "./grid/grid-row.directive"
export { GridComponent, CheckboxColumnComponent, ColumnComponent, ColumnsComponent }


import { ListDirective } from "./list/list.directive"
import { ListItemComponent } from "./list/list-item.component"
import { ListActionComponent, ListActionModel } from "./list/list-action.component"
export { ListDirective, ListItemComponent, ListActionComponent, ListActionModel }


import { MenuComponent } from "./menu/menu.component"
import { MenuItemDirective, MenuItemActionEvent } from "./menu/menu-item.directive"
import { MenuTriggerDirective } from "./menu/menu-trigger.directive"
export { MenuComponent, MenuItemDirective, MenuTriggerDirective, MenuItemActionEvent }


import { ScrollableDirective, ScrollOrient } from "./scrollable.directive"
export { ScrollableDirective, ScrollOrient }


import { VirtualForDirective } from "./virtual-for.directive"


@NgModule({
    imports: [
        CommonModule,
        NzCommonModule
    ],
    declarations: [
        GridComponent,
        CheckboxColumnComponent,
        ColumnComponent,
        ColumnsComponent,
        GridCellDirective,
        GridRowDirective,

        ListDirective,
        ListItemComponent,
        ListActionComponent,

        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective,

        ScrollableDirective,
        VirtualForDirective
    ],
    exports: [
        GridComponent,
        CheckboxColumnComponent,
        ColumnComponent,
        ColumnsComponent,

        ListDirective,
        ListItemComponent,
        ListActionComponent,

        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective,

        ScrollableDirective,
        VirtualForDirective
    ]
})
export class NzListModule { }
