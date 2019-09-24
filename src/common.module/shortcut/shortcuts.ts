import * as keycodes from "@angular/cdk/keycodes"

import { IDisposable, Destruct } from "../../util"


export type ShortcutHandler = (event: KeyboardEvent, shortcut: Shortcut) => void


export interface ShortcutDef {
    shortcut: string,
    handler: ShortcutHandler
}

export type ShortcutDefs = { [key: string]: ShortcutDef }


export class Shortcuts implements IDisposable {
    public readonly destruct = new Destruct()

    public set enabled(val: boolean) {
        if (this._enabled !== val) {
            this._enabled = val
        }
    }
    public get enabled(): boolean { return this._enabled }
    private _enabled: boolean = true

    public get isActive(): boolean { return this._enabled }

    public readonly shortcuts: ReadonlyArray<Shortcut>

    public constructor(public readonly roots: Element[], public readonly defs: ShortcutDefs) {
        this.shortcuts = makeShortcuts(defs)
    }

    public watch(el: Element) {
        if (this.roots.indexOf(el) === -1) {
            this.roots.push(el)
        }
    }

    public unwatch(el: Element) {
        let idx = this.roots.indexOf(el)
        if (idx > -1) {
            this.roots.splice(idx, 1)
        }
    }

    public on() {
        this.enabled = true
    }

    public off() {
        this.enabled = false
    }

    public dispose() {
        this.destruct.run()
    }
}


export interface SCMatch {
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    key: string | number | { special: string },
    type: "up" | "down",
}


export class Shortcut {
    public constructor(
        public readonly id: string,
        public readonly match: SCMatch[],
        public readonly handler: ShortcutHandler) {
    }

    public isMatchNormal(event: KeyboardEvent): SCMatch {
        for (const m of this.match) {
            if (m.alt === event.altKey
                && m.ctrl === event.ctrlKey
                && m.shift === event.shiftKey) {
                if (typeof m.key === "number" && event.keyCode === m.key) {
                    return m
                }
            }
        }
        return null
    }

    public isMatchSpecial(special: string): SCMatch {
        for (const m of this.match) {
            if (typeof m.key !== "string" && typeof m.key !== "number" && m.key.special === special) {
                return m
            }
        }
        return null
    }
}


function makeShortcuts(defs: ShortcutDefs): Shortcut[] {
    let res: Shortcut[] = []

    for (const id in defs) {
        const def = defs[id]
        res.push(new Shortcut(id, convertKeydefToMatch(def.shortcut), def.handler))
    }

    return res
}


const SPECIAL_KEYS = ["back"]


function convertKeydefToMatch(defs: string): SCMatch[] {
    return defs.split(/,/g).map(def => {
        const parts = def.trim().split(/\s*\+\s*/g)
        let res = { type: "down" } as SCMatch
        let idx

        if ((idx = parts.indexOf("ctrl")) > -1) {
            res.ctrl = true
            parts.splice(idx, 1)
        } else {
            res.ctrl = false
        }

        if ((idx = parts.indexOf("shift")) > -1) {
            res.shift = true
            parts.splice(idx, 1)
        } else {
            res.shift = false
        }

        if ((idx = parts.indexOf("alt")) > -1) {
            res.alt = true
            parts.splice(idx, 1)
        } else {
            res.alt = false
        }

        if (SPECIAL_KEYS.indexOf(parts[0]) > -1) {
            res.key = { special: parts[0] }
        } else {
            const key = parts[0].toUpperCase()
            if (key in keycodes) {
                res.key = (keycodes as any)[key]
            } else {
                throw new Error("Invalid shortcut key: " + key)
            }
        }

        return res
    })
}
