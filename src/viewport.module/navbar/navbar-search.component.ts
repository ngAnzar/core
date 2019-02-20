import { Component, Inject, ElementRef, Host, ViewChild, Input } from "@angular/core"


import { Destruct } from "../../util"
import { DataSourceDirective } from "../../data.module"
import { PointerEventService, KeyEventService, SpecialKey, MediaQueryService, KeyWatcher } from "../../common.module"
import { AutocompleteComponent } from "../../list.module"
import { ViewportService } from "../viewport.service"
import { SelectComponent } from "../../form.module"


@Component({
    selector: ".nz-navbar-search",
    templateUrl: "./navbar-search.template.pug",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.opened]": "opened ? '' : null",
        "[attr.flat]": "vps.navbarCenterOverlap ? '' : null"
    }
})
export class NavbarSearchComponent {
    public readonly destruct = new Destruct()

    @ViewChild("select", { read: SelectComponent }) public readonly select: SelectComponent<any>

    public empty: boolean = true

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public set focused(val: boolean) {
        if (this._focused !== val) {
            this._focused = val
        }
    }
    public get focused(): boolean { return this._focused }
    private _focused: boolean

    @Input()
    public set icon(val: string) {
        if (this._icon !== val) {
            this._icon = val
        }
    }
    public get icon(): string { return this._icon }
    private _icon: string

    public readonly AutocompleteComponent = AutocompleteComponent
    private _backWatcher: KeyWatcher

    public constructor(
        @Inject(ViewportService) protected readonly vps: ViewportService,
        @Inject(ElementRef) el: ElementRef<any>,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<any>,
        @Inject(PointerEventService) pointerEvents: PointerEventService,
        @Inject(KeyEventService) keyEvents: KeyEventService,
        @Inject(MediaQueryService) protected readonly mq: MediaQueryService) {

        this._backWatcher = this.destruct.disposable(keyEvents.newWatcher(SpecialKey.BackButton, (event: KeyboardEvent) => {
            this.hideSearch()
            return true
        }))

        this.destruct.subscription(pointerEvents.up(el.nativeElement)).subscribe(event => {
            if (this.select
                && this.select.el.nativeElement !== event.target
                && !this.select.el.nativeElement.contains(event.target as any)) {
                const input = this.select.el.nativeElement.querySelector("input[type='text']") as HTMLElement
                if (input) {
                    input.focus()
                }
            }
        })

        this.destruct.subscription(mq.watch("xs")).subscribe(event => {
            if (event.matches && this.select && this.select.opened) {
                this.vps.navbarCenterOverlap = true
            }
        })
    }

    public showSearch() {
        this._backWatcher.on()
        this.vps.navbarCenterOverlap = true
        setTimeout(() => this.select.opened = true, 200)
    }

    public hideSearch() {
        this._backWatcher.off()
        this.select.reset()
        setTimeout(() => this.vps.navbarCenterOverlap = false, 200)
    }
}
