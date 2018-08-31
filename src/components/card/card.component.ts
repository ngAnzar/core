import { Component } from "@angular/core"


@Component({
    selector: ".nz-card",
    templateUrl: "./card.template.pug"
})
export class CardComponent { }


@Component({
    selector: ".nz-card-actions",
    templateUrl: "./card-actions.template.pug"
})
export class CardActionsComponent { }


@Component({
    selector: ".nz-card-header",
    templateUrl: "./card-header.template.pug"
})
export class CardHeaderComponent extends CardActionsComponent { }

