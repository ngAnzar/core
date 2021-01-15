import {
    Component, ContentChildren, QueryList, Inject, Input,
    AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, AfterContentInit,
    EventEmitter, Output
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { BehaviorSubject, merge } from "rxjs"
import { startWith, filter, tap, debounceTime } from "rxjs/operators"

import { Destructible } from "../../util"
import { StackItemDirective } from "./stack-item.directive"
import type { StackChildData } from "./stack-child.directive"


@Component({
    selector: ".nz-stack",
    templateUrl: "./stack.template.pug",
    host: {
        "[attr.variant]": "dynamicHeight ? 'fluid' : 'fixed'"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackComponent extends Destructible implements AfterContentInit, AfterViewInit {
    @ContentChildren(StackItemDirective, { read: StackItemDirective }) protected readonly contentChildren: QueryList<StackItemDirective>

    @Input("children")
    public set inputChildren(val: StackItemDirective[]) {
        if (this._children.value !== val) {
            this._children.next(val)
        }
    }

    private readonly _children = new BehaviorSubject<StackItemDirective[]>(null)

    public get children() { return this._children.value }

    @Input()
    public set dynamicHeight(val: boolean) { this._dynamicHeight = coerceBooleanProperty(val) }
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

            this._updateChildData(val, old)

            if (children[old]) {
                children[old].itemRef.visible = false
            }
            children[val].itemRef.visible = true

            this.changed.next(this._selectedIndex = val)
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number
    private _pendingIndex: number = 0
    private _viewReady: boolean = false

    @Input()
    public set changing(val: number) {
        if (this._changing !== val) {
            if (this._selectedIndex == null) {
                return
            }
            this._changing = val
            let currIndex = this._selectedIndex

            if (val == null || val === 0) {
                for (const k in this._childTranslate) {
                    let i = Number(k)
                    let end = 0
                    if (i !== currIndex) {
                        end = currIndex < i ? 100 : -100
                    }
                    this._childData[i] = { begin: this._childTranslate[k], end, selected: end === 0 }
                }

                this._childTranslate.length = 0
            } else {
                let nextIndex = currIndex + (val < 0 ? 1 : -1)
                if (nextIndex < 0 || !this.children[nextIndex]) {
                    return
                }

                // reset
                for (const k in this._childTranslate) {
                    const i = Number(k)
                    this._childTranslate[i] = i < currIndex ? -100 : 100
                }

                let childData = this._childData[nextIndex]
                let begin = currIndex < nextIndex ? 100 : -100

                if (!childData || childData.begin !== begin || childData.preview !== true) {
                    this._childData[nextIndex] = { begin, preview: true }
                }

                let dir = val < 0 ? -1 : 1
                let percent = Math.abs(val)
                this._childTranslate[currIndex] = 100 * percent * dir
                this._childTranslate[nextIndex] = 100 * (1.0 - percent) * dir * -1
            }

            this.cdr.markForCheck()
        }
    }
    private _changing: number

    @Output()
    public readonly changed = new EventEmitter<number>()

    public _childData: Array<StackChildData> = []
    public _childTranslate: Array<number> = []

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
        super()

        this.destruct
            .subscription(
                merge(
                    this.changed,
                    this._children.pipe(tap(children => {
                        if (children) {
                            this._applyPendingIndex()

                            const length = children.length
                            if (this.selectedIndex >= length) {
                                this.selectedIndex = length - 1
                            }

                            this._childData = this._childData.slice(0, length)
                        }
                    }))
                )
            )
            .pipe(debounceTime(20))
            .subscribe(cdr.detectChanges.bind(cdr))
    }

    public ngAfterContentInit() {
        let skipFirst = this._children.value && this._children.value.length > 0
        this.destruct.subscription(this.contentChildren.changes)
            .pipe(
                startWith(this.contentChildren),
                filter(_ => {
                    if (skipFirst) {
                        skipFirst = false
                        return false
                    } else {
                        return true
                    }
                })
            )
            .subscribe(children => {
                this._children.next(children.toArray())
            })
    }

    public ngAfterViewInit() {
        this._viewReady = true
        this._applyPendingIndex()
    }

    private _applyPendingIndex() {
        let pending = this._pendingIndex
        if (pending != null) {
            delete this._pendingIndex
            this.selectedIndex = pending
        }
    }

    private _updateChildData(currentIndex: number, oldIndex: number) {
        if (oldIndex < 0) {
            this._childData[currentIndex] = { begin: 0, selected: true }
        } else if (oldIndex < currentIndex) {
            this._childData[oldIndex] = { begin: 0, end: -100, selected: false }
            this._childData[currentIndex] = { begin: 100, end: 0, selected: true }
        } else if (oldIndex > currentIndex) {
            this._childData[oldIndex] = { begin: 0, end: 100, selected: false }
            this._childData[currentIndex] = { begin: -100, end: 0, selected: true }
        }
    }
}
