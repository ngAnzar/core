import { Injectable, Inject, OnDestroy, TemplateRef, EventEmitter } from "@angular/core"
import { BehaviorSubject, Observable, Subscription, debounceTime, distinctUntilChanged, of, shareReplay, startWith, switchMap, merge, map, scan, combineLatest, filter } from "rxjs"
const DeepDiff = require("deep-diff")

import { Destruct, Destructible } from "../../util"
import { DataSourceDirective, DiffKind } from "../../data.module"



export interface ListFilterEditorContext {

}


export interface IListFilterEditor<T> {
    readonly name: string
    readonly valueChanges: Observable<T>
    readonly layer: TemplateRef<ListFilterEditorContext>
    readonly chip: TemplateRef<ListFilterEditorContext>
    readonly isEmpty: boolean

    canHandleFilter(name: string): boolean
    writeValue(name: string, value: T): void
    applyValue(): void
    resetValue(): void
    clearValue(): void
}


@Injectable()
export class ListFilterService extends Destructible {
    private readonly _filters = this.source.filterChanges.pipe(startWith(null), map(_ => this.source.filter), shareReplay(1))

    private readonly _editors = new BehaviorSubject<Array<IListFilterEditor<any>>>([])
    public readonly editorValues = this._editors.pipe(
        debounceTime(20),
        switchMap(editors => {
            return merge(
                ...editors.map(editor => {
                    return editor.valueChanges.pipe(map(v => {
                        return {[editor.name]: v}
                    }))
                })
            )
        }),
        scan((result, current) => {
            return {...result, ...current}
        }, {}),
        distinctUntilChanged((p, c) => {
            return !DeepDiff.diff(p, c)
        }),
        shareReplay(1)
    )

    public readonly appliedFilters = combineLatest({
        editors: this._editors,
        filters: this._filters
    }).pipe(
        map(({ editors, filters }) => {
            const filterNames = Object.keys(filters)
            return editors.filter(e => filterNames.some(v => e.canHandleFilter(v)))
        }),
        shareReplay(1)
    )

    public readonly changes = this.appliedFilters

    public constructor(@Inject(DataSourceDirective) public readonly source: DataSourceDirective) {
        super()

        const src = combineLatest({
            editors: this._editors,
            filterDiff: this.source.filterChanges.pipe(filter(v => !!v))
        })

        this.destruct.subscription(src).subscribe(({ editors, filterDiff }) => {
            for (const diff of filterDiff.diff) {
                const editor = editors.find(e => e.name === diff.path[0])
                if (!editor) {
                    continue
                }

                switch (diff.kind) {
                    case "N":
                    case "E":
                        editor.writeValue(editor.name, diff.rhs)
                        break

                    case "A":
                        editor.writeValue(editor.name, (filterDiff.value as any)[diff.path[0]])
                        break

                    case "D":
                        editor.clearValue()
                        break
                }

                editor.applyValue()
            }
        })
    }

    public registerEditor(editor: IListFilterEditor<any>) {
        if (!this._editors.value.includes(editor)) {
            const current = this._editors.value.slice(0)
            current.push(editor)
            this._editors.next(current)
        }
    }

    public removeEditor(editor: IListFilterEditor<any>) {
        const idx = this._editors.value.indexOf(editor)
        if (idx >= 0) {
            const current = this._editors.value.slice(0)
            current.splice(idx, 1)
            this._editors.next(current)
        }
    }
}
