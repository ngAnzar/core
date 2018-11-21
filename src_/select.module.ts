import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"

import { ServicesModule } from "./services.module"
import { InputModule } from "./input.module"
import { SelectionModule } from "./selection.module"
import { DirectivesModule } from "./directives.module"
import { ScrollerModule } from "./scroller.module"
import { ListModule } from "./list.module"

import { SelectComponent } from "./components/select/select.component"
import { DropdownComponent } from "./components/select/dropdown.component"
import { ChipComponent } from "./components/select/chip.component"
// import { HighlightPipe } from "./components/select/highlight.pipe"

export { IAutocompleteModel, Match, SelectComponent } from "./components/select/select.component"

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputModule,
        SelectionModule,
        DirectivesModule,
        ScrollerModule,
        ListModule,
        ServicesModule
    ],
    declarations: [
        SelectComponent,
        // HighlightPipe,
        DropdownComponent,
        ChipComponent
    ],
    exports: [
        SelectComponent,
        // HighlightPipe,
        DropdownComponent,
        ChipComponent,

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
