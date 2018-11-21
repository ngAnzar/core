import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { DirectivesModule } from "./directives.module"
import { PanelComponent } from "./components/panel/panel.component"
import { DrawerComponent } from "./components/panel/drawer.component"

export { PanelComponent, DrawerComponent }

@NgModule({
    imports: [
        CommonModule,
        DirectivesModule
    ],
    declarations: [
        PanelComponent,
        DrawerComponent
    ],
    exports: [
        PanelComponent,
        DrawerComponent,
        DirectivesModule
    ]
})
export class PanelModule { }
