import { Directive, OnDestroy, EventEmitter, Input, Output, Attribute, SkipSelf } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Selectable } from "./selectable.directive"



export interface SelectionEvent<T> extends Array<T> {
    selected: T[]
    removed: T[]
}


export type SelectedDict<T> = { [key: string]: T }


function remove<T>(list: T[], item: T) {
    let idx = list.indexOf(item)
    if (idx !== -1) {
        list.splice(idx, 1)
    }
}


export abstract class SelectionModel<T extends Selectable = Selectable> implements OnDestroy {
    public readonly items: T[] = []
    public abstract readonly type: string

    @Output("selection")
    public readonly changes: Observable<SelectionEvent<T>> = new EventEmitter()

    @Input("maintain-selection")
    public set maintainSelection(value: boolean) {
        this._maintainSelection = coerceBooleanProperty(value)
    }
    public get maintainSelection(): boolean {
        return this._maintainSelection
    }
    protected _maintainSelection: boolean = false

    protected _selected: SelectedDict<T> = {}
    protected _destroyed: SelectedDict<T> = {}
    protected _pending: SelectedDict<T> = {}

    public update(selection: { [key: string]: boolean }): void {
        let selected: T[] = []
        let removed: T[] = []

        for (let k in selection) {
            let old = this.isSelected(k)
            if (old !== selection[k]) {
                let cmp = this._selectableComponent(k)
                if (cmp) {
                    if (old) {
                        removed.push(this._selectableComponent(k))
                    } else if (selection[k]) {
                        selected.push(this._selectableComponent(k))
                    }
                } else {
                    throw new Error("Can't find component for selectionId: " + k)
                }
            }
            delete this._pending[k]
        }

        for (let r of removed) {
            remove(this.items, r)
            remove(this.items, this._destroyed[r.selectionId])
            remove(this.items, this._selected[r.selectionId])
            delete this._selected[r.selectionId]
            delete this._destroyed[r.selectionId]
        }

        if (selected.length !== 0) {
            for (let s of selected) {
                let i = this.items.indexOf(this._destroyed[s.selectionId])
                if (i !== -1) {
                    this.items[i] = s
                }

                i = this.items.indexOf(s)
                if (i === -1) {
                    this.items.push(s)
                }
                this._selected[s.selectionId] = s
                delete this._destroyed[s.selectionId]
            }
        }

        if (selected.length !== 0 || removed.length !== 0) {
            let evt: SelectionEvent<T> = this.items.slice(0) as any
            evt.removed = removed
            evt.selected = selected;
            (this.changes as EventEmitter<SelectionEvent<T>>).emit(evt)
        }
    }

    public isSelected(what: T | string): boolean {
        if (typeof what === "string") {
            return this._selected.hasOwnProperty(what)
        } else {
            return what.selected
        }
    }

    public _handleOnDestroy(cmp: T): void {
        if (this.maintainSelection) {
            // TODO: develop only
            if (/^nz-selectable/.test(cmp.selectionId)) {
                throw new Error("Maintain selection is not working with dynamic selectionId")
            }
            this._destroyed[cmp.selectionId] = cmp
        } else {
            this.update({ [cmp.selectionId]: false })
        }
    }

    public _handleSelectedChange(cmp: T) {
        this._pending[cmp.selectionId] = cmp
        this.update({ [cmp.selectionId]: cmp.selected })
    }

    public _canChangeSelected(cmp: T, newValue: boolean): boolean {
        return true
    }

    protected _selectableComponent(id: string): T {
        if (this.maintainSelection && this._destroyed.hasOwnProperty(id)) {
            return this._destroyed[id]
        } else {
            return this._selected[id] || this._pending[id]
        }
    }

    // public abstract itemRemoved(item: Selectable): void
    // public abstract itemAdded(item: Selectable): void

    public ngOnDestroy() {

    }
}


@Directive({
    selector: "[selection=single]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: SingleSelection },
    ]
})
export class SingleSelection<T extends Selectable> extends SelectionModel<T> {
    public readonly type = "single"
}


@Directive({
    selector: "[selection=multi]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: MultiSelection },
    ]
})
export class MultiSelection<T extends Selectable> extends SelectionModel<T> {
    public readonly type = "multi"
}


// @Directive({
//     selector: "[selection]:not([selection=single]):not([selection=multi])",
//     exportAs: "selection",
//     providers: [
//         {
//             provide: SelectionModel,
//             useExisting: new Attribute("selection")
//         },
//     ]
// })
// export class PropagateSelection<T extends Selectable> {
//     @Input("selection")
//     public set selection(value: SelectionModel<T>) {
//         if (this.selection !== value) {
//             this.selection = value
//         }
//     }
//     public get selection(): SelectionModel<T> {
//         return this._selection
//     }
//     protected _selection: SelectionModel<T>
// }
