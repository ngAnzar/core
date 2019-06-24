import { subMinutes } from "date-fns"


export function setTzToUTC(date: Date): Date {
    return subMinutes(date, date.getTimezoneOffset())
}
