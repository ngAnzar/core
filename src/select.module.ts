import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { InputModule } from "./input.module"
import { SelectionModule } from "./selection.module"
import { DirectivesModule } from "./directives.module"
import { ScrollerModule } from "./scroller.module"
import { ListModule } from "./list.module"

import { SelectComponent } from "./components/select/select.component"
import { DropdownComponent } from "./components/select/dropdown.component"
// import { HighlightPipe } from "./components/select/highlight.pipe"

export { IAutocompleteModel, Match } from "./components/select/select.component"

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputModule,
        SelectionModule,
        DirectivesModule,
        ScrollerModule,
        ListModule
    ],
    declarations: [
        SelectComponent,
        // HighlightPipe,
        DropdownComponent
    ],
    exports: [
        SelectComponent,
        // HighlightPipe,
        DropdownComponent,

        ReactiveFormsModule,
        SelectionModule,
        DirectivesModule,
        ScrollerModule,
        ListModule
    ],
    entryComponents: [
        DropdownComponent
    ]
})
export class SelectModule {

}
