import { OnDestroy, EventEmitter, Input, Output, InjectionToken, ElementRef, Injectable } from "@angular/core"
import { FocusOrigin } from "@angular/cdk/a11y"
import { Observable, Subject } from "rxjs"

import { IDisposable, NzRange } from "../../util"
import { Model, PrimaryKey, Field } from "../model"
import { SelectionKeyboardHandler } from "./keyboard-handler"


export const SELECTABLE_ITEM = new InjectionToken<ISelectable>("selectable")


export interface SelectionEvent<T> extends Array<T> {
    selected: T[]
    removed: T[]
    origin: FocusOrigin[]
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
    readonly keyboard: SelectionKeyboardHandler<T>
    readonly selected: SelectionItems<T>
    readonly focused: ISelectable

    update(update: Update): void
    clear(): void

    getSelectOrigin(what: PrimaryKey): SelectOrigin
    setSelected(what: PrimaryKey, selected: SelectOrigin): void
    getSelectables(range?: NzRange, onlySelected?: boolean): ISelectable[]
    setFocused(what: PrimaryKey, origin: FocusOrigin): void

    _handleOnDestroy(cmp: ISelectable<T>): void
    _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void
}


export interface ISelectable<T extends Model = Model> {
    selected: SelectOrigin
    focused: FocusOrigin
    readonly selectedChange: Observable<SelectOrigin>
    readonly el: ElementRef<HTMLElement>

    // egyedi azonosító, lehetőleg mindig maradjon meg az eredeti egy adott elemhez
    model: T
    selectionIndex: number
    readonly isAccessible: boolean

    _changeSelected(newValue: SelectOrigin): void
    _canChangeSelected(newValue: SelectOrigin): boolean
    // selectionData: any
}



export class PlaceholderModel extends Model {
    @Field({ primary: true }) public id: PrimaryKey
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


export class SelectionItems<T extends Model = Model> implements IDisposable {
    public byId: SelectedDict<T> = {}
    public origin: { [key: string]: SelectOrigin } = {}
    public readonly changes: Observable<SelectionEvent<T>> = new EventEmitter()

    public set(val: T[], origin: SelectOrigin) {
        let fullUpdate: Update = {}
        for (const k in this.byId) {
            fullUpdate[k] = null
        }

        for (const item of val) {
            fullUpdate[item.pk] = origin
            this._tmpModels[item.pk] = item
        }

        this.origin = {}
        this.update(fullUpdate)
    }
    public get(): T[] { return this._items }
    private _items: T[] = []

    private _tmpModels: { [key: string]: T } = {}

    public constructor(
        public readonly selectables: Readonly<{ [key: string]: ISelectable<T> }>) {
    }

    private _suspended: number = 0
    private _pending: Update = {}

    public update(update: Update): void {
        // console.trace(update)
        if (this._suspended || !this.byId) {
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

                if (!this.byId.hasOwnProperty(k)) {
                    const model = (this._tmpModels ? this._tmpModels[k] : null)
                        || (cmp ? cmp.model : null)
                        || new PlaceholderModel({ id: k })
                    this.byId[k] = model as any
                    selected.push(this.byId[k])
                }
                this.origin[k] = update[k]
            } else {
                let cmp = this.selectables[k]
                if (cmp && cmp.selected !== null) {
                    if (!cmp._canChangeSelected(null)) {
                        continue
                    }
                    cmp._changeSelected(null)
                }

                if (this.byId.hasOwnProperty(k)) {
                    removed.push(this.byId[k])
                    delete this.byId[k]
                }
                delete this.origin[k]
            }
        }

        removeEntries(this._items, removed)
        for (let a of selected) {
            this._items.push(a)
        }
        this._suspended = Math.max(0, this._suspended - 1)
        if (Object.keys(this._pending).length) {
            let pending = this._pending
            this._pending = {}
            this.update(pending)
        }

        if (removed.length || selected.length) {
            let event = this._items.slice(0) as SelectionEvent<T>
            event.selected = selected
            event.origin = event.map(v => this.origin[v.pk])
            event.removed = removed;
            (this.changes as EventEmitter<SelectionEvent<T>>).emit(event)
        }
    }

    public clear() {
        if (this._items.length > 0) {
            this.set([], null)
        }
    }

    public dispose() {
        delete this._pending
        delete this._items
        delete (this as any).selected
        delete (this as any).origin
        delete (this as any).selectables
        delete (this as any)._tmpModels
    }
}


export interface FocusingEvent<T extends Model> {
    item: T
    component: ISelectable<T>
    origin: FocusOrigin
}


@Injectable()
export abstract class SelectionModel<T extends Model = Model> implements OnDestroy, ISelectionModel {
    public abstract readonly type: string

    public set items(val: T[]) { this.selected.set(val, "program") }
    public get items(): T[] { return this.selected.get() }

    public readonly keyboard: SelectionKeyboardHandler = new SelectionKeyboardHandler(this)

    protected _selectables: { [key: string]: ISelectable<T> } = {}
    public readonly selected = new SelectionItems(this._selectables)

    @Output("selection")
    public get changes() { return this.selected.changes }

    @Output("focusing")
    public readonly focusing: Observable<FocusingEvent<T>> = new Subject()
    private _focusedItem: T

    public readonly focused: ISelectable

    @Input()
    public maintainSelection: boolean = true

    public update(update: Update): void {
        this.selected.update(update)
    }

    public clear() {
        this.selected.clear()
        delete this._focusedItem
    }

    public getSelectOrigin(what: PrimaryKey): SelectOrigin {
        return this.selected.origin[what] || null
    }

    public setSelected(what: PrimaryKey | PrimaryKey[], origin: SelectOrigin) {
        let selection: { [key: string]: SelectOrigin } = {}
        if (Array.isArray(what)) {
            for (const item of what) {
                selection[item] = origin
            }
        } else {
            selection[what] = origin
        }
        this.update(selection)
    }

    public getSelectables(range?: NzRange, onlySelected?: boolean): ISelectable[] {
        if (onlySelected) {
            return Object_values(this._selectables).filter(s => {
                return s.isAccessible
                    && (!range || range.contains(s.selectionIndex))
                    && this.getSelectOrigin(s.model.pk) !== null
            })
        } else if (range) {
            return Object_values(this._selectables).filter(s => {
                return s.isAccessible && range.contains(s.selectionIndex)
            })
        } else {
            return Object_values(this._selectables).filter(s => s.isAccessible)
        }
    }

    public setFocused(what: PrimaryKey, origin: FocusOrigin): void {
        if (this._focusedItem) {
            if (this._focusedItem.pk !== what) {
                let focused = this._selectables[this._focusedItem.pk]
                if (focused) {
                    (this as { focused: ISelectable }).focused = null
                    focused.focused = null;
                    (this.focusing as Subject<FocusingEvent<T>>).next({ item: focused.model, component: focused, origin: null })
                }
            } else {
                return
            }
        }

        let focused = this._selectables[what]
        if (focused) {
            (this as { focused: ISelectable }).focused = focused
            this._focusedItem = focused.model
            focused.focused = origin;
            (this.focusing as Subject<FocusingEvent<T>>).next({ item: focused.model, component: focused, origin })
        } else {
            this._focusedItem = null
        }
    }

    public _handleOnDestroy(cmp: ISelectable<T>): void {
        let model = cmp.model
        if (model) {
            if (!this.maintainSelection && this.getSelectOrigin(cmp.model.pk)) {
                this.setSelected(cmp.model.pk, null)
            }
            delete this._selectables[cmp.model.pk]
        }
    }

    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void {
        if (oldModel && this._selectables[oldModel.pk] === cmp) {
            delete this._selectables[oldModel.pk]
        }

        if (newModel) {
            this._selectables[newModel.pk] = cmp
        }
    }

    public ngOnDestroy() {
        this.selected.dispose()
        this.keyboard.dispose()
        delete (this as any).selected
        delete (this as any).keyboard
    }
}



function Object_values<T>(val: { [key: string]: T }): T[] {
    return Object.keys(val).map(k => val[k])
}
