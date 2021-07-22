import { Component, Input, ContentChild, TemplateRef, Inject, Output, OnInit, ViewChild } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable, Subscription, from, of, Subject, forkJoin } from "rxjs"
import { startWith, switchMap, mapTo, withLatestFrom, take, filter, map } from "rxjs/operators"

import { DataSourceDirective, SelectionModel, SelectOrigin, Model, SingleSelection, SelectionEvent } from "../data.module"
import { LocalStorageService, LocalStorageBucket } from "../common.module"
import { Destructible } from "../util"
import { ScrollerComponent } from "../list.module"

import type { TreeItemComponent } from "./tree-item.component"



export type ExpandedItems = { [key: string]: ExpandedItems }


@Component({
    selector: ".nz-tree",
    templateUrl: "tree.component.pug",
    exportAs: "nzTree",
    providers: [
        { provide: SelectionModel, useClass: SingleSelection }
    ]
})
export class TreeComponent extends Destructible implements OnInit {
    @ContentChild("content", { static: true, read: TemplateRef }) public readonly contentTpl: TemplateRef<TreeItemComponent<Model>>
    @ContentChild("buttons", { static: true, read: TemplateRef }) public readonly buttonsTpl: TemplateRef<TreeItemComponent<Model>>
    @ViewChild("scroller", { static: true, read: ScrollerComponent }) public readonly scroller: ScrollerComponent

    @Output("selection")
    public readonly changes: Subject<SelectionEvent<Model>> = new Subject()

    @Input()
    public set root(val: Model) {
        if (!Model.isEq(this._root, val)) {
            this._root = val

            // if (val) {
            //     if (initial && this._stateBucket) {
            //         this._onStateChanges(this._stateBucket)
            //     } else {
            //         this.reload()
            //     }
            // }
        }
    }
    public get root(): Model { return this._root }
    private _root: Model

    @Input() public queryValue: string = "id"
    @Input() public queryField: string = "parent_id"
    @Input() public isLeafField: string = "is_leaf"
    @Input() public singleExpand: boolean = true
    @Input() public rootVisible: boolean = true

    @Input()
    public set stateId(val: string) {
        if (this._stateId !== val) {
            this._stateId = val

            if (this._stateChangesSub) {
                this._stateChangesSub.unsubscribe()
                delete this._stateChangesSub
            }

            if (val) {
                this._stateBucket = this.localStorage.newBucket(val)
                this._stateChangesSub = this._stateBucket.changes$
                    .pipe(startWith(this._stateBucket))
                    .subscribe(this._onStateChanges.bind(this))
            }
        }
    }
    public get stateId(): string { return this._stateId }

    @Input()
    public set directSelect(val: boolean) {
        this._directSelect = coerceBooleanProperty(val)
    }
    public get directSelect(): boolean { return this._directSelect }
    private _directSelect: boolean = false

    // public get checkboxSelection(): boolean { return this.selection.type === "multi" }
    // public readonly checkboxSelection: boolean

    private _stateId: string
    private _stateBucket: LocalStorageBucket
    private _stateChangesSub: Subscription

    public readonly expandedItems: ExpandedItems = {}

    private _itemsById: { [key: string]: TreeItemComponent<Model> } = {}
    private _pendingExpand: { [key: string]: ExpandedItems } = {}

    public constructor(
        @Inject(DataSourceDirective) private readonly source: DataSourceDirective,
        @Inject(LocalStorageService) private readonly localStorage: LocalStorageService,
        @Inject(SelectionModel) public readonly selection: SelectionModel) {
        super()
    }

    public ngOnInit() {
        if (this.selection.type === "multi") {
            this._directSelect = true
            this.selection.keyboard.alwaysAppend = true
        } else {
            this.selection.keyboard.alwaysAppend = false
        }

        this.selection.keyboard.disableMouse = this._directSelect
        this.selection.maintainSelection = this._directSelect

        this.destruct.subscription(this.selection.changes).subscribe(selected => {
            this._scrollIntoViewport(selected)
            this.changes.next(selected)
        })
    }

    public reload() {
        const expanded = JSON.parse(JSON.stringify(this.expandedItems))
        const selected = this.selection.selected.get().map(val => val.pk)

        if (!this._itemsById[this.root?.pk]) {
            return
        }

        this._itemsById[this.root.pk]
            .collapse()
            .pipe(switchMap(v => this.expandItems(expanded)), take(1))
            .subscribe(() => {
                const x: { [key: string]: SelectOrigin } = {}
                for (const pk of selected) {
                    x[pk] = "program"
                }
                this.selection.selected.update(x)
            })
    }

    public reset() {
        if (!this._itemsById[this.root?.pk]) {
            return
        }

        this._itemsById[this.root.pk]
            .collapse()
            .pipe(
                switchMap(_ => this._itemsById[this.root.pk].expand()),
                take(1)
            )
            .subscribe()
    }

    public expandById() {

    }

    public expandItems(items: ExpandedItems, collapseOther: boolean = false): Observable<Array<number>> {
        let collapse: Observable<any>
        if (collapseOther) {
            const collapseFilter = JSON.parse(JSON.stringify(items))
            if (!collapseFilter[this.root.pk]) {
                collapseFilter[this.root.pk] = {}
            }
            collapse = this._collapseOthers(JSON.parse(JSON.stringify(this.expandedItems)), collapseFilter)
        } else {
            collapse = of(null)
        }

        return collapse.pipe(switchMap(v => {
            const queries = Object.keys(items)
                .map(id => {
                    const cmp = this._itemsById[id]
                    if (cmp) {
                        return cmp.expand().pipe(mapTo(Number(id)))
                    } else {
                        this._pendingExpand[id] = { [id]: items[id] }
                        return of(null)
                    }
                })
                .map(q => {
                    return q.pipe(
                        switchMap(id => {
                            if (items[id] && Object.keys(items[id]).length > 0) {
                                return this.expandItems(items[id]).pipe(map(expanded => {
                                    return expanded.concat([id])
                                }))
                            } else {
                                return of(null)
                            }
                        }),
                    )
                })

            if (queries.length === 0) {
                return of([])
            } else {
                return forkJoin(queries).pipe(
                    take(1),
                    map(result => {
                        return result
                            .filter(v => !!v)
                            .flat(Infinity)
                    })
                )
            }
        }))
    }

    public collapseAll(): Observable<any> {
        return this._collapseOthers(JSON.parse(JSON.stringify(this.expandedItems)), { [this.root.pk]: {} })
    }

    private _collapseOthers(collapse: ExpandedItems, filter: ExpandedItems): Observable<any> {
        return from(Object.keys(collapse)).pipe(
            switchMap(id => {
                const cmp = this._itemsById[id]
                if (cmp) {
                    if (cmp.isExpanded && !filter[id]) {
                        return cmp.collapse().pipe(mapTo(id))
                    } else {
                        return of(id)
                    }
                } else {
                    return of(id)
                }
            }),
            switchMap(id => {
                if (Object.keys(collapse[id]).length > 0) {
                    const subFilter = filter[id] && Object.keys(filter[id]).length > 0 ? filter[id] : {}
                    console.log({ subFilter })
                    return this._collapseOthers(collapse[id], subFilter)
                } else {
                    return of(null)
                }
            }),
            withLatestFrom()
        )
    }

    public registerTreeItem(item: TreeItemComponent<Model>) {
        this._itemsById[item.model.pk] = item

        if (Model.isEq(this._root, item.model)) {
            this.reset()
        } else if (this._pendingExpand[item.model.pk]) {
            const pending = this._pendingExpand[item.model.pk]
            delete this._pendingExpand[item.model.pk]
            this.expandItems(pending).subscribe()
        }
    }

    public unregisterTreeItem(item: TreeItemComponent<Model>) {
        delete this._itemsById[item.model.pk]
        delete this._pendingExpand[item.model.pk]
    }

    public onExpandedChange(item: TreeItemComponent<Model>) {
        if (item.isExpanded) {
            const expandedParent = this._getExpandedChild((item.model as any)[this.queryField], this.expandedItems)
            if (!expandedParent) {
                this.expandedItems[item.model.pk] = {}
            } else {
                expandedParent[item.model.pk] = {}
            }
        } else {
            this._delExpandedEntry(item.model.pk, this.expandedItems)
        }

        if (this._stateBucket) {
            this._stateBucket.set("expandedItems", this.expandedItems)
        }
    }

    public loadChildren(item: TreeItemComponent<Model>): Observable<any[]> {
        return this.source.storage.source.search(
            { ...this.source.storage.filter.get(), [this.queryField]: (item.model as any)[this.queryValue] },
            this.source.storage.sorter.get(),
            null,
            this.source.storage.meta.get())
    }

    private _getExpandedChild(id: any, container: ExpandedItems): ExpandedItems {
        for (const k in container) {
            if (k === `${id}`) {
                return container[k]
            } else {
                let sub = this._getExpandedChild(id, container[k])
                if (sub) {
                    return sub
                }
            }
        }
        return null
    }

    private _delExpandedEntry(id: any, container: ExpandedItems) {
        for (const k in container) {
            if (k === `${id}`) {
                delete container[k]
            } else {
                this._delExpandedEntry(id, container[k])
            }
        }
    }

    private _disableStateChange = false
    private _onStateChanges(bucket: LocalStorageBucket) {
        const expandedItems = bucket.get("expandedItems") as any
        if (!expandedItems || this._disableStateChange) {
            return
        }

        if (expandedItems) {
            this._disableStateChange = true

            this.expandItems(expandedItems).subscribe(_ => {
                this._disableStateChange = false
            })
        }
    }

    private _scrollIntoViewport(selected: SelectionEvent<Model>) {
        let targets: Node[] = []

        for (let i = 0, l = selected.length; i < l; ++i) {
            const origin = selected.origin[i]
            const item = this._itemsById[selected[i].pk]
            if (origin !== "mouse" && origin !== "touch" && item && item.el.nativeElement) {
                targets.push(item.el.nativeElement)
            }
        }

        if (targets.length) {
            this.scroller.service.scrollIntoViewport(targets, true)
        }
    }
}


// @Directive({
//     selector: ".nz-tree:not([selection])",
//     providers: [
//         { provide: SelectionModel, useExisting: TreeDefaultSelecton }
//     ]
// })
// export class TreeDefaultSelecton extends NoneSelection {

// }
