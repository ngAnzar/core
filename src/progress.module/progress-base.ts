import { Directive, Input, Inject, TemplateRef, ViewContainerRef, EmbeddedViewRef, Attribute } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable, Subscription } from "rxjs"

import { Destruct } from "../util"


export interface ProgressEvent {
    percent: number
    position?: number
    total?: number
}


// @Directive({})
export abstract class AbstractProgressComponent {
    public readonly destruct = new Destruct()

    @Input()
    public set source(val: Observable<ProgressEvent>) {
        if (this._source !== val) {
            if (this._sourceS) {
                this._sourceS.unsubscribe()
                delete this._sourceS
            }

            if (this._source = val) {
                this._sourceS = this.destruct.subscription(val).subscribe(this._onProgress)
            }
        }

    }
    private _source: Observable<ProgressEvent>
    private _sourceS: Subscription

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

    public abstract percent: number

    private _onProgress = (event: any) => {
        if (this.indeterminate) {
            this.percent = 1
        } else {
            this.percent = event.percent
        }
    }

    // protected _view: EmbeddedViewRef<any>

    // public constructor(
    //     @Inject(TemplateRef) protected readonly tpl: TemplateRef<any>,
    //     @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef) {

    //     this.visible = true
    // }
}
