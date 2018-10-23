import { Directive, OnDestroy, EventEmitter, Input, Output, Attribute, SkipSelf, Self } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Model, ID, Field } from "../data"
import { Selectable } from "./selectable.directive"


export interface SelectionEvent<T> extends Array<T> {
    selected: T[]
    removed: T[]
}


export class PlaceholderModel extends Model {
    $placeholder = true
}


export type SelectedDict<T> = { [key: string]: T }
export type Update = { [key: string]: boolean }

function removeEntries<T extends Model>(list: T[], remove: T[]) {
    for (let r of remove) {
        let l = list.length
        while (l-- > 0) {
            if (Model.isEq(r, list[l])) {
                list.splice(l, 1)
            }
        }
    }
}


export interface ISelectionModel<T extends Model = Model> {
    items: T[]
    maintainSelection: boolean

    readonly type: string
    readonly changes: Observable<SelectionEvent<T>>

    update(update: Update): void
    isSelected(what: ID): boolean
    setSelected(what: ID, selected: boolean): void
    _handleOnDestroy(cmp: Selectable<T>): void
    _handleSelectedChange(cmp: Selectable<T>): void
    _handleModelChange(cmp: Selectable<T>, oldModel: T, newModel: T): void
    _canChangeSelected(cmp: Selectable<T>, newValue: boolean): boolean
}


export abstract class SelectionModel<T extends Model = Model> implements OnDestroy, ISelectionModel {
    public set items(val: T[]) {
        let fullUpdate: Update = {}
        for (const k in this._selected) {
            fullUpdate[k] = false
        }

        let models = {} as any
        for (const item of val) {
            fullUpdate[item.id] = true
            models[item.id] = item
        }

        this._models = models
        this.update(fullUpdate)
        delete this._models
    }
    public get items(): T[] {
        return this._items
    }
    protected _items: T[] = []

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
    protected _selectables: { [key: string]: Selectable<T> } = {}
    protected _models: { [key: string]: T }

    protected _suspended: boolean
    protected _pending: Update = {}

    public update(update: Update): void {
        if (this._suspended || !this._selected) {
            this._pending = Object.assign(this._pending, update)
            return
        }
        this._suspended = true

        let selected: T[] = []
        let removed: T[] = []

        for (let k in update) {
            if (update[k]) {
                let cmp = this._selectables[k]
                if (cmp) {
                    cmp.selected = true
                }
                if (!this._selected.hasOwnProperty(k)) {
                    const model = (this._models ? this._models[k] : null)
                        || (cmp ? cmp.model : null)
                        || new PlaceholderModel({ id: k })
                    this._selected[k] = model as any
                    selected.push(this._selected[k])
                }
            } else {
                let cmp = this._selectables[k]
                if (cmp) {
                    cmp.selected = false
                }
                if (this._selected.hasOwnProperty(k)) {
                    removed.push(this._selected[k])
                    delete this._selected[k]
                }
            }
        }

        removeEntries(this.items, removed)
        for (let a of selected) {
            this.items.push(a)
        }
        this._suspended = false
        if (Object.keys(this._pending).length) {
            let pending = this._pending
            this._pending = {}
            this.update(pending)
        }

        if (removed.length || selected.length) {
            let event = this.items.slice(0) as SelectionEvent<T>
            event.selected = selected
            event.removed = removed;
            (this.changes as EventEmitter<SelectionEvent<T>>).emit(event)
        }
    }

    public isSelected(what: ID): boolean {
        return this._selected.hasOwnProperty(what)
    }

    public setSelected(what: ID, selected: boolean) {
        this.update({ [what]: selected })
    }

    public _handleOnDestroy(cmp: Selectable<T>): void {
        if (!this.maintainSelection) {
            this.update({ [cmp.selectionId]: false })
        }
        delete this._selectables[cmp.selectionId]
    }

    public _handleSelectedChange(cmp: Selectable<T>): void {
        this.update({ [cmp.selectionId]: cmp.selected })
    }

    public _handleModelChange(cmp: Selectable<T>, oldModel: T, newModel: T): void {
        for (let k in this._selectables) {
            let selectable = this._selectables[k]
            if (selectable === cmp && k !== cmp.selectionId) {
                delete this._selectables[k]
                break
            }
        }
        this._selectables[cmp.selectionId] = cmp
        this.update({ [cmp.selectionId]: this.isSelected(cmp.selectionId) })
    }

    public _canChangeSelected(cmp: Selectable<T>, newValue: boolean): boolean {
        return true
    }

    // protected _selectableComponent(id: string): T {
    //     return this._selectables
    // }

    // public abstract itemRemoved(item: Selectable): void
    // public abstract itemAdded(item: Selectable): void

    public ngOnDestroy() {
        delete this._suspended
        delete this._models
        delete this._selected
        delete this._items
    }
}


@Directive({
    selector: "[selection=single]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: SingleSelection },
    ]
})
export class SingleSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "single"

    protected selectedId: ID

    public update(update: Update): void {
        let newSid = this.selectedId
        for (let k in update) {
            if (update[k]) {
                newSid = k
                break
            } else if (k === newSid) {
                newSid = null
            }
        }

        if (this.selectedId) {
            update[this.selectedId] = false
        }

        for (let k in update) {
            update[k] = k === newSid
        }
        this.selectedId = newSid
        super.update(update)
    }
}


@Directive({
    selector: "[selection=multi]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: MultiSelection },
    ]
})
export class MultiSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "multi"
}


const SELECTION = Symbol("selection")


@Directive({
    selector: "[selection]:not([selection=single]):not([selection=multi])",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: PropagateSelection }
    ]
})
export class PropagateSelection<T extends Model = Model> implements ISelectionModel<T> {
    @Input("selection")
    protected set __selectionModel(val: SelectionModel<T>) {
        this[SELECTION] = val
    }
    private [SELECTION]: SelectionModel<T>

    public get items(): T[] { return this[SELECTION].items }
    public set items(val: T[]) { this[SELECTION].items = val }

    public get maintainSelection(): boolean { return this[SELECTION].maintainSelection }
    public set maintainSelection(val: boolean) { this[SELECTION].maintainSelection = val }

    public get type(): string { return this[SELECTION].type }
    public get changes(): Observable<SelectionEvent<T>> { return this[SELECTION].changes }

    public update(update: Update): void { this[SELECTION].update(update) }
    public isSelected(what: ID): boolean { return this[SELECTION].isSelected(what) }
    public setSelected(what: ID, selected: boolean): void { this[SELECTION].setSelected(what, selected) }
    public _handleOnDestroy(cmp: Selectable<T>): void { this[SELECTION]._handleOnDestroy(cmp) }
    public _handleSelectedChange(cmp: Selectable<T>): void { this[SELECTION]._handleSelectedChange(cmp) }
    public _handleModelChange(cmp: Selectable<T>, oldModel: T, newModel: T): void { this[SELECTION]._handleModelChange(cmp, oldModel, newModel) }
    public _canChangeSelected(cmp: Selectable<T>, newValue: boolean): boolean { return this[SELECTION]._canChangeSelected(cmp, newValue) }
}
