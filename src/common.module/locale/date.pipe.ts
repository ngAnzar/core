import { Pipe, PipeTransform, Inject } from "@angular/core"
import { format, parseISO } from "date-fns"

import { LocaleService, DateFormat } from "./locale.service"


@Pipe({
    name: "nzDate"
})
export class DatePipe implements PipeTransform {
    public constructor(@Inject(LocaleService) protected readonly locale: LocaleService) {
    }

    public transform(value: Date | string, format: DateFormat = "long+time", maxRelative: string = null): string {
        if (typeof value === "string") {
            value = parseISO(value)
        }
        return this.locale.formatDate(value, format)
    }
}
