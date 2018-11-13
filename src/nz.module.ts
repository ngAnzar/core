import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ButtonModule } from "./button.module"
import { CardModule } from "./card.module"
import { CheckboxModule } from "./checkbox.module"
import { CoreModule } from "./core.module"
import { DataGridModule } from "./data-grid.module"
import { DateInputModule } from "./date-input.module"
import { DialogModule } from "./dialog.module"
import { DirectivesModule } from "./directives.module"
import { FormFieldModule } from "./form-field.module"
import { InputModule } from "./input.module"
import { LayerModule } from "./layer.module"
import { ListModule } from "./list.module"
import { MenuModule } from "./menu.module"
import { NavbarModule } from "./navbar.module"
import { PanelModule } from "./panel.module"
import { RadioModule } from "./radio.module"
import { RpcModule } from "./rpc.module"
import { SelectModule } from "./select.module"
import { SelectionModule } from "./selection.module"
import { ToastModule } from "./toast.module"


const content = [
    ButtonModule,
    CardModule,
    CheckboxModule,
    CoreModule,
    DataGridModule,
    DateInputModule,
    DialogModule,
    DirectivesModule,
    FormFieldModule,
    InputModule,
    LayerModule,
    ListModule,
    MenuModule,
    NavbarModule,
    PanelModule,
    RadioModule,
    RpcModule,
    SelectModule,
    SelectionModule,
    ToastModule
]


@NgModule({
    imports: [
        CommonModule,
        ...content
    ],
    exports: content
})
export class NzModule {

}
