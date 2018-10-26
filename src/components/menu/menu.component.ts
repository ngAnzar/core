import { Component, ContentChildren, QueryList, TemplateRef, ViewChild } from "@angular/core"

import { LayerComponent } from "../../layer.module"
import { MenuItemDirective } from "./menu-item.directive"
import { Anchor } from "../../levitate/levitate-compute"


export interface MenuPanelContext {

}


@Component({
    selector: ".nz-menu",
    templateUrl: "./menu.template.pug"
})
export class MenuComponent extends LayerComponent<MenuPanelContext> {
    @ContentChildren(MenuItemDirective, { read: TemplateRef }) protected menuItems: QueryList<MenuItemDirective>

    // public ngAfterContentInit() {
    //     console.log(this)
    // }

    public show(anchor?: Anchor) {


        return super.show(anchor)
    }

    protected newContext(): MenuPanelContext {
        return {} as MenuPanelContext
    }
}
