import { Directive, Inject, Self, HostListener } from "@angular/core"
import { RouterLink, RouterLinkWithHref } from "@angular/router"


@Directive({
    selector: ":not(a)[routerLink]"
})
export class NzRouterLink {
    private rlClick: () => void
    public constructor(@Inject(RouterLink) @Self() rl: RouterLink) {
        this.rlClick = rl.onClick.bind(rl)
        rl.onClick = empty as any
    }

    @HostListener("tap")
    public onTap() {
        this.rlClick()
    }
}


@Directive({
    selector: "a[routerLink]"
})
export class NzRouterLinkHref {
    private rlClick: (button: number, ctrlKey: boolean, metaKey: boolean, shiftKey: boolean) => void
    public constructor(@Inject(RouterLinkWithHref) @Self() rl: RouterLinkWithHref) {
        this.rlClick = rl.onClick.bind(rl)
        rl.onClick = empty as any
    }

    @HostListener("tap", ["$event"])
    public onTap(event: any) {
        this.rlClick(0, event.ctrlKey, event.metaKey, event.shiftKey)
    }
}

function empty() {

}
