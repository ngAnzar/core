import { Component, Inject, InjectionToken, Optional } from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { Observable, Subject, forkJoin, EMPTY, merge, zip, of } from "rxjs"
import { take, map, debounceTime, distinctUntilChanged, shareReplay, switchMap, filter, tap } from "rxjs/operators"

import { Destructible } from "../../../../util"
import { Model, Field } from "../../../../data.module"
import { removeNode } from "../util"
import { RichtextStream } from "./richtext-stream"
import { RichtextElement } from "./richtext-el"
import { ComponentManager } from "./component-manager"
import { ContentEditable } from "./content-editable"
import { RangeFactory } from "./rangy"



export const RICHTEXT_AUTO_COMPLETE = new InjectionToken<RichtextAcProvider>("nzRichtextAutoComplete")
export const RICHTEXT_AUTO_COMPLETE_EL = new RichtextElement("nz-richtext-autocomplete")

const circleSmallSvg = require("mdi/circle-small.svg")

export const PROVIDER = Symbol("@AcProvider")


export class RichtextAcItem extends Model {
    public [PROVIDER]: RichtextAcProvider
    @Field({ primary: true }) public id: string
    @Field() public label: string
    @Field() public note: string
    @Field() public icon: string
    @Field() public data: any
    public readonly iconSafe: SafeStyle
}


export class RichtextAcSession {
    public constructor(
        public readonly stream: RichtextStream,
        public readonly anchor: HTMLElement,
        public readonly cmpManager: ComponentManager,
        public readonly content: ContentEditable) { }
}


export abstract class RichtextAcProvider {
    public abstract readonly trigger: RegExp
    public abstract readonly terminate: RegExp | null
    public abstract readonly mustSelect: boolean
    public abstract readonly minChars: number

    public abstract query(value: string): Observable<RichtextAcItem[]>
    public abstract onSelect(sess: RichtextAcSession, item: RichtextAcItem): void
    public abstract onTerminate(sess: RichtextAcSession, text: string): boolean

    protected replaceWithComponent(sess: RichtextAcSession, type: string, params: { [key: string]: any }) {
        const { anchor, cmpManager, content } = sess
        const portalEl = cmpManager.createPortalEl(type, params)

        anchor.parentNode.insertBefore(portalEl, anchor)

        let range = new RangeFactory(anchor, 0, anchor, 0)
        range.select()
        removeNode(anchor)
        content.insertText(" ")
    }

    protected removeAnchor(sess: RichtextAcSession) {
        removeNode(sess.anchor)
    }
}


interface AcTrigger {
    type: "query" | "terminate",
    anchor?: HTMLElement,
    text?: string
}


export class AutocompleteManager extends Destructible {
    private readonly trigger$: Subject<AcTrigger> = this.destruct.subject(new Subject())
    private readonly _trigger$ = this.trigger$.pipe(shareReplay(1))

    public readonly anchor$ = this._trigger$.pipe(
        debounceTime(20),
        distinctUntilChanged(distinctElComparator),
        map(v => v.anchor),
        shareReplay(1)
    )

    public readonly providers$ = this._trigger$.pipe(
        debounceTime(20),
        filter(val => val.type === "query"),
        distinctUntilChanged(distinctTextComparator),
        map(val => this.getProviders(val.text)),
        shareReplay(1)
    )

    private readonly _providers$ = merge(this._trigger$, this.providers$).pipe(
        switchMap(_ => zip(this._trigger$, this.providers$)),
        map(([trigger, providers]) => {
            if (!trigger.anchor) {
                return []
            }

            const terminated = trigger.type === "terminate"
                ? providers
                : providers.filter(p => p.terminate && p.terminate.test(trigger.text))

            if (terminated.length) {
                const sess = new RichtextAcSession(this.stream, trigger.anchor, this.cmpManager, this.ce)
                let isTerminated = false
                for (const p of terminated) {
                    isTerminated = isTerminated || p.onTerminate(sess, trigger.text)
                }

                if (isTerminated) {
                    return []
                }
            }

            return trigger.type === "terminate" ? [] : providers
        }),
        shareReplay(1)
    )

    public readonly items$ = merge(this._trigger$.pipe(distinctUntilChanged(distinctTextComparator)), this._providers$).pipe(
        debounceTime(250),
        switchMap(_ => zip(this._trigger$, this._providers$).pipe(take(1))),
        switchMap(([trigger, providers]) => {
            if (trigger.type === "terminate" || providers.length === 0) {
                return of([] as RichtextAcItem[])
            }

            const query = trigger.text
            const queryFrom = providers.filter(p => p.minChars <= query.length)

            return forkJoin(queryFrom.map(p => p.query(query))).pipe(
                take(1),
                map(value => {
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
                })
            )
        }),
        shareReplay(1)
    )

    public constructor(
        @Inject(RICHTEXT_AUTO_COMPLETE) @Optional() protected readonly providers: RichtextAcProvider[],
        @Inject(DomSanitizer) private readonly sanitizer: DomSanitizer,
        @Inject(RichtextStream) public readonly stream: RichtextStream,
        @Inject(ComponentManager) public readonly cmpManager: ComponentManager,
        @Inject(ContentEditable) public readonly ce: ContentEditable) {
        super()

        stream.addElementHandler(RICHTEXT_AUTO_COMPLETE_EL, removeNode)
    }

    public hasAcProviderFor(query: string): boolean {
        for (const provider of this.providers) {
            if (provider.trigger.test(query)) {
                return true
            }
        }
        return false
    }

    public getProviders(query: string): RichtextAcProvider[] {
        let result = []
        for (const provider of this.providers) {
            if (provider.trigger.test(query)) {
                result.push(provider)
            }
        }
        return result
    }

    public trigger(node: HTMLElement) {
        this.trigger$.next({ type: "query", anchor: node, text: node.innerText })
    }

    public terminate(node?: HTMLElement) {
        if (node) {
            this.trigger$.next({ type: "terminate", anchor: node, text: node.innerText })
        } else {
            this.trigger$.next({ type: "terminate" })
        }
    }
}

function distinctElComparator(a: AcTrigger, b: AcTrigger) {
    return a.anchor === b.anchor
}


function distinctTextComparator(a: AcTrigger, b: AcTrigger) {
    return a.text === b.text
}
