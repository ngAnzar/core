import {
    Component, Inject, ElementRef, ViewChild, AfterViewInit, Input,
    ChangeDetectionStrategy, ChangeDetectorRef, Optional
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { RippleService, BoundedRippleRef } from "../../animation.module"
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
export class ListItemComponent implements AfterViewInit {
    @ViewChild("ripple") protected readonly rippleContainer: ElementRef<any>

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

    protected boundedRipple: BoundedRippleRef

    public constructor(
        @Inject(RippleService) protected readonly rippleSvc: RippleService,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(SelectableDirective) @Optional() public readonly selectable: SelectableDirective) {
    }

    public ngAfterViewInit() {
        this.boundedRipple = this.rippleSvc.attach(this.el, this.rippleContainer)
    }
}
