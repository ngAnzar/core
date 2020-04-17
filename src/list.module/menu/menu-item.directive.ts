import { Directive, Inject, TemplateRef } from "@angular/core"

import { ListItemComponent } from "../list/list-item.component"


export interface MenuItemActionEvent {
    event: Event
    menuItem: MenuItemDirective
    listItem: ListItemComponent
}


@Directive({ selector: "[nzMenuItem]" })
export class MenuItemDirective {
    public constructor(@Inject(TemplateRef) public readonly tpl: TemplateRef<any>) {
    }
}
