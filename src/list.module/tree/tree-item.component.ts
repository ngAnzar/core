import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnDestroy, OnInit } from "@angular/core"
import { Observable, Subject, of, Observer } from "rxjs"
import { takeUntil, finalize, take, tap } from "rxjs/operators"

import { TreeComponent } from "./tree.component"


@Component({
    selector: ".nz-tree-item",
    templateUrl: "./tree-item.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeItemComponent<T = any> implements OnDestroy, OnInit {
    @Input() public level: number
    @Input() public isNode: boolean

    @Input()
    public set model(val: T) {
        if (this.$implicit !== val) {
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

    private _loadUntil: Subject<void>
    public _children: T[]

    public readonly height = 32

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(TreeComponent) public readonly tree: TreeComponent) {
    }

    public ngOnInit() {
        if (this.level < 0) {
            this.isExpanded = true
        }
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
                    this.cdr.markForCheck()
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
}
