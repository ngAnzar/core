import {
    Component, Input, Attribute, Output, TemplateRef, ViewChild, EventEmitter, OnDestroy, Directive
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Model, Field, SelectableDirective, SelectOrigin } from "../../data.module"


// related issue: https://github.com/angular/angular/issues/12530
// related issue: https://github.com/angular/angular/issues/8563

@Component({
    selector: "nz-list-action",
    template: `<ng-template #tpl><ng-content></ng-content></ng-template>`
})
export class ListActionComponent implements OnDestroy {
    @Input() public readonly position: "first" | "last"
    @Input() public readonly behavior: "selectable" | "virtual" = "virtual"
    @Input() public readonly text: string

    @ViewChild("tpl", { read: TemplateRef, static: true }) public readonly tpl: TemplateRef<any>

    @Output("action") public readonly onAction: Observable<ListActionComponent> = new EventEmitter()

    public readonly model = new ListActionModel({ action: this })

    public constructor(@Attribute("id") id: string) {
        this.model.id = id || Math.random().toString(36)
    }

    public ngOnDestroy() {
        delete (this as any).onAction
        delete (this as any).tpl
        delete (this as any).model
    }
}


export class ListActionModel extends Model {
    public readonly isListAction = true
    @Field({ primary: true }) public id: string
    @Field({ map: (v) => v }) public action: ListActionComponent
}


@Directive({
    selector: "[selectableAction]",
    providers: [
        { provide: SelectableDirective, useExisting: SelectableActionDirective }
    ]
})
export class SelectableActionDirective extends SelectableDirective<ListActionModel> {
    @Input("selectableAction")
    public set selectableAction(val: any) {
        this.model = val
    }

    public _canChangeSelected(newValue: SelectOrigin): boolean {
        let action = this.model.action

        if (action && newValue) {
            (action.onAction as EventEmitter<ListActionComponent>).emit(action)
            return action.behavior === "selectable"
        }

        return (action && action.behavior === "selectable")
            || (this.selection.keyboard.instantSelection === false && newValue === "keyboard")
    }
}
