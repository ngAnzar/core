import { Component, Inject, ElementRef, Host, ViewChild, Input, ContentChild, ContentChildren, QueryList, TemplateRef, ChangeDetectorRef, Attribute, AfterViewInit } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"


import { Destruct } from "../../util"
import { DataSourceDirective } from "../../data.module"
import { PointerEventService, KeyEventService, SpecialKey, MediaQueryService, KeyWatcher } from "../../common.module"
import { AutocompleteComponent, ListActionComponent } from "../../list.module"
import { ViewportService } from "../viewport.service"
import { SelectComponent } from "../../form.module"
import { SelectTemplateRef } from "../../form.module/input/select/select.component"


@Component({
    selector: ".nz-navbar-search",
    templateUrl: "./navbar-search.template.pug",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.opened]": "opened ? '' : null",
        "[attr.flat]": "vps.navbarCenterOverlap ? '' : null"
    }
})
export class NavbarSearchComponent implements AfterViewInit {
    public readonly destruct = new Destruct()

    @ContentChild("selected", { read: TemplateRef }) public readonly selectedTpl: SelectTemplateRef<any>
    @ContentChild("item", { read: TemplateRef }) public readonly itemTpl: SelectTemplateRef<any>
    @ContentChildren(ListActionComponent) public readonly actions: QueryList<ListActionComponent>

    @ViewChild("select", { read: SelectComponent }) public readonly select: SelectComponent<any>

    public set empty(val: boolean) {
        if (this._empty !== val) {
            this._empty = val
            this.cdr.detectChanges()
        }
    }
    public get empty(): boolean { return this._empty }
    private _empty: boolean = true

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            this.cdr.detectChanges()
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public set focused(val: boolean) {
        if (this._focused !== val) {
            this._focused = val
            this.cdr.detectChanges()
        }
    }
    public get focused(): boolean { return this._focused }
    private _focused: boolean

    @Input()
    public set icon(val: string) {
        if (this._icon !== val) {
            this._icon = val
            this.cdr.detectChanges()
        }
    }
    public get icon(): string { return this._icon }
    private _icon: string

    @Input()
    public set autoReset(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._autoReset !== val) {
            this._autoReset = val
            this.cdr.markForCheck()
        }
    }
    public get autoReset(): boolean { return this._autoReset }
    private _autoReset: boolean = false

    public readonly AutocompleteComponent = AutocompleteComponent
    private _backWatcher: KeyWatcher

    public constructor(
        @Inject(ViewportService) protected readonly vps: ViewportService,
        @Inject(ElementRef) el: ElementRef<any>,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<any>,
        @Inject(PointerEventService) pointerEvents: PointerEventService,
        @Inject(KeyEventService) keyEvents: KeyEventService,
        @Inject(MediaQueryService) protected readonly mq: MediaQueryService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Attribute("displayField") protected readonly displayField: string,
        @Attribute("valueField") protected readonly valueField: string,
        @Attribute("queryField") protected readonly queryField: string) {

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

    public ngAfterViewInit() {
        if (this.displayField) {
            this.select.displayField = this.displayField
        }

        if (this.queryField) {
            this.select.queryField = this.queryField
        }

        if (this.valueField) {
            this.select.valueField = this.valueField
        }

        this.destruct.subscription(this.select.selection.changes).subscribe(sel => {
            let selected = sel[0]
            console.log({ selected })
            // if (this.autoReset) {
            //     this.hideSearch()
            // }
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
