import { Injectable, Inject, OnDestroy, TemplateRef, EventEmitter } from "@angular/core"
import { Observable, Subscription } from "rxjs"

import { Destruct } from "../../util"
import { DataSourceDirective, DiffKind } from "../../data.module"
import { GridFilter } from "./abstract"


export interface GridFilterEditorContext {

}


export interface IGridFilterEditor<T> {
    // filter name
    readonly valueChanges: Observable<T>
    readonly layer: TemplateRef<GridFilterEditorContext>
    readonly chip: TemplateRef<GridFilterEditorContext>
    readonly isEmpty: boolean

    canHandleFilter(name: string): boolean
    writeValue(name: string, value: T): void
    resetValue(): void
    clearValue(): void
}


@Injectable()
export class GridFilterService implements OnDestroy {
    public readonly editors: ReadonlyArray<IGridFilterEditor<any>> = []
    public readonly filters: ReadonlyArray<IGridFilterEditor<any>> = []
    public readonly destruct = new Destruct(() => {
        this.subscriptions.forEach((v) => v.unsubscribe())
    })
    public readonly changes: Observable<void> = this.destruct.subject(new EventEmitter())

    protected readonly subscriptions = new Map<IGridFilterEditor<any>, Subscription>()

    public constructor(@Inject(DataSourceDirective) public readonly source: DataSourceDirective) {
        this.destruct.subscription(source.filterChanges).subscribe(changes => {
            let changed = false
            for (const change of changes.diff) {
                if ("path" in change) {
                    const name = change.path[0]
                    for (const editor of this.editors) {
                        if (editor.canHandleFilter(name)) {
                            this._handleFilterChange(editor, name, change)
                            changed = true
                        }
                    }
                }
            }

            if (changed) {
                (this.changes as EventEmitter<void>).emit()
            }
        })
    }

    public registerEditor(editor: IGridFilterEditor<any>) {
        (this.editors as IGridFilterEditor<any>[]).push(editor)

        if (this.subscriptions.has(editor)) {
            this.subscriptions.get(editor).unsubscribe()
        }

        this.subscriptions.set(editor, editor.valueChanges.subscribe(changes => {
            console.log("Editor value change", { empty: editor.isEmpty })
            let idx = this.filters.indexOf(editor)
            console.log({ idx })
            if (editor.isEmpty) {
                if (idx !== -1) {
                    (this.filters as Array<IGridFilterEditor<any>>).splice(idx, 1)
                }
            } else if (idx === -1) {
                (this.filters as Array<IGridFilterEditor<any>>).push(editor)
            }
            (this.changes as EventEmitter<void>).emit()
            console.log(this.filters)
        }))
    }

    public removeEditor(editor: IGridFilterEditor<any>) {
        const editors = this.editors as IGridFilterEditor<any>[]
        const idx = editors.indexOf(editor)
        if (idx !== -1) {
            editors.splice(idx, 1)
        }
        if (this.subscriptions.has(editor)) {
            this.subscriptions.get(editor).unsubscribe()
        }
    }

    protected _handleFilterChange(editor: IGridFilterEditor<any>, name: string, change: DiffKind) {
        switch (change.kind) {
            case "N":
            case "E":
                editor.writeValue(name, change.rhs)
                break

            case "D":
                editor.writeValue(name, null)
                break

            default:
                console.error("unhandled kind", change)
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    // public setFilter(name: string, cmp: GridFilter, value: any) {
    //     if (value != null) {
    //         this.filters[name] = { cmp, value }
    //         this.source.filter = { ...this.source.filter, [name]: value }
    //     } else {
    //         delete this.filters[name]
    //         let filter = this.source.filter as any
    //         delete filter[name]
    //         this.source.filter = filter
    //     }
    // }

    // public getFilter(name: string) {
    //     let filter = this.source.storage.filter.get() as any
    //     return filter ? filter[name] : null
    // }

    // public hasFilter(name: string): boolean {
    //     return this.filters[name] != null
    // }
}
