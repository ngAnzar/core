import { OnDestroy, EventEmitter, Input, Output } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { IDisposable } from "../../util"
import { Model, ID } from "../model"


export interface SelectionEvent<T> extends Array<T> {
    selected: T[]
    removed: T[]
}


// export interface SelectedEvent<T extends Model> {
//     source: Selectable<T>
//     selected: boolean
// }


export interface ISelectionModel<T extends Model = Model> {
    items: T[]
    maintainSelection: boolean

    readonly type: string
    readonly changes: Observable<SelectionEvent<T>>

    update(update: Update): void
    clear(): void
    getSelectOrigin(what: ID): SelectOrigin
    setSelected(what: ID, selected: SelectOrigin): void

    _handleOnDestroy(cmp: ISelectable<T>): void
    _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void
}


export interface ISelectable<T extends Model = Model> {
    selected: SelectOrigin
    readonly selectedChange: Observable<SelectOrigin>

    // egyedi azonosító, lehetőleg mindig maradjon meg az eredeti egy adott elemhez
    model: T
    selectionId: ID
    selectionIndex: number

    _changeSelected(newValue: SelectOrigin): void
    _canChangeSelected(newValue: SelectOrigin): boolean
    // selectionData: any
}



export class PlaceholderModel extends Model {
    $placeholder = true
}


export type SelectOrigin = null | "program" | "mouse" | "keyboard"
export type SelectedDict<T> = { [key: string]: T }
export type Update = { [key: string]: SelectOrigin }

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


class SelectionItems<T extends Model = Model> implements IDisposable {
    public selected: SelectedDict<T> = {}
    public origin: { [key: string]: SelectOrigin } = {}
    public readonly changes: Observable<SelectionEvent<T>> = new EventEmitter()

    public set items(val: T[]) {
        let fullUpdate: Update = {}
        for (const k in this.selected) {
            fullUpdate[k] = null
        }

        let models = {} as any
        for (const item of val) {
            fullUpdate[item.id] = "program"
            models[item.id] = item
        }

        this._tmpModels = models
        this.update(fullUpdate)
        delete this._tmpModels
    }
    public get items(): T[] { return this._items }
    private _items: T[] = []

    private _tmpModels: { [key: string]: T }

    public constructor(
        public readonly selectables: Readonly<{ [key: string]: ISelectable<T> }>) {
    }

    private _suspended: number = 0
    private _pending: Update = {}

    public update(update: Update): void {
        if (this._suspended || !this.selected) {
            this._pending = Object.assign(this._pending, update)
            return
        }
        this._suspended++

        let selected: T[] = []
        let removed: T[] = []

        for (let k in update) {
            if (update[k]) {
                let cmp = this.selectables[k]
                if (cmp && cmp.selected !== update[k]) {
                    if (!cmp._canChangeSelected(update[k])) {
                        continue
                    }
                    cmp._changeSelected(update[k])
                }

                if (!this.selected.hasOwnProperty(k)) {
                    const model = (this._tmpModels ? this._tmpModels[k] : null)
                        || (cmp ? cmp.model : null)
                        || new PlaceholderModel({ id: k })
                    this.selected[k] = model as any
                    selected.push(this.selected[k])
                }
            } else {
                let cmp = this.selectables[k]
                if (cmp && cmp.selected !== null) {
                    if (!cmp._canChangeSelected(null)) {
                        continue
                    }
                    cmp._changeSelected(null)
                }

                if (this.selected.hasOwnProperty(k)) {
                    removed.push(this.selected[k])
                    delete this.selected[k]
                }
            }
            this.origin[k] = update[k]
        }

        removeEntries(this.items, removed)
        for (let a of selected) {
            this.items.push(a)
        }
        this._suspended = Math.max(0, this._suspended - 1)
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

    public clear() {
        if (this.items.length > 0) {
            let event = [] as SelectionEvent<T>
            event.removed = this.items.slice(0) as SelectionEvent<T>;
            (this.changes as EventEmitter<SelectionEvent<T>>).emit(event)
        }
    }

    public dispose() {
        delete this._pending
        delete this._items
        delete (this as any).selected
        delete (this as any).origin
        delete (this as any).selectables
    }
}


export abstract class SelectionModel<T extends Model = Model> implements OnDestroy, ISelectionModel {
    public abstract readonly type: string

    public set items(val: T[]) { this._selectedItems.items = val }
    public get items(): T[] { return this._selectedItems.items }

    @Output("selection")
    public get changes() { return this._selectedItems.changes }

    @Input()
    public maintainSelection: boolean = true

    protected _selectables: { [key: string]: ISelectable<T> } = {}

    protected _selectedItems = new SelectionItems(this._selectables)
    // protected _keyboardItems = new SelectionItems(this._selectables, this._models)

    public update(update: Update): void {
        this._selectedItems.update(update)
    }

    public clear() {
        this._selectedItems.clear()
    }

    public getSelectOrigin(what: ID): SelectOrigin {
        return this._selectedItems.origin[what]
    }

    public setSelected(what: ID, selected: SelectOrigin) {
        this.update({ [what]: selected })
    }

    public _handleOnDestroy(cmp: ISelectable<T>): void {
        if (!this.maintainSelection) {
            this.update({ [cmp.selectionId]: null })
        }
        delete this._selectables[cmp.selectionId]
    }

    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void {
        for (let k in this._selectables) {
            let selectable = this._selectables[k]
            if (selectable === cmp && k !== cmp.selectionId) {
                delete this._selectables[k]
                break
            }
        }
        this._selectables[cmp.selectionId] = cmp
        this.update({ [cmp.selectionId]: this.getSelectOrigin(cmp.selectionId) })
    }

    public ngOnDestroy() {
        this._selectedItems.dispose()
        delete this._selectedItems
    }
}



/*export abstract class SelectionModel<T extends Model = Model> implements OnDestroy, ISelectionModel {
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
    protected _selectables: { [key: string]: ISelectable<T> } = {}
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
                if (cmp && cmp.selected !== true) {
                    if (!cmp._canChangeSelected(true)) {
                        continue
                    }
                    cmp._changeSelected(true)
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
                if (cmp && cmp.selected !== false) {
                    if (!cmp._canChangeSelected(false)) {
                        continue
                    }
                    cmp._changeSelected(false)
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

    public clear() {
        if (this.items.length > 0) {
            let event = [] as SelectionEvent<T>
            event.removed = this.items.slice(0) as SelectionEvent<T>;
            (this.changes as EventEmitter<SelectionEvent<T>>).emit(event)
        }
    }

    public isSelected(what: ID): boolean {
        return this._selected && this._selected.hasOwnProperty(what)
    }

    public setSelected(what: ID, selected: boolean) {
        this.update({ [what]: selected })
    }

    public _handleOnDestroy(cmp: ISelectable<T>): void {
        if (!this.maintainSelection) {
            this.update({ [cmp.selectionId]: false })
        }
        delete this._selectables[cmp.selectionId]
    }

    // public _handleSelectedChange(cmp: Selectable<T>): void {
    //     this.update({ [cmp.selectionId]: cmp.selected })
    // }

    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void {
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
*/
