import { Component, Input, ContentChild, TemplateRef, Inject } from "@angular/core"
import { Observable, Subscription, from, of, EMPTY } from "rxjs"
import { startWith, switchMap, mapTo } from "rxjs/operators"

import { DataSourceDirective } from "../../data.module"
import { LocalStorageService, LocalStorageBucket } from "../../common.module"
import type { TreeItemComponent } from "./tree-item.component"



export type ExpandedItems = { [key: string]: ExpandedItems }


@Component({
    selector: ".nz-tree",
    templateUrl: "tree.component.pug"
})
export class TreeComponent {
    @ContentChild("content", { static: true, read: TemplateRef }) public readonly contentTpl: TemplateRef<TreeItemComponent>
    @ContentChild("buttons", { static: true, read: TemplateRef }) public readonly buttonsTpl: TemplateRef<TreeItemComponent>

    @Input()
    public set root(val: any) {
        if (this._root !== val) {
            this._root = val
            if (this._stateBucket && val) {
                this._onStateChanges(this._stateBucket)
            }
        }
    }
    public get root(): any { return this._root }
    private _root: any

    @Input() public queryValue: string = "id"
    @Input() public queryField: string = "parent_id"
    @Input() public isLeafField: string = "is_leaf"
    @Input() public singleExpand: boolean = true

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
    private _stateId: string
    private _stateBucket: LocalStorageBucket
    private _stateChangesSub: Subscription

    public readonly expandedItems: ExpandedItems = {}

    private _itemsById: { [key: string]: TreeItemComponent } = {}
    private _pendingExpand: { [key: string]: ExpandedItems } = {}

    public constructor(
        @Inject(DataSourceDirective) private readonly source: DataSourceDirective,
        @Inject(LocalStorageService) private readonly localStorage: LocalStorageService) {
    }

    public expandById() {

    }

    public expandItems(items: ExpandedItems): Observable<any> {
        return from(Object.keys(items)).pipe(
            switchMap(id => {
                const cmp = this._itemsById[id]
                if (cmp) {
                    if (cmp.isExpanded) {
                        return of(id)
                    } else {
                        return cmp.expand().pipe(mapTo(id))
                    }
                } else {
                    this._pendingExpand[id] = { [id]: items[id] }
                    return EMPTY
                }
            }),
            switchMap(id => {
                if (Object.keys(items[id]).length > 0) {
                    return this.expandItems(items[id])
                } else {
                    return of(null)
                }
            })
        )
    }

    public registerTreeItem(item: TreeItemComponent) {
        this._itemsById[item.model.id] = item
        if (this._pendingExpand[item.model.id]) {
            const pending = this._pendingExpand[item.model.id]
            delete this._pendingExpand[item.model.id]
            this.expandItems(pending).subscribe()
        }
    }

    public unregisterTreeItem(item: TreeItemComponent) {
        delete this._itemsById[item.model.id]
        delete this._pendingExpand[item.model.id]
    }

    public onExpandedChange(item: TreeItemComponent) {
        if (item.isExpanded) {
            const expandedParent = this._getExpandedChild(item.model[this.queryField], this.expandedItems)
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

    public loadChildren(item: TreeItemComponent): Observable<any[]> {
        return this.source.storage.source.search(
            { ...this.source.storage.filter.get(), [this.queryField]: item.model[this.queryValue] },
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
        this._disableStateChange = true

        this.expandItems(expandedItems).subscribe(_ => {
            this._disableStateChange = false
        })
    }
}
