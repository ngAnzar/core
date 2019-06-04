import { Component, ContentChildren, QueryList, ViewChild, TemplateRef } from "@angular/core"


import { MenuItemDirective } from "../menu/menu-item.directive"


export interface MenuPanelContext {

}


@Component({
    selector: ".nz-popup-menu",
    templateUrl: "./popup-menu.template.pug"
})
export class PopupMenuComponent {
    @ViewChild("layer", { read: TemplateRef }) public readonly layer: TemplateRef<any>
    @ContentChildren(MenuItemDirective) protected menuItems: QueryList<MenuItemDirective>
}