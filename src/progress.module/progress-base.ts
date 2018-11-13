import { Directive, Input, Inject, TemplateRef, ViewContainerRef, EmbeddedViewRef, Attribute } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"


export interface ProgressEvent {
    percent: number
    position?: number
    total?: number
}


// @Directive({})
export abstract class AbstractProgressComponent {
    @Input()
    public source: Observable<ProgressEvent>

    // @Input()
    // public set visible(val: boolean) {
    //     console.log("set visible", val)
    //     val = coerceBooleanProperty(val)
    //     if (this._visible !== val) {
    //         this._visible = val

    //         if (this._view) {
    //             this._view.destroy()
    //             delete this._view
    //         }

    //         if (val) {
    //             this._view = this.tpl.createEmbeddedView({})
    //             this.vcr.insert(this._view)
    //         }
    //     }
    // }
    // public get visible(): boolean { return this._visible }
    // protected _visible: boolean = false

    @Input()
    public set indeterminate(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._indeterminate !== val) {
            this._indeterminate = val
        }
    }
    public get indeterminate(): boolean { return this._indeterminate }
    protected _indeterminate: boolean = false

    // protected _view: EmbeddedViewRef<any>

    // public constructor(
    //     @Inject(TemplateRef) protected readonly tpl: TemplateRef<any>,
    //     @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef) {

    //     this.visible = true
    // }
}
