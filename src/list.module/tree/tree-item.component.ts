import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnDestroy, OnInit, ElementRef } from "@angular/core"
import { Observable, Subject, of, Observer } from "rxjs"
import { takeUntil, finalize, take, tap } from "rxjs/operators"

import { SelectOrigin, Model } from "../../data.module"
import { TreeComponent } from "./tree.component"
import { ScrollerService } from "../scroller/scroller.service"


@Component({
    selector: ".nz-tree-item",
    templateUrl: "./tree-item.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeItemComponent<T extends Model> implements OnDestroy {
    @Input() public level: number
    @Input() public isNode: boolean

    @Input()
    public set model(val: T) {
        if (!Model.isEq(this.$implicit, val)) {
            if (this.$implicit) {
                this.tree.unregisterTreeItem(this)
            }

            this.$implicit = val
            this.isNode = !(val as any)[this.tree.isLeafField]
            this.tree.registerTreeItem(this)
            this.cdr.markForCheck()
        }
    }
    public get model(): T { return this.$implicit }
    public $implicit: T

    public set isBusy(val: boolean) {
        if (this._isBusy !== val) {
            this._isBusy = val
            this.cdr.markForCheck()
        }
    }
    public get isBusy(): boolean { return this._isBusy }
    public _isBusy: boolean

    public set isExpanded(val: boolean) {
        if (this._isExpanded !== val) {
            if (val) {
                this.expand().subscribe()
            } else {
                this.collapse().subscribe()
            }

            this._isExpanded = val
        }
    }
    public get isExpanded(): boolean { return this._isExpanded }
    public _isExpanded: boolean

    public get selected(): SelectOrigin { return this._selected }
    private _selected: SelectOrigin = null

    private _loadUntil: Subject<void>
    public _children: T[]

    public readonly height = 32

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(TreeComponent) public readonly tree: TreeComponent,
        @Inject(ScrollerService) private readonly scroller: ScrollerService) {
    }

    public expand(): Observable<T[]> {
        if (this._isExpanded) {
            return of([])
        }
        this._isExpanded = true
        return this._loadChildren()
            .pipe(
                tap(children => {
                    this._children = children
                    this._isExpanded = true
                    this.tree.onExpandedChange(this)
                    this.cdr.detectChanges()
                })
            )
    }

    public collapse(): Observable<void> {
        return new Observable((observer: Observer<void>) => {
            this._children = null
            this._isBusy = false
            this._isExpanded = false
            this._loadUntil && this._loadUntil.complete()
            this.tree.onExpandedChange(this)
            this.cdr.markForCheck()
            observer.next()
            observer.complete()
        })
    }

    private _loadChildren() {
        this._loadUntil = new Subject()

        this._isBusy = true
        return this.tree
            .loadChildren(this)
            .pipe(
                takeUntil(this._loadUntil),
                take(1),
                finalize(() => {
                    this._isBusy = false
                    delete this._loadUntil
                    this.cdr.detectChanges()
                })
            )
    }

    public ngOnDestroy() {
        this._loadUntil && this._loadUntil.complete()
        this.$implicit && this.tree.unregisterTreeItem(this)
    }

    public onItemTap(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        if (this.isNode) {
            this.isExpanded = !this._isExpanded
        }
    }

    public onSelectionChange(origin: SelectOrigin) {
        if (this._selected !== origin) {
            this._selected = origin
            this.cdr.detectChanges()
        }

        if (origin === "keyboard" || origin === "program") {
            this.scrollIntoViewport()
        }
    }

    public scrollIntoViewport() {
        this.scroller.scrollIntoViewport(this.el.nativeElement, true)
    }
}
