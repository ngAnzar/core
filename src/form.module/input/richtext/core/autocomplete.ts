import { Component, Inject, InjectionToken, Optional } from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { Observable, Subject, forkJoin } from "rxjs"
import { take, map, debounceTime } from "rxjs/operators"

import { Destruct, IDisposable } from "../../../../util"
import { Model, Field, SingleSelection, ISelectionModel, SelectionModel } from "../../../data.module"
import { LayerService, ComponentLayerRef, DropdownLayer } from "../../../layer.module"
import { RichtextStream, RangeFactory } from "./richtext-stream"
import { removeNode } from "./util"


export const RICHTEXT_AUTO_COMPLETE = new InjectionToken<RichtextAcProvider>("nzRichtextAutoComplete")

const circleSmallSvg = require("mdi/circle-small.svg")

const PROVIDER = Symbol("@AcProvider")


export class RichtextAcItem extends Model {
    public [PROVIDER]: RichtextAcProvider
    @Field({ primary: true }) public id: string
    @Field() public label: string
    @Field() public note: string
    @Field() public icon: string
    @Field() public data: any
    public readonly iconSafe: SafeStyle
}


export abstract class RichtextAcProvider {
    public abstract readonly trigger: RegExp
    public abstract readonly terminate: RegExp | null
    public abstract readonly mustSelect: boolean
    public abstract readonly minChars: number

    public abstract query(value: string): Observable<RichtextAcItem[]>
    public abstract onSelect(item: RichtextAcItem, rt: RichtextStream, anchor: HTMLElement): void
    public abstract onTerminate(text: string, rt: RichtextStream, anchor: HTMLElement): boolean

    protected replaceWithComponent(rt: RichtextStream, anchor: HTMLElement, type: string, params: { [key: string]: any }) {
        let cmp = this.createComponentNode(rt, anchor.id, type, params)

        anchor.parentNode.insertBefore(cmp, anchor)

        let range = new RangeFactory(anchor, 0, anchor, 0)
        range.select()
        removeNode(anchor)
        // console.log("AAAA", cmp.outerHTML)
        rt.command().insertText(" ").exec()
    }

    protected createComponentNode(rt: RichtextStream, id: string, type: string, params: any): HTMLElement {
        let node = rt.portalEl.create()
        node.setAttribute("contenteditable", "false")
        node.setAttribute("id", id)
        node.setAttribute("component", type)
        node.setAttribute("params", encodeURIComponent(JSON.stringify(params)))
        return node
    }

    protected removeAnchor(rt: RichtextStream, anchor: HTMLElement) {
        removeNode(anchor)
    }
}



export class AutocompleteManager implements IDisposable {
    public readonly destruct = new Destruct()
    public readonly items: Observable<RichtextAcItem[]> = this.destruct.subject(new Subject())

    private _debounce: Subject<string> = this.destruct.subject(new Subject())

    public constructor(
        @Inject(RICHTEXT_AUTO_COMPLETE) @Optional() protected readonly providers: RichtextAcProvider[],
        @Inject(DomSanitizer) private readonly sanitizer: DomSanitizer) {

        this.destruct.subscription(this._debounce).pipe(debounceTime(250)).subscribe(this._update)
    }

    public update(query: string) {
        this._debounce.next(query)
    }

    private _update = (query: string) => {
        if (this.destruct.done || !this.providers) {
            return
        }
        const terminated = this.providers.filter(p => p.terminate && p.terminate.test(query))

        if (terminated.length) {
            let isTerminated = false

            for (const p of terminated) {
                isTerminated = isTerminated || (p.terminate && p.onTerminate(query, this.rt, this.anchorEl))
                let idx = this.providers.indexOf(p)
                if (idx !== -1) {
                    this.providers.splice(idx, 1)
                }
            }

            if (isTerminated) {
                return
            }
        }

        const queryFrom = this.providers.filter(p => p.minChars <= query.length)

        if (queryFrom.length) {
            this.destruct.subscription(forkJoin(queryFrom.map(p => p.query(query))))
                .pipe(take(1))
                .pipe(map(value => {
                    let result: RichtextAcItem[] = []
                    for (let i = 0, l = value.length; i < l; i++) {
                        for (let v of value[i]) {
                            v[PROVIDER] = queryFrom[i]
                            if (!v.icon) {
                                v.icon = circleSmallSvg
                            }
                            (v as { iconSafe: SafeStyle }).iconSafe = this.sanitizer.bypassSecurityTrustStyle(`url(${v.icon})`)
                            result.push(v)
                        }
                    }
                    return result.sort((a, b) => a.label.localeCompare(b.label))
                }))
                .subscribe(result => (this.items as Subject<RichtextAcItem[]>).next(result))
        } else {
            (this.items as Subject<RichtextAcItem[]>).next([])
        }
    }

    public dispose() {
        this.destruct.run()
        delete (this as any).providers
    }
}

