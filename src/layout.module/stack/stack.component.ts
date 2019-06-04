import {
    Component, ContentChildren, TemplateRef, QueryList, Inject, Input,
    AfterViewInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { Destruct } from "../../util"
import { AnimateSwitch } from "./stack.animation"


@Component({
    selector: ".nz-stack",
    templateUrl: "./stack.template.pug",
    host: {
        "[attr.variant]": "dynamicHeight ? 'fluid' : 'fixed'"
    },
    animations: [AnimateSwitch],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent implements AfterViewInit, OnDestroy {
    @ContentChildren(TemplateRef) protected readonly contentChildren: QueryList<TemplateRef<any>>
    @Input("children") protected readonly vChildren: Array<TemplateRef<any>>

    public get children() {
        return this.vChildren ? this.vChildren : this.contentChildren
    }

    @Input()
    public set dynamicHeight(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._dynamicHeight !== val) {
            this._dynamicHeight = val
            this.cdr.markForCheck()
        }
    }
    public get dynamicHeight(): boolean { return this._dynamicHeight }
    private _dynamicHeight: boolean = false

    @Input()
    public set selectedIndex(val: number) {
        val = isNaN(val) ? 0 : this.children ? Math.max(0, Math.min(val, this.children.length)) : 0

        if (this._selectedIndex !== val) {
            if (this._viewReady === false) {
                this._pendingIndex = val
                return
            }

            const old = isNaN(this._selectedIndex) ? -1 : this._selectedIndex
            const dir = old > val ? "right" : "left"
            this.childSwitch[old] = `${dir}-out`
            this.childSwitch[val] = `${dir}-in`
            this._selectedIndex = val
            this._prevIndex = old
            this.cdr.detectChanges()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number
    private _prevIndex: number = -1

    public readonly destruct = new Destruct()
    public readonly childSwitch: string[] = []

    private _pendingIndex: number = 0
    private _viewReady: boolean = false

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterViewInit() {
        this._viewReady = true
        this.selectedIndex = this._pendingIndex
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    protected _startChildAnim(event: any, idx: number) {
        this._pendingIndex = -1
        this._viewReady = false

        if (this._dynamicHeight) {
            const el = event.element as HTMLElement

            if (idx === this._selectedIndex) {
                el.style.position = "relative"
                let height = Math.max(this.el.nativeElement.offsetHeight, el.offsetHeight)
                this.el.nativeElement.style.height = `${height}px`
            } else {
                el.style.width = `${el.offsetWidth}px`
                el.style.height = `${el.offsetWidth}px`
                el.style.position = "absolute"
            }
        }
    }

    protected _doneChildAnim(event: any, idx: number) {
        if (this._dynamicHeight) {
            const el = event.element as HTMLElement

            if (idx === this._selectedIndex) {
                this.el.nativeElement.style.height = ''
            } else {
                el.style.width = ``
                el.style.height = ``
            }
        }

        this._viewReady = true
        if (this._pendingIndex >= 0) {
            this.selectedIndex = this._pendingIndex
        }
    }
}