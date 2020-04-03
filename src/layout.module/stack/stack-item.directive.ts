import { Directive, Inject, Optional, SkipSelf, Input, OnChanges, SimpleChanges, TemplateRef } from "@angular/core"
import { Observable, Subject, merge } from "rxjs"
import { filter, mapTo } from "rxjs/operators"


export class StackItemRef {
    public readonly visibleChanges = new Subject<boolean>()
    public readonly activate: Observable<StackItemRef>
    public readonly deactivate: Observable<StackItemRef>

    public set visible(val: boolean) {
        if (this._visible !== val) {
            this._visible = val
            this.visibleChanges.next(val)
        }
    }
    public get visible(): boolean { return this._visible }
    private _visible: boolean = false

    public constructor(@Inject(StackItemRef) @Optional() @SkipSelf() public readonly parent?: StackItemRef) {
        const activate = this.visibleChanges.pipe(filter(v => v), mapTo(this))
        const deactivate = this.visibleChanges.pipe(filter(v => !v), mapTo(this))

        if (this.parent) {
            this.activate = merge(activate, this.parent.activate)
            this.deactivate = merge(deactivate, this.parent.deactivate)
        } else {
            this.activate = activate
            this.deactivate = activate
        }
    }
}


@Directive({
    selector: "[nzStackItem]",
    providers: [StackItemRef]
})
export class StackItemDirective {
    public constructor(
        @Inject(StackItemRef) public readonly itemRef: StackItemRef,
        @Inject(TemplateRef) public tpl: TemplateRef<any>) { }
}
