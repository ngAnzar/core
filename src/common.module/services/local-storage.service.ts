import { Injectable } from "@angular/core"
import { Observable, Observer, fromEvent, Subject, merge } from "rxjs"
import { filter, map, mapTo, share } from "rxjs/operators"

import { Destructible } from "../../util"


export type SV_Literal = string | number | boolean | null
export interface SV_Map { [member: string]: SV_Literal | SV_Array | SV_Map }
export interface SV_Array extends Array<SV_Literal | SV_Array | SV_Map> { }
export type StoreableValue = SV_Literal | SV_Map | SV_Array
export interface LocalStoreChangeEvent {
    key: string
    oldValue: StoreableValue,
    newValue: StoreableValue,
}


// export type StoreableValue = null | string | number | boolean | Date | Array<StoreableValue> | { [key: string]: StoreableValue }


@Injectable()
export class LocalStorageService extends Destructible {
    private _event$: Observable<LocalStoreChangeEvent> = fromEvent<StorageEvent>(window, "storage").pipe(
        filter(event => event.storageArea === localStorage),
        map(event => {
            return {
                key: event.key,
                newValue: event.newValue != null ? JSON.parse(event.newValue) : null,
                oldValue: event.oldValue != null ? JSON.parse(event.oldValue) : null,
            }
        })
    )

    private _change$: Subject<LocalStoreChangeEvent> = this.destruct.subject(new Subject<LocalStoreChangeEvent>())

    private _watcher$: Observable<LocalStoreChangeEvent> = this.destruct
        .subscription(merge(this._event$, this._change$))
        .pipe(share())

    public get(name: string, defaultValue: any = null): StoreableValue {
        const val = localStorage.getItem(name)
        return val == null ? defaultValue : JSON.parse(val)
    }

    public set(name: string, value: StoreableValue) {
        const oldValue = localStorage.getItem(name)
        const newValue = JSON.stringify(value)

        localStorage.setItem(name, newValue)
        if (oldValue !== newValue) {
            this._change$.next({ key: name, oldValue: JSON.parse(oldValue), newValue: value })
        }
    }

    public del(name: string) {
        this._change$.next({ key: name, oldValue: this.get(name), newValue: null })
        localStorage.removeItem(name)
    }

    public clear() {
        for (let i = 0, l = localStorage.length; i < l; i++) {
            const key = localStorage.key(i)
            this._change$.next({ key: key, oldValue: key, newValue: null })
        }

        localStorage.clear()
    }

    public newBucket(id: string) {
        return new LocalStorageBucket(id, this)
    }

    public watch(name: string): Observable<LocalStoreChangeEvent> {
        return this._watcher$.pipe(filter(event => event.key === name))
    }
}


export class LocalStorageBucket extends Destructible {
    private _data: { [key: string]: StoreableValue } = {}

    public readonly changes$ = this.destruct.subscription(this.svc.watch(this.id)).pipe(
        map(event => {
            this._setData(event.newValue)
            return this
        }),
        share()
    )

    public constructor(public readonly id: string, private readonly svc: LocalStorageService) {
        super()
        this._setData(svc.get(id))
        this.destruct.subscription(this.changes$).subscribe()
    }

    public get(name: string, defaultValue: any = null): StoreableValue {
        if (name in this._data) {
            return this._data[name]
        } else {
            return defaultValue
        }
    }

    public set(name: string, value: StoreableValue) {
        this._data[name] = value
        this.svc.set(this.id, this._data)
    }

    public del(name: string) {
        delete this._data[name]
        this.svc.set(this.id, this._data)
    }

    public clear() {
        this._data = {}
        this.svc.del(this.id)
    }

    private _setData(value: any) {
        if (`${value}` === "[object Object]") {
            this._data = value as any
        } else {
            this._data = {}
        }
    }
}
