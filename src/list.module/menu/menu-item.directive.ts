import { Directive, Output, EventEmitter, Inject, TemplateRef } from "@angular/core"
import { Observable } from "rxjs"
import { share, map } from "rxjs/operators"

import { ListItemComponent } from "../list/list-item.component"


export interface MenuItemActionEvent {
    event: Event
    menuItem: MenuItemDirective
    listItem: ListItemComponent
}


@Directive({ selector: "[nzMenuItem]" })
export class MenuItemDirective {
    // @Output()
    // public action: Observable<any> = new EventEmitter()

    // public readonly _onClick = new EventEmitter<[Event, ListItemComponent]>()

    // @Output()
    // public readonly action: Observable<MenuItemActionEvent> = this._onClick
    //     .pipe(map((v: [Event, ListItemComponent]) => {
    //         return { event: v[0], menuItem: this, listItem: v[1] }
    //     }), share())


    public constructor(@Inject(TemplateRef) public readonly tpl: TemplateRef<any>) {
        // console.log(tpl)
        // this.action.subscribe(ok => {
        //     console.log(ok)
        // })
    }
}
