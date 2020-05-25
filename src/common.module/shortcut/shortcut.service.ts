import { Inject, Injectable, NgZone } from "@angular/core"
import { DOCUMENT } from "@angular/common"


import { Destructible, isDeviceReady } from "../../util"
import { Shortcuts, ShortcutDefs, Shortcut } from "./shortcuts"

/**
 * ss.create(this.el, [
 *      {id: "client-sheet.tab1", shortcut: "ctrl+1", handler: () => {}}
 * ])
 */
@Injectable({ providedIn: "root" })
export class ShortcutService extends Destructible {
    private _shortcuts: Shortcuts[] = []

    private _registeredEvents: { [key: string]: boolean } = {}

    private _execKeyEvent: (event: KeyboardEvent) => void

    private _execSpecial: (specialKey: string, event: Event) => void

    private _execMatch: (event: Event, shortcut: Shortcut) => void

    public constructor(
        @Inject(DOCUMENT) private readonly doc: Document,
        @Inject(NgZone) private readonly zone: NgZone) {
        super()

        this.zone.runOutsideAngular(() => {
            this._execKeyEvent = (event: KeyboardEvent) => {
                const shortcuts = this.shortcutsForEl(this.doc.activeElement)
                for (const s of shortcuts) {
                    const match = s.isMatchNormal(event)
                    if (match) {
                        event.preventDefault()
                        this._execMatch(event, s)
                        return
                    }
                }
            }

            this._execSpecial = (specialKey: string, event: Event) => {
                const shortcuts = this.shortcutsForEl(this.doc.activeElement)
                for (const s of shortcuts) {
                    const match = s.isMatchSpecial(specialKey)
                    if (match) {
                        event.preventDefault()
                        this._execMatch(event, s)
                        return
                    }
                }

                switch (specialKey) {
                    case "back":
                        (navigator as any).app.backHistory()
                        break
                }
            }

            this._execMatch = (event: Event, shortcut: Shortcut) => {
                this.zone.run(() => {
                    shortcut.handler(event as any, shortcut)
                })
            }
        })
    }

    public create(definitions: ShortcutDefs): Shortcuts
    public create(root: Element, definitions: ShortcutDefs): Shortcuts

    public create(root: Element | ShortcutDefs, definitions?: ShortcutDefs): Shortcuts {
        if (!(root instanceof Element)) {
            definitions = root
            root = this.doc as any
        }

        const shortcuts = new Shortcuts([root as Element], definitions)
        shortcuts.destruct.any(() => {
            let idx = this._shortcuts.indexOf(shortcuts)
            if (idx !== -1) {
                this._shortcuts.splice(idx, 1)
            }
        })
        this._shortcuts.push(shortcuts)
        this._installHandlers(shortcuts)
        return shortcuts
    }

    public shortcutsForEl(el: Element, onlyActive: boolean = true): ReadonlyArray<Shortcut> {
        let result: Array<[number, Shortcuts]> = []

        for (const shortcuts of this._shortcuts) {
            if (!onlyActive || shortcuts.isActive) {
                let priority = 0
                let match = false
                for (const root of shortcuts.roots) {
                    priority = Math.max(priority, document.evaluate('ancestor::*', root, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength)
                    if (el === root || root.contains(el)) {
                        match = true
                    }
                }
                if (match) {
                    result.push([priority, shortcuts])
                }
            }
        }

        return result.sort(sortShortcuts).reduce(reduceShortcuts, [])
    }

    private _installHandlers(shortcuts: Shortcuts) {
        this.zone.runOutsideAngular(() => {
            for (const s of shortcuts.shortcuts) {
                for (const match of s.match) {
                    if (typeof match.key === "string" || typeof match.key === "number") {
                        if (!this._registeredEvents[match.type]) {
                            this.doc.addEventListener(`key${match.type}`, this._execKeyEvent)
                            this.destruct.any(() => {
                                this.doc.removeEventListener(`key${match.type}`, this._execKeyEvent)
                                delete this._registeredEvents[match.type]
                            })
                            this._registeredEvents[match.type] = true
                        }
                    } else {
                        switch (match.key.special) {
                            case "back":
                                this._installBackButton()
                                break
                        }
                    }
                }
            }
        })
    }

    private _installBackButton() {
        if (!this._registeredEvents.back) {
            this._registeredEvents.back = true
            // isDeviceReady().subscribe(v => {
            const handler = this._execSpecial.bind(this, "back")
            this.doc.addEventListener("backbutton", handler, false)
            this.destruct.any(() => {
                this.doc.removeEventListener("backbutton", handler, false)
                delete this._registeredEvents.back
            })
            // })
        }
    }
}


function sortShortcuts(a: [number, Shortcuts], b: [number, Shortcuts]) {
    return b[0] - a[0]
}

function reduceShortcuts(dst: Array<Shortcut>, src: [number, Shortcuts]) {
    return dst.concat(src[1].shortcuts)
}
