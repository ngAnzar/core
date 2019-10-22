import { Component, Inject, InjectionToken, Optional } from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { Observable, Subject, forkJoin, EMPTY, merge, zip, of } from "rxjs"
import { take, map, debounceTime, distinctUntilChanged, shareReplay, switchMap, filter, tap, mapTo, switchMapTo, pairwise, startWith, share } from "rxjs/operators"

import { Destructible } from "../../../../util"
import { Model, Field } from "../../../../data.module"
import { removeNode } from "../util"
import { RichtextStream } from "./richtext-stream"
import { RichtextElement } from "./richtext-el"
import { ComponentManager } from "./component-manager"
import { ContentEditable } from "./content-editable"


export const RICHTEXT_AUTO_COMPLETE = new InjectionToken<RichtextAcProvider>("nzRichtextAutoComplete")
export const RICHTEXT_AUTO_COMPLETE_EL = new RichtextElement("nz-richtext-autocomplete", null, { spellcheck: "false" })

const circleSmallSvg = require("mdi/circle-small.svg")

export const PROVIDER = Symbol("@AcProvider")


export class RichtextAcItem extends Model {
    public [PROVIDER]: RichtextAcProvider
    @Field({ primary: true }) public id: string
    @Field() public label: string
    @Field() public note: string
    @Field() public icon: string
    @Field() public data: any
    @Field() public isAction: boolean
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

        sess.anchor.focus()
        content.replaceNode(anchor, portalEl)
        content.insertText(" ")
    }

    protected persistAnchor(sess: RichtextAcSession) {
        sess.anchor.setAttribute("persist", "true")
    }

    protected removeAnchor(sess: RichtextAcSession) {
        removeNode(sess.anchor)
    }
}


interface AcTrigger {
    type: "query" | "terminate"
    anchor?: HTMLElement
    text?: string
    providers?: RichtextAcProvider[]
    items?: RichtextAcItem[]
}


export class AutocompleteManager extends Destructible {
    private readonly _trigger$: Subject<AcTrigger> = this.destruct.subject(new Subject())

    public readonly trigger$ = this._trigger$.pipe(
        distinctUntilChanged((a, b) => {
            if (a.type === b.type) {
                if (a.type === "terminate") {
                    return true
                } else {
                    return a.text === b.text && a.anchor === b.anchor
                }
            } else {
                return false
            }
        }),
        share()
    )

    public readonly providers$ = this.trigger$.pipe(
        distinctUntilChanged((a, b) => a.type === b.type && a.text === b.text),
        startWith(null),
        pairwise(),
        map(([prev, curr]) => {
            if (curr.type === "terminate") {
                if (prev && prev.type === "query") {
                    curr.providers = prev.providers
                }
            } else {
                curr.providers = this.getProviders(curr.text)
            }
            if (!curr.providers || !curr.anchor) {
                curr.providers = []
            }
            return curr
        }),
        map(trigger => {
            const providers = trigger.providers
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
                    trigger.providers = []
                    return trigger
                }
            }

            trigger.providers = trigger.type === "terminate" ? [] : providers
            return trigger
        }),
        share()
    )

    public readonly terminate$ = this.providers$.pipe(
        filter(v => !v.providers || v.providers.length === 0),
        share()
    )

    public readonly items$ = this.providers$.pipe(
        debounceTime(250),
        switchMap(trigger => {
            const providers = trigger.providers
            if (trigger.type === "terminate" || providers.length === 0) {
                trigger.items = []
                return of(trigger)
            }

            const query = trigger.text
            const queryFrom = providers.filter(p => p.minChars <= query.length)

            if (queryFrom.length === 0) {
                trigger.items = []
                return of(trigger)
            }

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
                    trigger.items = result.sort((a, b) => {
                        if (a.isAction === b.isAction) {
                            return a.label.localeCompare(b.label)
                        } else {
                            return a.isAction ? 1 : -1
                        }
                    })
                    return trigger
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
        this._trigger$.next({ type: "query", anchor: node, text: node.innerText })
    }

    public terminate(node?: HTMLElement) {
        if (node) {
            this._trigger$.next({ type: "terminate", anchor: node, text: node.innerText })
        } else {
            this._trigger$.next({ type: "terminate" })
        }
    }
}

function distinctElComparator(a: AcTrigger, b: AcTrigger) {
    return a.anchor === b.anchor
}


function distinctTextComparator(a: AcTrigger, b: AcTrigger) {
    return a.text === b.text
}
