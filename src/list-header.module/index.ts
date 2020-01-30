import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"


import { NzCommonModule } from "../common.module"
import { NzFormModule } from "../form.module"
import { NzDataModule } from "../data.module"
import { NzAnimationModule } from "../animation.module"
import { NzLayerModule } from "../layer.module"
import { NzLayoutModule } from "../layout.module"


import { ColumnComponent } from "./column/column.component"
import { ColumnsComponent } from "./column/columns.component"
export { ColumnComponent, ColumnsComponent }

import { ListFilter, ColumnFilter } from "./filter/abstract"
import { ListFilterChipComponent } from "./filter/filter-chip.component"
import { ListFilterService } from "./filter/list-filter.service"
import { ListFilterText } from "./filter/text.component"
import { ListFilterDate } from "./filter/date.component"
export { ListFilter, ColumnFilter, ListFilterChipComponent, ListFilterService, ListFilterText, ListFilterDate }

import { ListHeaderComponent } from "./header/list-header.component"
export { ListHeaderComponent }


@NgModule({
    imports: [
        CommonModule,

        NzCommonModule,
        NzFormModule,
        NzDataModule,
        NzAnimationModule,
        NzLayerModule,
        NzLayoutModule
    ],
    declarations: [
        ColumnComponent,
        ColumnsComponent,

        ListFilterChipComponent,
        ListFilterText,
        ListFilterDate,

        ListHeaderComponent,
    ],
    exports: [
        ColumnComponent,
        ColumnsComponent,

        ListFilterText,
        ListFilterDate,

        ListHeaderComponent,
    ]
})
export class NzListHeaderModule { }
