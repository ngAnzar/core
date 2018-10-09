import { EventEmitter } from "@angular/core"
import { Observable, Subject } from "rxjs"


export interface CCEItem<T> {
    index: number
    prevIndex?: number
    item: T
}

export type CollectionChangeItem<T> = { kind: "D", index: number, item: T } |
{ kind: "U", index: number, newIndex: number, item: T } |
{ kind: "A", index: number, item: T }



export interface CollectionChangeEvent<T> {
    changes: Array<CollectionChangeItem<T>>
    items: T[]
}


export type CollectionItemId = string | number | Array<string | number>


export abstract class Collection<T> {
    public idField: string | string[] = "id"
    public abstract items: T[]
    public readonly itemsChanged: Observable<CollectionChangeEvent<T>> = new EventEmitter()

    protected emitChanged(oldItems: T[], newItems: T[], oldIndexStart: number = 0, newIndexStart: number = 0): boolean {
        let event = this.diff(oldItems, newItems, oldIndexStart, newIndexStart)
        if (event.changes.length) {
            (this.itemsChanged as EventEmitter<CollectionChangeEvent<T>>).emit(event)
            return true
        }
        return false
    }

    public forEach(cb: (item: T, index: number) => void) {
        this.items.forEach(cb)
    }

    public itemIsEq(a: T, b: T) {
        return a === b || (this.idField && this.testIdMatch(a, this._getItemId(b)))
    }

    public get(index: number): T | null {
        return this.items[index]
    }

    public getById(id: CollectionItemId): T | null {
        for (let item of this.items) {
            if (this.testIdMatch(item, id)) {
                return item
            }
        }
        return null
    }

    public getIndex(id: CollectionItemId): number {
        for (let i = 0, items = this.items, l = items.length; i < l; i++) {
            if (this.testIdMatch(items[i], id)) {
                return i
            }
        }
        return -1
    }

    protected testIdMatch(item: any, id: CollectionItemId): boolean {
        const idField = this.idField
        if (typeof idField === "string") {
            if (typeof id === "string" || typeof id === "number") {
                return item[idField] === id
            } else if (Array.isArray(id)) {
                if (id.length === 1) {
                    return item[idField] === id[0]
                } else {
                    throw new Error(`Invalid id value: ${id}`)
                }
            }
        } else if (idField.length > 0) {
            if (Array.isArray(id) && idField.length === id.length) {
                for (let i = idField.length, l = idField.length; i < l; i++) {
                    if (item[idField[i]] !== id[i]) {
                        return false
                    }
                }
                return true
            } else {
                throw new Error(`Invalid id value: ${id}`)
            }
        }
        return false
    }

    protected _getItemId(item: any): CollectionItemId {
        if (typeof this.idField === "string") {
            return item[this.idField]
        } else {
            let id: CollectionItemId = []
            for (let f of this.idField) {
                id.push(item[f])
            }
            return id
        }
    }

    protected diff(oldItems: T[], newItems: T[], oldIndexStart: number = 0, newIndexStart: number = 0): CollectionChangeEvent<T> {
        let changes: CollectionChangeItem<T>[] = []

        for (let i = 0, l = oldItems.length; i < l; i++) {
            let bIndex = newItems.findIndex(b => this.itemIsEq(oldItems[i], b))
            if (bIndex === -1) {
                changes.push({ kind: "D", index: i + oldIndexStart, item: oldItems[i] })
            } else if (bIndex !== i || oldItems[i] !== newItems[bIndex]) {
                changes.push({ kind: "U", index: i + oldIndexStart, newIndex: bIndex + newIndexStart, item: newItems[bIndex] })
            }
        }

        for (let i = 0, l = newItems.length; i < l; i++) {
            let aIndex = oldItems.findIndex(a => this.itemIsEq(newItems[i], a))
            if (aIndex === -1) {
                changes.push({ kind: "A", index: i + newIndexStart, item: newItems[i] })
            }
        }

        return { items: newItems, changes: changes.sort((a, b) => a.index - b.index) }
    }
}
