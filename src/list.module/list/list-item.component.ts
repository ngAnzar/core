import {
    Component, Inject, Input, ChangeDetectionStrategy, ChangeDetectorRef, Optional
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { SelectableDirective } from "../../data.module"
// import { ListDirective } from "./list.directive"

@Component({
    selector: ".nz-list-item",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.tabindex]": "-1"
    },
    templateUrl: "./list-item.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListItemComponent {

    @Input()
    public set focused(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._focused !== val) {
            this._focused = val
            this.cdr.markForCheck()
        }
    }
    public get focused(): boolean { return this._focused }
    protected _focused: boolean

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(SelectableDirective) @Optional() public readonly selectable: SelectableDirective) {
    }
}
