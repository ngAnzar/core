import { Directive, Input, Inject, ChangeDetectorRef, HostBinding, OnDestroy } from "@angular/core"
import { Observable, Subscription } from "rxjs"

import { Destruct } from "../../util"


/**
 * Ha megvan adva a percent akkor megállapítható módba vált a progress indicator
 * Ha nincs megadva a percent akkor pedig megállapíthatatlan
 */
export interface ProgressEvent {
    /**
     * Aktuális százalék 0...1
     */
    percent?: number
    current?: number
    total?: number
    /**
     * Ez lesz kiírva, már ahol támogatott a szöveg
     */
    message?: string
}


@Directive()
export abstract class ProgressComponent implements OnDestroy {
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

    @Input()
    public set percent(val: number) {
        if (this._percent !== val) {
            this._percent = val
            this.onPercentChange()
            this.cdr.markForCheck()
        }
    }
    public get percent(): number { return this._percent }
    protected _percent: number

    public set indeterminate(val: boolean) {
        if (this._indeterminate !== val) {
            this._indeterminate = val
            this.onIndeterminateChange()
            this.cdr.markForCheck()
        }
    }
    public get indeterminate(): boolean { return this._indeterminate }
    private _indeterminate: boolean = true

    @Input()
    @HostBinding("attr.color")
    public color: string

    private _onProgress = (event: ProgressEvent) => {
        if (event.percent == null) {
            this.indeterminate = true
            this.percent = null
        } else {
            this.indeterminate = false
            this.percent = event.percent
        }
    }

    public constructor(@Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) { }

    protected onIndeterminateChange() {

    }

    protected onPercentChange() {

    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    // protected _view: EmbeddedViewRef<any>

    // public constructor(
    //     @Inject(TemplateRef) protected readonly tpl: TemplateRef<any>,
    //     @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef) {

    //     this.visible = true
    // }
}
