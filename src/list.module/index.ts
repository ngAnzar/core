import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
// import { FlexLayoutModule } from "@angular/flex-layout"

import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzAnimationModule } from "../animation.module"
import { NzLayerModule } from "../layer.module"
import { NzLayoutModule } from "../layout.module"

import { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL, AUTOCOMPLETE_ITEM_FACTORY } from "./autocomplete/autocomplete.component"
export { AutocompleteComponent, AUTOCOMPLETE_ACTIONS, AUTOCOMPLETE_ITEM_TPL, AUTOCOMPLETE_ITEM_FACTORY }

import { ExlistComponent } from "./exlist/exlist.component"
import { ExlistItemComponent } from "./exlist/exlist-item.component"
export { ExlistSwitchHandler } from "./exlist/exlist-switch-handler"
export { ExlistComponent, ExlistItemComponent }

import { FabmenuComponent } from "./fabmenu/fabmenu.component"
import { FabmenuTriggerDirective } from "./fabmenu/fabmenu-trigger.directive"
export { FabmenuComponent, FabmenuTriggerDirective }

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
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { ScrollEvent, ScrollOrient, ScrollerService } from "./scroller/scroller.service"
export {
    ScrollEvent, ScrollOrient, ScrollerService, ScrollbarComponent, ScrollerComponent, ScrollableDirective
}


import { SlideableComponent } from "./slideable/slideable.component"
import { SlideableBackDirective } from "./slideable/slideable.directive"
export { SlideableComponent, SlideableBackDirective }

import { TabsComponent } from "./tabs/tabs.component"
import { TabComponent } from "./tabs/tab.component"
import { TabLabelsComponent } from "./tabs/tab-labels.component"
import { TabLabelDirective } from "./tabs/tab-label.directive"
export { TabsComponent, TabComponent }

import { TreeComponent } from "./tree/tree.component"
import { TreeItemComponent } from "./tree/tree-item.component"
export { TreeComponent, TreeItemComponent }

// import { VirtualForDirective } from "./virtual-for.directive"
// import { VirtualForFixedItems, VirtualForVaryingItems, VirtualForVaryingItemsIntersection } from "./virtual-for-strategy.directive"


import { VirtualForDirective } from "./virtual-for/virtual-for.directive"
import { VF_FixedItemHeight, VF_VaryingItemHeight } from "./virtual-for/visible-range"


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        // FlexLayoutModule,
        NzCommonModule,
        NzDataModule,
        NzAnimationModule,
        NzLayerModule,
        NzLayoutModule
    ],
    declarations: [
        AutocompleteComponent,

        ExlistComponent,
        ExlistItemComponent,

        FabmenuComponent,
        FabmenuTriggerDirective,

        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,

        MenuComponent,
        MenuItemDirective,
        PopupMenuComponent,
        PopupMenuDirective,

        ScrollbarComponent,
        ScrollerComponent,
        ScrollableDirective,

        SlideableComponent,
        SlideableBackDirective,

        TabsComponent,
        TabComponent,
        TabLabelDirective,
        TabLabelsComponent,

        TreeComponent,
        TreeItemComponent,

        VirtualForDirective,
        VF_FixedItemHeight,
        VF_VaryingItemHeight,
        // VirtualForFixedItems,
        // VirtualForVaryingItems,
        // VirtualForVaryingItemsIntersection
    ],
    exports: [
        ExlistComponent,
        ExlistItemComponent,

        FabmenuComponent,
        FabmenuTriggerDirective,

        ListDirective,
        ListItemComponent,
        ListActionComponent,
        SelectableActionDirective,

        MenuComponent,
        MenuItemDirective,
        PopupMenuComponent,
        PopupMenuDirective,

        ScrollbarComponent,
        ScrollerComponent,
        ScrollableDirective,

        SlideableComponent,
        SlideableBackDirective,

        TabsComponent,
        TabComponent,

        TreeComponent,

        VirtualForDirective,
        VF_FixedItemHeight,
        VF_VaryingItemHeight,
        // VirtualForFixedItems,
        // VirtualForVaryingItems,
        // VirtualForVaryingItemsIntersection
    ],
    entryComponents: [
        AutocompleteComponent
    ]
})
export class NzListModule { }
