import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzAnimationModule } from "../animation.module"
import { NzLayerModule } from "../layer.module"

import { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL } from "./autocomplete/autocomplete.component"
export { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL }


import { ListDirective } from "./list/list.directive"
import { ListItemComponent } from "./list/list-item.component"
import { ListActionComponent, ListActionModel, SelectableActionDirective } from "./list/list-action.component"
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
        NzCommonModule,
        NzDataModule,
        NzAnimationModule,
        NzLayerModule
    ],
    declarations: [
        AutocompleteComponent,

        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,

        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective,

        ScrollableDirective,
        VirtualForDirective
    ],
    exports: [
        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,

        MenuComponent,
        MenuItemDirective,
        MenuTriggerDirective,

        ScrollableDirective,
        VirtualForDirective
    ],
    entryComponents: [
        AutocompleteComponent
    ]
})
export class NzListModule { }
