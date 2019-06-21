import IMask from "imask"


export const MASK_BLOCKS = {
    yyyy: {
        mask: IMask.MaskedRange,
        from: 1900,
        to: 3000,
        maxLength: 4
    },

    dd: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 31,
        maxLength: 2
    },

    MM: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 12,
        maxLength: 2
    },

    HH: {
        mask: IMask.MaskedRange,
        from: 0,
        to: 23,
        maxLength: 2
    },

    mm: {
        mask: IMask.MaskedRange,
        from: 0,
        to: 59,
        maxLength: 2
    },

    ss: {
        mask: IMask.MaskedRange,
        from: 0,
        to: 59,
        maxLength: 2
    }
}
