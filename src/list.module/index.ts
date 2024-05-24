import { CommonModule } from "@angular/common"
import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"

import { NzAnimationModule } from "../animation.module"
// import { FlexLayoutModule } from "@angular/flex-layout"
import { NzCommonModule } from "../common.module"
import { NzDataModule } from "../data.module"
import { NzLayerModule } from "../layer.module"
import { NzLayoutModule } from "../layout.module"
import {
    AUTOCOMPLETE_ACTIONS,
    AUTOCOMPLETE_ITEM_FACTORY,
    AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE,
    AUTOCOMPLETE_ITEM_TPL,
    AutocompleteComponent
} from "./autocomplete/autocomplete.component"
import { ExlistItemComponent } from "./exlist/exlist-item.component"
import { ExlistComponent } from "./exlist/exlist.component"
import { FabmenuTriggerDirective } from "./fabmenu/fabmenu-trigger.directive"
import { FabmenuComponent } from "./fabmenu/fabmenu.component"
import { ListActionComponent, ListActionModel, SelectableActionDirective } from "./list/list-action.component"
import { ListItemComponent } from "./list/list-item.component"
import { ListDirective } from "./list/list.directive"
import { MenuItemActionEvent, MenuItemDirective } from "./menu/menu-item.directive"
import { MenuComponent } from "./menu/menu.component"
import { PopupMenuComponent } from "./popupmenu/popup-menu.component"
import { PopupMenuDirective } from "./popupmenu/popup-menu.directive"
import { ScrollableDirective } from "./scroller/scrollable.directive"
// import { ScrollableDirective, ScrollOrient } from "./scrollable.directive"
// export { ScrollableDirective, ScrollOrient }
// import { Scrollable, ScrollableNativeDirective } from "./scroller/scrollable.directive"
import { ScrollbarComponent } from "./scroller/scrollbar.component"
import { ScrollerComponent } from "./scroller/scroller.component"
import { ScrollerService, ScrollEvent, ScrollOrient } from "./scroller/scroller.service"
import { SlideableComponent } from "./slideable/slideable.component"
import { SlideableBackDirective } from "./slideable/slideable.directive"
import { TabLabelDirective } from "./tabs/tab-label.directive"
import { TabLabelsComponent } from "./tabs/tab-labels.component"
import { TabComponent } from "./tabs/tab.component"
import { TabsComponent } from "./tabs/tabs.component"
import { VirtualForDirective } from "./virtual-for/virtual-for.directive"
import { VF_FixedItemHeight, VF_Layout_Column, VF_Layout_Grid, VF_VaryingItemHeight } from "./virtual-for/visible-range"

export {
    AutocompleteComponent,
    AUTOCOMPLETE_ACTIONS,
    AUTOCOMPLETE_ITEM_TPL,
    AUTOCOMPLETE_ITEM_FACTORY,
    AUTOCOMPLETE_ITEM_FACTORY_ALWAYS_VISIBLE
}

export { ExlistSwitchHandler } from "./exlist/exlist-switch-handler"
export { ExlistComponent, ExlistItemComponent }

export { FabmenuComponent, FabmenuTriggerDirective }

export { ListDirective, ListItemComponent, ListActionComponent, ListActionModel }

export { MenuComponent, MenuItemDirective, MenuItemActionEvent, PopupMenuComponent, PopupMenuDirective }

export { ScrollEvent, ScrollOrient, ScrollerService, ScrollbarComponent, ScrollerComponent, ScrollableDirective }

export { SlideableComponent, SlideableBackDirective }

export { TabsComponent, TabComponent }

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

        VirtualForDirective,
        VF_FixedItemHeight,
        VF_VaryingItemHeight,
        VF_Layout_Column,
        VF_Layout_Grid
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
        TabLabelsComponent,

        VirtualForDirective,
        VF_FixedItemHeight,
        VF_VaryingItemHeight,
        VF_Layout_Column,
        VF_Layout_Grid
        // VirtualForFixedItems,
        // VirtualForVaryingItems,
        // VirtualForVaryingItemsIntersection
    ],
    entryComponents: [AutocompleteComponent]
})
export class NzListModule {}
