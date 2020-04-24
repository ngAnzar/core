import {
    Component, ContentChildren, QueryList, Inject, Input,
    AfterViewInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, AfterContentInit,
    EventEmitter, Output
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { AnimateSwitch } from "./stack.animation"
import { StackItemDirective } from "./stack-item.directive"


@Component({
    selector: ".nz-stack",
    templateUrl: "./stack.template.pug",
    host: {
        "[attr.variant]": "dynamicHeight ? 'fluid' : 'fixed'"
    },
    animations: [AnimateSwitch],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent implements AfterViewInit, OnDestroy, AfterContentInit {
    @ContentChildren(StackItemDirective, { read: StackItemDirective }) protected readonly contentChildren: QueryList<StackItemDirective>
    private _contentChildren: StackItemDirective[]

    @Input("children") public inputChildren: StackItemDirective[]

    public get children() {
        return this.inputChildren ? this.inputChildren : this._contentChildren
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
        const children = this.children

        if (this._viewReady === false || !children || children.length === 0) {
            this._pendingIndex = val
            return
        }

        val = isNaN(val) ? 0 : children ? Math.max(0, Math.min(val, children.length - 1)) : 0

        if (this._selectedIndex !== val) {
            const old = isNaN(this._selectedIndex) ? -1 : this._selectedIndex

            if (old < 0) {
                this.childSwitch[val] = `visible`
                children[val].itemRef.visible = true
            } else {
                const dir = old > val ? "right" : "left"
                this.childSwitch[old] = `${dir}-out`
                this.childSwitch[val] = `${dir}-in`

                children[old].itemRef.visible = false
                children[val].itemRef.visible = true
            }

            this._selectedIndex = val;
            (this.changed as EventEmitter<number>).emit(val)
            this.cdr.markForCheck()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number

    public readonly destruct = new Destruct()
    public readonly childSwitch: string[] = []

    @Output() public readonly changed: Observable<number> = new EventEmitter()

    private _pendingIndex: number = 0
    private _viewReady: boolean = false

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterViewInit() {
        this._viewReady = true
        let pending = this._pendingIndex
        if (pending != null) {
            delete this._pendingIndex
            this.selectedIndex = pending
        }
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.contentChildren.changes)
            .pipe(startWith(this.contentChildren))
            .subscribe(content => {
                this._contentChildren = content.toArray()
                const children = this.children
                const length = children.length
                if (this.selectedIndex >= children.length) {
                    this.selectedIndex = children.length - 1
                }


                for (const k in this.childSwitch) {
                    if (parseInt(k, 10) >= children.length) {
                        delete this.childSwitch[k]
                    }
                }

                if (length && this._viewReady) {
                    this.ngAfterViewInit()
                }
            })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public _startChildAnim(event: any, idx: number) {
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

    public _doneChildAnim(event: any, idx: number) {
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
