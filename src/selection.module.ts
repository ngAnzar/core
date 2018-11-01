import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { Selectable, SelectableDirective } from "./selection/selectable.directive"
import { SingleSelection, MultiSelection, PropagateSelection } from "./selection/selection.directive"

export { SelectionModel, SelectionEvent } from "./selection/selection.directive"
export { Selectable, SelectableDirective, SingleSelection, MultiSelection }


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        SelectableDirective,
        SingleSelection,
        MultiSelection,
        PropagateSelection
    ],
    exports: [
        SelectableDirective,
        SingleSelection,
        MultiSelection,
        PropagateSelection
    ]
})
export class SelectionModule {

}
