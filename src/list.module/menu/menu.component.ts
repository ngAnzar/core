import { Component, ContentChildren, QueryList, ViewChild, TemplateRef } from "@angular/core"


import { MenuItemDirective } from "./menu-item.directive"


export interface MenuPanelContext {

}


@Component({
    selector: ".nz-menu",
    templateUrl: "./menu.template.pug"
})
export class MenuComponent {
    @ViewChild("layer", { read: TemplateRef, static: true }) public readonly layer: TemplateRef<any>
    @ContentChildren(MenuItemDirective) public readonly menuItems: QueryList<MenuItemDirective>
}
