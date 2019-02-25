import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FlexLayoutModule } from "@angular/flex-layout"

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
import { PopupMenuComponent } from "./popupmenu/popup-menu.component"
import { PopupMenuDirective } from "./popupmenu/popup-menu.directive"
export { MenuComponent, MenuItemDirective, MenuItemActionEvent, PopupMenuComponent, PopupMenuDirective }


// import { ScrollableDirective, ScrollOrient } from "./scrollable.directive"
// export { ScrollableDirective, ScrollOrient }
// import { Scrollable, ScrollableNativeDirective } from "./scroller/scrollable.directive"
import { ScrollbarComponent } from "./scroller/scrollbar.component"
import { ScrollerComponent } from "./scroller/scroller.component"
import { ScrollEvent, ScrollOrient, ScrollerService } from "./scroller/scroller.service"
export {
    ScrollEvent, ScrollOrient, ScrollerService, ScrollbarComponent, ScrollerComponent
}


import { VirtualForDirective } from "./virtual-for.directive"


@NgModule({
    imports: [
        CommonModule,
        FlexLayoutModule,
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
        PopupMenuComponent,
        PopupMenuDirective,

        // ScrollableNativeDirective,
        ScrollbarComponent,
        ScrollerComponent,
        VirtualForDirective
    ],
    exports: [
        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,

        MenuComponent,
        MenuItemDirective,
        PopupMenuComponent,
        PopupMenuDirective,

        // ScrollableNativeDirective,
        ScrollbarComponent,
        ScrollerComponent,
        VirtualForDirective
    ],
    entryComponents: [
        AutocompleteComponent
    ]
})
export class NzListModule { }
