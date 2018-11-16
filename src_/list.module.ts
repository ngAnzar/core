import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { SelectionModule } from "./selection.module"
import { ListDirective } from "./components/list/list.directive"
import { ListItemComponent } from "./components/list/list-item.component"
import { ListActionComponent, SelectableActionDirective } from "./components/list/list-action.component"


@NgModule({
    imports: [
        CommonModule,
        SelectionModule
    ],
    declarations: [
        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective
    ],
    exports: [
        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,
        SelectionModule
    ]
})
export class ListModule {

}
