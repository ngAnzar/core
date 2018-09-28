import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { SelectionModule } from "./selection.module"
import { ListDirective } from "./components/list/list.directive"
import { ListItemComponent } from "./components/list/list-item.component"


@NgModule({
    imports: [
        CommonModule,
        SelectionModule
    ],
    declarations: [
        ListDirective,
        ListItemComponent
    ],
    exports: [
        ListDirective,
        ListItemComponent,
        SelectionModule
    ]
})
export class ListModule {

}
