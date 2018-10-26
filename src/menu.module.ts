import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { ListModule } from "./list.module"
import { LayerModule } from "./layer.module"

import { MenuComponent } from "./components/menu/menu.component"
import { MenuItemDirective } from "./components/menu/menu-item.directive"
import { MenuTriggerDirective } from "./components/menu/menu-trigger.directive"


@NgModule({
    imports: [
        CommonModule,
        ListModule,
        LayerModule
    ],
    declarations: [
        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective
    ],
    exports: [
        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective
    ]
})
export class MenuModule {

}
